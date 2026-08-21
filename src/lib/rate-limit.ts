// Simple in-memory rate limiter. Works for single-instance deployments.
// For multi-instance production use, replace with Redis/Upstash.

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Prune stale entries periodically to prevent memory growth
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 60_000);
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function getClientIp(req: Request): string {
  const forwarded = (req as { headers: Headers }).headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (req as { headers: Headers }).headers.get("x-real-ip") ?? "unknown";
}
