-- ============================================================================
-- Migration: 001_fix_rls_tenant_isolation.sql
-- Purpose: Replace permissive RLS policies with tenant isolation
-- Safe to run multiple times (idempotent)
-- Date: 2026-01-10
-- ============================================================================

-- Function to safely create policies
-- This script uses DROP POLICY IF EXISTS before CREATE POLICY to ensure idempotency.

-- 1. DEPARTMENT_PROMPTS (Tenant Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'department_prompts') THEN
        ALTER TABLE department_prompts ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all department_prompts" ON department_prompts;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON department_prompts;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON department_prompts;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON department_prompts;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON department_prompts;

        CREATE POLICY "tenant_isolation_select" ON department_prompts FOR SELECT USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_insert" ON department_prompts FOR INSERT WITH CHECK (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_update" ON department_prompts FOR UPDATE USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_delete" ON department_prompts FOR DELETE USING (auth.uid()::text = tenant_id);
    END IF;
END $$;

-- 2. INTEGRATIONS (Tenant Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'integrations') THEN
        ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all integrations" ON integrations;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON integrations;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON integrations;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON integrations;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON integrations;

        CREATE POLICY "tenant_isolation_select" ON integrations FOR SELECT USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_insert" ON integrations FOR INSERT WITH CHECK (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_update" ON integrations FOR UPDATE USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_delete" ON integrations FOR DELETE USING (auth.uid()::text = tenant_id);
    END IF;
END $$;

-- 3. SYNCED_RECORDS (Tenant Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'synced_records') THEN
        ALTER TABLE synced_records ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all synced_records" ON synced_records;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON synced_records;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON synced_records;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON synced_records;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON synced_records;

        CREATE POLICY "tenant_isolation_select" ON synced_records FOR SELECT USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_insert" ON synced_records FOR INSERT WITH CHECK (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_update" ON synced_records FOR UPDATE USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_delete" ON synced_records FOR DELETE USING (auth.uid()::text = tenant_id);
    END IF;
END $$;

-- 4. RECORD_EMBEDDINGS (Tenant Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'record_embeddings') THEN
        ALTER TABLE record_embeddings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all record_embeddings" ON record_embeddings;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON record_embeddings;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON record_embeddings;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON record_embeddings;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON record_embeddings;

        CREATE POLICY "tenant_isolation_select" ON record_embeddings FOR SELECT USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_insert" ON record_embeddings FOR INSERT WITH CHECK (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_update" ON record_embeddings FOR UPDATE USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_delete" ON record_embeddings FOR DELETE USING (auth.uid()::text = tenant_id);
    END IF;
END $$;

-- 5. ACTION_LOGS (Tenant Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'action_logs') THEN
        ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all action_logs" ON action_logs;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON action_logs;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON action_logs;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON action_logs;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON action_logs;

        CREATE POLICY "tenant_isolation_select" ON action_logs FOR SELECT USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_insert" ON action_logs FOR INSERT WITH CHECK (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_update" ON action_logs FOR UPDATE USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_delete" ON action_logs FOR DELETE USING (auth.uid()::text = tenant_id);
    END IF;
END $$;

-- 6. TASK_EXECUTIONS (Tenant Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'task_executions') THEN
        ALTER TABLE task_executions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all task_executions" ON task_executions;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON task_executions;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON task_executions;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON task_executions;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON task_executions;

        CREATE POLICY "tenant_isolation_select" ON task_executions FOR SELECT USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_insert" ON task_executions FOR INSERT WITH CHECK (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_update" ON task_executions FOR UPDATE USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_delete" ON task_executions FOR DELETE USING (auth.uid()::text = tenant_id);
    END IF;
END $$;

-- 7. BUSINESS_PATTERNS (Tenant Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'business_patterns') THEN
        ALTER TABLE business_patterns ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all business_patterns" ON business_patterns;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON business_patterns;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON business_patterns;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON business_patterns;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON business_patterns;

        CREATE POLICY "tenant_isolation_select" ON business_patterns FOR SELECT USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_insert" ON business_patterns FOR INSERT WITH CHECK (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_update" ON business_patterns FOR UPDATE USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_delete" ON business_patterns FOR DELETE USING (auth.uid()::text = tenant_id);
    END IF;
END $$;

-- 8. BUSINESS_GLOSSARY (Tenant Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'business_glossary') THEN
        ALTER TABLE business_glossary ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all business_glossary" ON business_glossary;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON business_glossary;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON business_glossary;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON business_glossary;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON business_glossary;

        CREATE POLICY "tenant_isolation_select" ON business_glossary FOR SELECT USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_insert" ON business_glossary FOR INSERT WITH CHECK (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_update" ON business_glossary FOR UPDATE USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_delete" ON business_glossary FOR DELETE USING (auth.uid()::text = tenant_id);
    END IF;
END $$;

-- 9. INTERACTIONS (User Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'interactions') THEN
        ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all interactions" ON interactions;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON interactions;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON interactions;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON interactions;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON interactions;

        CREATE POLICY "tenant_isolation_select" ON interactions FOR SELECT USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_insert" ON interactions FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_update" ON interactions FOR UPDATE USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_delete" ON interactions FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- 10. CONVERSATIONS (User Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'conversations') THEN
        ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all conversations" ON conversations;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON conversations;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON conversations;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON conversations;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON conversations;

        CREATE POLICY "tenant_isolation_select" ON conversations FOR SELECT USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_insert" ON conversations FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_update" ON conversations FOR UPDATE USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_delete" ON conversations FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- 11. MEMORIES (User Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'memories') THEN
        ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all memories" ON memories;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON memories;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON memories;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON memories;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON memories;

        CREATE POLICY "tenant_isolation_select" ON memories FOR SELECT USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_insert" ON memories FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_update" ON memories FOR UPDATE USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_delete" ON memories FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- 12. PROACTIVE_INSIGHTS (User Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'proactive_insights') THEN
        ALTER TABLE proactive_insights ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all proactive_insights" ON proactive_insights;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON proactive_insights;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON proactive_insights;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON proactive_insights;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON proactive_insights;

        CREATE POLICY "tenant_isolation_select" ON proactive_insights FOR SELECT USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_insert" ON proactive_insights FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_update" ON proactive_insights FOR UPDATE USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_delete" ON proactive_insights FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- 13. KNOWLEDGE_ENTITIES (User Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'knowledge_entities') THEN
        ALTER TABLE knowledge_entities ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all knowledge_entities" ON knowledge_entities;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON knowledge_entities;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON knowledge_entities;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON knowledge_entities;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON knowledge_entities;

        CREATE POLICY "tenant_isolation_select" ON knowledge_entities FOR SELECT USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_insert" ON knowledge_entities FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_update" ON knowledge_entities FOR UPDATE USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_delete" ON knowledge_entities FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- 14. KNOWLEDGE_RELATIONSHIPS (Tenant Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'knowledge_relationships') THEN
        ALTER TABLE knowledge_relationships ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all knowledge_relationships" ON knowledge_relationships;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON knowledge_relationships;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON knowledge_relationships;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON knowledge_relationships;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON knowledge_relationships;

        CREATE POLICY "tenant_isolation_select" ON knowledge_relationships FOR SELECT USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_insert" ON knowledge_relationships FOR INSERT WITH CHECK (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_update" ON knowledge_relationships FOR UPDATE USING (auth.uid()::text = tenant_id);
        CREATE POLICY "tenant_isolation_delete" ON knowledge_relationships FOR DELETE USING (auth.uid()::text = tenant_id);
    END IF;
END $$;

-- 15. USER_SETTINGS (User Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'user_settings') THEN
        ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all user_settings" ON user_settings;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON user_settings;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON user_settings;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON user_settings;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON user_settings;

        CREATE POLICY "tenant_isolation_select" ON user_settings FOR SELECT USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_insert" ON user_settings FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_update" ON user_settings FOR UPDATE USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_delete" ON user_settings FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- 16. GOALS (User Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'goals') THEN
        ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all goals" ON goals;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON goals;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON goals;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON goals;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON goals;

        CREATE POLICY "tenant_isolation_select" ON goals FOR SELECT USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_insert" ON goals FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_update" ON goals FOR UPDATE USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_delete" ON goals FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- 17. FEEDBACK (User Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'feedback') THEN
        ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all feedback" ON feedback;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON feedback;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON feedback;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON feedback;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON feedback;

        CREATE POLICY "tenant_isolation_select" ON feedback FOR SELECT USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_insert" ON feedback FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_update" ON feedback FOR UPDATE USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_delete" ON feedback FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- 18. LEARNINGS (User Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'learnings') THEN
        ALTER TABLE learnings ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all learnings" ON learnings;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON learnings;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON learnings;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON learnings;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON learnings;

        CREATE POLICY "tenant_isolation_select" ON learnings FOR SELECT USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_insert" ON learnings FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_update" ON learnings FOR UPDATE USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_delete" ON learnings FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- 19. REFLECTIONS (User Isolation)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'reflections') THEN
        ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all reflections" ON reflections;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON reflections;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON reflections;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON reflections;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON reflections;

        CREATE POLICY "tenant_isolation_select" ON reflections FOR SELECT USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_insert" ON reflections FOR INSERT WITH CHECK (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_update" ON reflections FOR UPDATE USING (auth.uid()::text = user_id);
        CREATE POLICY "tenant_isolation_delete" ON reflections FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- 20. INTEGRATION_PROVIDERS (Special)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'integration_providers') THEN
        ALTER TABLE integration_providers ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all integration_providers" ON integration_providers;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON integration_providers;
        DROP POLICY IF EXISTS "tenant_isolation_insert" ON integration_providers;
        DROP POLICY IF EXISTS "tenant_isolation_update" ON integration_providers;
        DROP POLICY IF EXISTS "tenant_isolation_delete" ON integration_providers;

        CREATE POLICY "tenant_isolation_select" ON integration_providers FOR SELECT USING (auth.role() = 'authenticated');
        -- No insert/update/delete for users
    END IF;
END $$;

-- 21. Schema.sql specific tables (user_memory, conversation_sessions, messages, agent_state, proactive_triggers, review_queue)
DO $$ 
BEGIN
    -- user_memory
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'user_memory') THEN
        ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can access own memory" ON user_memory;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON user_memory;
        CREATE POLICY "tenant_isolation_all" ON user_memory FOR ALL USING (auth.uid()::text = user_id);
    END IF;

    -- conversation_sessions
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'conversation_sessions') THEN
        ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can access own sessions" ON conversation_sessions;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON conversation_sessions;
        CREATE POLICY "tenant_isolation_all" ON conversation_sessions FOR ALL USING (auth.uid()::text = user_id);
    END IF;

    -- messages
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'messages') THEN
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can access own messages" ON messages;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON messages;
        CREATE POLICY "tenant_isolation_all" ON messages FOR ALL USING (auth.uid()::text = user_id);
    END IF;

    -- agent_state
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'agent_state') THEN
        ALTER TABLE agent_state ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can access own agent state" ON agent_state;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON agent_state;
        CREATE POLICY "tenant_isolation_all" ON agent_state FOR ALL USING (auth.uid()::text = user_id);
    END IF;

    -- proactive_triggers
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'proactive_triggers') THEN
        ALTER TABLE proactive_triggers ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can access own triggers" ON proactive_triggers;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON proactive_triggers;
        CREATE POLICY "tenant_isolation_all" ON proactive_triggers FOR ALL USING (auth.uid()::text = user_id);
    END IF;

    -- review_queue
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'review_queue') THEN
        ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Users can access own reviews" ON review_queue;
        DROP POLICY IF EXISTS "tenant_isolation_select" ON review_queue;
        CREATE POLICY "tenant_isolation_all" ON review_queue FOR ALL USING (auth.uid()::text = user_id);
    END IF;
END $$;

-- 22. Additional placeholder tables from prompt (if they exist)
DO $$ 
BEGIN
    -- user_goals
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'user_goals') THEN
        ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "tenant_isolation_all" ON user_goals;
        CREATE POLICY "tenant_isolation_all" ON user_goals FOR ALL USING (auth.uid()::text = user_id);
    END IF;
    -- goal_progress
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'goal_progress') THEN
        ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "tenant_isolation_all" ON goal_progress;
        CREATE POLICY "tenant_isolation_all" ON goal_progress FOR ALL USING (auth.uid()::text = user_id);
    END IF;
    -- scheduled_tasks
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'scheduled_tasks') THEN
        ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "tenant_isolation_all" ON scheduled_tasks;
        CREATE POLICY "tenant_isolation_all" ON scheduled_tasks FOR ALL USING (auth.uid()::text = user_id);
    END IF;
    -- user_context
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'user_context') THEN
        ALTER TABLE user_context ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "tenant_isolation_all" ON user_context;
        CREATE POLICY "tenant_isolation_all" ON user_context FOR ALL USING (auth.uid()::text = user_id);
    END IF;
    -- feedback_entries
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'feedback_entries') THEN
        ALTER TABLE feedback_entries ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "tenant_isolation_all" ON feedback_entries;
        CREATE POLICY "tenant_isolation_all" ON feedback_entries FOR ALL USING (auth.uid()::text = user_id);
    END IF;
END $$;
