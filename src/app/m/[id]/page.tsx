"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMeetingAction, updateAvailabilityAction, validateSessionAction } from "@/actions";
import { useMeeting, useCurrentUser, meetingIdAtom } from "@/store";
import { useSocket } from "@/hooks";
import { useSetAtom } from "jotai";
import {
    IdentityModal,
    CalendarGrid,
    ParticipantPanel,
    AdminPanel,
    ShareButton,
    SummaryExport,
} from "@/components";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Lock, AlertCircle, Sparkles, Users, Clock, Share2, ChevronDown, ChevronUp } from "lucide-react";
import type { SocketMessage } from "@/types";

export default function MeetingPage() {
    const params = useParams();
    const router = useRouter();
    const meetingId = params.id as string;

    const setMeetingIdAtom = useSetAtom(meetingIdAtom);
    const { meeting, setMeeting, isLoading, setIsLoading, error, setError, isFrozen } = useMeeting();
    const { currentUser, isAdmin, adminToken } = useCurrentUser();

    const [showIdentityModal, setShowIdentityModal] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitializedRef = useRef(false);

    useEffect(() => {
        setMeetingIdAtom(meetingId);
    }, [meetingId, setMeetingIdAtom]);

    const fetchMeeting = useCallback(async (skipSlotInit = false) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await getMeetingAction(meetingId);
            if (!result.success) {
                setError(result.error);
                return;
            }
            setMeeting(result.data);

            // Initialize slots from server data only once or when explicitly requested
            if (!skipSlotInit && currentUser && result.data.participants[currentUser.participantId]) {
                const serverSlots = result.data.participants[currentUser.participantId].slots;
                if (!isInitializedRef.current) {
                    setSelectedSlots(serverSlots);
                    isInitializedRef.current = true;
                }
            }
        } catch (err) {
            setError("Toplantı yüklenemedi");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [meetingId, setMeeting, setIsLoading, setError, currentUser]);

    // Initial load
    useEffect(() => {
        fetchMeeting();
    }, [fetchMeeting]);

    // Session check
    useEffect(() => {
        const checkSession = async () => {
            if (!meeting) return;

            if (!currentUser) {
                setShowIdentityModal(true);
                return;
            }

            const isValid = await validateSessionAction(
                meetingId,
                currentUser.participantId,
                currentUser.deviceToken
            );

            if (isValid) {
                const participant = meeting.participants[currentUser.participantId];
                if (participant && !isInitializedRef.current) {
                    setSelectedSlots(participant.slots);
                    isInitializedRef.current = true;
                }
                setShowIdentityModal(false);
            } else {
                setShowIdentityModal(true);
            }
        };

        checkSession();
    }, [meeting, currentUser, meetingId]);

    // Socket message handler - refresh data but don't reset local selection
    const handleSocketMessage = useCallback(
        (message: SocketMessage) => {
            console.log("Socket message:", message);
            // Fetch meeting data but skip reinitializing slots
            fetchMeeting(true);
        },
        [fetchMeeting]
    );

    useSocket(meetingId, handleSocketMessage);

    // Handle slot changes with debounced server update
    const handleSlotsChange = useCallback(
        (newSlots: string[]) => {
            // Update local state immediately (optimistic UI)
            setSelectedSlots(newSlots);

            // Debounce server update
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }

            updateTimeoutRef.current = setTimeout(async () => {
                if (!currentUser) return;

                const result = await updateAvailabilityAction(
                    meetingId,
                    currentUser.participantId,
                    currentUser.deviceToken,
                    newSlots
                );

                if (!result.success) {
                    console.error("Failed to update slots:", result.error);
                }
            }, 300);
        },
        [meetingId, currentUser]
    );

    const handleIdentityClaimed = useCallback(() => {
        setShowIdentityModal(false);
        isInitializedRef.current = false; // Allow re-initialization after identity change
        fetchMeeting();
    }, [fetchMeeting]);

    if (isLoading && !meeting) {
        return (
            <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl gradient-primary shadow-glow animate-pulse">
                        <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <p className="text-sm text-muted-foreground">Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error && !meeting) {
        return (
            <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
                <Card className="max-w-md w-full glass">
                    <CardContent className="pt-6 text-center">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                            <AlertCircle className="w-7 h-7 text-red-500" />
                        </div>
                        <h2 className="font-semibold text-lg">Bir sorun oluştu</h2>
                        <p className="text-muted-foreground mt-1 text-sm">{error}</p>
                        <Button onClick={() => router.push("/")} className="mt-4">
                            Ana Sayfaya Dön
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!meeting) return null;

    const participantCount = Object.keys(meeting.participants).length;
    const claimedCount = Object.values(meeting.participants).filter(p => p.isClaimed).length;
    const currentParticipant = currentUser ? meeting.participants[currentUser.participantId] : null;

    return (
        <div className="min-h-screen bg-background">
            {/* Decorative */}
            <div className="hidden sm:block fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute bottom-0 -left-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
            </div>

            {showIdentityModal && (
                <IdentityModal
                    meeting={meeting}
                    meetingId={meetingId}
                    onClaimed={handleIdentityClaimed}
                />
            )}

            {/* Header */}
            <header className="relative border-b bg-card/80 backdrop-blur-md sticky top-0 z-40">
                <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <a href="/" className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-white" />
                                </div>
                            </a>
                            <div className="min-w-0 flex-1">
                                <h1 className="font-semibold text-sm sm:text-base truncate">
                                    {meeting.meta.title}
                                </h1>
                                {isFrozen && (
                                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-amber-600 font-medium">
                                        <Lock className="w-2.5 h-2.5" />
                                        Kilitli
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2">
                            <ShareButton meetingId={meetingId} />
                            <div className="hidden sm:block">
                                <SummaryExport meeting={meeting} meetingId={meetingId} />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Current User Banner */}
            {currentUser && currentParticipant && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-200 dark:border-blue-800">
                    <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-blue-800 dark:text-blue-200">
                                        {currentParticipant.name}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400">
                                        {selectedSlots.length > 0 ? `${selectedSlots.length} saat seçtin` : "Müsait saatlerini işaretle"}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right text-xs text-blue-600 dark:text-blue-400">
                                <span className="font-medium">{claimedCount}/{participantCount}</span> katıldı
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="relative container mx-auto px-3 sm:px-4 py-4 sm:py-6">
                <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
                    {/* Calendar Grid */}
                    <Card className="glass overflow-hidden order-1">
                        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-accent/5 p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-sm sm:text-base">Müsaitlik Takvimi</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm truncate">
                                        {currentUser
                                            ? "Müsait saatlerine tıkla, tekrar tıkla kaldır"
                                            : "Önce ismini seç"}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-4">
                            <CalendarGrid
                                meeting={meeting}
                                currentUserId={currentUser?.participantId || null}
                                selectedSlots={selectedSlots}
                                onSlotsChange={handleSlotsChange}
                            />
                        </CardContent>
                    </Card>

                    {/* Sidebar */}
                    <div className="order-2 lg:order-2 space-y-4">
                        {/* Mobile: Collapsible participants */}
                        <div className="lg:hidden">
                            <button
                                onClick={() => setShowParticipants(!showParticipants)}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border"
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    <span className="font-medium text-sm">Katılımcılar</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                        {claimedCount}/{participantCount}
                                    </span>
                                </div>
                                {showParticipants ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                )}
                            </button>

                            {showParticipants && (
                                <Card className="glass mt-2">
                                    <CardContent className="p-3">
                                        <ParticipantPanel
                                            meeting={meeting}
                                            currentUserId={currentUser?.participantId || null}
                                        />
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Desktop: Always visible */}
                        <Card className="glass hidden lg:block">
                            <CardHeader className="border-b bg-muted/30 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-base">Katılımcılar</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                <ParticipantPanel
                                    meeting={meeting}
                                    currentUserId={currentUser?.participantId || null}
                                />
                            </CardContent>
                        </Card>

                        {/* Admin Panel */}
                        {isAdmin && adminToken && (
                            <AdminPanel
                                meeting={meeting}
                                meetingId={meetingId}
                                adminToken={adminToken}
                                onUpdate={() => fetchMeeting(true)}
                            />
                        )}
                    </div>
                </div>
            </main>

            {/* Mobile: Floating share button */}
            <div className="fixed bottom-4 right-4 sm:hidden z-50">
                <Button
                    size="lg"
                    className="rounded-full w-14 h-14 shadow-lg gradient-primary"
                    onClick={() => {
                        const url = window.location.href;
                        navigator.share?.({ url }) || navigator.clipboard.writeText(url);
                    }}
                >
                    <Share2 className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
