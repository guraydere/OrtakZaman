"use client";

import { useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { formatDayHeaderTR, formatHour, createSlotId } from "@/lib/client";
import { useSlotSelection, useMeeting } from "@/store";
import type { PublicMeeting } from "@/types";

interface CalendarGridProps {
    meeting: PublicMeeting;
    currentUserId: string | null;
    onSlotUpdate: (slots: string[]) => void;
}

export function CalendarGrid({ meeting, currentUserId, onSlotUpdate }: CalendarGridProps) {
    const { selectedSlots, toggleSlot, isSelecting, setIsSelecting } = useSlotSelection();
    const { isFrozen } = useMeeting();

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

    const getSlotColor = useCallback(
        (slotId: string, isSelected: boolean) => {
            const { count } = heatmapData.data[slotId] || { count: 0 };
            const { totalParticipants } = heatmapData;
            const ratio = totalParticipants > 0 ? count / totalParticipants : 0;

            if (isSelected) {
                // Current user's selection - vibrant blue/indigo
                if (ratio === 0) return "bg-indigo-500 text-white shadow-md";
                if (ratio < 0.5) return "bg-indigo-600 text-white shadow-md";
                if (ratio < 1) return "bg-emerald-500 text-white shadow-md";
                return "bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-300";
            }

            // Heatmap colors - more vibrant
            if (count === 0) return "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700";
            if (ratio < 0.33) return "bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200";
            if (ratio < 0.66) return "bg-green-400 dark:bg-green-700 text-white";
            if (ratio < 1) return "bg-green-500 dark:bg-green-600 text-white";
            return "bg-green-600 dark:bg-green-500 text-white ring-2 ring-green-300 dark:ring-green-400 shadow-lg";
        },
        [heatmapData]
    );

    const handleSlotClick = useCallback(
        (slotId: string) => {
            if (isFrozen || !currentUserId) return;
            toggleSlot(slotId);

            const newSlots = selectedSlots.includes(slotId)
                ? selectedSlots.filter((s) => s !== slotId)
                : [...selectedSlots, slotId];
            onSlotUpdate(newSlots);
        },
        [isFrozen, currentUserId, toggleSlot, selectedSlots, onSlotUpdate]
    );

    const handleMouseDown = useCallback(
        (slotId: string) => {
            if (isFrozen || !currentUserId) return;
            setIsSelecting(true);
            handleSlotClick(slotId);
        },
        [isFrozen, currentUserId, setIsSelecting, handleSlotClick]
    );

    const handleMouseEnter = useCallback(
        (slotId: string) => {
            if (!isSelecting || isFrozen || !currentUserId) return;
            if (!selectedSlots.includes(slotId)) {
                toggleSlot(slotId);
                onSlotUpdate([...selectedSlots, slotId]);
            }
        },
        [isSelecting, isFrozen, currentUserId, selectedSlots, toggleSlot, onSlotUpdate]
    );

    const handleMouseUp = useCallback(() => {
        setIsSelecting(false);
    }, [setIsSelecting]);

    // Touch handlers for mobile
    const handleTouchStart = useCallback(
        (slotId: string, e: React.TouchEvent) => {
            if (isFrozen || !currentUserId) return;
            e.preventDefault();
            handleSlotClick(slotId);
        },
        [isFrozen, currentUserId, handleSlotClick]
    );

    return (
        <div
            className="select-none touch-pan-y"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Scrollable container for mobile */}
            <div className="overflow-x-auto -mx-2 px-2 pb-2">
                <div className="min-w-[320px]">
                    {/* Header Row - Days */}
                    <div
                        className="grid gap-0.5 sm:gap-1 mb-1"
                        style={{ gridTemplateColumns: `48px repeat(${dates.length}, minmax(40px, 1fr))` }}
                    >
                        <div className="text-[10px] sm:text-xs text-muted-foreground flex items-end justify-center pb-1">
                            Saat
                        </div>
                        {dates.map((date, index) => {
                            const { day, date: dateStr } = formatDayHeaderTR(date);
                            return (
                                <div
                                    key={date}
                                    className="text-center py-1 sm:py-2"
                                >
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
                            style={{ gridTemplateColumns: `48px repeat(${dates.length}, minmax(40px, 1fr))` }}
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

                                return (
                                    <button
                                        key={slotId}
                                        className={cn(
                                            "h-9 sm:h-10 rounded-md sm:rounded-lg transition-all duration-100 relative",
                                            "flex items-center justify-center",
                                            "text-[10px] sm:text-xs font-medium",
                                            "active:scale-95 touch-manipulation",
                                            getSlotColor(slotId, isSelected),
                                            isDisabled && "cursor-not-allowed opacity-50",
                                            !isDisabled && "cursor-pointer"
                                        )}
                                        onMouseDown={() => handleMouseDown(slotId)}
                                        onMouseEnter={() => handleMouseEnter(slotId)}
                                        onTouchStart={(e) => handleTouchStart(slotId, e)}
                                        disabled={isDisabled}
                                        aria-label={`${formatHour(hour)}, ${slotData?.participants.join(", ") || "Henüz kimse seçmedi"}`}
                                    >
                                        {/* Show count for slots with participants */}
                                        {slotData && slotData.count > 0 && !isSelected && (
                                            <span className="opacity-80">{slotData.count}</span>
                                        )}
                                        {/* Checkmark for selected */}
                                        {isSelected && (
                                            <span>✓</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend - Compact for mobile */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-indigo-500 flex items-center justify-center text-white text-[8px] sm:text-[10px]">✓</div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Sen</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-green-200 dark:bg-green-800" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Az</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-green-500" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Çok</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-green-600 ring-2 ring-green-300" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Hepsi</span>
                </div>
            </div>

            {/* Help text for mobile */}
            {!currentUserId && (
                <p className="text-center text-xs text-muted-foreground mt-3 p-2 rounded-lg bg-muted/50">
                    Seçim yapmak için önce ismini seç
                </p>
            )}
        </div>
    );
}
