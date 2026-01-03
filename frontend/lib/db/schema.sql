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
