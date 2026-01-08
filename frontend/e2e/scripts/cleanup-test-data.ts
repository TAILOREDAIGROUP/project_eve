import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_USER_ID = 'test-user-id'; // Adjust if needed

async function cleanup() {
  console.log(`Cleaning up test data for tenant: ${TEST_TENANT_ID}`);

  const tables = [
    'messages',
    'conversation_sessions',
    'user_memory',
    'agent_state',
    'proactive_triggers',
    'review_queue',
    'interactions',
    'feedback',
    'learnings',
    'goals',
    'conversations',
    'memories',
    'user_settings',
    'reflections',
    'proactive_insights',
    'knowledge_relationships',
    'knowledge_entities',
    'integrations'
  ];

  for (const table of tables) {
    try {
      let query = supabase.from(table).delete();
      
      // Some tables use user_id, some use tenant_id, some use both
      // We'll try to delete by tenant_id first if it exists, otherwise by user_id
      
      if (table === 'agent_state' || table === 'user_settings') {
        // These tables might only have user_id or specific unique constraints
        const { error } = await query.or(`user_id.eq.${TEST_USER_ID},tenant_id.eq.${TEST_TENANT_ID}`);
        if (error) console.warn(`Warning cleaning ${table}: ${error.message}`);
      } else {
        const { error } = await query.or(`tenant_id.eq.${TEST_TENANT_ID},user_id.eq.${TEST_USER_ID}`);
        if (error) console.warn(`Warning cleaning ${table}: ${error.message}`);
      }
      
      console.log(`✓ Cleaned ${table}`);
    } catch (err) {
      console.error(`Error cleaning ${table}:`, err);
    }
  }

  console.log('Cleanup complete');
}

cleanup();
