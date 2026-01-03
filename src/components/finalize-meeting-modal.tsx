"use client";

import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PublicMeeting } from "@/types";
import { createSlotId, formatDayHeaderTR, formatHour } from "@/lib/date-utils";
import { finalizeMeetingAction } from "@/actions";
import { Check, Trophy, Crown, Loader2, Calendar, User, X, Clock, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinalizeMeetingModalProps {
    meeting: PublicMeeting;
    meetingId: string;
    adminToken: string;
    isOpen: boolean;
    onClose: () => void;
    onFinalized?: () => void;
}

export function FinalizeMeetingModal({
    meeting,
    meetingId,
    adminToken,
    isOpen,
    onClose,
    onFinalized
}: FinalizeMeetingModalProps) {
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeSlotId = hoveredSlot || selectedSlot;

    // Calculate best matches
    const bestMatches = useMemo(() => {
        const { dates, startHour, endHour } = meeting.schedule;
        const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
        const totalParticipants = Object.keys(meeting.participants).length;

        if (totalParticipants === 0) return [];

        const slots = [];

        // Iterate all slots
        for (let d = 0; d < dates.length; d++) {
            for (const h of hours) {
                const slotId = createSlotId(d, h);
                let count = 0;
                // Only authorized participants
                for (const p of Object.values(meeting.participants)) {
                    if (p.status === "approved" && p.slots.includes(slotId)) {
                        count++;
                    }
                }

                if (count > 0) {
                    slots.push({
                        slotId,
                        dateIndex: d,
                        hour: h,
                        count,
                    });
                }
            }
        }

        if (slots.length === 0) return [];

        // STRICT FILTER: Find max count
        const maxCount = Math.max(...slots.map(s => s.count));

        // Return ONLY slots with maxCount
        return slots.filter(s => s.count === maxCount).sort((a, b) => {
            if (a.dateIndex !== b.dateIndex) return a.dateIndex - b.dateIndex;
            return a.hour - b.hour;
        });
    }, [meeting]);

    useEffect(() => {
        if (!isOpen) {
            setSelectedSlot(null);
            setHoveredSlot(null);
            setError(null);
        }
    }, [isOpen]);

    const handleFinalize = async () => {
        if (!selectedSlot) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await finalizeMeetingAction(meetingId, selectedSlot, adminToken);
            if (result.success) {
                onFinalized?.();
                onClose();
            } else {
                setError(result.error || "İşlem başarısız oldu");
            }
        } catch {
            setError("Bir hata oluştu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const sortedParticipants = useMemo(() => {
        return Object.values(meeting.participants)
            .filter(p => p.status === "approved")
            .sort((a, b) => a.name.localeCompare(b.name, "tr"));
    }, [meeting]);

    const maxParticipantCount = bestMatches.length > 0 ? bestMatches[0].count : 0;
    const totalCount = sortedParticipants.length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl h-[90vh] md:h-[80vh] overflow-hidden flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 sm:p-6 border-b flex-none flex flex-row items-center gap-4 space-y-0">
                    <Button variant="ghost" size="icon" className="-ml-2 md:hidden" onClick={onClose}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <DialogTitle className="text-xl">Buluşmayı Kesinleştir</DialogTitle>
                        <DialogDescription>
                            En yüksek katılıma ({maxParticipantCount}/{totalCount}) sahip zamanlar.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* TOP/LEFT: Selection Area */}
                    <div className="flex-none md:w-[400px] md:flex-none border-b md:border-b-0 md:border-r bg-muted/10 flex flex-col overflow-hidden">
                        <div className="p-3 border-b flex items-center justify-between bg-muted/20">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Uygun Zamanlar
                            </span>
                            <span className="text-xs font-bold text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded border border-green-200 dark:border-green-800">
                                {bestMatches.length} Seçenek
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 md:p-4">
                            {bestMatches.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    Ortak bir zaman bulunamadı.
                                </div>
                            ) : (
                                <div className="flex md:grid md:grid-cols-2 gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 px-1 snap-x">
                                    {bestMatches.map((match) => {
                                        const dateStr = meeting.schedule.dates[match.dateIndex];
                                        const { day, date } = formatDayHeaderTR(dateStr);
                                        const isSelected = selectedSlot === match.slotId;
                                        const isHovered = hoveredSlot === match.slotId;

                                        return (
                                            <button
                                                key={match.slotId}
                                                onClick={() => setSelectedSlot(match.slotId)}
                                                onMouseEnter={() => setHoveredSlot(match.slotId)}
                                                onMouseLeave={() => setHoveredSlot(null)}
                                                className={cn(
                                                    "flex-none w-32 md:w-auto snap-center relative p-3 rounded-xl border text-left transition-all duration-200",
                                                    isSelected
                                                        ? "border-green-500 bg-green-100 dark:bg-green-900/40 ring-2 ring-green-500 shadow-lg transform scale-[1.02] z-10"
                                                        : isHovered
                                                            ? "border-primary/50 bg-accent transform scale-[1.01]"
                                                            : "border-border hover:border-primary/30 bg-card shadow-sm",
                                                )}
                                            >
                                                <div className="text-xs font-medium text-muted-foreground mb-1">
                                                    {day}, {date}
                                                </div>
                                                <div className={cn(
                                                    "text-2xl font-black tracking-tight",
                                                    isSelected ? "text-green-700 dark:text-green-300" : "text-foreground"
                                                )}>
                                                    {formatHour(match.hour)}
                                                </div>

                                                {isSelected && (
                                                    <div className="absolute top-2 right-2 text-green-600 bg-white rounded-full p-0.5 shadow-sm">
                                                        <CheckCircle className="w-5 h-5 fill-current" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BOTTOM/RIGHT: Participant List */}
                    <div className="flex-1 flex flex-col bg-background min-h-0">
                        <div className="p-3 border-b flex items-center justify-between bg-muted/5">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Davetli Listesi
                            </span>
                            {!activeSlotId && (
                                <span className="text-[10px] text-muted-foreground italic">
                                    (Bir saate tıklayın)
                                </span>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2">
                            {sortedParticipants.map((p) => {
                                const isAvailable = activeSlotId ? p.slots.includes(activeSlotId) : null;

                                return (
                                    <div
                                        key={p.id || p.name}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
                                            activeSlotId === null
                                                ? "bg-card border-border opacity-70"
                                                : isAvailable
                                                    ? "bg-green-100 border-green-300 dark:bg-green-900/40 dark:border-green-800 shadow-sm"
                                                    : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 opacity-60"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-9 h-9 rounded-full flex items-center justify-center border font-semibold text-sm transition-colors shadow-sm",
                                            activeSlotId === null
                                                ? "bg-muted text-muted-foreground border-border"
                                                : isAvailable
                                                    ? "bg-green-200 border-green-300 text-green-800 dark:bg-green-800 dark:text-green-100 dark:border-green-700"
                                                    : "bg-red-100 border-red-200 text-red-600 dark:bg-red-900 dark:text-red-200 dark:border-red-800"
                                        )}>
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>

                                        <div className="flex-1 min-w-0 flex items-center justify-between">
                                            <div className={cn(
                                                "font-bold text-base truncate",
                                                activeSlotId && isAvailable ? "text-green-900 dark:text-green-100"
                                                    : activeSlotId ? "text-red-900 dark:text-red-200"
                                                        : "text-muted-foreground"
                                            )}>
                                                {p.name}
                                            </div>

                                            {activeSlotId && (
                                                <div className={cn(
                                                    "text-xs font-bold px-3 py-1 rounded-full border shadow-sm",
                                                    isAvailable
                                                        ? "text-green-700 bg-green-50 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800"
                                                        : "text-red-600 bg-red-50 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800"
                                                )}>
                                                    {isAvailable ? "UYGUN" : "DEĞİL"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-muted/5 flex-none flex items-center justify-between">
                    {error ? (
                        <div className="text-sm text-red-600 font-medium">
                            {error}
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground hidden sm:block">
                            *Seçim kalıcıdır.
                        </div>
                    )}

                    <div className="flex gap-4 w-full sm:w-auto">
                        <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1 sm:flex-none border-zinc-300">
                            Vazgeç
                        </Button>
                        <Button
                            onClick={handleFinalize}
                            disabled={!selectedSlot || isSubmitting}
                            className={cn(
                                "flex-1 sm:flex-none w-40 font-bold tracking-wide shadow-md transition-all",
                                selectedSlot
                                    ? "bg-green-600 hover:bg-green-700 text-white ring-2 ring-green-600 ring-offset-2"
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "KESİNLEŞTİR"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
