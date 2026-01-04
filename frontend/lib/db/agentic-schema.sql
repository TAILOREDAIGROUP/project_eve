-- ============================================================================
-- PROJECT EVE - COMPLETE AGENTIC AI DATABASE SCHEMA
-- ============================================================================

-- ============================================================================
-- USER SETTINGS TABLE
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

-- ============================================================================
-- CONVERSATIONS TABLE (Chat History)
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);

-- ============================================================================
-- MEMORIES TABLE (Extracted Facts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  content TEXT NOT NULL,
  memory_type TEXT DEFAULT 'fact' CHECK (memory_type IN ('fact', 'preference', 'goal', 'context', 'other')),
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_tenant ON memories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance DESC);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(memory_type);

-- ============================================================================
-- REFLECTIONS TABLE (Self-Evaluation)
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

CREATE INDEX IF NOT EXISTS idx_reflections_tenant ON reflections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reflections_created ON reflections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reflections_scores ON reflections((scores->>'overall'));

-- ============================================================================
-- FEEDBACK TABLE (User Feedback)
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  feedback TEXT NOT NULL CHECK (feedback IN ('positive', 'negative')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_tenant ON feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_interaction ON feedback(interaction_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);

-- ============================================================================
-- LEARNINGS TABLE (Extracted Patterns)
-- ============================================================================
CREATE TABLE IF NOT EXISTS learnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  patterns JSONB DEFAULT '[]',
  preferences JSONB DEFAULT '[]',
  feedback_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learnings_tenant ON learnings(tenant_id);

-- ============================================================================
-- GOALS TABLE
-- ============================================================================
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
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  target_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_goals_tenant ON goals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority);

-- ============================================================================
-- PROACTIVE INSIGHTS TABLE
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_proactive_insights_tenant ON proactive_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proactive_insights_type ON proactive_insights(type);
CREATE INDEX IF NOT EXISTS idx_proactive_insights_expires ON proactive_insights(expires_at);

-- ============================================================================
-- KNOWLEDGE ENTITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('person', 'organization', 'project', 'concept', 'location', 'date', 'product', 'other')),
  description TEXT,
  attributes JSONB DEFAULT '{}',
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  first_mentioned TIMESTAMPTZ DEFAULT NOW(),
  last_mentioned TIMESTAMPTZ DEFAULT NOW(),
  mention_count INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_knowledge_entities_tenant ON knowledge_entities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_type ON knowledge_entities(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_name ON knowledge_entities(name);
CREATE INDEX IF NOT EXISTS idx_knowledge_entities_mentions ON knowledge_entities(mention_count DESC);

-- ============================================================================
-- KNOWLEDGE RELATIONSHIPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  source_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  description TEXT,
  confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_tenant ON knowledge_relationships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_source ON knowledge_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_target ON knowledge_relationships(target_entity_id);
