"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMeetingAction, claimIdentityAction, forceClaimIdentityAction } from "@/actions";
import { useMeeting, useCurrentUser, useSlotSelection } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, User, UserCheck, AlertCircle } from "lucide-react";
import type { PublicMeeting } from "@/types";

interface IdentityModalProps {
    meeting: PublicMeeting;
    meetingId: string;
    onClaimed: () => void;
}

export function IdentityModal({ meeting, meetingId, onClaimed }: IdentityModalProps) {
    const { saveDeviceToken } = useCurrentUser();
    const { initializeSlots } = useSlotSelection();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForceOption, setShowForceOption] = useState(false);

    const handleSelect = async (participantId: string) => {
        const participant = meeting.participants[participantId];
        if (!participant) return;

        // Already claimed by another device
        if (participant.isClaimed) {
            setSelectedId(participantId);
            setShowForceOption(true);
            setError(`"${participant.name}" başka bir cihazda aktif`);
            return;
        }

        setIsLoading(true);
        setError(null);
        setSelectedId(participantId);

        try {
            const result = await claimIdentityAction(meetingId, participantId);

            if (!result.success) {
                setError(result.error || "Bir hata oluştu");
                if (result.error?.includes("başka bir cihazda")) {
                    setShowForceOption(true);
                }
                return;
            }

            // Save device token and initialize slots
            saveDeviceToken(participantId, result.deviceToken);
            initializeSlots(participant.slots);
            onClaimed();
        } catch (err) {
            setError("Bir hata oluştu");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForceClaim = async () => {
        if (!selectedId) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await forceClaimIdentityAction(meetingId, selectedId);

            if (!result.success) {
                setError(result.error || "Bir hata oluştu");
                return;
            }

            const participant = meeting.participants[selectedId];
            saveDeviceToken(selectedId, result.deviceToken);
            initializeSlots(participant?.slots || []);
            onClaimed();
        } catch (err) {
            setError("Bir hata oluştu");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const participants = Object.entries(meeting.participants)
        .filter(([, p]) => p.status === "approved")
        .sort((a, b) => a[1].name.localeCompare(b[1].name, "tr"));

    return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-xl">Hoş geldin! 👋</DialogTitle>
                    <DialogDescription>
                        <span className="font-medium text-foreground">{meeting.meta.title}</span>
                        {meeting.meta.description && (
                            <span className="block mt-1 text-muted-foreground">
                                {meeting.meta.description}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Sen hangisisin?</p>

                    <div className="grid gap-2">
                        {participants.map(([id, participant]) => (
                            <Button
                                key={id}
                                variant={participant.isClaimed ? "outline" : "default"}
                                className="w-full justify-start gap-3 h-auto py-3"
                                disabled={isLoading}
                                onClick={() => handleSelect(id)}
                            >
                                {participant.isClaimed ? (
                                    <UserCheck className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                    <User className="w-5 h-5" />
                                )}
                                <span className="flex-1 text-left">{participant.name}</span>
                                {participant.isClaimed && (
                                    <span className="text-xs text-muted-foreground">Seçildi</span>
                                )}
                                {isLoading && selectedId === id && (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                            </Button>
                        ))}
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="space-y-2">
                                <p>{error}</p>
                                {showForceOption && (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={handleForceClaim}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : null}
                                        Bu benim, girişi zorla
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {meeting.meta.allowGuest && (
                        <div className="pt-4 border-t">
                            <a
                                href={`/m/${meetingId}/join/guest`}
                                className="text-sm text-muted-foreground hover:text-primary"
                            >
                                Listede yokum? Katılım isteği gönder
                            </a>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
