"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2 } from "lucide-react";
import { formatDayHeaderTR, formatHour, parseSlotId } from "@/lib/client";
import type { PublicMeeting } from "@/types";

interface ShareButtonProps {
    meetingId: string;
}

export function ShareButton({ meetingId }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const shareUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/m/${meetingId}`
            : "";

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Copy failed:", err);
        }
    };

    return (
        <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
                <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Kopyalandı!
                </>
            ) : (
                <>
                    <Copy className="w-4 h-4 mr-2" />
                    Linki Kopyala
                </>
            )}
        </Button>
    );
}

interface SummaryExportProps {
    meeting: PublicMeeting;
    meetingId: string;
}

export function SummaryExport({ meeting, meetingId }: SummaryExportProps) {
    const [copied, setCopied] = useState(false);

    // Find best slot(s)
    const bestSlots = useMemo(() => {
        const slotCounts: Record<string, { count: number; names: string[] }> = {};
        const totalParticipants = Object.keys(meeting.participants).length;

        Object.values(meeting.participants).forEach((participant) => {
            participant.slots.forEach((slotId) => {
                if (!slotCounts[slotId]) {
                    slotCounts[slotId] = { count: 0, names: [] };
                }
                slotCounts[slotId].count++;
                slotCounts[slotId].names.push(participant.name);
            });
        });

        // Sort by count descending
        const sorted = Object.entries(slotCounts)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 3);

        return sorted.map(([slotId, data]) => {
            const parsed = parseSlotId(slotId);
            if (!parsed) return null;

            const date = meeting.schedule.dates[parsed.dayIndex];
            const { day, date: dateStr } = formatDayHeaderTR(date);
            const hour = formatHour(parsed.hour);

            return {
                slotId,
                day,
                date: dateStr,
                hour,
                count: data.count,
                total: totalParticipants,
                names: data.names,
                missingNames: Object.values(meeting.participants)
                    .filter((p) => !p.slots.includes(slotId))
                    .map((p) => p.name),
            };
        }).filter(Boolean);
    }, [meeting]);

    const generateSummary = () => {
        const shareUrl =
            typeof window !== "undefined"
                ? `${window.location.origin}/m/${meetingId}`
                : "";

        let summary = `📅 ${meeting.meta.title}\n\n`;

        if (bestSlots.length === 0) {
            summary += "❌ Henüz seçim yapılmadı\n";
        } else {
            const best = bestSlots[0];
            if (best) {
                summary += `✅ En Uygun Zaman: ${best.day} ${best.date} ${best.hour} (${best.count}/${best.total} Kişi)\n`;

                if (best.missingNames.length > 0 && best.missingNames.length <= 3) {
                    summary += `❌ Eksik: ${best.missingNames.join(", ")}\n`;
                }
            }
        }

        summary += `\n🔗 ${shareUrl}`;

        return summary;
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(generateSummary());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Copy failed:", err);
        }
    };

    return (
        <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
                <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Kopyalandı!
                </>
            ) : (
                <>
                    <Share2 className="w-4 h-4 mr-2" />
                    WhatsApp Özeti
                </>
            )}
        </Button>
    );
}
