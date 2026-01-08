/**
 * Comprehensive Agentic AI Test Suite for Project Eve
 * Tests Multi-Agent coordination, Orchestration, and core agentic loops
 */

import { createAgenticOrchestrator } from '../../lib/agent/agentic-orchestrator';
import { createMultiAgentSystem } from '../../lib/agent/multi-agent';

async function testOrchestrator() {
  console.log('🧪 Testing Agentic Orchestrator...');
  const userId = 'test-user-' + Date.now();
  const tenantId = 'test-tenant';
  const orchestrator = createAgenticOrchestrator(userId, tenantId);

  await orchestrator.initialize();
  console.log('✅ Orchestrator initialized');

  const userQuery = 'I want to build a high-performance web application using Next.js.';
  const aiResponse = 'That sounds like a great project! I can help you with that.';
  
  const context = await orchestrator.buildContext(userQuery);
  console.log('✅ Context built with engagement level:', context.engagementLevel);

  const response = await orchestrator.processMessage(userQuery, aiResponse, context);
  console.log('✅ Message processed');
  console.log('   Revision status:', response.wasRevised);
  console.log('   Reflection score:', response.reflectionScore);
  
  return response;
}

async function testMultiAgent() {
  console.log('\n🧪 Testing Multi-Agent System...');
  const userId = 'test-user-' + Date.now();
  const tenantId = 'test-tenant';
  const multiAgent = createMultiAgentSystem(userId, tenantId);

  const objective = 'Analyze the current trends in AI agents and write a short summary.';
  const context = 'Focus on productivity and developer tools.';

  console.log('   Creating plan...');
  const plan = await multiAgent.createPlan(objective, context);
  console.log('✅ Plan created with', plan.tasks.length, 'tasks');

  console.log('   Executing plan (this may take a moment)...');
  const result = await multiAgent.executePlan(plan);
  console.log('✅ Plan executed');
  console.log('   Overall confidence:', result.overallConfidence);
  console.log('   Final synthesized output length:', result.finalOutput.length);

  return result;
}

async function runAllTests() {
  try {
    console.log('🚀 Starting Phase 5 Comprehensive Tests\n');
    
    await testOrchestrator();
    await testMultiAgent();
    
    console.log('\n✨ All Phase 5 tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Check for API key before running
if (!process.env.OPENROUTER_API_KEY) {
  console.error('❌ Error: OPENROUTER_API_KEY is required to run tests.');
  process.exit(1);
}

runAllTests();
