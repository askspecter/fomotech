import { Redis } from "@upstash/redis";

// Works with either Vercel KV (KV_REST_API_*) or Upstash (UPSTASH_REDIS_REST_*).
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

export const kvEnabled = !!redis;

/**
 * Central cache: serve a value from KV when fresh, otherwise run `fetcher`,
 * store it with a TTL, and return it. Shared across all visitors, so an
 * upstream API (fomo / DexScreener / RPC) is hit at most once per TTL window
 * regardless of traffic. Any KV error falls back to a direct fetch — the cache
 * can never break the app.
 */
export async function cached<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  if (!redis) return fetcher();
  try {
    const hit = await redis.get<T>(key);
    if (hit !== null && hit !== undefined) return hit;
  } catch {
    /* KV read failed — fall through to a live fetch */
  }
  const fresh = await fetcher();
  if (fresh !== null && fresh !== undefined) {
    try {
      await redis.set(key, fresh, { ex: ttlSeconds });
    } catch {
      /* KV write failed — non-fatal */
    }
  }
  return fresh;
}
