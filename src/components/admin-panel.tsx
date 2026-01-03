"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    toggleFreezeAction,
    resetSessionAction,
    approveGuestAction,
    rejectGuestAction,
    deleteParticipantAction,
} from "@/actions";
import {
    Lock,
    Unlock,
    RefreshCw,
    UserCheck,
    UserX,
    Trash2,
    Loader2,
    Shield,
    CheckCircle,
} from "lucide-react";
import type { PublicMeeting } from "@/types";

interface AdminPanelProps {
    meeting: PublicMeeting;
    meetingId: string;
    adminToken: string;
    onUpdate: () => void;
    onFinalize: () => void;
}

export function AdminPanel({ meeting, meetingId, adminToken, onUpdate, onFinalize }: AdminPanelProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleFreeze = async () => {
        setIsLoading("freeze");
        try {
            const newStatus = meeting.meta.status !== "frozen";
            await toggleFreezeAction(meetingId, adminToken, newStatus);
            onUpdate();
        } finally {
            setIsLoading(null);
        }
    };

    const handleResetSession = async (participantId: string) => {
        setIsLoading(`reset-${participantId}`);
        try {
            await resetSessionAction(meetingId, participantId, adminToken);
            onUpdate();
        } finally {
            setIsLoading(null);
        }
    };

    const handleApproveGuest = async (requestId: string) => {
        setIsLoading(`approve-${requestId}`);
        try {
            await approveGuestAction(meetingId, requestId, adminToken);
            onUpdate();
        } finally {
            setIsLoading(null);
        }
    };

    const handleRejectGuest = async (requestId: string) => {
        setIsLoading(`reject-${requestId}`);
        try {
            await rejectGuestAction(meetingId, requestId, adminToken);
            onUpdate();
        } finally {
            setIsLoading(null);
        }
    };

    const handleDeleteParticipant = async (participantId: string) => {
        if (!confirm("Bu katılımcıyı silmek istediğinize emin misiniz?")) return;

        setIsLoading(`delete-${participantId}`);
        try {
            await deleteParticipantAction(meetingId, participantId, adminToken);
            onUpdate();
        } finally {
            setIsLoading(null);
        }
    };

    const isFrozen = meeting.meta.status === "frozen";
    const participants = Object.entries(meeting.participants);
    const guestRequests = meeting.guestRequests;

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="w-4 h-4" />
                    Yönetici Paneli
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Freeze Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-sm">Buluşma Durumu</p>
                        <p className="text-xs text-muted-foreground">
                            {isFrozen ? "Seçim yapılamıyor" : "Seçim açık"}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant={isFrozen ? "default" : "outline"}
                        onClick={handleFreeze}
                        disabled={isLoading === "freeze"}
                    >
                        {isLoading === "freeze" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isFrozen ? (
                            <>
                                <Unlock className="w-4 h-4 mr-1" />
                                Aç
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4 mr-1" />
                                Kilitle
                            </>
                        )}
                    </Button>
                </div>

                {/* Finalize Meeting */}
                {meeting.meta.status !== "finalized" && (
                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={onFinalize}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Buluşmayı Sonlandır
                    </Button>
                )}

                {/* Guest Requests */}
                {guestRequests.length > 0 && (
                    <div className="space-y-2">
                        <p className="font-medium text-sm">Bekleyen İstekler</p>
                        {guestRequests.map((request) => (
                            <div
                                key={request.tempId}
                                className="flex items-center justify-between p-2 bg-background rounded-md"
                            >
                                <span className="text-sm">{request.name}</span>
                                <div className="flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-green-600 hover:text-green-700"
                                        onClick={() => handleApproveGuest(request.tempId)}
                                        disabled={isLoading === `approve-${request.tempId}`}
                                    >
                                        {isLoading === `approve-${request.tempId}` ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <UserCheck className="w-4 h-4" />
                                        )}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-red-600 hover:text-red-700"
                                        onClick={() => handleRejectGuest(request.tempId)}
                                        disabled={isLoading === `reject-${request.tempId}`}
                                    >
                                        {isLoading === `reject-${request.tempId}` ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <UserX className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Participant Management */}
                <div className="space-y-2">
                    <p className="font-medium text-sm">Katılımcılar</p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                        {participants.map(([id, participant]) => (
                            <div
                                key={id}
                                className="flex items-center justify-between p-2 bg-background rounded-md text-sm"
                            >
                                <span>{participant.name}</span>
                                <div className="flex gap-1">
                                    {participant.isClaimed && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            title="Oturumu sıfırla"
                                            onClick={() => handleResetSession(id)}
                                            disabled={isLoading === `reset-${id}`}
                                        >
                                            {isLoading === `reset-${id}` ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-4 h-4" />
                                            )}
                                        </Button>
                                    )}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        title="Katılımcıyı sil"
                                        onClick={() => handleDeleteParticipant(id)}
                                        disabled={isLoading === `delete-${id}`}
                                    >
                                        {isLoading === `delete-${id}` ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
