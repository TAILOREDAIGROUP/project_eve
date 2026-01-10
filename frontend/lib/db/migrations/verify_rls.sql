-- ============================================================================
-- Verification script: verify_rls.sql
-- Purpose: Confirm RLS is enabled and policies are applied
-- Date: 2026-01-10
-- ============================================================================

-- 1. Check RLS is enabled on all tables (should be 't' for true)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. List all policies (should show tenant_isolation_* for each table)
SELECT tablename, policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Count policies per table 
-- (Most tables should have 4 policies: SELECT, INSERT, UPDATE, DELETE)
-- (Some tables from schema.sql use 'FOR ALL' which counts as 1 policy)
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 4. Specific check for tenant isolation patterns
SELECT tablename, policyname, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND (qual LIKE '%auth.uid()%' OR qual LIKE '%auth.role()%')
ORDER BY tablename;
