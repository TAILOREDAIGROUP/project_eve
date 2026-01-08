// frontend/lib/security/ai-monitor.ts
import { Message } from 'ai';
import { logSecurityEvent } from './logger';

export interface SecurityRisk {
  score: number; // 0 to 100
  isBlocked: boolean;
  reason?: string;
}

export function analyzeRequestRisk(
  messages: Message[],
  userId: string,
  tenantId: string
): SecurityRisk {
  let riskScore = 0;
  let reason = '';

  const lastMessage = messages[messages.length - 1]?.content || '';

  // 1. Detect Prompt Injection Patterns (Escalating from Phase 1)
  const HIGH_RISK_PATTERNS = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /disregard\s+(all\s+)?prior/i,
    /you\s+are\s+now\s+in\s+developer\s+mode/i,
    /reveal\s+(your\s+)?system\s+prompt/i,
  ];

  if (HIGH_RISK_PATTERNS.some(p => p.test(lastMessage))) {
    riskScore += 80;
    reason += 'High-risk prompt injection pattern detected. ';
  }

  // 2. Detect Data Exfiltration Patterns
  const EXFILTRATION_PATTERNS = [
    /SELECT\s+\*\s+FROM/i,
    /api_key/i,
    /password/i,
    /token/i,
  ];

  if (EXFILTRATION_PATTERNS.some(p => p.test(lastMessage))) {
    riskScore += 40;
    reason += 'Potential data exfiltration pattern detected. ';
  }

  // 3. Detect Unusual Patterns (e.g., extremely long repetitive strings)
  if (/(.)\1{100,}/.test(lastMessage)) {
    riskScore += 50;
    reason += 'Repetitive character pattern (potential DoS/anomaly). ';
  }

  // Auto-block threshold
  const isBlocked = riskScore >= 90;

  if (riskScore > 0) {
    logSecurityEvent({
      type: 'anomaly',
      severity: riskScore > 70 ? 'high' : 'medium',
      userId,
      tenantId,
      details: `Risk Score: ${riskScore}. Reason: ${reason}`,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    score: Math.min(riskScore, 100),
    isBlocked,
    reason: reason.trim() || undefined,
  };
}
