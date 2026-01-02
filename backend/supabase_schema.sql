-- Enable pgvector extension to work with embeddings
create extension if not exists vector;

-- Documents table to store uploaded content and their embeddings
create table documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(1536)
);

-- User Memory table to store facts about the user
create table user_memory (
  user_id uuid,
  fact_key text,
  fact_value text,
  confidence_score float
);
