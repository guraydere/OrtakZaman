"use server";

import { headers } from "next/headers";
import {
    createMeeting as createMeetingInStore,
    getPublicMeeting,
    claimIdentity as claimIdentityInStore,
    forceClaimIdentity as forceClaimInStore,
    validateDeviceToken,
    updateAvailability as updateAvailabilityInStore,
    addGuestRequest,
    approveGuestRequest as approveGuestInStore,
    rejectGuestRequest as rejectGuestInStore,
    setMeetingStatus,
    resetParticipantSession,
    validateAdminToken,
    deleteParticipant as deleteParticipantInStore,
    finalizeMeeting as finalizeMeetingInStore,
    generateDeviceToken,
    generateGuestRequestId,
    checkGuestRequestRateLimit,
} from "@/lib";
import type {
    CreateMeetingInput,
    CreateMeetingOutput,
    PublicMeeting,
} from "@/types";

/**
 * Get client IP address from headers
 */
async function getClientIP(): Promise<string> {
    const headersList = await headers();
    return (
        headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
        headersList.get("x-real-ip") ||
        "unknown"
    );
}

// ===========================================
// PUBLIC ACTIONS
// ===========================================

/**
 * Create a new meeting
 */
export async function createMeetingAction(
    input: CreateMeetingInput
): Promise<{ success: true; data: CreateMeetingOutput } | { success: false; error: string }> {
    try {
        // Validation
        if (!input.title?.trim()) {
            return { success: false, error: "Başlık gereklidir" };
        }
        if (!input.dates?.length) {
            return { success: false, error: "En az bir tarih seçilmelidir" };
        }
        if (!input.participantNames?.length) {
            return { success: false, error: "En az bir katılımcı eklenmelidir" };
        }

        const { meetingId, adminToken } = await createMeetingInStore({
            ...input,
            title: input.title.trim(),
            participantNames: input.participantNames.map((n) => n.trim()).filter(Boolean),
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        return {
            success: true,
            data: {
                meetingId,
                adminToken,
                shareUrl: `${appUrl}/m/${meetingId}`,
            },
        };
    } catch (error) {
        console.error("createMeetingAction error:", error);
        return { success: false, error: "Buluşma oluşturulamadı" };
    }
}

/**
 * Get public meeting data
 */
export async function getMeetingAction(
    meetingId: string
): Promise<{ success: true; data: PublicMeeting } | { success: false; error: string }> {
    try {
        const meeting = await getPublicMeeting(meetingId);
        if (!meeting) {
            return { success: false, error: "Buluşma bulunamadı" };
        }
        return { success: true, data: meeting };
    } catch (error) {
        console.error("getMeetingAction error:", error);
        return { success: false, error: "Buluşma yüklenemedi" };
    }
}

/**
 * Claim a participant identity
 */
export async function claimIdentityAction(
    meetingId: string,
    participantId: string
): Promise<{ success: true; deviceToken: string } | { success: false; error: string }> {
    try {
        const deviceToken = generateDeviceToken();
        const result = await claimIdentityInStore(meetingId, participantId, deviceToken);

        if (!result.success) {
            return { success: false, error: result.error || "Kimlik alınamadı" };
        }

        return { success: true, deviceToken };
    } catch (error) {
        console.error("claimIdentityAction error:", error);
        return { success: false, error: "Kimlik alınamadı" };
    }
}

/**
 * Force claim identity (take over from another device)
 */
export async function forceClaimIdentityAction(
    meetingId: string,
    participantId: string
): Promise<{ success: true; deviceToken: string } | { success: false; error: string }> {
    try {
        const deviceToken = generateDeviceToken();
        await forceClaimInStore(meetingId, participantId, deviceToken);
        return { success: true, deviceToken };
    } catch (error) {
        console.error("forceClaimIdentityAction error:", error);
        return { success: false, error: "Kimlik zorla alınamadı" };
    }
}

/**
 * Validate current device token
 */
export async function validateSessionAction(
    meetingId: string,
    participantId: string,
    deviceToken: string
): Promise<boolean> {
    try {
        return await validateDeviceToken(meetingId, participantId, deviceToken);
    } catch {
        return false;
    }
}

/**
 * Update availability slots
 */
export async function updateAvailabilityAction(
    meetingId: string,
    participantId: string,
    deviceToken: string,
    slots: string[]
): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate device token
        const isValid = await validateDeviceToken(meetingId, participantId, deviceToken);
        if (!isValid) {
            return { success: false, error: "Oturum geçersiz" };
        }

        return await updateAvailabilityInStore(meetingId, participantId, slots);
    } catch (error) {
        console.error("updateAvailabilityAction error:", error);
        return { success: false, error: "Güncelleme başarısız" };
    }
}

/**
 * Request guest access
 */
export async function requestGuestAccessAction(
    meetingId: string,
    name: string
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!name?.trim()) {
            return { success: false, error: "İsim gereklidir" };
        }

        const ip = await getClientIP();

        // Rate limit check
        const rateLimit = await checkGuestRequestRateLimit(ip);
        if (!rateLimit.allowed) {
            return {
                success: false,
                error: "Çok fazla istek. Lütfen bir dakika bekleyin.",
            };
        }

        // Check if meeting allows guests
        const meeting = await getPublicMeeting(meetingId);
        if (!meeting) {
            return { success: false, error: "Buluşma bulunamadı" };
        }
        if (!meeting.meta.allowGuest) {
            return { success: false, error: "Bu buluşmaya misafir eklenemez" };
        }

        await addGuestRequest(meetingId, {
            tempId: generateGuestRequestId(),
            name: name.trim(),
            ip,
            timestamp: Date.now(),
        });

        return { success: true };
    } catch (error) {
        console.error("requestGuestAccessAction error:", error);
        return { success: false, error: "İstek gönderilemedi" };
    }
}

// ===========================================
// ADMIN ACTIONS
// ===========================================

/**
 * Approve a guest request
 */
export async function approveGuestAction(
    meetingId: string,
    requestId: string,
    adminToken: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await validateAdminToken(meetingId, adminToken);
        if (!isAdmin) {
            return { success: false, error: "Yetkiniz yok" };
        }

        const result = await approveGuestInStore(meetingId, requestId);
        return result;
    } catch (error) {
        console.error("approveGuestAction error:", error);
        return { success: false, error: "Onay başarısız" };
    }
}

/**
 * Reject a guest request
 */
export async function rejectGuestAction(
    meetingId: string,
    requestId: string,
    adminToken: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await validateAdminToken(meetingId, adminToken);
        if (!isAdmin) {
            return { success: false, error: "Yetkiniz yok" };
        }

        const result = await rejectGuestInStore(meetingId, requestId);
        return result;
    } catch (error) {
        console.error("rejectGuestAction error:", error);
        return { success: false, error: "Red başarısız" };
    }
}

/**
 * Freeze/unfreeze meeting
 */
export async function toggleFreezeAction(
    meetingId: string,
    adminToken: string,
    freeze: boolean
): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await validateAdminToken(meetingId, adminToken);
        if (!isAdmin) {
            return { success: false, error: "Yetkiniz yok" };
        }

        await setMeetingStatus(meetingId, freeze ? "frozen" : "active");
        return { success: true };
    } catch (error) {
        console.error("toggleFreezeAction error:", error);
        return { success: false, error: "İşlem başarısız" };
    }
}

/**
 * Reset participant session
 */
export async function resetSessionAction(
    meetingId: string,
    participantId: string,
    adminToken: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await validateAdminToken(meetingId, adminToken);
        if (!isAdmin) {
            return { success: false, error: "Yetkiniz yok" };
        }

        await resetParticipantSession(meetingId, participantId);
        return { success: true };
    } catch (error) {
        console.error("resetSessionAction error:", error);
        return { success: false, error: "Sıfırlama başarısız" };
    }
}

/**
 * Delete a participant
 */
export async function deleteParticipantAction(
    meetingId: string,
    participantId: string,
    adminToken: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await validateAdminToken(meetingId, adminToken);
        if (!isAdmin) {
            return { success: false, error: "Yetkiniz yok" };
        }

        await deleteParticipantInStore(meetingId, participantId);
        return { success: true };
    } catch (error) {
        console.error("deleteParticipantAction error:", error);
        return { success: false, error: "Silme başarısız" };
    }
}

/**
 * Validate admin token
 */
export async function validateAdminAction(
    meetingId: string,
    adminToken: string
): Promise<boolean> {
    try {
        return await validateAdminToken(meetingId, adminToken);
    } catch {
        return false;
    }
}

/**
 * Finalize meeting with a selected slot
 */
export async function finalizeMeetingAction(
    meetingId: string,
    slotId: string,
    adminToken: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const isAdmin = await validateAdminToken(meetingId, adminToken);
        if (!isAdmin) {
            return { success: false, error: "Yetkiniz yok" };
        }

        const result = await finalizeMeetingInStore(meetingId, slotId);
        return result;
    } catch (error) {
        console.error("finalizeMeetingAction error:", error);
        return { success: false, error: "İşlem başarısız" };
    }
}
