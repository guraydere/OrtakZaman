"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, isSaturday, nextSaturday } from "date-fns";
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
    Check,
    X
} from "lucide-react";

type DatePreset = "today" | "weekend" | "3days" | "5days" | "7days" | "custom";
type EditingDate = "start" | "end" | null;

export function CreateMeetingForm() {
    const router = useRouter();
    const { saveAdminToken } = useCurrentUser();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [participants, setParticipants] = useState<string[]>([]);
    const [selectedPreset, setSelectedPreset] = useState<DatePreset>("3days");
    const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
    const [customEndDate, setCustomEndDate] = useState<Date>(addDays(new Date(), 2));
    const [editingDate, setEditingDate] = useState<EditingDate>(null);
    const [allowGuest, setAllowGuest] = useState(true);
    const [startHour, setStartHour] = useState(9);
    const [endHour, setEndHour] = useState(22);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate dates based on preset
    const getDateRange = (): { from: Date; to: Date } => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (selectedPreset) {
            case "today":
                return { from: today, to: today };
            case "weekend": {
                let saturday = today;
                if (!isSaturday(today)) {
                    saturday = nextSaturday(today);
                }
                const sunday = addDays(saturday, 1);
                return { from: saturday, to: sunday };
            }
            case "3days":
                return { from: today, to: addDays(today, 2) };
            case "5days":
                return { from: today, to: addDays(today, 4) };
            case "7days":
                return { from: today, to: addDays(today, 6) };
            case "custom":
                return { from: customStartDate, to: customEndDate };
            default:
                return { from: today, to: addDays(today, 2) };
        }
    };

    const dateRange = getDateRange();
    const selectedDaysCount = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const dateRangeText = dateRange.from.getTime() === dateRange.to.getTime()
        ? format(dateRange.from, "d MMMM yyyy", { locale: tr })
        : `${format(dateRange.from, "d MMM", { locale: tr })} - ${format(dateRange.to, "d MMM", { locale: tr })}`;

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

        setIsLoading(true);

        try {
            const dates: string[] = [];
            let currentDate = dateRange.from;

            while (currentDate <= dateRange.to) {
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

    const presets: { key: DatePreset; label: string }[] = [
        { key: "today", label: "Bugün" },
        { key: "weekend", label: "Hafta Sonu" },
        { key: "3days", label: "3 Gün" },
        { key: "5days", label: "5 Gün" },
        { key: "7days", label: "7 Gün" },
    ];

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;

        if (editingDate === "start") {
            setCustomStartDate(date);
            if (date > customEndDate) {
                setCustomEndDate(date);
            }
            setEditingDate(null);
        } else if (editingDate === "end") {
            if (date >= customStartDate) {
                setCustomEndDate(date);
            }
            setEditingDate(null);
        }
    };

    return (
        <>
            {/* Date Picker Modal */}
            {editingDate && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 100,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "16px",
                    }}
                >
                    {/* Backdrop */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: "rgba(0,0,0,0.5)",
                        }}
                        onClick={() => setEditingDate(null)}
                    />

                    {/* Modal */}
                    <div style={{
                        position: "relative",
                        backgroundColor: "#ffffff",
                        borderRadius: "16px",
                        padding: "20px",
                        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                        maxWidth: "350px",
                        width: "100%",
                    }}>
                        {/* Header */}
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "16px",
                            paddingBottom: "12px",
                            borderBottom: "1px solid #e5e7eb",
                        }}>
                            <span style={{ fontWeight: "700", fontSize: "16px", color: "#166534" }}>
                                {editingDate === "start" ? "📅 Başlangıç Tarihi" : "📅 Bitiş Tarihi"}
                            </span>
                            <button
                                type="button"
                                onClick={() => setEditingDate(null)}
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor: "#f3f4f6",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <X style={{ width: "18px", height: "18px", color: "#6b7280" }} />
                            </button>
                        </div>

                        {/* Calendar */}
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <Calendar
                                mode="single"
                                selected={editingDate === "start" ? customStartDate : customEndDate}
                                onSelect={handleDateSelect}
                                disabled={editingDate === "end"
                                    ? [{ before: customStartDate }, { after: addDays(customStartDate, 6) }]
                                    : [{ before: new Date() }, { after: addDays(new Date(), 30) }]
                                }
                                locale={tr}
                                className="rounded-lg border-0"
                            />
                        </div>
                    </div>
                </div>
            )}

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
                                    <p style={{ fontSize: "12px", color: "#14b8a6", margin: "2px 0 0 0" }}>Listede olmayan kişiler de katılabilir</p>
                                </div>
                            </label>
                        </Section>

                        {/* Step 3: Date & Time */}
                        <Section icon={<CalendarIcon style={{ width: "16px", height: "16px", color: "#16a34a" }} />} title="Ne zaman müsaitsiniz?" step={3}>
                            {/* Date Presets */}
                            <div style={{ padding: "16px", backgroundColor: "#f0fdf4", borderRadius: "12px", border: "2px solid #86efac" }}>
                                <div style={{ marginBottom: "12px" }}>
                                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#166534" }}>📅 Tarih Seçin</span>
                                </div>

                                {/* Preset Buttons */}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                                    {presets.map((preset) => (
                                        <button
                                            key={preset.key}
                                            type="button"
                                            onClick={() => setSelectedPreset(preset.key)}
                                            style={{
                                                padding: "10px 14px",
                                                borderRadius: "10px",
                                                border: selectedPreset === preset.key ? "2px solid #16a34a" : "2px solid #d1fae5",
                                                backgroundColor: selectedPreset === preset.key ? "#dcfce7" : "#ffffff",
                                                color: selectedPreset === preset.key ? "#166534" : "#6b7280",
                                                fontWeight: "600",
                                                fontSize: "13px",
                                                cursor: "pointer",
                                                transition: "all 0.15s ease",
                                            }}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Option - Compact Date Buttons */}
                                <div style={{
                                    padding: "12px",
                                    borderRadius: "10px",
                                    border: selectedPreset === "custom" ? "2px solid #16a34a" : "2px solid #d1fae5",
                                    backgroundColor: selectedPreset === "custom" ? "#dcfce7" : "#ffffff",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#166534" }}>Özel Tarih Seç</span>
                                        <span style={{ fontSize: "11px", color: "#6b7280" }}>en fazla 7 gün</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "12px" }}>
                                        {/* Start Date Button */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedPreset("custom");
                                                setEditingDate("start");
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: "12px",
                                                borderRadius: "10px",
                                                border: "2px solid #a7f3d0",
                                                backgroundColor: "#ffffff",
                                                cursor: "pointer",
                                                textAlign: "center",
                                            }}
                                        >
                                            <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>Başlangıç</div>
                                            <div style={{ fontSize: "15px", fontWeight: "700", color: "#166534" }}>
                                                {format(customStartDate, "d MMM", { locale: tr })}
                                            </div>
                                        </button>

                                        {/* Arrow */}
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <ArrowRight style={{ width: "16px", height: "16px", color: "#86efac" }} />
                                        </div>

                                        {/* End Date Button */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedPreset("custom");
                                                setEditingDate("end");
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: "12px",
                                                borderRadius: "10px",
                                                border: "2px solid #a7f3d0",
                                                backgroundColor: "#ffffff",
                                                cursor: "pointer",
                                                textAlign: "center",
                                            }}
                                        >
                                            <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px" }}>Bitiş</div>
                                            <div style={{ fontSize: "15px", fontWeight: "700", color: "#166534" }}>
                                                {format(customEndDate, "d MMM", { locale: tr })}
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Selected Date Display */}
                                <div style={{
                                    marginTop: "12px",
                                    padding: "12px 16px",
                                    backgroundColor: "#dcfce7",
                                    borderRadius: "10px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}>
                                    <span style={{ fontWeight: "700", color: "#166534", fontSize: "15px" }}>{dateRangeText}</span>
                                    <span style={{
                                        fontSize: "12px",
                                        padding: "4px 10px",
                                        backgroundColor: "#bbf7d0",
                                        borderRadius: "20px",
                                        color: "#166534",
                                        fontWeight: "500"
                                    }}>
                                        {selectedDaysCount} gün
                                    </span>
                                </div>
                            </div>

                            {/* Time Selection */}
                            <div style={{ padding: "16px", backgroundColor: "#fffbeb", borderRadius: "12px", border: "2px solid #fcd34d", marginTop: "16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                                    <Clock style={{ width: "14px", height: "14px", color: "#d97706" }} />
                                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#92400e" }}>⏰ Saat Aralığı</span>
                                </div>
                                <p style={{ fontSize: "12px", color: "#d97706", marginBottom: "12px" }}>
                                    Müsaitlik sorulacak saat aralığı
                                </p>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <div style={{ flex: 1 }}>
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
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ width: "20px", height: "2px", backgroundColor: "#fbbf24", borderRadius: "2px" }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
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
                </div >
            </form >
        </>
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
