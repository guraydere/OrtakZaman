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

    const getSlotInfo = useCallback((slotId: string) => {
        const isMySelection = selectedSlots.includes(slotId);
        let othersCount = 0;

        Object.entries(meeting.participants).forEach(([pid, participant]) => {
            if (participant.slots.includes(slotId)) {
                if (pid !== currentUserId) {
                    othersCount++;
                }
            }
        });

        const totalCount = othersCount + (isMySelection ? 1 : 0);
        return { isMySelection, othersCount, totalCount };
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
                <div
                    className="mb-4 p-3 sm:p-4 rounded-xl border"
                    style={{
                        background: "linear-gradient(to right, #ecfdf5, #f0fdfa)",
                        borderColor: "#a7f3d0"
                    }}
                >
                    <div className="flex items-start gap-3">
                        {bestMatches.perfect.length > 0 ? (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#10b981" }}>
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#f59e0b" }}>
                                <Crown className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            {bestMatches.perfect.length > 0 ? (
                                <>
                                    <h4 className="font-bold text-sm sm:text-base" style={{ color: "#065f46" }}>
                                        🎉 Herkesin Uygun Olduğu {bestMatches.perfect.length} Saat!
                                    </h4>
                                    <p className="text-xs sm:text-sm mt-0.5" style={{ color: "#059669" }}>
                                        Koyu yeşil kutular ortak müsait zamanlardır
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h4 className="font-bold text-sm sm:text-base" style={{ color: "#92400e" }}>
                                        En İyi Eşleşme: %{participationPercent} Katılım
                                    </h4>
                                    <p className="text-xs sm:text-sm mt-0.5" style={{ color: "#d97706" }}>
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

                                const hasAnySelection = isMySelection || totalCount > 0;
                                const ratio = totalParticipants > 0 ? totalCount / totalParticipants : 0;

                                // Determine styles using inline styles to bypass Tailwind issues
                                let bgStyle = {};
                                if (totalCount > 0) {
                                    if (isPerfect || ratio >= 1) {
                                        bgStyle = { backgroundColor: "#059669", color: "white", borderColor: "#047857", borderWidth: "2px" }; // emerald-600 (Darker)
                                    } else if (ratio >= 0.66) {
                                        bgStyle = { backgroundColor: "#34d399", color: "#064e3b", borderColor: "#10b981" }; // emerald-400 (Medium)
                                    } else if (ratio >= 0.33) {
                                        bgStyle = { backgroundColor: "#a7f3d0", color: "#064e3b", borderColor: "#6ee7b7" }; // emerald-200 (Light)
                                    } else {
                                        bgStyle = { backgroundColor: "#ecfdf5", color: "#065f46", borderColor: "#a7f3d0" }; // emerald-50 (Very light)
                                    }
                                } else {
                                    bgStyle = { backgroundColor: "var(--background)", color: "#94a3b8", borderColor: "var(--border)" };
                                }

                                return (
                                    <button
                                        key={slotId}
                                        className={cn(
                                            "h-10 sm:h-11 rounded-lg transition-all duration-150 relative overflow-hidden",
                                            "active:scale-95 touch-manipulation border hover:brightness-95",
                                            isDisabled && "cursor-not-allowed opacity-50",
                                            !isDisabled && "cursor-pointer"
                                        )}
                                        style={bgStyle}
                                        onMouseDown={() => handleMouseDown(slotId)}
                                        onMouseEnter={() => handleMouseEnter(slotId)}
                                        onTouchStart={(e) => handleTouchStart(slotId, e)}
                                        disabled={isDisabled}
                                    >
                                        {/* My selection indicator */}
                                        {isMySelection && (
                                            <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-7 bg-blue-500 flex items-center justify-center z-10">
                                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                            </div>
                                        )}

                                        {/* Content */}
                                        {hasAnySelection && (
                                            <div
                                                className={cn(
                                                    "absolute inset-0 flex items-center justify-center",
                                                    isMySelection && "pl-6 sm:pl-7"
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

                                        {isPerfect && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center z-20">
                                                <Trophy className="w-3 h-3 text-emerald-600" />
                                            </div>
                                        )}

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

            {/* Legend with inline styles */}
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
                    <div className="w-6 h-6 rounded border-2 border-[#047857]" style={{ backgroundColor: "#059669" }} />
                    <span>Herkes</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded border border-[#10b981]" style={{ backgroundColor: "#34d399" }} />
                    <span>Çoğunluk</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded border border-[#6ee7b7]" style={{ backgroundColor: "#a7f3d0" }} />
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
