import { getRedisClient } from "./redis";
import { createHash, randomBytes } from "crypto";

const RATE_LIMIT_PREFIX = "ratelimit:";
const DEFAULT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000");
const DEFAULT_MAX_REQUESTS = parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || "10"
);

/**
 * Get or create a daily rotating salt
 * This ensures that the hash of an IP changes every day
 */
async function getDailySalt(): Promise<string> {
    const redis = getRedisClient();
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const saltKey = `${RATE_LIMIT_PREFIX}salt:${date}`;

    // Try to get existing salt
    let salt = await redis.get(saltKey);

    if (!salt) {
        // Create new random salt
        salt = randomBytes(16).toString('hex');
        // Set with 26 hours TTL to ensure overlap coverage
        await redis.set(saltKey, salt, "EX", 26 * 60 * 60);
    }

    return salt;
}

/**
 * Hash IP address with salt for privacy
 */
function hashIP(ip: string, salt: string): string {
    return createHash("sha256").update(ip + salt).digest("hex");
}

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

    // Get daily salt first
    const salt = await getDailySalt();

    // Hash the IP with the salt
    const hashedIp = hashIP(ip, salt);
    const key = `${RATE_LIMIT_PREFIX}${action}:${hashedIp}`;

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
