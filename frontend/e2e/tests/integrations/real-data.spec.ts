import { test, expect } from '@playwright/test';

const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

test.describe('Integration Real Data', () => {
  
  test('Google Calendar API returns proper structure', async ({ request }) => {
    const response = await request.post('/api/integrations/google/calendar', {
      data: { tenantId: TENANT_ID }
    });
    
    const data = await response.json();
    
    // Should either return events or "not connected" error
    if (response.ok()) {
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('events');
      expect(Array.isArray(data.events)).toBe(true);
    } else {
      expect(data).toHaveProperty('error');
      expect(data.error).toMatch(/not connected/i);
    }
  });

  test('Slack Threads API returns proper structure', async ({ request }) => {
    const response = await request.post('/api/integrations/slack/threads', {
      data: { tenantId: TENANT_ID }
    });
    
    const data = await response.json();
    
    if (response.ok()) {
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('threads');
      expect(Array.isArray(data.threads)).toBe(true);
    } else {
      expect(data).toHaveProperty('error');
      expect(data.error).toMatch(/not connected/i);
    }
  });

  test('HubSpot Deals API returns proper structure', async ({ request }) => {
    const response = await request.post('/api/integrations/hubspot/deals', {
      data: { tenantId: TENANT_ID }
    });
    
    const data = await response.json();
    
    if (response.ok()) {
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('deals');
      expect(data).toHaveProperty('analysis');
    } else {
      expect(data).toHaveProperty('error');
      expect(data.error).toMatch(/not connected/i);
    }
  });
});
