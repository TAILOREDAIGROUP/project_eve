async function testRoute(path: string) {
  console.log(`Testing ${path}...`);
  const response = await fetch(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId: '550e8400-e29b-41d4-a716-446655440000' })
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

async function runTests() {
  await testRoute('/api/integrations/google/calendar');
  await testRoute('/api/integrations/slack/threads');
  await testRoute('/api/integrations/hubspot/deals');
}

runTests();
