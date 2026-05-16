import { NextRequest, NextResponse } from "next/server";

export interface RateLimitOptions {
  request: NextRequest;
  key: string;
  limit: number;
  windowSeconds?: number;
  errorMessage?: string;
}

/**
 * IP-based rate limiter backed by Vercel KV.
 *
 * Fails open: if KV is unconfigured or throws, the request is allowed
 * through. This keeps local development working without KV credentials and
 * ensures a KV outage doesn't block paying customers.
 *
 * Returns a 429 NextResponse to short-circuit the route handler, or null
 * when the request is within budget.
 */
export async function rateLimit({
  request,
  key,
  limit,
  windowSeconds = 60,
  errorMessage = "محاولات كثيرة جداً، حاول مرة أخرى بعد قليل",
}: RateLimitOptions): Promise<NextResponse | null> {
  if (!process.env.KV_REST_API_URL) return null;

  try {
    const { kv } = await import("@vercel/kv");
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const rateKey = `rate:${key}:${ip}`;
    const count = await kv.incr(rateKey);
    if (count === 1) await kv.expire(rateKey, windowSeconds);
    if (count > limit) {
      return NextResponse.json({ error: errorMessage }, { status: 429 });
    }
  } catch {
    // Fail open — see contract above.
  }

  return null;
}
