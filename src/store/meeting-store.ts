"use client";

import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { PublicMeeting } from "@/types";

// ===========================================
// MEETING STATE
// ===========================================

// Current meeting data
export const meetingAtom = atom<PublicMeeting | null>(null);

// Meeting ID
export const meetingIdAtom = atom<string | null>(null);

// Loading state
export const isLoadingAtom = atom(false);

// Error state
export const errorAtom = atom<string | null>(null);

// Meeting status derived atom
export const isFrozenAtom = atom((get) => {
    const meeting = get(meetingAtom);
    return meeting?.meta.status === "frozen";
});

// ===========================================
// USER STATE (persisted to localStorage)
// ===========================================

// Device tokens for each meeting (meetingId -> { participantId, deviceToken })
export const deviceTokensAtom = atomWithStorage<
    Record<string, { participantId: string; deviceToken: string }>
>("ortakzaman_tokens", {});

// Admin tokens for each meeting (meetingId -> adminToken)
export const adminTokensAtom = atomWithStorage<Record<string, string>>(
    "ortakzaman_admin",
    {}
);

// ===========================================
// CURRENT USER DERIVED ATOMS
// ===========================================

// Current user info for the active meeting
export const currentUserAtom = atom((get) => {
    const meetingId = get(meetingIdAtom);
    const tokens = get(deviceTokensAtom);
    if (!meetingId) return null;
    return tokens[meetingId] || null;
});

// Is current user admin for this meeting
export const isAdminAtom = atom((get) => {
    const meetingId = get(meetingIdAtom);
    const adminTokens = get(adminTokensAtom);
    if (!meetingId) return false;
    return !!adminTokens[meetingId];
});

// Get admin token for current meeting
export const currentAdminTokenAtom = atom((get) => {
    const meetingId = get(meetingIdAtom);
    const adminTokens = get(adminTokensAtom);
    if (!meetingId) return null;
    return adminTokens[meetingId] || null;
});

// ===========================================
// SELECTION STATE
// ===========================================

// Currently selected slots (for optimistic UI)
export const selectedSlotsAtom = atom<string[]>([]);

// Is selecting mode active
export const isSelectingAtom = atom(false);

// ===========================================
// HOOKS
// ===========================================

export function useMeeting() {
    const [meeting, setMeeting] = useAtom(meetingAtom);
    const [meetingId, setMeetingId] = useAtom(meetingIdAtom);
    const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
    const [error, setError] = useAtom(errorAtom);
    const isFrozen = useAtomValue(isFrozenAtom);

    return {
        meeting,
        setMeeting,
        meetingId,
        setMeetingId,
        isLoading,
        setIsLoading,
        error,
        setError,
        isFrozen,
    };
}

export function useCurrentUser() {
    const currentUser = useAtomValue(currentUserAtom);
    const isAdmin = useAtomValue(isAdminAtom);
    const adminToken = useAtomValue(currentAdminTokenAtom);
    const [deviceTokens, setDeviceTokens] = useAtom(deviceTokensAtom);
    const [adminTokens, setAdminTokens] = useAtom(adminTokensAtom);
    const meetingId = useAtomValue(meetingIdAtom);

    const saveDeviceToken = (participantId: string, deviceToken: string) => {
        if (!meetingId) return;
        setDeviceTokens((prev) => ({
            ...prev,
            [meetingId]: { participantId, deviceToken },
        }));
    };

    const saveAdminToken = (token: string) => {
        if (!meetingId) return;
        setAdminTokens((prev) => ({
            ...prev,
            [meetingId]: token,
        }));
    };

    const clearSession = () => {
        if (!meetingId) return;
        setDeviceTokens((prev) => {
            const newTokens = { ...prev };
            delete newTokens[meetingId];
            return newTokens;
        });
    };

    return {
        currentUser,
        isAdmin,
        adminToken,
        saveDeviceToken,
        saveAdminToken,
        clearSession,
    };
}

export function useSlotSelection() {
    const [selectedSlots, setSelectedSlots] = useAtom(selectedSlotsAtom);
    const [isSelecting, setIsSelecting] = useAtom(isSelectingAtom);

    const toggleSlot = (slotId: string) => {
        setSelectedSlots((prev) =>
            prev.includes(slotId)
                ? prev.filter((s) => s !== slotId)
                : [...prev, slotId]
        );
    };

    const addSlot = (slotId: string) => {
        setSelectedSlots((prev) =>
            prev.includes(slotId) ? prev : [...prev, slotId]
        );
    };

    const removeSlot = (slotId: string) => {
        setSelectedSlots((prev) => prev.filter((s) => s !== slotId));
    };

    const clearSelection = () => {
        setSelectedSlots([]);
    };

    const initializeSlots = (slots: string[]) => {
        setSelectedSlots(slots);
    };

    return {
        selectedSlots,
        isSelecting,
        setIsSelecting,
        toggleSlot,
        addSlot,
        removeSlot,
        clearSelection,
        initializeSlots,
    };
}
