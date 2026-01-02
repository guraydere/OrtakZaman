"use client";

import { Check, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicMeeting } from "@/types";

interface ParticipantPanelProps {
    meeting: PublicMeeting;
    currentUserId: string | null;
}

export function ParticipantPanel({ meeting, currentUserId }: ParticipantPanelProps) {
    const participants = Object.entries(meeting.participants)
        .filter(([, p]) => p.status === "approved")
        .sort((a, b) => {
            // Current user first
            if (a[0] === currentUserId) return -1;
            if (b[0] === currentUserId) return 1;
            // Then by name
            return a[1].name.localeCompare(b[1].name, "tr");
        });

    const claimedCount = participants.filter(([, p]) => p.isClaimed).length;
    const totalCount = participants.length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Katılımcılar</h3>
                <span className="text-sm text-muted-foreground">
                    {claimedCount}/{totalCount} katıldı
                </span>
            </div>

            <div className="space-y-2">
                {participants.map(([id, participant]) => {
                    const isCurrentUser = id === currentUserId;
                    const hasSlots = participant.slots.length > 0;

                    return (
                        <div
                            key={id}
                            className={cn(
                                "flex items-center gap-3 p-2 rounded-lg transition-colors",
                                isCurrentUser && "bg-primary/10 border border-primary/20"
                            )}
                        >
                            {/* Status Icon */}
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center",
                                    participant.isClaimed
                                        ? hasSlots
                                            ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                                            : "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                {participant.isClaimed ? (
                                    hasSlots ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <User className="w-4 h-4" />
                                    )
                                ) : (
                                    <Clock className="w-4 h-4" />
                                )}
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <p
                                    className={cn(
                                        "font-medium truncate",
                                        isCurrentUser && "text-primary"
                                    )}
                                >
                                    {participant.name}
                                    {isCurrentUser && (
                                        <span className="text-xs ml-1 text-muted-foreground">
                                            (Sen)
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {participant.isClaimed
                                        ? hasSlots
                                            ? `${participant.slots.length} saat seçti`
                                            : "Henüz seçim yapmadı"
                                        : "Giriş yapmadı"}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pending guests */}
            {meeting.guestRequests.length > 0 && (
                <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Bekleyen İstekler ({meeting.guestRequests.length})
                    </h4>
                    <div className="space-y-1">
                        {meeting.guestRequests.map((request) => (
                            <div
                                key={request.tempId}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                                <Clock className="w-3 h-3" />
                                <span>{request.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
