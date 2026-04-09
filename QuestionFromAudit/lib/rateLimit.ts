import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter using a sliding window.
 * Suitable for single-instance deployments (Vercel serverless functions share no state,
 * so this provides per-instance protection). Upgrade to @upstash/ratelimit for
 * distributed rate limiting across instances.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

function getIdentifier(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Optional key prefix to separate limits for different endpoints */
  prefix?: string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfterMs?: number;
}

export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): RateLimitResult {
  const { limit, windowMs, prefix = "rl" } = config;
  const id = getIdentifier(req);
  const key = `${prefix}:${id}`;
  const now = Date.now();

  cleanup(windowMs);

  const entry = store.get(key) || { timestamps: [] };
  const cutoff = now - windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return { success: false, limit, remaining: 0, retryAfterMs };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return { success: true, limit, remaining: limit - entry.timestamps.length };
}

/**
 * Returns a 429 response if rate limit is exceeded, or null if allowed.
 * Usage in API routes:
 *   const blocked = applyRateLimit(req, { limit: 10, windowMs: 60 * 60 * 1000, prefix: "masters" });
 *   if (blocked) return blocked;
 */
export function applyRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const result = checkRateLimit(req, config);

  if (!result.success) {
    const retryAfterSec = Math.ceil((result.retryAfterMs || 0) / 1000);
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
