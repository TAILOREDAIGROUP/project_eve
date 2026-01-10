
const TEST_API_URL = 'https://project-eve-seven.vercel.app/api/chat';

async function sendMessage(message, sessionId, tenantId) {
  console.log(`\nSending: "${message}" (Session: ${sessionId}, Tenant: ${tenantId})`);
  const response = await fetch(TEST_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }],
      tenant_id: tenantId,
      session_id: sessionId
    }),
  });
  
  const text = await response.text();
  console.log(`Response: ${text}`);
  return text;
}

async function diagnose() {
  const tenantId = 'diag-tenant-' + Date.now();
  const sessionId = 'diag-sess-' + Date.now();
  
  // Test Memory
  await sendMessage('My favorite color is purple and my dog is named Max.', sessionId, tenantId);
  console.log('Waiting 5s for persistence...');
  await new Promise(r => setTimeout(r, 5000));
  await sendMessage('What is my favorite color and what is my dog\'s name?', sessionId, tenantId);
  
  // Test Context
  const sessionId2 = 'diag-ctx-' + Date.now();
  await sendMessage('I am working on a marketing campaign for a new smartphone.', sessionId2, tenantId);
  console.log('Waiting 2s for persistence...');
  await new Promise(r => setTimeout(r, 2000));
  await sendMessage('What are some good taglines I could use?', sessionId2, tenantId);
}

diagnose().catch(console.error);
