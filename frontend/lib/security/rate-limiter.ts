// frontend/lib/security/rate-limiter.ts

declare global {
  var rateLimitStore: Map<string, { count: number; resetTime: number }> | undefined;
}

export function checkRateLimit(
  identifier: string,
  req: Request,
  maxRequests: number = 20,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  // Simple in-memory store using globalThis to persist in serverless environment (single instance)
  if (!globalThis.rateLimitStore) {
    globalThis.rateLimitStore = new Map();
  }

  const now = Date.now();
  const entry = globalThis.rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    globalThis.rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetIn: entry.resetTime - now };
}
