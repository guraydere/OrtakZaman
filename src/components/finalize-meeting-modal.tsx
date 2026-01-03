"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PublicMeeting } from "@/types";
import { createSlotId, formatDayHeaderTR, formatHour } from "@/lib/date-utils";
import { finalizeMeetingAction } from "@/actions";
import { Check, Trophy, Crown, Loader2, Calendar } from "lucide-react";
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate best matches (Reused logic)
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
                const attendees = [];

                // Count participants
                for (const p of Object.values(meeting.participants)) {
                    if (p.slots.includes(slotId)) {
                        count++;
                        attendees.push(p.name);
                    }
                }

                if (count > 0) {
                    slots.push({
                        slotId,
                        dateIndex: d,
                        hour: h,
                        count,
                        attendees,
                        ratio: count / totalParticipants
                    });
                }
            }
        }

        // Sort by count (desc) then by date/hour
        return slots.sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            if (a.dateIndex !== b.dateIndex) return a.dateIndex - b.dateIndex;
            return a.hour - b.hour;
        }).slice(0, 5); // Take top 5
    }, [meeting]);

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Buluşmayı Sonlandır</DialogTitle>
                    <DialogDescription>
                        En uygun zamanı seçerek buluşmayı kesinleştirin. Bu işlem geri alınamaz.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {bestMatches.length === 0 ? (
                        <div className="text-center p-6 text-muted-foreground bg-slate-50 rounded-lg">
                            Henüz yeterli katılım yok.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">En İyi Eşleşmeler</h4>
                            {bestMatches.map((match) => {
                                const dateStr = meeting.schedule.dates[match.dateIndex];
                                const { day, date } = formatDayHeaderTR(dateStr);
                                const isSelected = selectedSlot === match.slotId;
                                const isPerfect = match.ratio === 1;

                                return (
                                    <button
                                        key={match.slotId}
                                        onClick={() => setSelectedSlot(match.slotId)}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group",
                                            isSelected
                                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500"
                                                : "border-border hover:border-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                                isSelected
                                                    ? "bg-emerald-500 text-white"
                                                    : isPerfect ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {isSelected ? (
                                                    <Check className="w-5 h-5" />
                                                ) : isPerfect ? (
                                                    <Trophy className="w-5 h-5" />
                                                ) : (
                                                    <Calendar className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">
                                                    {day}, {date} • {formatHour(match.hour)}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {match.count} kişi: {match.attendees.slice(0, 3).join(", ")}{match.attendees.length > 3 && ` +${match.attendees.length - 3}`}
                                                </div>
                                            </div>
                                        </div>
                                        {isPerfect && !isSelected && (
                                            <div className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                                TAM
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
                            <span className="font-bold">!</span> {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        İptal
                    </Button>
                    <Button
                        onClick={handleFinalize}
                        disabled={!selectedSlot || isSubmitting}
                        className={cn(
                            "gap-2",
                            selectedSlot ? "bg-emerald-600 hover:bg-emerald-700" : ""
                        )}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Check className="w-4 h-4" />
                        )}
                        Kesinleştir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
