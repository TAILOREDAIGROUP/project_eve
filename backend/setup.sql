-- Enable pgvector extension
create extension if not exists vector;

-- 1. TENANTS
create table public.tenants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. USERS (Links to Supabase Auth)
-- This table mimics a public profile linked to the private auth.users
create table public.users (
  id uuid references auth.users not null primary key,
  tenant_id uuid references public.tenants not null,
  role text default 'member',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. DOCUMENTS
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants not null,
  name text not null,
  file_type text not null, -- 'pdf', 'csv', 'docx'
  s3_path text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. DOCUMENT CHUNKS (Vectors)
create table public.document_chunks (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants not null,
  document_id uuid references public.documents(id) on delete cascade not null,
  content text not null,
  embedding vector(1536), -- text-embedding-3-small
  chunk_index int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. CHAT HISTORY
create table public.chat_sessions (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants not null,
  user_id uuid references public.users(id) not null,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants not null,
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  role text not null, -- 'user', 'assistant'
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. SEMANTIC CACHE
create table public.semantic_cache (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants not null,
  query_hash text not null, -- Fast exact match
  query_embedding vector(1536), -- For semantic check
  response text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. TOKEN USAGE
create table public.token_usage (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants not null,
  user_id uuid references public.users(id),
  input_tokens int default 0,
  output_tokens int default 0,
  model_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INDEXES
create index on public.document_chunks using hnsw (embedding vector_cosine_ops);
create index on public.semantic_cache using hnsw (query_embedding vector_cosine_ops);
create index idx_documents_tenant on public.documents(tenant_id);
create index idx_chunks_tenant on public.document_chunks(tenant_id);

-- ROW LEVEL SECURITY (RLS)
-- "Bank Grade" means we must ensure a user can ONLY see rows where tenant_id matches their own tenant_id.

alter table public.tenants enable row level security;
alter table public.users enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.semantic_cache enable row level security;
alter table public.token_usage enable row level security;

-- HELPER FUNCTION: Get current user's tenant_id
create or replace function get_current_tenant_id()
returns uuid
language sql
security definer
as $$
  select tenant_id from public.users
  where id = auth.uid()
$$;

-- POLICIES

-- Tenants: Users can view their own tenant
create policy "Users can view own tenant" on public.tenants
  for select using (id = get_current_tenant_id());

-- Users: Users can view members of their own tenant
create policy "Users can view own tenant members" on public.users
  for select using (tenant_id = get_current_tenant_id());

-- Documents
create policy "Tenant isolation for documents" on public.documents
  for all using (tenant_id = get_current_tenant_id());

-- Document Chunks
create policy "Tenant isolation for chunks" on public.document_chunks
  for select using (tenant_id = get_current_tenant_id());

-- Chat Sessions
create policy "Tenant isolation for chat sessions" on public.chat_sessions
  for all using (tenant_id = get_current_tenant_id());

-- Chat Messages
create policy "Tenant isolation for chat messages" on public.chat_messages
  for all using (tenant_id = get_current_tenant_id());

-- Function for matching documents with tenant isolation
create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query(
    select
      document_chunks.id,
      document_chunks.content,
      1 - (document_chunks.embedding <=> query_embedding) as similarity
    from document_chunks
    where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
    and document_chunks.tenant_id = get_current_tenant_id() -- CRITICAL: FORCE TENANT CHECK
    order by document_chunks.embedding <=> query_embedding
    limit match_count
  );
end;
$$;
