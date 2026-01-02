"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ParticipantInput } from "@/components/participant-input";
import { createMeetingAction } from "@/actions";
import { useCurrentUser } from "@/store";
import {
    Loader2,
    Calendar as CalendarIcon,
    Users,
    Clock,
    Sparkles,
    ArrowRight,
    PartyPopper,
    Info,
    CheckCircle2
} from "lucide-react";
import type { DateRange } from "react-day-picker";

export function CreateMeetingForm() {
    const router = useRouter();
    const { saveAdminToken } = useCurrentUser();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [participants, setParticipants] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfWeek(new Date(), { weekStartsOn: 1 }),
        to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    });
    const [allowGuest, setAllowGuest] = useState(true);
    const [startHour, setStartHour] = useState(9);
    const [endHour, setEndHour] = useState(22);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title.trim()) {
            setError("Lütfen bir başlık girin");
            return;
        }
        if (participants.length === 0) {
            setError("En az bir katılımcı ekleyin");
            return;
        }
        if (!dateRange?.from) {
            setError("Lütfen tarih seçin");
            return;
        }

        setIsLoading(true);

        try {
            const dates: string[] = [];
            let currentDate = dateRange.from;
            const endDate = dateRange.to || dateRange.from;

            while (currentDate <= endDate) {
                dates.push(format(currentDate, "yyyy-MM-dd"));
                currentDate = addDays(currentDate, 1);
            }

            const result = await createMeetingAction({
                title: title.trim(),
                description: description.trim() || undefined,
                dates,
                participantNames: participants,
                allowGuest,
                startHour,
                endHour,
            });

            if (!result.success) {
                setError(result.error);
                return;
            }

            saveAdminToken(result.data.adminToken);
            router.push(`/m/${result.data.meetingId}`);
        } catch (err) {
            setError("Bir hata oluştu. Lütfen tekrar deneyin.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate selected days count
    const selectedDaysCount = dateRange?.from && dateRange?.to
        ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : dateRange?.from ? 1 : 0;

    // Format date range for display
    const dateRangeText = dateRange?.from
        ? dateRange.to
            ? `${format(dateRange.from, "d MMM", { locale: tr })} - ${format(dateRange.to, "d MMM", { locale: tr })}`
            : format(dateRange.from, "d MMMM yyyy", { locale: tr })
        : "Tarih seçilmedi";

    return (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Header - Mobile optimized */}
            <div className="text-center p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border border-primary/20">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl gradient-primary mb-3 shadow-glow">
                    <PartyPopper className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gradient">Yeni Buluşma Oluştur</h2>
                <p className="text-sm text-muted-foreground mt-1">3 adımda hazır, 30 saniye sürer</p>
            </div>

            {/* Step 1: Title & Description */}
            <SectionCard
                step={1}
                title="Ne için buluşuyorsunuz?"
                icon={<Sparkles className="w-5 h-5" />}
                color="purple"
                hint="Kısa ve açıklayıcı bir isim verin"
            >
                <div className="space-y-3">
                    <Input
                        id="title"
                        placeholder="Örn: Haftalık Kahvaltı, Futbol Maçı..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isLoading}
                        className="h-12 sm:h-14 text-base sm:text-lg bg-white dark:bg-background border-2 border-purple-200 dark:border-purple-900 focus:border-purple-500 focus:ring-purple-500/20 rounded-xl placeholder:text-muted-foreground/60"
                    />
                    <Input
                        id="description"
                        placeholder="Açıklama ekle (isteğe bağlı)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isLoading}
                        className="h-11 text-sm bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 focus:border-purple-400 rounded-xl"
                    />
                </div>
            </SectionCard>

            {/* Step 2: Participants */}
            <SectionCard
                step={2}
                title="Kimler katılacak?"
                icon={<Users className="w-5 h-5" />}
                color="blue"
                hint="İsimleri yazıp Enter'a basın"
                badge={participants.length > 0 ? `${participants.length} kişi` : undefined}
            >
                <div className="space-y-3">
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-3 border-2 border-blue-200 dark:border-blue-900">
                        <ParticipantInput
                            value={participants}
                            onChange={setParticipants}
                            placeholder="İsim yazın ve Enter'a basın..."
                        />
                    </div>

                    <label className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border border-teal-200 dark:border-teal-800 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]">
                        <input
                            type="checkbox"
                            checked={allowGuest}
                            onChange={(e) => setAllowGuest(e.target.checked)}
                            className="w-5 h-5 mt-0.5 rounded border-teal-300 text-teal-600 focus:ring-teal-500"
                            disabled={isLoading}
                        />
                        <div className="flex-1">
                            <span className="text-sm font-semibold text-teal-800 dark:text-teal-200">Sonradan katılım izni</span>
                            <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">Listede olmayan kişiler de katılım isteği gönderebilir</p>
                        </div>
                    </label>
                </div>
            </SectionCard>

            {/* Step 3: Date & Time - Combined and clearer */}
            <SectionCard
                step={3}
                title="Ne zaman müsaitsiniz?"
                icon={<CalendarIcon className="w-5 h-5" />}
                color="green"
                hint="Hangi günler ve saatler arasında müsaitlik sorulsun?"
            >
                <div className="space-y-4">
                    {/* Date Selection with preview */}
                    <div className="bg-green-50/50 dark:bg-green-950/20 rounded-xl p-3 sm:p-4 border-2 border-green-200 dark:border-green-900">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-green-800 dark:text-green-200">📅 Tarih Aralığı</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 font-medium">
                                {selectedDaysCount} gün seçili
                            </span>
                        </div>

                        {/* Selected dates preview */}
                        <div className="mb-3 p-2 rounded-lg bg-white dark:bg-background border border-green-200 dark:border-green-800">
                            <p className="text-center font-semibold text-green-700 dark:text-green-300">{dateRangeText}</p>
                        </div>

                        <div className="flex justify-center">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={1}
                                disabled={{ before: new Date() }}
                                className="rounded-lg border-0 scale-[0.95] sm:scale-100"
                            />
                        </div>

                        <p className="text-xs text-center text-green-600 dark:text-green-400 mt-2 flex items-center justify-center gap-1">
                            <Info className="w-3 h-3" />
                            Başlangıç ve bitiş gününe tıklayın
                        </p>
                    </div>

                    {/* Time Selection - More intuitive */}
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-3 sm:p-4 border-2 border-amber-200 dark:border-amber-900">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">⏰ Saat Aralığı</span>
                        </div>

                        <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                            Katılımcılara hangi saatler arasında müsaitlik sorulacak?
                        </p>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex-1">
                                <label className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1 block">Başlangıç</label>
                                <select
                                    value={startHour}
                                    onChange={(e) => setStartHour(parseInt(e.target.value))}
                                    className="w-full h-12 px-3 text-lg font-semibold rounded-xl bg-white dark:bg-background border-2 border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-center"
                                    disabled={isLoading}
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>
                                            {i.toString().padStart(2, "0")}:00
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col items-center pt-5">
                                <div className="w-6 h-0.5 bg-amber-300 dark:bg-amber-700 rounded-full" />
                                <span className="text-xs text-amber-500 mt-1">arası</span>
                            </div>

                            <div className="flex-1">
                                <label className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1 block">Bitiş</label>
                                <select
                                    value={endHour}
                                    onChange={(e) => setEndHour(parseInt(e.target.value))}
                                    className="w-full h-12 px-3 text-lg font-semibold rounded-xl bg-white dark:bg-background border-2 border-amber-300 dark:border-amber-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-center"
                                    disabled={isLoading}
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i + 1}>
                                            {(i + 1).toString().padStart(2, "0")}:00
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-3 p-2 rounded-lg bg-amber-100/50 dark:bg-amber-900/30 text-center">
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                {endHour - startHour} saatlik dilimler gösterilecek
                            </p>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-2 border-red-200 dark:border-red-800">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* Submit - Large and prominent for mobile */}
            <Button
                type="submit"
                size="lg"
                className="w-full h-14 sm:h-16 text-base sm:text-lg font-bold gradient-primary hover:opacity-90 transition-all shadow-glow rounded-2xl"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Oluşturuluyor...
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Linki Oluştur ve Paylaş
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                )}
            </Button>
        </form>
    );
}

// Section Card Component
function SectionCard({
    step,
    title,
    icon,
    color,
    hint,
    badge,
    children
}: {
    step: number;
    title: string;
    icon: React.ReactNode;
    color: "purple" | "blue" | "green";
    hint?: string;
    badge?: string;
    children: React.ReactNode;
}) {
    const colorClasses = {
        purple: {
            bg: "bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30",
            border: "border-purple-200 dark:border-purple-800",
            step: "bg-purple-600 text-white",
            icon: "text-purple-600 dark:text-purple-400",
            title: "text-purple-900 dark:text-purple-100",
        },
        blue: {
            bg: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
            border: "border-blue-200 dark:border-blue-800",
            step: "bg-blue-600 text-white",
            icon: "text-blue-600 dark:text-blue-400",
            title: "text-blue-900 dark:text-blue-100",
        },
        green: {
            bg: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
            border: "border-green-200 dark:border-green-800",
            step: "bg-green-600 text-white",
            icon: "text-green-600 dark:text-green-400",
            title: "text-green-900 dark:text-green-100",
        },
    };

    const classes = colorClasses[color];

    return (
        <div className={`rounded-2xl p-4 sm:p-5 border-2 ${classes.bg} ${classes.border} transition-all`}>
            <div className="flex items-start gap-3 mb-3 sm:mb-4">
                <div className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${classes.step} flex items-center justify-center font-bold text-sm shadow-md`}>
                    {step}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={classes.icon}>{icon}</span>
                        <h3 className={`font-bold text-base sm:text-lg ${classes.title}`}>{title}</h3>
                        {badge && (
                            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-white/80 dark:bg-black/30 font-medium">
                                {badge}
                            </span>
                        )}
                    </div>
                    {hint && (
                        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
}
