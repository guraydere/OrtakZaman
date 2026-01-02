import { customAlphabet } from "nanoid";
import { randomBytes } from "crypto";

// URL-friendly meeting ID (10 characters)
const nanoid = customAlphabet(
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    10
);

/**
 * Generate a URL-friendly meeting ID
 * Example: "a1B2c3D4e5"
 */
export function generateMeetingId(): string {
    return nanoid();
}

/**
 * Generate a secure admin token (32 bytes = 64 hex chars)
 */
export function generateAdminToken(): string {
    return randomBytes(32).toString("hex");
}

/**
 * Generate a device token (UUID v4 format)
 */
export function generateDeviceToken(): string {
    return crypto.randomUUID();
}

/**
 * Generate a participant UUID
 */
export function generateParticipantId(): string {
    return crypto.randomUUID();
}

/**
 * Generate a guest request ID
 */
export function generateGuestRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Validate admin token format (64 hex characters)
 */
export function isValidAdminToken(token: string): boolean {
    return /^[a-f0-9]{64}$/i.test(token);
}

/**
 * Validate device token format (UUID)
 */
export function isValidDeviceToken(token: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        token
    );
}

/**
 * Validate meeting ID format (10 alphanumeric chars)
 */
export function isValidMeetingId(id: string): boolean {
    return /^[a-zA-Z0-9]{10}$/.test(id);
}
