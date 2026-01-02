// Meeting related types

export interface MeetingMeta {
    title: string;
    description?: string;
    adminToken: string;
    createdAt: number;
    expiresAt: number;
    status: "active" | "frozen";
    allowGuest: boolean;
}

export interface Schedule {
    type: "weekly" | "specific_dates";
    dates: string[]; // ISO date strings: "2024-05-20"
    startHour: number; // e.g., 9 for 09:00
    endHour: number; // e.g., 22 for 22:00
}

export interface Participant {
    name: string;
    status: "approved" | "pending";
    deviceToken: string | null;
    slots: string[]; // Format: "d0_h18" (day0_hour18)
}

export interface GuestRequest {
    tempId: string;
    name: string;
    ip: string;
    timestamp: number;
}

export interface Meeting {
    meta: MeetingMeta;
    schedule: Schedule;
    participants: Record<string, Participant>; // key: participant UUID
    guestRequests: GuestRequest[];
}

// API Request/Response types

export interface CreateMeetingInput {
    title: string;
    description?: string;
    dates: string[];
    participantNames: string[];
    allowGuest: boolean;
    startHour?: number;
    endHour?: number;
}

export interface CreateMeetingOutput {
    meetingId: string;
    adminToken: string;
    shareUrl: string;
}

export interface PublicMeeting {
    meta: Omit<MeetingMeta, "adminToken">;
    schedule: Schedule;
    participants: Record<
        string,
        Omit<Participant, "deviceToken"> & { isClaimed: boolean }
    >;
    guestRequests: Pick<GuestRequest, "tempId" | "name">[];
}

// Socket message types
export type SocketMessageType =
    | "SLOTS_UPDATED"
    | "PARTICIPANT_JOINED"
    | "GUEST_REQUEST"
    | "GUEST_APPROVED"
    | "GUEST_REJECTED"
    | "MEETING_FROZEN"
    | "MEETING_UNFROZEN"
    | "SESSION_RESET";

export interface SocketMessage {
    type: SocketMessageType;
    meetingId: string;
    userId?: string;
    name?: string;
    slots?: string[];
    requestId?: string;
}
