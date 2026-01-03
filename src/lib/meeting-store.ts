import { getRedisClient, publishMessage } from "./redis";
import {
    generateMeetingId,
    generateAdminToken,
    generateParticipantId,
} from "./tokens";
import { calculateExpiresAt } from "./date-utils";
import type {
    Meeting,
    MeetingMeta,
    Participant,
    GuestRequest,
    Schedule,
    PublicMeeting,
    CreateMeetingInput,
    SocketMessage,
} from "@/types";

const MEETING_PREFIX = "meeting:";
const MEETING_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Get Redis key for a meeting
 */
function getMeetingKey(meetingId: string): string {
    return `${MEETING_PREFIX}${meetingId}`;
}

/**
 * Create a new meeting
 */
export async function createMeeting(
    input: CreateMeetingInput
): Promise<{ meetingId: string; adminToken: string }> {
    const redis = getRedisClient();
    const meetingId = generateMeetingId();
    const adminToken = generateAdminToken();

    // Create participants from names
    const participants: Record<string, Participant> = {};
    for (const name of input.participantNames) {
        const participantId = generateParticipantId();
        participants[participantId] = {
            name,
            status: "approved",
            deviceToken: null,
            slots: [],
        };
    }

    const meeting: Meeting = {
        meta: {
            title: input.title,
            description: input.description,
            adminToken,
            createdAt: Date.now(),
            expiresAt: calculateExpiresAt(),
            status: "active",
            allowGuest: input.allowGuest,
        },
        schedule: {
            type: input.dates.length === 7 ? "weekly" : "specific_dates",
            dates: input.dates,
            startHour: input.startHour ?? 9,
            endHour: input.endHour ?? 22,
        },
        participants,
        guestRequests: [],
    };

    const key = getMeetingKey(meetingId);

    // Store as JSON using RedisJSON
    await redis.call("JSON.SET", key, "$", JSON.stringify(meeting));
    await redis.expire(key, MEETING_TTL);

    return { meetingId, adminToken };
}

/**
 * Get a meeting by ID (full data including admin token)
 */
export async function getMeeting(meetingId: string): Promise<Meeting | null> {
    const redis = getRedisClient();
    const key = getMeetingKey(meetingId);

    const result = await redis.call("JSON.GET", key);
    if (!result) return null;

    return JSON.parse(result as string) as Meeting;
}

/**
 * Get public meeting data (without admin token and device tokens)
 */
export async function getPublicMeeting(
    meetingId: string
): Promise<PublicMeeting | null> {
    const meeting = await getMeeting(meetingId);
    if (!meeting) return null;

    // Remove sensitive data
    const { adminToken, ...metaWithoutToken } = meeting.meta;

    // Transform participants to hide device tokens
    const publicParticipants: Record<
        string,
        Omit<Participant, "deviceToken"> & { isClaimed: boolean }
    > = {};

    for (const [id, participant] of Object.entries(meeting.participants)) {
        const { deviceToken, ...rest } = participant;
        publicParticipants[id] = {
            ...rest,
            isClaimed: deviceToken !== null,
        };
    }

    // Hide guest request IPs
    const publicGuestRequests = meeting.guestRequests.map(({ tempId, name }) => ({
        tempId,
        name,
    }));

    return {
        meta: metaWithoutToken,
        schedule: meeting.schedule,
        participants: publicParticipants,
        guestRequests: publicGuestRequests,
    };
}

/**
 * Claim a participant identity
 */
export async function claimIdentity(
    meetingId: string,
    participantId: string,
    deviceToken: string
): Promise<{ success: boolean; error?: string }> {
    const redis = getRedisClient();
    const key = getMeetingKey(meetingId);

    // Get current participant
    const participantPath = `$.participants.${participantId}`;
    const result = await redis.call("JSON.GET", key, participantPath);

    if (!result) {
        return { success: false, error: "Katılımcı bulunamadı" };
    }

    const [participant] = JSON.parse(result as string) as Participant[];

    if (participant.deviceToken !== null) {
        return { success: false, error: "Bu isim zaten başka bir cihazda aktif" };
    }

    // Set device token
    await redis.call(
        "JSON.SET",
        key,
        `${participantPath}.deviceToken`,
        JSON.stringify(deviceToken)
    );

    // Publish event
    await publishMessage("meeting_updates", {
        type: "PARTICIPANT_JOINED",
        meetingId,
        userId: participantId,
        name: participant.name,
    } as SocketMessage);

    return { success: true };
}

/**
 * Force claim identity (take over from another device)
 */
export async function forceClaimIdentity(
    meetingId: string,
    participantId: string,
    newDeviceToken: string
): Promise<{ success: boolean }> {
    const redis = getRedisClient();
    const key = getMeetingKey(meetingId);

    const participantPath = `$.participants.${participantId}`;

    // Overwrite device token
    await redis.call(
        "JSON.SET",
        key,
        `${participantPath}.deviceToken`,
        JSON.stringify(newDeviceToken)
    );

    return { success: true };
}

/**
 * Validate device token for a participant
 */
export async function validateDeviceToken(
    meetingId: string,
    participantId: string,
    deviceToken: string
): Promise<boolean> {
    const redis = getRedisClient();
    const key = getMeetingKey(meetingId);

    const result = await redis.call(
        "JSON.GET",
        key,
        `$.participants.${participantId}.deviceToken`
    );

    if (!result) return false;

    const [storedToken] = JSON.parse(result as string) as (string | null)[];
    return storedToken === deviceToken;
}

/**
 * Update participant availability slots
 */
export async function updateAvailability(
    meetingId: string,
    participantId: string,
    slots: string[]
): Promise<{ success: boolean; error?: string }> {
    const redis = getRedisClient();
    const key = getMeetingKey(meetingId);

    // Check if meeting is frozen
    const statusResult = await redis.call("JSON.GET", key, "$.meta.status");
    if (statusResult) {
        const [status] = JSON.parse(statusResult as string) as string[];
        if (status === "frozen") {
            return { success: false, error: "Toplantı kilitlenmiş" };
        }
    }

    // Update slots
    await redis.call(
        "JSON.SET",
        key,
        `$.participants.${participantId}.slots`,
        JSON.stringify(slots)
    );

    // Publish event
    await publishMessage("meeting_updates", {
        type: "SLOTS_UPDATED",
        meetingId,
        userId: participantId,
        slots,
    } as SocketMessage);

    return { success: true };
}

/**
 * Add a guest request
 */
export async function addGuestRequest(
    meetingId: string,
    guestRequest: GuestRequest
): Promise<{ success: boolean }> {
    const redis = getRedisClient();
    const key = getMeetingKey(meetingId);

    await redis.call(
        "JSON.ARRAPPEND",
        key,
        "$.guestRequests",
        JSON.stringify(guestRequest)
    );

    // Publish event
    await publishMessage("meeting_updates", {
        type: "GUEST_REQUEST",
        meetingId,
        requestId: guestRequest.tempId,
        name: guestRequest.name,
    } as SocketMessage);

    return { success: true };
}

/**
 * Approve a guest request
 */
export async function approveGuestRequest(
    meetingId: string,
    requestId: string
): Promise<{ success: boolean; participantId?: string }> {
    const meeting = await getMeeting(meetingId);
    if (!meeting) return { success: false };

    const requestIndex = meeting.guestRequests.findIndex(
        (r) => r.tempId === requestId
    );
    if (requestIndex === -1) return { success: false };

    const request = meeting.guestRequests[requestIndex];
    const participantId = generateParticipantId();

    const redis = getRedisClient();
    const key = getMeetingKey(meetingId);

    // Add as participant
    const newParticipant: Participant = {
        name: request.name,
        status: "approved",
        deviceToken: null,
        slots: [],
    };

    await redis.call(
        "JSON.SET",
        key,
        `$.participants.${participantId}`,
        JSON.stringify(newParticipant)
    );

    // Remove from guest requests
    await redis.call("JSON.ARRPOP", key, "$.guestRequests", requestIndex);

    // Publish event
    await publishMessage("meeting_updates", {
        type: "GUEST_APPROVED",
        meetingId,
        requestId,
        userId: participantId,
        name: request.name,
    } as SocketMessage);

    return { success: true, participantId };
}

/**
 * Reject a guest request
 */
export async function rejectGuestRequest(
    meetingId: string,
    requestId: string
): Promise<{ success: boolean }> {
    const meeting = await getMeeting(meetingId);
    if (!meeting) return { success: false };

    const requestIndex = meeting.guestRequests.findIndex(
        (r) => r.tempId === requestId
    );
    if (requestIndex === -1) return { success: false };

    const redis = getRedisClient();
    const key = getMeetingKey(meetingId);

    await redis.call("JSON.ARRPOP", key, "$.guestRequests", requestIndex);

    // Publish event
    await publishMessage("meeting_updates", {
        type: "GUEST_REJECTED",
        meetingId,
        requestId,
    } as SocketMessage);

    return { success: true };
}

/**
 * Freeze/unfreeze a meeting
 */
export async function setMeetingStatus(
    meetingId: string,
    status: "active" | "frozen"
): Promise<{ success: boolean }> {
    const redis = getRedisClient();
    const key = getMeetingKey(meetingId);

    await redis.call("JSON.SET", key, "$.meta.status", JSON.stringify(status));

    // Publish event
    await publishMessage("meeting_updates", {
        type: status === "frozen" ? "MEETING_FROZEN" : "MEETING_UNFROZEN",
        meetingId,
    } as SocketMessage);

    return { success: true };
}

/**
 * Reset a participant's session (clear device token)
 */
export async function resetParticipantSession(
    meetingId: string,
    participantId: string
): Promise<{ success: boolean }> {
    const redis = getRedisClient();
    const key = getMeetingKey(meetingId);

    await redis.call(
        "JSON.SET",
        key,
        `$.participants.${participantId}.deviceToken`,
        "null"
    );

    // Publish event
    await publishMessage("meeting_updates", {
        type: "SESSION_RESET",
        meetingId,
        userId: participantId,
    } as SocketMessage);

    return { success: true };
}

/**
 * Validate admin token for a meeting
 */
export async function validateAdminToken(
    meetingId: string,
    adminToken: string
): Promise<boolean> {
    const redis = getRedisClient();
    const key = getMeetingKey(meetingId);

    const result = await redis.call("JSON.GET", key, "$.meta.adminToken");
    if (!result) return false;

    const [storedToken] = JSON.parse(result as string) as string[];
    return storedToken === adminToken;
}

/**
 * Delete a participant from meeting
 */
export async function deleteParticipant(
    meetingId: string,
    participantId: string
): Promise<{ success: boolean }> {
    const redis = getRedisClient();
    const key = getMeetingKey(meetingId);

    await redis.call("JSON.DEL", key, `$.participants.${participantId}`);

    return { success: true };
}

/**
 * Finalize a meeting with a selected slot
 */
export async function finalizeMeeting(
    meetingId: string,
    slotId: string
): Promise<{ success: boolean; error?: string }> {
    const redis = getRedisClient();
    const key = getMeetingKey(meetingId);

    // Verify meeting exists
    const exists = await redis.exists(key);
    if (!exists) {
        return { success: false, error: "Toplantı bulunamadı" };
    }

    // Update status and finalizedSlotId atomically
    const pipeline = redis.pipeline();
    pipeline.call("JSON.SET", key, "$.meta.status", JSON.stringify("finalized"));
    pipeline.call("JSON.SET", key, "$.meta.finalizedSlotId", JSON.stringify(slotId));
    await pipeline.exec();

    // Publish event
    await publishMessage("meeting_updates", {
        type: "MEETING_FINALIZED",
        meetingId,
        slots: [slotId], // Sending the finalized slot in slots array
    } as SocketMessage);

    return { success: true };
}
