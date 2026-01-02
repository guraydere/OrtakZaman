import Redis from "ioredis";

// Redis client singleton
let redis: Redis | null = null;

export function getRedisClient(): Redis {
    if (!redis) {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
        redis = new Redis(redisUrl);

        redis.on("error", (err) => {
            console.error("Redis connection error:", err);
        });

        redis.on("connect", () => {
            console.log("✅ Connected to Redis");
        });
    }

    return redis;
}

// Redis Pub/Sub publisher
let publisher: Redis | null = null;

export function getPublisher(): Redis {
    if (!publisher) {
        const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
        publisher = new Redis(redisUrl);
    }
    return publisher;
}

// Publish message to channel
export async function publishMessage(
    channel: string,
    message: object
): Promise<void> {
    const pub = getPublisher();
    await pub.publish(channel, JSON.stringify(message));
}

// Close connections (for cleanup)
export async function closeRedisConnections(): Promise<void> {
    if (redis) {
        await redis.quit();
        redis = null;
    }
    if (publisher) {
        await publisher.quit();
        publisher = null;
    }
}
