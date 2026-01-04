import { getRedisClient } from "./redis";

// Analytics key prefixes
const ANALYTICS_GLOBAL_PREFIX = "analytics:global:";
const ANALYTICS_DAILY_PREFIX = "analytics:daily:";

// Global metric keys
const GLOBAL_MEETINGS_CREATED = `${ANALYTICS_GLOBAL_PREFIX}meetings_created`;
const GLOBAL_TOTAL_VOTES = `${ANALYTICS_GLOBAL_PREFIX}total_votes`;
const GLOBAL_TOTAL_PARTICIPANTS = `${ANALYTICS_GLOBAL_PREFIX}total_participants`;

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
function getTodayKey(): string {
    return new Date().toISOString().split("T")[0];
}

/**
 * Get daily analytics key for a specific date
 */
function getDailyKey(date: string): string {
    return `${ANALYTICS_DAILY_PREFIX}${date}`;
}

// ===========================================
// TRACKING FUNCTIONS
// ===========================================

/**
 * Track a page view with device type
 */
export async function trackPageView(isMobile: boolean): Promise<void> {
    try {
        const redis = getRedisClient();
        const today = getTodayKey();
        const dailyKey = getDailyKey(today);
        const deviceField = isMobile ? "device_mobile" : "device_desktop";

        const pipeline = redis.pipeline();
        pipeline.hincrby(dailyKey, "views", 1);
        pipeline.hincrby(dailyKey, deviceField, 1);
        await pipeline.exec();
    } catch (error) {
        console.error("Analytics trackPageView error:", error);
    }
}

/**
 * Track a new meeting creation with participant count
 */
export async function trackMeetingCreated(participantCount: number): Promise<void> {
    try {
        const redis = getRedisClient();
        const today = getTodayKey();
        const dailyKey = getDailyKey(today);

        const pipeline = redis.pipeline();
        pipeline.incr(GLOBAL_MEETINGS_CREATED);
        pipeline.incrby(GLOBAL_TOTAL_PARTICIPANTS, participantCount);
        pipeline.hincrby(dailyKey, "created", 1);
        pipeline.hincrby(dailyKey, "participants", participantCount);
        await pipeline.exec();
    } catch (error) {
        console.error("Analytics trackMeetingCreated error:", error);
    }
}

/**
 * Track a vote (availability update)
 */
export async function trackVote(): Promise<void> {
    try {
        const redis = getRedisClient();
        const today = getTodayKey();
        const dailyKey = getDailyKey(today);

        const pipeline = redis.pipeline();
        pipeline.incr(GLOBAL_TOTAL_VOTES);
        pipeline.hincrby(dailyKey, "votes", 1);
        await pipeline.exec();
    } catch (error) {
        console.error("Analytics trackVote error:", error);
    }
}

// ===========================================
// QUERY FUNCTIONS
// ===========================================

export interface DailyStats {
    date: string;
    views: number;
    created: number;
    votes: number;
    participants: number;
    deviceMobile: number;
    deviceDesktop: number;
}

export interface GlobalStats {
    meetingsCreated: number;
    totalVotes: number;
    totalParticipants: number;
}

/**
 * Get analytics stats for a specific date
 */
export async function getDailyStats(date: string): Promise<DailyStats> {
    try {
        const redis = getRedisClient();
        const dailyKey = getDailyKey(date);
        const data = await redis.hgetall(dailyKey);

        return {
            date,
            views: parseInt(data.views || "0", 10),
            created: parseInt(data.created || "0", 10),
            votes: parseInt(data.votes || "0", 10),
            participants: parseInt(data.participants || "0", 10),
            deviceMobile: parseInt(data.device_mobile || "0", 10),
            deviceDesktop: parseInt(data.device_desktop || "0", 10),
        };
    } catch (error) {
        console.error("Analytics getDailyStats error:", error);
        return {
            date,
            views: 0,
            created: 0,
            votes: 0,
            participants: 0,
            deviceMobile: 0,
            deviceDesktop: 0,
        };
    }
}

/**
 * Get global analytics stats
 */
export async function getGlobalStats(): Promise<GlobalStats> {
    try {
        const redis = getRedisClient();
        const pipeline = redis.pipeline();
        pipeline.get(GLOBAL_MEETINGS_CREATED);
        pipeline.get(GLOBAL_TOTAL_VOTES);
        pipeline.get(GLOBAL_TOTAL_PARTICIPANTS);
        const results = await pipeline.exec();

        return {
            meetingsCreated: parseInt((results?.[0]?.[1] as string) || "0", 10),
            totalVotes: parseInt((results?.[1]?.[1] as string) || "0", 10),
            totalParticipants: parseInt((results?.[2]?.[1] as string) || "0", 10),
        };
    } catch (error) {
        console.error("Analytics getGlobalStats error:", error);
        return {
            meetingsCreated: 0,
            totalVotes: 0,
            totalParticipants: 0,
        };
    }
}

/**
 * Get analytics stats for the last N days
 */
export async function getStatsRange(days: number): Promise<DailyStats[]> {
    const stats: DailyStats[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dailyStats = await getDailyStats(dateStr);
        stats.push(dailyStats);
    }

    return stats;
}
