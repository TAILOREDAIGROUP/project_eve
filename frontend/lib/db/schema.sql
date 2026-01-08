-- ============================================================================
-- DOMAIN MEMORY FACTORY SCHEMA
-- ============================================================================
-- This schema implements persistent memory for the proactive agent system
-- Tables: user_memory, conversation_sessions, messages, agent_state
-- ============================================================================

-- User Memory Table (persistent context across sessions)
CREATE TABLE IF NOT EXISTS user_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('fact', 'preference', 'goal', 'context')),
  content TEXT NOT NULL,
  confidence FLOAT DEFAULT 1.0,
  source TEXT, -- which conversation this came from
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- optional TTL
  embedding VECTOR(1536) -- for semantic search
);

-- Conversation Sessions Table
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_type TEXT DEFAULT 'chat',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  summary TEXT, -- AI-generated summary of the conversation
  goals_discussed JSONB DEFAULT '[]'::jsonb,
  outcomes JSONB DEFAULT '[]'::jsonb
);

-- Message History Table (for context retrieval)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  embedding VECTOR(1536)
);

-- Agent State Table (for boot-up ritual)
CREATE TABLE IF NOT EXISTS agent_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  current_goals JSONB DEFAULT '[]'::jsonb,
  active_tasks JSONB DEFAULT '[]'::jsonb,
  user_profile JSONB DEFAULT '{}'::jsonb,
  last_interaction TIMESTAMPTZ,
  interaction_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proactive Triggers Table (Phase 4)
CREATE TABLE IF NOT EXISTS proactive_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('stale_goal', 'blocked_task', 'streak', 'pattern', 'milestone')),
  trigger_data JSONB DEFAULT '{}'::jsonb,
  fired_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution TEXT
);

-- Review Queue Table (Phase 5)
CREATE TABLE IF NOT EXISTS review_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  message_id UUID,
  content TEXT NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('accuracy', 'tone', 'completeness', 'safety')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revised')),
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_type ON user_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_user_memory_created ON user_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_state_user_id ON agent_state(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_triggers_user_id ON proactive_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_triggers_resolved ON proactive_triggers(resolved_at);
CREATE INDEX IF NOT EXISTS idx_review_queue_user_id ON review_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_status ON review_queue(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can access own memory" ON user_memory
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can access own sessions" ON conversation_sessions
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can access own messages" ON messages
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can access own agent state" ON agent_state
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can access own triggers" ON proactive_triggers
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can access own reviews" ON review_queue
  FOR ALL USING (auth.uid()::text = user_id);

-- Learning Tables
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  feedback TEXT CHECK (feedback IN ('positive', 'negative')),
  reflection_score NUMERIC,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CONTINUOUS LEARNING TABLES
-- ============================================================================

-- Feedback table for storing user feedback on interactions
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  feedback TEXT NOT NULL CHECK (feedback IN ('positive', 'negative')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learnings table for storing extracted patterns and preferences
-- (Updating existing table structure)
DROP TABLE IF EXISTS learnings;
CREATE TABLE IF NOT EXISTS learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  patterns JSONB DEFAULT '[]',
  preferences JSONB DEFAULT '[]',
  feedback_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for feedback
CREATE INDEX IF NOT EXISTS idx_feedback_tenant ON feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_interaction ON feedback(interaction_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

-- ============================================================================
-- GOAL MANAGEMENT TABLES
-- ============================================================================

-- Goals table for tracking user goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT DEFAULT 'other',
  subtasks JSONB DEFAULT '[]',
  progress INTEGER DEFAULT 0,
  target_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for goals
CREATE INDEX IF NOT EXISTS idx_goals_tenant ON goals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority);

-- RLS Policies
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all feedback" ON feedback FOR ALL USING (true);
CREATE POLICY "Allow all learnings" ON learnings FOR ALL USING (true);
CREATE POLICY "Allow all goals" ON goals FOR ALL USING (true);

-- ============================================================================
-- PERSISTENT MEMORY TABLES (Added for Agentic Fix)
-- ============================================================================

-- Conversations table for storing chat history
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memories table for storing extracted facts
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  content TEXT NOT NULL,
  memory_type TEXT DEFAULT 'fact',
  importance INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance DESC);

-- ============================================================================
-- USER SETTINGS TABLE (For Engagement Levels)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  engagement_level INTEGER DEFAULT 2 CHECK (engagement_level IN (1, 2, 3)),
  preferences JSONB DEFAULT '{}',
  last_interaction TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_tenant ON user_settings(tenant_id);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all user_settings" ON user_settings FOR ALL USING (true);

-- ============================================================================
-- SELF-REFLECTION TABLE (For quality tracking and improvement)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_query TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}',
  improvements JSONB DEFAULT '[]',
  was_revised BOOLEAN DEFAULT FALSE,
  revised_response TEXT,
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_reflections_tenant ON reflections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reflections_created ON reflections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reflections_scores ON reflections((scores->>'overall'));

-- RLS Policy
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all reflections" ON reflections FOR ALL USING (true);

-- ============================================================================
-- PROACTIVE ENGINE TABLES
-- ============================================================================

-- Proactive insights table
CREATE TABLE IF NOT EXISTS proactive_insights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'suggestion', 'check_in', 'tip', 'alert', 'goal_update')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
  related_goal_id TEXT,
  actionable BOOLEAN DEFAULT FALSE,
  suggested_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT FALSE
);

-- Indexes for proactive insights
CREATE INDEX IF NOT EXISTS idx_proactive_insights_tenant ON proactive_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proactive_insights_type ON proactive_insights(type);
CREATE INDEX IF NOT EXISTS idx_proactive_insights_priority ON proactive_insights(priority);
CREATE INDEX IF NOT EXISTS idx_proactive_insights_expires ON proactive_insights(expires_at);

-- ============================================================================
-- KNOWLEDGE GRAPH TABLES
-- ============================================================================

-- Knowledge entities table
CREATE TABLE IF NOT EXISTS knowledge_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('person', 'organization', 'project', 'concept', 'location', 'date', 'product', 'other')),
  description TEXT,
  attributes JSONB DEFAULT '{}',
  confidence INTEGER DEFAULT 50,
  first_mentioned TIMESTAMPTZ DEFAULT NOW(),
  last_mentioned TIMESTAMPTZ DEFAULT NOW(),
  mention_count INTEGER DEFAULT 1
);

-- Knowledge relationships table
CREATE TABLE IF NOT EXISTS knowledge_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  source_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  description TEXT,
  confidence INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for knowledge graph
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_tenant ON knowledge_entities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_type ON knowledge_entities(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_name ON knowledge_entities(name);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_mentions ON knowledge_entities(mention_count DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_tenant ON knowledge_relationships(tenant_id);

-- ============================================================================
-- ADMIN & PROMPT MANAGEMENT TABLES
-- ============================================================================

-- Department prompts table for admin customization
CREATE TABLE IF NOT EXISTS department_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  departments JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_department_prompts_tenant ON department_prompts(tenant_id);

ALTER TABLE department_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all department_prompts" ON department_prompts FOR ALL USING (true);

-- ============================================================================
-- INTEGRATIONS & CONNECTORS
-- ============================================================================

-- Available integration providers
CREATE TABLE IF NOT EXISTS integration_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'communication', 'crm', 'finance', 'productivity', 'storage'
  auth_type TEXT NOT NULL DEFAULT 'oauth2', -- 'oauth2', 'api_key', 'basic'
  scopes JSONB DEFAULT '[]',
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's connected integrations
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  provider_id TEXT NOT NULL REFERENCES integration_providers(id),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'connected', 'error', 'revoked'
  access_token TEXT, -- encrypted in production
  refresh_token TEXT, -- encrypted in production
  token_expires_at TIMESTAMPTZ,
  scopes JSONB DEFAULT '[]',
  account_info JSONB DEFAULT '{}', -- email, name, org from provider
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, provider_id)
);

-- Synced data from integrations (normalized)
CREATE TABLE IF NOT EXISTS synced_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  record_type TEXT NOT NULL, -- 'email', 'document', 'deal', 'contact', 'ticket', 'invoice', 'message', 'event'
  external_id TEXT NOT NULL, -- ID in the source system
  title TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  url TEXT, -- deep link back to source
  created_at_source TIMESTAMPTZ,
  updated_at_source TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, provider_id, external_id)
);

-- Vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS record_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID REFERENCES synced_records(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension
  chunk_index INTEGER DEFAULT 0,
  chunk_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Action logs (audit trail for write operations)
CREATE TABLE IF NOT EXISTS action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'send_email', 'create_deal', 'create_ticket', 'update_record'
  provider_id TEXT,
  task_id TEXT, -- which department task triggered this
  prompt_used TEXT,
  input_data JSONB,
  output_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'executed', 'failed', 'cancelled'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integrations_tenant ON integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_synced_records_tenant ON synced_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synced_records_type ON synced_records(record_type);
CREATE INDEX IF NOT EXISTS idx_synced_records_provider ON synced_records(provider_id);
CREATE INDEX IF NOT EXISTS idx_record_embeddings_tenant ON record_embeddings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_tenant ON action_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_status ON action_logs(status);

-- RLS
ALTER TABLE integration_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all integration_providers" ON integration_providers FOR ALL USING (true);
CREATE POLICY "Allow all integrations" ON integrations FOR ALL USING (true);
CREATE POLICY "Allow all synced_records" ON synced_records FOR ALL USING (true);
CREATE POLICY "Allow all record_embeddings" ON record_embeddings FOR ALL USING (true);
CREATE POLICY "Allow all action_logs" ON action_logs FOR ALL USING (true);

-- Seed default providers
INSERT INTO integration_providers (id, name, icon, description, category, auth_type, scopes) VALUES
  ('google', 'Google Workspace', '🔵', 'Gmail, Google Drive, Calendar', 'productivity', 'oauth2', '["gmail.readonly", "drive.readonly", "calendar.readonly"]'),
  ('slack', 'Slack', '💬', 'Messages and channels', 'communication', 'oauth2', '["channels:read", "chat:write", "users:read"]'),
  ('hubspot', 'HubSpot', '🟠', 'CRM - Deals, Contacts, Companies', 'crm', 'oauth2', '["crm.objects.contacts.read", "crm.objects.deals.read"]'),
  ('quickbooks', 'QuickBooks', '💚', 'Invoices, Expenses, Reports', 'finance', 'oauth2', '["com.intuit.quickbooks.accounting"]'),
  ('notion', 'Notion', '⬛', 'Documents and databases', 'productivity', 'oauth2', '["read_content"]'),
  ('zendesk', 'Zendesk', '🎫', 'Support tickets and customers', 'crm', 'oauth2', '["tickets:read", "users:read"]'),
  ('shopify', 'Shopify', '🛒', 'Orders, Products, Customers', 'finance', 'oauth2', '["read_orders", "read_products", "read_customers"]'),
  ('microsoft365', 'Microsoft 365', '🔷', 'Outlook, OneDrive, Teams', 'productivity', 'oauth2', '["Mail.Read", "Files.Read", "Calendars.Read"]')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- LEARNING & INTELLIGENCE LAYER
-- ============================================================================

-- Task execution history (what tasks users run most)
CREATE TABLE IF NOT EXISTS task_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  department_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  task_title TEXT NOT NULL,
  prompt_used TEXT NOT NULL,
  input_values JSONB DEFAULT '{}', -- filled bracket values
  response_summary TEXT,
  feedback TEXT, -- 'positive', 'negative', null
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learned patterns per tenant (what Eve has learned about this business)
CREATE TABLE IF NOT EXISTS business_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  pattern_type TEXT NOT NULL, -- 'terminology', 'preference', 'workflow', 'entity', 'style'
  pattern_key TEXT NOT NULL,
  pattern_value TEXT NOT NULL,
  confidence INTEGER DEFAULT 50, -- 0-100
  source TEXT, -- 'explicit' (user told us), 'inferred' (learned from usage)
  example_context TEXT,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, pattern_type, pattern_key)
);

-- Business glossary (company-specific terms Eve learns)
CREATE TABLE IF NOT EXISTS business_glossary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  category TEXT, -- 'product', 'process', 'team', 'customer', 'metric'
  aliases JSONB DEFAULT '[]',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, term)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_executions_tenant ON task_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_task_executions_task ON task_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_executions_created ON task_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_patterns_tenant ON business_patterns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_patterns_type ON business_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_business_glossary_tenant ON business_glossary(tenant_id);

-- RLS
ALTER TABLE task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_glossary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all task_executions" ON task_executions FOR ALL USING (true);
CREATE POLICY "Allow all business_patterns" ON business_patterns FOR ALL USING (true);
CREATE POLICY "Allow all business_glossary" ON business_glossary FOR ALL USING (true);
