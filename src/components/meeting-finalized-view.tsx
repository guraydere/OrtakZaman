"use client";

import { Meeting, PublicMeeting } from "@/types/meeting";
import { formatDayHeaderTR, formatHour } from "@/lib/date-utils";
import { Check, X, Calendar, Clock, PartyPopper, CalendarPlus, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MeetingFinalizedViewProps {
    meeting: Meeting | PublicMeeting;
    finalizedSlotId: string;
}

export function MeetingFinalizedView({ meeting, finalizedSlotId }: MeetingFinalizedViewProps) {
    const [dayIndexStr, hourStr] = finalizedSlotId.split("_");
    const dayIndex = parseInt(dayIndexStr.replace("d", ""));
    const hour = parseInt(hourStr.replace("h", ""));

    const dateStr = meeting.schedule.dates[dayIndex];
    const { day, date } = formatDayHeaderTR(dateStr);

    // Find participants
    const participants = Object.values(meeting.participants);
    const attendees = participants.filter(p => p.slots.includes(finalizedSlotId));
    const absentees = participants.filter(p => !p.slots.includes(finalizedSlotId));

    // Date Helper for Calendar Links
    const getEventDetails = () => {
        // dateStr is usually YYYY-MM-DD
        // Create date object
        const startDate = new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:00:00`);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

        return { startDate, endDate };
    };

    const handleGoogleCalendar = () => {
        const { startDate, endDate } = getEventDetails();

        const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const params = new URLSearchParams({
            action: "TEMPLATE",
            text: meeting.meta.title,
            details: meeting.meta.description || "",
            dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
        });

        window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank");
    };

    const handleDownloadICS = () => {
        const { startDate, endDate } = getEventDetails();
        const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//OrtakZaman//Meeting//TR",
            "BEGIN:VEVENT",
            `UID:${meeting.id}-${finalizedSlotId}@ortakzaman.com`,
            `DTSTAMP:${formatDate(new Date())}`,
            `DTSTART:${formatDate(startDate)}`,
            `DTEND:${formatDate(endDate)}`,
            `SUMMARY:${meeting.meta.title}`,
            `DESCRIPTION:${meeting.meta.description || ""}`,
            "END:VEVENT",
            "END:VCALENDAR"
        ].join("\r\n");

        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${meeting.meta.title.replace(/\s+/g, "_")}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 animate-in fade-in duration-500 pb-20">
            <div className="w-full max-w-3xl space-y-8">

                {/* Header Section */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4 shadow-lg ring-8 ring-emerald-50 dark:ring-emerald-950/50 animate-bounce-slow">
                        <PartyPopper className="w-10 h-10" />
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                        {meeting.meta.title}
                    </h1>

                    {meeting.meta.description && (
                        <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                            {meeting.meta.description}
                        </p>
                    )}
                </div>

                {/* Main Result Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-border/50 overflow-hidden">
                    {/* Date/Time Banner */}
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-8 sm:p-10 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-10"></div>
                        <div className="uppercase tracking-widest text-xs font-bold text-indigo-100 mb-4 relative z-10">
                            Kesinleşen Tarih
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 relative z-10">
                            <div className="flex items-center gap-4">
                                <Calendar className="w-8 h-8 text-indigo-200" />
                                <span className="text-3xl sm:text-4xl font-bold">{day}, {date}</span>
                            </div>
                            <div className="hidden sm:block w-px h-16 bg-white/20" />
                            <div className="flex items-center gap-4">
                                <Clock className="w-8 h-8 text-indigo-200" />
                                <span className="text-4xl sm:text-5xl font-black tracking-widest">{formatHour(hour)}</span>
                            </div>
                        </div>

                        {/* Add to Calendar Actions */}
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 relative z-10">
                            <Button
                                variant="secondary"
                                className="bg-white/10 hover:bg-white/20 text-white border-white/10"
                                onClick={handleGoogleCalendar}
                            >
                                <CalendarPlus className="w-4 h-4 mr-2" />
                                Google Takvim
                            </Button>
                            <Button
                                variant="secondary"
                                className="bg-white/10 hover:bg-white/20 text-white border-white/10"
                                onClick={handleDownloadICS}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                .ICS İndir (Outlook/Apple)
                            </Button>
                        </div>
                    </div>

                    {/* Participants Lists */}
                    <div className="p-8 grid md:grid-cols-2 gap-8 md:divide-x dark:divide-slate-800">

                        {/* Attendees */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">
                                <Check className="w-4 h-4" />
                                Gelebilecekler ({attendees.length})
                            </h3>
                            <ul className="space-y-2">
                                {attendees.map((p, i) => (
                                    <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/50">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-foreground">{p.name}</span>
                                    </li>
                                ))}
                                {attendees.length === 0 && (
                                    <p className="text-sm text-muted-foreground italic">Kimse bu saate uygun değil.</p>
                                )}
                            </ul>
                        </div>

                        {/* Absentees */}
                        <div className="space-y-4">
                            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <X className="w-4 h-4" />
                                Gelemeyecekler ({absentees.length})
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {absentees.map((p, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium">
                                        {p.name}
                                    </span>
                                ))}
                                {absentees.length === 0 && (
                                    <p className="text-sm text-muted-foreground italic">Herkes katılabiliyor! 🎉</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
