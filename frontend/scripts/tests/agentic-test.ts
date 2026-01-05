/**
 * Agentic AI Capabilities Test Suite
 * Tests self-reflection, learning, and goal management
 */
const TEST_API_URL = process.env.TEST_API_URL || 'http://localhost:3000/api/chat';

interface AgenticTestResult {
  capability: string;
  passed: boolean;
  score: number;
  details: string;
}

async function sendMessage(message: string, tenantId: string = 'test-tenant', sessionId?: string): Promise<string> {
  const response = await fetch(TEST_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }],
      tenant_id: tenantId,
      session_id: sessionId || `session-${tenantId}`,
    }),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  const rawText = await response.text();
  
  // Parse AI SDK stream format (e.g., 0:"content")
  const lines = rawText.split('\n');
  let fullContent = '';
  for (const line of lines) {
    if (line.startsWith('0:')) {
      try {
        const content = JSON.parse(line.substring(2));
        fullContent += content;
      } catch (e) {
        // Fallback for non-JSON content
        fullContent += line.substring(2);
      }
    }
  }
  
  // If no 0: lines found, try returning the raw text if it doesn't look like a stream
  if (!fullContent && rawText) {
    return rawText;
  }
  
  return fullContent;
}

async function testMemoryPersistence(): Promise<AgenticTestResult> {
  const tenantId = `test-memory-${Date.now()}`;
  const sessionId = `session-${tenantId}`;
  console.log(`\n🧠 Testing Memory Persistence (Tenant: ${tenantId})...`);
  try {
    // Tell Eve something specific
    await sendMessage('My favorite color is purple and my dog is named Max.', tenantId, sessionId);

    // Wait for persistence
    console.log('Waiting 5s for persistence...');
    await new Promise(r => setTimeout(r, 5000));

    // Ask about it
    const response = await sendMessage('What is my favorite color and what is my dog\'s name?', tenantId, sessionId);
    console.log(`Eve said: "${response}"`);

    const remembersColor = response.toLowerCase().includes('purple');
    const remembersDog = response.toLowerCase().includes('max');

    const passed = remembersColor && remembersDog;
    const score = (remembersColor ? 50 : 0) + (remembersDog ? 50 : 0);

    return {
      capability: 'Memory Persistence',
      passed,
      score,
      details: passed
        ? 'Eve successfully remembered user information across messages'
        : `Eve failed to remember: color=${remembersColor}, dog=${remembersDog}`,
    };
  } catch (error) {
    return {
      capability: 'Memory Persistence',
      passed: false,
      score: 0,
      details: `Error: ${error}`,
    };
  }
}

async function testContextualUnderstanding(): Promise<AgenticTestResult> {
  const tenantId = `test-context-${Date.now()}`;
  const sessionId = `session-${tenantId}`;
  console.log(`\n🎯 Testing Contextual Understanding (Tenant: ${tenantId})...`);
  try {
    // Set up context
    await sendMessage('I am working on a marketing campaign for a new smartphone.', tenantId, sessionId);

    // Wait for persistence
    console.log('Waiting 3s for persistence...');
    await new Promise(r => setTimeout(r, 3000));

    // Ask a follow-up that requires context
    const response = await sendMessage('What are some good taglines I could use?', tenantId, sessionId);
    console.log(`Eve said: "${response}"`);

    // Check if response is contextually relevant
    const isRelevant =
      response.toLowerCase().includes('phone') ||
      response.toLowerCase().includes('mobile') ||
      response.toLowerCase().includes('smart') ||
      response.toLowerCase().includes('tech') ||
      response.toLowerCase().includes('campaign') ||
      response.toLowerCase().includes('marketing');

    return {
      capability: 'Contextual Understanding',
      passed: isRelevant,
      score: isRelevant ? 100 : 0,
      details: isRelevant
        ? 'Eve understood the context and provided relevant suggestions'
        : 'Eve failed to maintain context from previous message',
    };
  } catch (error) {
    return {
      capability: 'Contextual Understanding',
      passed: false,
      score: 0,
      details: `Error: ${error}`,
    };
  }
}

async function testGoalRecognition(): Promise<AgenticTestResult> {
  const tenantId = `test-goal-${Date.now()}`;
  console.log(`\n🎯 Testing Goal Recognition (Tenant: ${tenantId})...`);
  try {
    const response = await sendMessage('I want to learn Spanish in the next 3 months. Can you help me create a plan?', tenantId);
    console.log(`Eve said: "${response}"`);

    // Check if Eve recognizes this as a goal and provides structured help
    const hasStructure =
      response.includes('week') ||
      response.includes('day') ||
      response.includes('step') ||
      response.includes('plan') ||
      response.includes('1.') ||
      response.includes('•');

    const hasTimeframe =
      response.toLowerCase().includes('month') ||
      response.toLowerCase().includes('week');

    const passed = hasStructure && hasTimeframe;
    const score = (hasStructure ? 50 : 0) + (hasTimeframe ? 50 : 0);

    return {
      capability: 'Goal Recognition',
      passed,
      score,
      details: passed
        ? 'Eve recognized the goal and provided a structured plan'
        : `Eve failed: structure=${hasStructure}, timeframe=${hasTimeframe}`,
    };
  } catch (error) {
    return {
      capability: 'Goal Recognition',
      passed: false,
      score: 0,
      details: `Error: ${error}`,
    };
  }
}

async function testProactiveSuggestions(): Promise<AgenticTestResult> {
  const tenantId = `test-proactive-${Date.now()}`;
  console.log(`\n💡 Testing Proactive Suggestions (Tenant: ${tenantId})...`);
  try {
    const response = await sendMessage('I just started a new business selling handmade candles.', tenantId);
    console.log(`Eve said: "${response}"`);

    // Check if Eve proactively offers helpful suggestions
    const hasProactiveSuggestions =
      response.toLowerCase().includes('suggest') ||
      response.toLowerCase().includes('consider') ||
      response.toLowerCase().includes('might want') ||
      response.toLowerCase().includes('could') ||
      response.toLowerCase().includes('recommend') ||
      response.toLowerCase().includes('tip');

    return {
      capability: 'Proactive Suggestions',
      passed: hasProactiveSuggestions,
      score: hasProactiveSuggestions ? 100 : 0,
      details: hasProactiveSuggestions
        ? 'Eve proactively offered helpful suggestions'
        : 'Eve did not proactively offer suggestions',
    };
  } catch (error) {
    return {
      capability: 'Proactive Suggestions',
      passed: false,
      score: 0,
      details: `Error: ${error}`,
    };
  }
}

async function testAdaptiveTone(): Promise<AgenticTestResult> {
  const tenantId = `test-tone-${Date.now()}`;
  console.log(`\n🎭 Testing Adaptive Tone (Tenant: ${tenantId})...`);
  try {
    // Send a casual message
    const casualResponse = await sendMessage('hey whats up! how r u doing today lol', tenantId);
    console.log(`Eve (Casual) said: "${casualResponse}"`);

    // Send a formal message
    const formalResponse = await sendMessage('Good afternoon. I would like to inquire about enterprise pricing options for your services.', tenantId);
    console.log(`Eve (Formal) said: "${formalResponse}"`);

    // Check if responses match the tone
    const casualHasInformalTone =
      casualResponse.includes('!') ||
      casualResponse.toLowerCase().includes('hey') ||
      casualResponse.toLowerCase().includes('great') ||
      casualResponse.toLowerCase().includes('doing');

    const formalHasFormalTone =
      formalResponse.includes('Thank you') ||
      formalResponse.includes('pleased') ||
      formalResponse.includes('assist') ||
      formalResponse.includes('information') ||
      formalResponse.includes('regarding') ||
      formalResponse.includes('options');

    const passed = casualHasInformalTone || formalHasFormalTone;
    const score = (casualHasInformalTone ? 50 : 0) + (formalHasFormalTone ? 50 : 0);

    return {
      capability: 'Adaptive Tone',
      passed,
      score,
      details: `Casual tone match: ${casualHasInformalTone}, Formal tone match: ${formalHasFormalTone}`,
    };
  } catch (error) {
    return {
      capability: 'Adaptive Tone',
      passed: false,
      score: 0,
      details: `Error: ${error}`,
    };
  }
}

async function runAgenticTests(): Promise<void> {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║             PROJECT EVE - AGENTIC CAPABILITIES TEST          ║
╠══════════════════════════════════════════════════════════════╣
║ Testing: Memory, Context, Goals, Proactivity, Adaptation     ║
╚══════════════════════════════════════════════════════════════╝
`);
  console.log(`Testing against: ${TEST_API_URL}\n`);

  const results: AgenticTestResult[] = [];

  // Run all tests
  results.push(await testMemoryPersistence());
  results.push(await testContextualUnderstanding());
  results.push(await testGoalRecognition());
  results.push(await testProactiveSuggestions());
  results.push(await testAdaptiveTone());

  // Calculate overall score
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const maxScore = results.length * 100;
  const overallScore = Math.round((totalScore / maxScore) * 100);

  // Print results
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     AGENTIC TEST RESULTS                     ║
╠══════════════════════════════════════════════════════════════╣`);

  results.forEach(r => {
    const status = r.passed ? '✅' : '❌';
    console.log(`║ ${status} ${r.capability.padEnd(25)} Score: ${r.score}/100`);
    console.log(`║    ${r.details.substring(0, 55).padEnd(55)} ║`);
  });

  console.log(`╠══════════════════════════════════════════════════════════════╣`);
  console.log(`║                                                              ║`);
  console.log(`║ AGENTIC READINESS SCORE: ${overallScore}/100`.padEnd(63) + '║');

  let status: string;
  if (overallScore >= 80) {
    status = '✅ TRULY AGENTIC';
  } else if (overallScore >= 60) {
    status = '⚠️ PARTIALLY AGENTIC';
  } else {
    status = '❌ NOT YET AGENTIC';
  }

  console.log(`║ STATUS: ${status}`.padEnd(63) + '║');
  console.log(`║                                                              ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
}

// Run tests
runAgenticTests().catch(console.error);
