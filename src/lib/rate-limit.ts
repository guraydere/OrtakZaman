import { getRedisClient } from "./redis";

const RATE_LIMIT_PREFIX = "ratelimit:";
const DEFAULT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000");
const DEFAULT_MAX_REQUESTS = parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || "10"
);

/**
 * Check and increment rate limit for an IP
 * Returns true if request is allowed, false if rate limited
 */
export async function checkRateLimit(
    ip: string,
    action: string,
    windowMs: number = DEFAULT_WINDOW_MS,
    maxRequests: number = DEFAULT_MAX_REQUESTS
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const redis = getRedisClient();
    const key = `${RATE_LIMIT_PREFIX}${action}:${ip}`;
    const now = Date.now();
    const windowSeconds = Math.ceil(windowMs / 1000);

    // Get current count
    const current = await redis.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= maxRequests) {
        const ttl = await redis.ttl(key);
        return {
            allowed: false,
            remaining: 0,
            resetAt: now + ttl * 1000,
        };
    }

    // Increment and set expiry if new key
    const newCount = await redis.incr(key);
    if (newCount === 1) {
        await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);

    return {
        allowed: true,
        remaining: maxRequests - newCount,
        resetAt: now + ttl * 1000,
    };
}

/**
 * Rate limit specifically for guest requests (stricter)
 */
export async function checkGuestRequestRateLimit(
    ip: string
): Promise<{ allowed: boolean; remaining: number }> {
    // 3 requests per minute for guest requests
    const result = await checkRateLimit(ip, "guest_request", 60000, 3);
    return {
        allowed: result.allowed,
        remaining: result.remaining,
    };
}
