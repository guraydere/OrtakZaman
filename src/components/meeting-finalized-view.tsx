import { PublicMeeting } from "@/types";
import { formatDayHeaderTR, formatHour } from "@/lib/date-utils";
import { Check, X, Calendar, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeetingFinalizedViewProps {
    meeting: PublicMeeting;
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

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-border w-full max-w-md overflow-hidden relative">
                {/* Confetti effect background (optional, simple gradient for now) */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-10" />

                <div className="p-6 sm:p-8 relative">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-2">
                        Toplantı Kesinleşti!
                    </h2>
                    <p className="text-center text-muted-foreground mb-8">
                        Harika! Ortak zaman belirlendi.
                    </p>

                    {/* Date & Time Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-8 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-center gap-3 text-lg font-medium mb-1">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            <span>{day}, {date}</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                            <Clock className="w-8 h-8" />
                            <span>{formatHour(hour)}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Attendees */}
                        <div>
                            <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                Katılanlar ({attendees.length})
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {attendees.map((p, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm font-medium border border-emerald-100 dark:border-emerald-800"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        {p.name}
                                    </span>
                                ))}
                                {attendees.length === 0 && (
                                    <span className="text-sm text-muted-foreground italic pl-2">Kimse uygun değil mi? 🤔</span>
                                )}
                            </div>
                        </div>

                        {/* Absentees */}
                        {absentees.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                                    Uygun Olmayanlar ({absentees.length})
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {absentees.map((p, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm border border-slate-100 dark:border-slate-700 opacity-75"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            {p.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-border text-center">
                    <p className="text-xs text-muted-foreground">
                        OrtakZaman ile planlandı 🚀
                    </p>
                </div>
            </div>
        </div>
    );
}
