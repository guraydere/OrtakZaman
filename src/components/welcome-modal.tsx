"use client";

import { Check, Clock, Users, Zap, Share2, Calendar, Sparkles, ArrowRight } from "lucide-react";

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
    const handleClose = () => {
        localStorage.setItem("ortakzaman_welcome_seen", "true");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            overflow: "auto",
        }}>
            {/* Backdrop */}
            <div
                onClick={handleClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.6)",
                }}
            />

            {/* Modal */}
            <div style={{
                position: "relative",
                width: "100%",
                maxWidth: "480px",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}>
                {/* Hero */}
                <div style={{
                    padding: "20px",
                    color: "white",
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c026d3 100%)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                        <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(255,255,255,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <Calendar style={{ width: "16px", height: "16px" }} />
                        </div>
                        <span style={{ fontSize: "18px", fontWeight: "700" }}>OrtakZaman</span>
                    </div>

                    <h2 style={{ fontSize: "20px", fontWeight: "900", marginBottom: "8px" }}>
                        Buluşma planlamak hiç bu kadar <span style={{ color: "#fde68a" }}>kolay</span> olmamıştı.
                    </h2>
                    <p style={{ fontSize: "14px", color: "rgba(199,210,254,1)" }}>
                        Tek link ile herkesin müsait zamanını bulun.
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "16px" }}>
                        <Badge icon={<Users style={{ width: "12px", height: "12px" }} />} text="Hesap Yok" />
                        <Badge icon={<Zap style={{ width: "12px", height: "12px" }} />} text="Anlık Sync" />
                        <Badge icon={<Share2 style={{ width: "12px", height: "12px" }} />} text="Tek Link" />
                        <Badge icon={<Sparkles style={{ width: "12px", height: "12px" }} />} text="Ücretsiz" />
                    </div>
                </div>

                {/* Steps */}
                <div style={{ padding: "20px", backgroundColor: "#ffffff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                        <Clock style={{ width: "16px", height: "16px", color: "#4f46e5" }} />
                        <span style={{ fontWeight: "700", color: "#18181b" }}>Nasıl Çalışır?</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                        <Step n={1} title="Başlık gir" desc="Katılımcıları ekle" />
                        <Step n={2} title="Linki paylaş" desc="Grubuna gönder" />
                        <Step n={3} title="Zamanı bul" desc="En yeşil = ortak zaman!" last />
                    </div>

                    {/* Button */}
                    <button
                        onClick={handleClose}
                        style={{
                            width: "100%",
                            padding: "16px 24px",
                            backgroundColor: "#4f46e5",
                            color: "white",
                            fontSize: "18px",
                            fontWeight: "700",
                            borderRadius: "12px",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            boxShadow: "0 10px 15px -3px rgba(79,70,229,0.3)",
                        }}
                    >
                        Devam Et
                        <ArrowRight style={{ width: "20px", height: "20px" }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "12px",
            fontWeight: "500",
            color: "white",
        }}>
            {icon}
            <span>{text}</span>
        </div>
    );
}

function Step({ n, title, desc, last }: { n: number; title: string; desc: string; last?: boolean }) {
    return (
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "700",
                backgroundColor: last ? "#4f46e5" : "#e0e7ff",
                color: last ? "white" : "#4338ca",
                flexShrink: 0,
            }}>
                {last ? <Check style={{ width: "12px", height: "12px" }} /> : n}
            </div>
            <div>
                <span style={{ fontWeight: "600", fontSize: "14px", color: "#18181b" }}>{title}</span>
                <span style={{ fontSize: "12px", color: "#71717a", marginLeft: "4px" }}>{desc}</span>
            </div>
        </div>
    );
}
