"use client";

import { useMemo, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { formatDayHeaderTR, formatHour, createSlotId } from "@/lib/client";
import { useMeeting } from "@/store";
import type { PublicMeeting } from "@/types";
import { Check, Trophy, Crown } from "lucide-react";

interface CalendarGridProps {
    meeting: PublicMeeting;
    currentUserId: string | null;
    selectedSlots: string[];
    onSlotsChange: (slots: string[]) => void;
}

export function CalendarGrid({
    meeting,
    currentUserId,
    selectedSlots,
    onSlotsChange
}: CalendarGridProps) {
    const { isFrozen } = useMeeting();
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState<"add" | "remove">("add");

    const { dates } = meeting.schedule;
    const { startHour, endHour } = meeting.schedule;
    const hours = useMemo(
        () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
        [startHour, endHour]
    );

    const totalParticipants = Object.keys(meeting.participants).length;

    // Calculate slot data including my local selection
    const getSlotInfo = useCallback((slotId: string) => {
        const isMySelection = selectedSlots.includes(slotId);

        let othersCount = 0;
        const participants: string[] = [];

        Object.entries(meeting.participants).forEach(([pid, participant]) => {
            if (participant.slots.includes(slotId)) {
                if (pid !== currentUserId) {
                    othersCount++;
                }
                participants.push(participant.name);
            }
        });

        const totalCount = othersCount + (isMySelection ? 1 : 0);

        return { isMySelection, othersCount, totalCount, participants };
    }, [selectedSlots, meeting.participants, currentUserId]);

    // Find best matches
    const bestMatches = useMemo(() => {
        if (totalParticipants === 0) return { perfect: [], good: [], maxCount: 0 };

        const allSlots: { slotId: string; count: number }[] = [];

        dates.forEach((_, dayIndex) => {
            hours.forEach((hour) => {
                const slotId = createSlotId(dayIndex, hour);
                const info = getSlotInfo(slotId);
                allSlots.push({ slotId, count: info.totalCount });
            });
        });

        const maxCount = Math.max(...allSlots.map(s => s.count));
        if (maxCount === 0) return { perfect: [], good: [], maxCount: 0 };

        const perfect = allSlots
            .filter(s => s.count === totalParticipants && s.count > 0)
            .map(s => s.slotId);

        const good = allSlots
            .filter(s => s.count === maxCount && s.count > 0 && s.count < totalParticipants)
            .map(s => s.slotId);

        return { perfect, good, maxCount };
    }, [dates, hours, totalParticipants, getSlotInfo]);

    // Toggle
    const toggleSlot = useCallback(
        (slotId: string) => {
            if (isFrozen || !currentUserId) return;
            const isCurrentlySelected = selectedSlots.includes(slotId);
            const newSlots = isCurrentlySelected
                ? selectedSlots.filter((s) => s !== slotId)
                : [...selectedSlots, slotId];
            onSlotsChange(newSlots);
        },
        [isFrozen, currentUserId, selectedSlots, onSlotsChange]
    );

    const handleMouseDown = useCallback(
        (slotId: string) => {
            if (isFrozen || !currentUserId) return;
            const isSelected = selectedSlots.includes(slotId);
            setDragMode(isSelected ? "remove" : "add");
            setIsDragging(true);
            toggleSlot(slotId);
        },
        [isFrozen, currentUserId, selectedSlots, toggleSlot]
    );

    const handleMouseEnter = useCallback(
        (slotId: string) => {
            if (!isDragging || isFrozen || !currentUserId) return;
            const isSelected = selectedSlots.includes(slotId);
            if (dragMode === "add" && !isSelected) {
                onSlotsChange([...selectedSlots, slotId]);
            } else if (dragMode === "remove" && isSelected) {
                onSlotsChange(selectedSlots.filter((s) => s !== slotId));
            }
        },
        [isDragging, isFrozen, currentUserId, dragMode, selectedSlots, onSlotsChange]
    );

    const handleMouseUp = useCallback(() => setIsDragging(false), []);

    const handleTouchStart = useCallback(
        (slotId: string, e: React.TouchEvent) => {
            if (isFrozen || !currentUserId) return;
            e.preventDefault();
            toggleSlot(slotId);
        },
        [isFrozen, currentUserId, toggleSlot]
    );

    const participationPercent = totalParticipants > 0 && bestMatches.maxCount > 0
        ? Math.round((bestMatches.maxCount / totalParticipants) * 100)
        : 0;

    return (
        <div
            className="select-none touch-pan-y"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Best Match Summary */}
            {totalParticipants > 0 && (bestMatches.perfect.length > 0 || bestMatches.good.length > 0) && (
                <div className="mb-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-start gap-3">
                        {bestMatches.perfect.length > 0 ? (
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                                <Crown className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            {bestMatches.perfect.length > 0 ? (
                                <>
                                    <h4 className="font-bold text-emerald-800 dark:text-emerald-200 text-sm sm:text-base">
                                        🎉 Herkesin Uygun Olduğu {bestMatches.perfect.length} Saat!
                                    </h4>
                                    <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                                        Koyu yeşil kutular ortak müsait zamanlardır
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h4 className="font-bold text-amber-800 dark:text-amber-200 text-sm sm:text-base">
                                        En İyi Eşleşme: %{participationPercent} Katılım
                                    </h4>
                                    <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                                        {bestMatches.maxCount}/{totalParticipants} kişinin uygun olduğu {bestMatches.good.length} saat var
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="overflow-x-auto -mx-2 px-2 pb-2">
                <div className="min-w-[320px]">
                    {/* Header */}
                    <div
                        className="grid gap-1 mb-1"
                        style={{ gridTemplateColumns: `50px repeat(${dates.length}, minmax(80px, 1fr))` }}
                    >
                        <div className="text-[10px] sm:text-xs text-muted-foreground flex items-end justify-center pb-1">
                            Saat
                        </div>
                        {dates.map((date) => {
                            const { day, date: dateStr } = formatDayHeaderTR(date);
                            return (
                                <div key={date} className="text-center py-1 sm:py-2">
                                    <div className="text-[10px] sm:text-xs font-semibold text-foreground">{day}</div>
                                    <div className="text-[9px] sm:text-[10px] text-muted-foreground">{dateStr}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Rows */}
                    {hours.map((hour) => (
                        <div
                            key={hour}
                            className="grid gap-1 mb-1"
                            style={{ gridTemplateColumns: `50px repeat(${dates.length}, minmax(80px, 1fr))` }}
                        >
                            <div className="flex items-center justify-center text-[10px] sm:text-xs text-muted-foreground font-medium">
                                {formatHour(hour)}
                            </div>

                            {dates.map((_, dayIndex) => {
                                const slotId = createSlotId(dayIndex, hour);
                                const { isMySelection, totalCount } = getSlotInfo(slotId);
                                const isDisabled = isFrozen || !currentUserId;
                                const isPerfect = bestMatches.perfect.includes(slotId);
                                const isBestMatch = bestMatches.good.includes(slotId);

                                // Slot state
                                const hasAnySelection = isMySelection || totalCount > 0;
                                const ratio = totalParticipants > 0 ? totalCount / totalParticipants : 0;

                                // Determine background and text colors based on participation
                                let bgColor: string;
                                let textColor: string;
                                let borderStyle: string;

                                if (totalCount === 0) {
                                    // Empty - no one selected
                                    bgColor = "bg-slate-50 dark:bg-slate-900";
                                    textColor = "text-slate-400";
                                    borderStyle = "border border-slate-200 dark:border-slate-700";
                                } else if (isPerfect || ratio >= 1) {
                                    // Everyone selected - darkest green
                                    bgColor = "bg-emerald-500";
                                    textColor = "text-white";
                                    borderStyle = "border-2 border-emerald-300 shadow-md";
                                } else if (ratio >= 0.66) {
                                    // Most people - medium green
                                    bgColor = "bg-emerald-400";
                                    textColor = "text-white";
                                    borderStyle = "border border-emerald-300";
                                } else if (ratio >= 0.33) {
                                    // Some people - light green
                                    bgColor = "bg-emerald-200 dark:bg-emerald-700";
                                    textColor = "text-emerald-900 dark:text-white";
                                    borderStyle = "border border-emerald-300 dark:border-emerald-600";
                                } else {
                                    // Few people - very light green
                                    bgColor = "bg-emerald-100 dark:bg-emerald-800";
                                    textColor = "text-emerald-800 dark:text-emerald-100";
                                    borderStyle = "border border-emerald-200 dark:border-emerald-700";
                                }

                                return (
                                    <button
                                        key={slotId}
                                        className={cn(
                                            "h-10 sm:h-11 rounded-lg transition-all duration-150 relative overflow-hidden",
                                            "active:scale-95 touch-manipulation",
                                            bgColor,
                                            borderStyle,
                                            isDisabled && "cursor-not-allowed opacity-50",
                                            !isDisabled && "cursor-pointer hover:brightness-95"
                                        )}
                                        onMouseDown={() => handleMouseDown(slotId)}
                                        onMouseEnter={() => handleMouseEnter(slotId)}
                                        onTouchStart={(e) => handleTouchStart(slotId, e)}
                                        disabled={isDisabled}
                                    >
                                        {/* My selection indicator - absolute positioned blue strip on left */}
                                        {isMySelection && (
                                            <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-7 bg-blue-500 flex items-center justify-center z-10">
                                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                            </div>
                                        )}

                                        {/* Content area - centered, with left padding if my selection */}
                                        {hasAnySelection && (
                                            <div
                                                className={cn(
                                                    "absolute inset-0 flex items-center justify-center",
                                                    isMySelection && "pl-6 sm:pl-7",
                                                    textColor
                                                )}
                                            >
                                                <span className="text-xs sm:text-sm font-bold">
                                                    {hour.toString().padStart(2, "0")}:00
                                                </span>
                                                {totalCount > 0 && (
                                                    <span className="text-[10px] sm:text-xs ml-1 opacity-80">
                                                        ({totalCount})
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Perfect match badge */}
                                        {isPerfect && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center z-20">
                                                <Trophy className="w-3 h-3 text-emerald-600" />
                                            </div>
                                        )}

                                        {/* Best match badge (not perfect) */}
                                        {isBestMatch && !isPerfect && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center z-20">
                                                <Crown className="w-3 h-3 text-amber-600" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-4 pt-4 border-t text-[10px] sm:text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <div className="relative w-10 h-6 rounded border border-slate-200 overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-4 bg-blue-500 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>
                    </div>
                    <span>Ben seçtim</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-emerald-500 border-2 border-emerald-300" />
                    <span>Herkes</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-emerald-400 border border-emerald-300" />
                    <span>Çoğunluk</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-800 border border-emerald-200" />
                    <span>Az kişi</span>
                </div>
            </div>

            {currentUserId && selectedSlots.length > 0 && (
                <p className="text-center text-xs text-blue-600 mt-3 font-medium">
                    {selectedSlots.length} saat seçtiniz • Tekrar tıklayarak kaldırabilirsiniz
                </p>
            )}
        </div>
    );
}
