# Database Migration Instructions

## Applying RLS Security Fix

This migration replaces permissive Row-Level Security (RLS) policies with proper tenant/user isolation to ensure data privacy between users.

### Option A: Via Supabase Dashboard (Recommended)

1.  Log in to your **Supabase Project Dashboard**.
2.  Navigate to the **SQL Editor** in the left-hand sidebar.
3.  Click **New Query**.
4.  Copy the contents of `001_fix_rls_tenant_isolation.sql` and paste it into the editor.
5.  Click **Run**.
6.  Open another new query, copy the contents of `verify_rls.sql`, and click **Run**.
7.  Verify the results:
    -   All relevant tables should show `rowsecurity = true`.
    -   Each table should have the corresponding `tenant_isolation` policies.

### Option B: Via Supabase CLI

If you have the Supabase CLI configured locally, you can push the changes:

```bash
# From the project root
supabase db push
```

*Note: The script is idempotent and safe to run multiple times.*
