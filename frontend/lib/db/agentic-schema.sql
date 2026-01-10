-- ============================================================================
-- PROJECT EVE - COMPLETE AGENTIC AI DATABASE SCHEMA
-- SECURITY UPDATE: Row-Level Security (RLS) policies implemented for tenant isolation
-- DATE: 2026-01-10
-- CHANGES:
-- 1. Enabled RLS on all tables
-- 2. Implemented user_id based isolation for all agentic tables
-- 3. Implemented tenant_id based isolation for relationship tables
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

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_relationships ENABLE ROW LEVEL SECURITY;

-- user_settings policies
CREATE POLICY "tenant_isolation_select" ON user_settings FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_insert" ON user_settings FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_update" ON user_settings FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_delete" ON user_settings FOR DELETE USING (auth.uid()::text = user_id);

-- conversations policies
CREATE POLICY "tenant_isolation_select" ON conversations FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_insert" ON conversations FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_update" ON conversations FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_delete" ON conversations FOR DELETE USING (auth.uid()::text = user_id);

-- memories policies
CREATE POLICY "tenant_isolation_select" ON memories FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_insert" ON memories FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_update" ON memories FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_delete" ON memories FOR DELETE USING (auth.uid()::text = user_id);

-- reflections policies
CREATE POLICY "tenant_isolation_select" ON reflections FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_insert" ON reflections FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_update" ON reflections FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_delete" ON reflections FOR DELETE USING (auth.uid()::text = user_id);

-- feedback policies
CREATE POLICY "tenant_isolation_select" ON feedback FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_insert" ON feedback FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_update" ON feedback FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_delete" ON feedback FOR DELETE USING (auth.uid()::text = user_id);

-- learnings policies
CREATE POLICY "tenant_isolation_select" ON learnings FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_insert" ON learnings FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_update" ON learnings FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_delete" ON learnings FOR DELETE USING (auth.uid()::text = user_id);

-- goals policies
CREATE POLICY "tenant_isolation_select" ON goals FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_insert" ON goals FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_update" ON goals FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_delete" ON goals FOR DELETE USING (auth.uid()::text = user_id);

-- proactive_insights policies
CREATE POLICY "tenant_isolation_select" ON proactive_insights FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_insert" ON proactive_insights FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_update" ON proactive_insights FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_delete" ON proactive_insights FOR DELETE USING (auth.uid()::text = user_id);

-- knowledge_entities policies
CREATE POLICY "tenant_isolation_select" ON knowledge_entities FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_insert" ON knowledge_entities FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_update" ON knowledge_entities FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "tenant_isolation_delete" ON knowledge_entities FOR DELETE USING (auth.uid()::text = user_id);

-- knowledge_relationships policies (uses tenant_id)
CREATE POLICY "tenant_isolation_select" ON knowledge_relationships FOR SELECT USING (auth.uid()::text = tenant_id);
CREATE POLICY "tenant_isolation_insert" ON knowledge_relationships FOR INSERT WITH CHECK (auth.uid()::text = tenant_id);
CREATE POLICY "tenant_isolation_update" ON knowledge_relationships FOR UPDATE USING (auth.uid()::text = tenant_id);
CREATE POLICY "tenant_isolation_delete" ON knowledge_relationships FOR DELETE USING (auth.uid()::text = tenant_id);
