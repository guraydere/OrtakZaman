"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
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
    Info,
    Check
} from "lucide-react";
import type { DateRange } from "react-day-picker";

export function CreateMeetingForm() {
    const router = useRouter();
    const { saveAdminToken } = useCurrentUser();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [participants, setParticipants] = useState<string[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date()
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

            saveAdminToken(result.data.adminToken, result.data.meetingId);
            router.push(`/m/${result.data.meetingId}`);
        } catch (err) {
            setError("Bir hata oluştu. Lütfen tekrar deneyin.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const onDateSelect = (range: DateRange | undefined) => {
        if (!range?.from) {
            setDateRange(range);
            return;
        }
        const fromDate = range.from;
        const newRange = { ...range };
        if (newRange.to) {
            const diffTime = Math.abs(newRange.to.getTime() - fromDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 6) {
                newRange.to = addDays(fromDate, 6);
            }
        }
        setDateRange(newRange);
    };

    const selectedDaysCount = dateRange?.from && dateRange?.to
        ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : dateRange?.from ? 1 : 0;

    const dateRangeText = dateRange?.from
        ? dateRange.to
            ? `${format(dateRange.from!, "d MMM", { locale: tr })} - ${format(dateRange.to, "d MMM", { locale: tr })}`
            : format(dateRange.from!, "d MMMM yyyy", { locale: tr })
        : "Tarih seçilmedi";

    return (
        <form onSubmit={handleSubmit}>
            <div style={{
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
            }}>
                {/* Header */}
                <div style={{
                    padding: "20px",
                    color: "white",
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c026d3 100%)",
                    textAlign: "center",
                }}>
                    <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 12px",
                    }}>
                        <CalendarIcon style={{ width: "24px", height: "24px" }} />
                    </div>
                    <h2 style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>Yeni Buluşma Oluştur</h2>
                    <p style={{ fontSize: "14px", color: "rgba(199,210,254,1)", marginTop: "4px" }}>
                        3 adımda hazır, 30 saniye sürer
                    </p>
                </div>

                {/* Form Content */}
                <div style={{ backgroundColor: "#ffffff", padding: "20px" }}>
                    {/* Step 1: Title */}
                    <Section icon={<Sparkles style={{ width: "16px", height: "16px", color: "#7c3aed" }} />} title="Ne için buluşuyorsunuz?" step={1}>
                        <input
                            type="text"
                            placeholder="Örn: Haftalık Kahvaltı, Futbol Maçı..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isLoading}
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                fontSize: "16px",
                                border: "2px solid #e9d5ff",
                                borderRadius: "12px",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Açıklama (isteğe bağlı)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isLoading}
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                fontSize: "14px",
                                border: "1px solid #f3e8ff",
                                borderRadius: "10px",
                                outline: "none",
                                marginTop: "8px",
                                backgroundColor: "#faf5ff",
                                boxSizing: "border-box",
                            }}
                        />
                    </Section>

                    {/* Step 2: Participants */}
                    <Section icon={<Users style={{ width: "16px", height: "16px", color: "#3b82f6" }} />} title="Kimler katılacak?" step={2} badge={participants.length > 0 ? `${participants.length} kişi` : undefined}>
                        <div style={{ padding: "12px", backgroundColor: "#eff6ff", borderRadius: "12px", border: "2px solid #bfdbfe" }}>
                            <ParticipantInput
                                value={participants}
                                onChange={setParticipants}
                                placeholder="İsim yazın ve Enter'a basın..."
                            />
                        </div>
                        <label style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
                            padding: "12px",
                            marginTop: "12px",
                            backgroundColor: "#f0fdfa",
                            borderRadius: "12px",
                            border: "1px solid #99f6e4",
                            cursor: "pointer",
                        }}>
                            <input
                                type="checkbox"
                                checked={allowGuest}
                                onChange={(e) => setAllowGuest(e.target.checked)}
                                disabled={isLoading}
                                style={{ width: "20px", height: "20px", marginTop: "2px" }}
                            />
                            <div>
                                <span style={{ fontWeight: "600", fontSize: "14px", color: "#0f766e" }}>Sonradan katılım izni</span>
                                <p style={{ fontSize: "12px", color: "#14b8a6", margin: "2px 0 0 0" }}>Listede olmayan kişiler de katılım isteği gönderebilir</p>
                            </div>
                        </label>
                    </Section>

                    {/* Step 3: Date & Time */}
                    <Section icon={<CalendarIcon style={{ width: "16px", height: "16px", color: "#16a34a" }} />} title="Ne zaman müsaitsiniz?" step={3}>
                        {/* Date Selection */}
                        <div style={{ padding: "16px", backgroundColor: "#f0fdf4", borderRadius: "12px", border: "2px solid #86efac" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <span style={{ fontSize: "14px", fontWeight: "600", color: "#166534" }}>📅 Tarih Aralığı</span>
                                <span style={{ fontSize: "12px", padding: "4px 10px", backgroundColor: "#bbf7d0", borderRadius: "20px", color: "#166534", fontWeight: "500" }}>
                                    {selectedDaysCount} gün seçili
                                </span>
                            </div>
                            <div style={{ textAlign: "center", padding: "8px", backgroundColor: "#ffffff", borderRadius: "8px", marginBottom: "12px", fontWeight: "600", color: "#15803d" }}>
                                {dateRangeText}
                            </div>
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <Calendar
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={onDateSelect}
                                    numberOfMonths={1}
                                    disabled={{ before: new Date() }}
                                    fromDate={new Date()}
                                    toDate={addDays(new Date(), 30)}
                                    locale={tr}
                                    className="rounded-lg border-0"
                                />
                            </div>
                            <p style={{ fontSize: "11px", color: "#16a34a", textAlign: "center", marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                                <Info style={{ width: "12px", height: "12px" }} />
                                Başlangıç ve bitiş gününe tıklayın
                            </p>
                        </div>

                        {/* Time Selection */}
                        <div style={{ padding: "16px", backgroundColor: "#fffbeb", borderRadius: "12px", border: "2px solid #fcd34d", marginTop: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                                <Clock style={{ width: "14px", height: "14px", color: "#d97706" }} />
                                <span style={{ fontSize: "14px", fontWeight: "600", color: "#92400e" }}>⏰ Saat Aralığı</span>
                            </div>
                            <p style={{ fontSize: "12px", color: "#d97706", marginBottom: "12px" }}>
                                Katılımcılara hangi saatler arasında müsaitlik sorulacak?
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: "11px", color: "#92400e", fontWeight: "600", marginBottom: "4px", display: "block" }}>Başlangıç</label>
                                    <select
                                        value={startHour}
                                        onChange={(e) => setStartHour(parseInt(e.target.value))}
                                        disabled={isLoading}
                                        style={{
                                            width: "100%",
                                            padding: "12px 8px",
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            border: "2px solid #fbbf24",
                                            borderRadius: "10px",
                                            textAlign: "center",
                                            backgroundColor: "#ffffff",
                                        }}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i}>
                                                {i.toString().padStart(2, "0")}:00
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ textAlign: "center", paddingTop: "20px" }}>
                                    <div style={{ width: "20px", height: "2px", backgroundColor: "#fbbf24", borderRadius: "2px" }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: "11px", color: "#92400e", fontWeight: "600", marginBottom: "4px", display: "block" }}>Bitiş</label>
                                    <select
                                        value={endHour}
                                        onChange={(e) => setEndHour(parseInt(e.target.value))}
                                        disabled={isLoading}
                                        style={{
                                            width: "100%",
                                            padding: "12px 8px",
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            border: "2px solid #fbbf24",
                                            borderRadius: "10px",
                                            textAlign: "center",
                                            backgroundColor: "#ffffff",
                                        }}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i + 1}>
                                                {(i + 1).toString().padStart(2, "0")}:00
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginTop: "12px", padding: "8px", backgroundColor: "rgba(251,191,36,0.2)", borderRadius: "8px", textAlign: "center" }}>
                                <p style={{ fontSize: "13px", fontWeight: "600", color: "#92400e", margin: 0 }}>
                                    {endHour - startHour} saatlik dilimler gösterilecek
                                </p>
                            </div>
                        </div>
                    </Section>

                    {/* Error */}
                    {error && (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px 16px",
                            marginTop: "16px",
                            backgroundColor: "#fef2f2",
                            borderRadius: "12px",
                            border: "2px solid #fecaca",
                        }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
                            <span style={{ fontSize: "14px", fontWeight: "500", color: "#dc2626" }}>{error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: "100%",
                            padding: "18px 24px",
                            marginTop: "20px",
                            fontSize: "18px",
                            fontWeight: "700",
                            color: "#ffffff",
                            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c026d3 100%)",
                            border: "none",
                            borderRadius: "14px",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            opacity: isLoading ? 0.7 : 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            boxShadow: "0 10px 25px -5px rgba(79,70,229,0.4)",
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} />
                                Oluşturuluyor...
                            </>
                        ) : (
                            <>
                                <Check style={{ width: "20px", height: "20px" }} />
                                Linki Oluştur ve Paylaş
                                <ArrowRight style={{ width: "20px", height: "20px" }} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}

function Section({ icon, title, step, badge, children }: {
    icon: React.ReactNode;
    title: string;
    step: number;
    badge?: string;
    children: React.ReactNode;
}) {
    return (
        <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    backgroundColor: "#4f46e5",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: "700",
                }}>
                    {step}
                </div>
                {icon}
                <span style={{ fontWeight: "700", fontSize: "15px", color: "#18181b", flex: 1 }}>{title}</span>
                {badge && (
                    <span style={{ fontSize: "12px", padding: "4px 10px", backgroundColor: "#e0e7ff", borderRadius: "20px", color: "#4338ca", fontWeight: "500" }}>
                        {badge}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}
