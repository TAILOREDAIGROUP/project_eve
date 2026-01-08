// frontend/lib/security/logger.ts

export interface SecurityEvent {
  type: 'prompt_injection' | 'rate_limit' | 'validation_error' | 'auth_failure' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  tenantId?: string;
  details: string;
  timestamp: string;
}

export async function logSecurityEvent(event: SecurityEvent) {
  // Log to console in development
  console.warn(`[SECURITY ${event.severity.toUpperCase()}]`, event);
  
  // In production, send to Supabase or external SIEM
  if (process.env.NODE_ENV === 'production') {
    try {
        await fetch('/api/security/log', {
            method: 'POST',
            body: JSON.stringify(event),
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Failed to log security event to API:', error);
    }
  }
}
