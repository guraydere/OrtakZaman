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

    // Calculate heatmap values
    const heatmapData = useMemo(() => {
        const data: Record<string, { count: number; participants: string[] }> = {};
        const totalParticipants = Object.keys(meeting.participants).length;

        // Initialize all slots
        dates.forEach((_, dayIndex) => {
            hours.forEach((hour) => {
                const slotId = createSlotId(dayIndex, hour);
                data[slotId] = { count: 0, participants: [] };
            });
        });

        // Count participants per slot
        Object.entries(meeting.participants).forEach(([, participant]) => {
            participant.slots.forEach((slotId) => {
                if (data[slotId]) {
                    data[slotId].count++;
                    data[slotId].participants.push(participant.name);
                }
            });
        });

        return { data, totalParticipants };
    }, [meeting.participants, dates, hours]);

    // Find best matches
    const bestMatches = useMemo(() => {
        const { data, totalParticipants } = heatmapData;
        if (totalParticipants === 0) return { perfect: [], good: [], maxCount: 0 };

        const entries = Object.entries(data);
        const maxCount = Math.max(...entries.map(([, d]) => d.count));

        if (maxCount === 0) return { perfect: [], good: [], maxCount: 0 };

        const perfect = entries
            .filter(([, d]) => d.count === totalParticipants && d.count > 0)
            .map(([id]) => id);

        const good = entries
            .filter(([, d]) => d.count === maxCount && d.count > 0 && d.count < totalParticipants)
            .map(([id]) => id);

        return { perfect, good, maxCount };
    }, [heatmapData]);

    // Get cell background color based on participation
    const getSlotStyle = useCallback(
        (slotId: string, isSelected: boolean) => {
            const slotData = heatmapData.data[slotId];
            const count = slotData?.count || 0;
            const { totalParticipants } = heatmapData;
            const ratio = totalParticipants > 0 ? count / totalParticipants : 0;
            const isPerfect = bestMatches.perfect.includes(slotId);
            const isBestMatch = bestMatches.good.includes(slotId);

            // User's own selection - blue tones
            if (isSelected) {
                if (isPerfect) {
                    return "bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-300";
                }
                if (count > 0) {
                    return "bg-blue-600 text-white shadow-md";
                }
                return "bg-blue-500 text-white shadow-md";
            }

            // Not selected by user - show heatmap
            if (count === 0) {
                return "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400";
            }

            // Perfect match - everyone available
            if (isPerfect) {
                return "bg-green-500 text-white ring-2 ring-green-300 shadow-lg";
            }

            // Best match (not perfect)
            if (isBestMatch && count > 1) {
                return "bg-amber-400 text-white ring-2 ring-amber-200 shadow-md";
            }

            // Gradient based on participation ratio
            if (ratio >= 0.75) {
                return "bg-green-400 text-white";
            }
            if (ratio >= 0.5) {
                return "bg-green-300 text-green-900 dark:bg-green-600 dark:text-white";
            }
            if (ratio >= 0.25) {
                return "bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100";
            }
            return "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200";
        },
        [heatmapData, bestMatches]
    );

    // Toggle slot selection
    const toggleSlot = useCallback(
        (slotId: string) => {
            if (isFrozen || !currentUserId) return;

            const isCurrentlySelected = selectedSlots.includes(slotId);
            let newSlots: string[];

            if (isCurrentlySelected) {
                newSlots = selectedSlots.filter((s) => s !== slotId);
            } else {
                newSlots = [...selectedSlots, slotId];
            }

            onSlotsChange(newSlots);
        },
        [isFrozen, currentUserId, selectedSlots, onSlotsChange]
    );

    // Mouse/touch handlers
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

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleTouchStart = useCallback(
        (slotId: string, e: React.TouchEvent) => {
            if (isFrozen || !currentUserId) return;
            e.preventDefault();
            toggleSlot(slotId);
        },
        [isFrozen, currentUserId, toggleSlot]
    );

    const { totalParticipants } = heatmapData;
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
                                        🎉 Herkesin Uygun Olduğu {bestMatches.perfect.length} Saat Var!
                                    </h4>
                                    <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                                        Yeşil çerçeveli saatler herkesin müsait olduğu zamanlardır
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

            {/* Scrollable container */}
            <div className="overflow-x-auto -mx-2 px-2 pb-2">
                <div className="min-w-[320px]">
                    {/* Header Row - Days */}
                    <div
                        className="grid gap-0.5 sm:gap-1 mb-1"
                        style={{ gridTemplateColumns: `50px repeat(${dates.length}, minmax(55px, 1fr))` }}
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

                    {/* Grid Rows - Hours */}
                    {hours.map((hour) => (
                        <div
                            key={hour}
                            className="grid gap-0.5 sm:gap-1 mb-0.5 sm:mb-1"
                            style={{ gridTemplateColumns: `50px repeat(${dates.length}, minmax(55px, 1fr))` }}
                        >
                            {/* Hour Label */}
                            <div className="flex items-center justify-center text-[10px] sm:text-xs text-muted-foreground font-medium">
                                {formatHour(hour)}
                            </div>

                            {/* Slots for each day */}
                            {dates.map((_, dayIndex) => {
                                const slotId = createSlotId(dayIndex, hour);
                                const isSelected = selectedSlots.includes(slotId);
                                const slotData = heatmapData.data[slotId];
                                const isDisabled = isFrozen || !currentUserId;
                                const isPerfect = bestMatches.perfect.includes(slotId);
                                const isBestMatch = bestMatches.good.includes(slotId);

                                return (
                                    <button
                                        key={slotId}
                                        className={cn(
                                            "h-11 sm:h-12 rounded-lg transition-all duration-150 relative",
                                            "flex flex-col items-center justify-center",
                                            "active:scale-95 touch-manipulation",
                                            getSlotStyle(slotId, isSelected),
                                            isDisabled && "cursor-not-allowed opacity-50",
                                            !isDisabled && "cursor-pointer hover:opacity-90"
                                        )}
                                        onMouseDown={() => handleMouseDown(slotId)}
                                        onMouseEnter={() => handleMouseEnter(slotId)}
                                        onTouchStart={(e) => handleTouchStart(slotId, e)}
                                        disabled={isDisabled}
                                        aria-label={`${formatHour(hour)}, ${slotData?.participants.join(", ") || "Henüz kimse seçmedi"}`}
                                    >
                                        {/* Selected state - show check and hour */}
                                        {isSelected && (
                                            <>
                                                <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} />
                                                <span className="text-[10px] sm:text-xs font-bold leading-none mt-0.5">
                                                    {hour.toString().padStart(2, "0")}:00
                                                </span>
                                            </>
                                        )}

                                        {/* Not selected but has participants - show count */}
                                        {!isSelected && slotData && slotData.count > 0 && (
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm sm:text-base font-bold">{slotData.count}</span>
                                                <span className="text-[8px] sm:text-[9px] opacity-75">kişi</span>
                                            </div>
                                        )}

                                        {/* Perfect match badge */}
                                        {isPerfect && !isSelected && (
                                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                                                <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                                            </div>
                                        )}

                                        {/* Best match badge */}
                                        {isBestMatch && !isSelected && (
                                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                                                <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
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
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Senin seçimin</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-green-500 ring-2 ring-green-300" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Herkes uygun</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-green-300 dark:bg-green-600" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Çoğunluk</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-800" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Az kişi</span>
                </div>
            </div>

            {/* Help text */}
            {!currentUserId && (
                <p className="text-center text-xs text-muted-foreground mt-3 p-2 rounded-lg bg-muted/50">
                    Seçim yapmak için önce ismini seç
                </p>
            )}

            {currentUserId && selectedSlots.length > 0 && (
                <p className="text-center text-xs text-blue-600 dark:text-blue-400 mt-3 font-medium">
                    {selectedSlots.length} saat seçtiniz • Tekrar tıklayarak kaldırabilirsiniz
                </p>
            )}
        </div>
    );
}
