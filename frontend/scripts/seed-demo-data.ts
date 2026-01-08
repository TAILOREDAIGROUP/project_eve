
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440000';

async function seed() {
  console.log('🌱 Seeding demo data for Project Eve...');

  // 1. User Settings
  console.log('Setting engagement level...');
  const { error: sError } = await supabase.from('user_settings').upsert({
    user_id: USER_ID,
    tenant_id: TENANT_ID,
    engagement_level: 3,
    preferences: { tone: 'professional', detail_level: 'high' }
  });
  if (sError) console.error('Settings error:', sError);

  // 2. Memories
  console.log('Seeding memories...');
  const memories = [
    { user_id: USER_ID, tenant_id: TENANT_ID, content: 'User prefers concise, executive-level summaries for technical reports.', memory_type: 'preference', importance: 9 },
    { user_id: USER_ID, tenant_id: TENANT_ID, content: 'User is currently focused on the Q1 launch of Project Eve.', memory_type: 'context', importance: 10 },
    { user_id: USER_ID, tenant_id: TENANT_ID, content: 'Tailored AI Group is the parent organization.', memory_type: 'fact', importance: 8 },
    { user_id: USER_ID, tenant_id: TENANT_ID, content: 'User typically works from 8 AM to 6 PM EST.', memory_type: 'preference', importance: 7 },
    { user_id: USER_ID, tenant_id: TENANT_ID, content: 'Eve is the name of the proactive AI agent.', memory_type: 'fact', importance: 10 }
  ];
  const { error: mError1 } = await supabase.from('memories').delete().eq('tenant_id', TENANT_ID);
  if (mError1) console.error('Memories delete error:', mError1);
  const { error: mError2 } = await supabase.from('memories').insert(memories);
  if (mError2) console.error('Memories insert error:', mError2);

  // 3. Goals
  console.log('Seeding goals...');
  const goals = [
    {
      user_id: USER_ID,
      tenant_id: TENANT_ID,
      title: 'Launch Project Eve Intelligence Dashboard',
      description: 'Create a comprehensive visual representation of agentic capabilities for stakeholders.',
      status: 'active',
      priority: 'critical',
      progress: 85,
      subtasks: [
        { id: 'st1', description: 'Design UI layout', status: 'completed' },
        { id: 'st2', description: 'Implement backend API routes', status: 'completed' },
        { id: 'st3', description: 'Connect to real-time data', status: 'in_progress' },
        { id: 'st4', description: 'Finalize demo data seeding', status: 'in_progress' }
      ]
    },
    {
      user_id: USER_ID,
      tenant_id: TENANT_ID,
      title: 'Enterprise Customer Onboarding',
      description: 'Prepare the system for the first wave of enterprise beta testers.',
      status: 'active',
      priority: 'high',
      progress: 30,
      subtasks: [
        { id: 'st5', description: 'Create documentation', status: 'completed' },
        { id: 'st6', description: 'Set up multi-tenant security', status: 'pending' },
        { id: 'st7', description: 'Training sessions', status: 'pending' }
      ]
    }
  ];
  const { error: gError1 } = await supabase.from('goals').delete().eq('tenant_id', TENANT_ID);
  if (gError1) console.error('Goals delete error:', gError1);
  const { error: gError2 } = await supabase.from('goals').insert(goals);
  if (gError2) console.error('Goals insert error:', gError2);

  // 4. Reflections
  console.log('Seeding reflections...');
  const reflections = [
    {
      user_id: USER_ID,
      tenant_id: TENANT_ID,
      user_query: 'Help me plan the dashboard launch.',
      ai_response: 'I will help you plan the launch. We should focus on the key metrics first.',
      scores: { overall: 90, accuracy: 95, tone: 85 },
      reasoning: 'The response was helpful but could be more proactive in suggesting specific metrics.',
      improvements: ['Suggest specific KPIs', 'Include a timeline']
    },
    {
      user_id: USER_ID,
      tenant_id: TENANT_ID,
      user_query: 'What is the status of the smartphone marketing campaign?',
      ai_response: 'You mentioned earlier you are working on it. Would you like me to draft some taglines?',
      scores: { overall: 85, accuracy: 90, tone: 80 },
      reasoning: 'Good memory recall, but response was a bit brief.',
      improvements: ['Provide examples immediately']
    }
  ];
  await supabase.from('reflections').delete().eq('tenant_id', TENANT_ID);
  await supabase.from('reflections').insert(reflections);

  // 5. Feedback
  console.log('Seeding feedback...');
  const feedbacks = [
    { interaction_id: 'int1', user_id: USER_ID, tenant_id: TENANT_ID, feedback: 'positive', comment: 'Great job remembering my preferences!' },
    { interaction_id: 'int2', user_id: USER_ID, tenant_id: TENANT_ID, feedback: 'positive', comment: 'The goal breakdown is very helpful.' }
  ];
  await supabase.from('feedback').delete().eq('tenant_id', TENANT_ID);
  await supabase.from('feedback').insert(feedbacks);

  // 6. Knowledge Graph
  console.log('Seeding knowledge graph...');
  const entities = [
    { user_id: USER_ID, tenant_id: TENANT_ID, name: 'Project Eve', type: 'project', description: 'Proactive agentic AI system' },
    { user_id: USER_ID, tenant_id: TENANT_ID, name: 'Tailored AI Group', type: 'organization', description: 'Parent company' },
    { user_id: USER_ID, tenant_id: TENANT_ID, name: 'Vercel', type: 'organization', description: 'Deployment platform' },
    { user_id: USER_ID, tenant_id: TENANT_ID, name: 'Supabase', type: 'organization', description: 'Database provider' }
  ];
  
  await supabase.from('knowledge_entities').delete().eq('tenant_id', TENANT_ID);
  const { data: createdEntities } = await supabase.from('knowledge_entities').insert(entities).select();

  if (createdEntities && createdEntities.length >= 2) {
    const relationships = [
      { 
        tenant_id: TENANT_ID, 
        source_entity_id: createdEntities.find(e => e.name === 'Project Eve').id, 
        target_entity_id: createdEntities.find(e => e.name === 'Tailored AI Group').id, 
        relationship_type: 'developed_by' 
      },
      { 
        tenant_id: TENANT_ID, 
        source_entity_id: createdEntities.find(e => e.name === 'Project Eve').id, 
        target_entity_id: createdEntities.find(e => e.name === 'Supabase').id, 
        relationship_type: 'uses' 
      }
    ];
    await supabase.from('knowledge_relationships').delete().eq('tenant_id', TENANT_ID);
    await supabase.from('knowledge_relationships').insert(relationships);
  }

  console.log('✅ Seeding complete!');
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
