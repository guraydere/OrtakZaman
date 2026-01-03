"use client";

import { useEffect, useState } from "react";
import { formatDayHeaderTR, formatHour } from "@/lib/date-utils";
import { PublicMeeting } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Download, CheckCircle, XCircle, Users, PartyPopper, Copy, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingFinalizedViewProps {
    meeting: PublicMeeting;
    finalizedSlotId: string;
}

export function MeetingFinalizedView({ meeting, finalizedSlotId }: MeetingFinalizedViewProps) {
    const [dateInfo, setDateInfo] = useState<{ day: string; date: string; hour: string } | null>(null);

    useEffect(() => {
        if (!finalizedSlotId) return;
        const parts = finalizedSlotId.split("_");
        const dIndex = parseInt(parts[0].replace("d", ""));
        const h = parseInt(parts[1].replace("h", ""));

        if (!isNaN(dIndex) && !isNaN(h)) {
            const dateStr = meeting.schedule.dates[dIndex];
            const header = formatDayHeaderTR(dateStr);
            setDateInfo({
                day: header.day,
                date: header.date,
                hour: formatHour(h)
            });
        }
    }, [finalizedSlotId, meeting]);

    if (!dateInfo) return null;

    // Helper to generate Google Calendar Link
    const handleGoogleCalendar = () => {
        // ... (implementation same as before)
        const parts = finalizedSlotId.split("_");
        const dIndex = parseInt(parts[0].replace("d", ""));
        const h = parseInt(parts[1].replace("h", ""));
        const dateStr = meeting.schedule.dates[dIndex]; // YYYY-MM-DD

        // Construct start/end time
        // Format: YYYYMMDDTHHMMSS
        const startDateTime = `${dateStr.replace(/-/g, "")}T${h.toString().padStart(2, "0")}0000`;
        const endDateTime = `${dateStr.replace(/-/g, "")}T${(h + 1).toString().padStart(2, "0")}0000`; // Suppose 1 hour duration

        const url = new URL("https://calendar.google.com/calendar/render");
        url.searchParams.append("action", "TEMPLATE");
        url.searchParams.append("text", meeting.meta.title);
        url.searchParams.append("details", meeting.meta.description || "OrtakZaman ile planlandı.");
        url.searchParams.append("dates", `${startDateTime}/${endDateTime}`);

        window.open(url.toString(), "_blank");
    };

    // Helper to generate ICS file
    const handleDownloadICS = () => {
        const parts = finalizedSlotId.split("_");
        const dIndex = parseInt(parts[0].replace("d", ""));
        const h = parseInt(parts[1].replace("h", ""));
        const dateStr = meeting.schedule.dates[dIndex];

        const startDateTime = `${dateStr.replace(/-/g, "")}T${h.toString().padStart(2, "0")}0000`;
        const endDateTime = `${dateStr.replace(/-/g, "")}T${(h + 1).toString().padStart(2, "0")}0000`;

        const icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//OrtakZaman//Meeting//EN",
            "BEGIN:VEVENT",
            `UID:${meeting.id}@ortakzaman.com`,
            `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
            `DTSTART:${startDateTime}`,
            `DTEND:${endDateTime}`,
            `SUMMARY:${meeting.meta.title}`,
            `DESCRIPTION:${meeting.meta.description || ""}`,
            "END:VEVENT",
            "END:VCALENDAR"
        ].join("\r\n");

        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute("download", `${meeting.meta.title}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Calculate attendees
    const attendees = Object.values(meeting.participants).filter(p => p.slots.includes(finalizedSlotId));
    const absentees = Object.values(meeting.participants).filter(p => !p.slots.includes(finalizedSlotId));

    return (
        <Card className="glass overflow-hidden border-2 border-primary/20 shadow-xl">
            <div className="bg-gradient-to-b from-primary/10 to-transparent p-6 sm:p-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-bounce duration-1000">
                    <PartyPopper className="w-8 h-8 text-primary" />
                </div>

                <div className="space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        {meeting.meta.title}
                    </h2>
                    <p className="text-muted-foreground font-medium">Buluşma Kesinleşti!</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
                    <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border shadow-sm flex items-center gap-3 min-w-[200px]">
                        <Calendar className="w-6 h-6 text-primary" />
                        <div className="text-left">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Tarih</p>
                            <p className="text-lg font-bold">{dateInfo.day}, {dateInfo.date}</p>
                        </div>
                    </div>

                    <div className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border shadow-sm flex items-center gap-3 min-w-[160px]">
                        <Clock className="w-6 h-6 text-primary" />
                        <div className="text-left">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Saat</p>
                            <p className="text-lg font-bold">{dateInfo.hour}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <Button onClick={handleGoogleCalendar} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                        <Calendar className="w-4 h-4 mr-2" />
                        Google Takvime Ekle
                    </Button>
                    <Button onClick={handleDownloadICS} variant="outline" className="shadow-sm">
                        <Download className="w-4 h-4 mr-2" />
                        ICS İndir (Outlook/Apple)
                    </Button>
                </div>
            </div>

            <CardContent className="p-6 space-y-6">
                {/* Attendees List */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 font-semibold border-b border-emerald-100 pb-2">
                        <CheckCircle className="w-5 h-5" />
                        Gelebilecekler ({attendees.length})
                    </div>
                    {attendees.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {attendees.map(p => (
                                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 border border-emerald-200 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold">
                                        {p.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-foreground">{p.name}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic pl-2">Kimse uygun değil görünüyor.</p>
                    )}
                </div>

                {/* Absentees List */}
                {absentees.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-red-600 font-semibold border-b border-red-100 pb-2">
                            <XCircle className="w-5 h-5" />
                            Gelemeyecekler ({absentees.length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {absentees.map(p => (
                                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-50/50 border border-red-100 dark:bg-red-900/10 dark:border-red-900/30 opacity-70">
                                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 border border-red-200 flex items-center justify-center text-red-700 dark:text-red-300 font-bold">
                                        {p.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-foreground">{p.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
