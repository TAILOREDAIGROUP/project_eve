import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

  test('GET /api/admin/prompts should return departments', async ({ request }) => {
    const response = await request.get(`/api/admin/prompts?tenant_id=${TENANT_ID}`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('departments');
    expect(Array.isArray(data.departments)).toBeTruthy();
  });

  test('POST /api/chat should return a streaming response', async ({ request }) => {
    const response = await request.post('/api/chat', {
      data: {
        messages: [{ role: 'user', content: 'Hello' }],
        tenant_id: TENANT_ID,
        session_id: `session-${TENANT_ID}`,
      }
    });
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/plain'); // Data stream
  });
});
