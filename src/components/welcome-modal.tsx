"use client";

import { useState } from "react";
import { Check, Clock, Users, Zap, Share2, Calendar, Sparkles, X, ArrowRight } from "lucide-react";

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem("ortakzaman_welcome_seen", "true");
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col md:flex-row bg-white dark:bg-zinc-900">

                {/* Left Side: Hero / Brand */}
                <div
                    className="relative p-6 md:p-10 flex flex-col justify-between text-white overflow-hidden md:w-[45%] min-h-[280px]"
                    style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #c026d3 100%)" }}
                >
                    {/* Decorative Elements */}
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-900/40 rounded-full blur-3xl" />

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl md:text-2xl font-bold">OrtakZaman</span>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black leading-tight">
                            Toplantı planlamak hiç bu kadar{" "}
                            <span className="text-amber-200">kolay</span>{" "}
                            olmamıştı.
                        </h2>
                        <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
                            WhatsApp gruplarında kaybolan mesajlara son. Tek link ile herkesin müsait olduğu zamanı saniyeler içinde bulun.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="relative z-10 grid grid-cols-2 gap-2 mt-6">
                        <FeatureBadge icon={<Users className="w-4 h-4" />} text="Hesap Yok" />
                        <FeatureBadge icon={<Zap className="w-4 h-4" />} text="Anlık Sync" />
                        <FeatureBadge icon={<Share2 className="w-4 h-4" />} text="Tek Link" />
                        <FeatureBadge icon={<Sparkles className="w-4 h-4" />} text="Ücretsiz" />
                    </div>
                </div>

                {/* Right Side: How it Works */}
                <div
                    className="flex-1 flex flex-col p-6 md:p-10 overflow-y-auto"
                    style={{ backgroundColor: "white" }}
                >
                    <div className="flex-1 space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                                <Clock className="w-5 h-5 text-indigo-600" />
                                Nasıl Çalışır?
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">3 adımda buluşmanızı organize edin</p>
                        </div>

                        <div className="space-y-4">
                            <Step number={1} title="Başlık ve Katılımcılar" desc="Etkinlik detaylarını girin, isimleri ekleyin." />
                            <Step number={2} title="Linki Paylaş" desc="Oluşan özel linki grubunuza gönderin." />
                            <Step number={3} title="Herkes İşaretlesin" desc="En yeşil kutucuk, ortak zamanınızdır!" isLast />
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700 flex flex-col gap-4">
                        <div
                            className="flex items-center gap-2 cursor-pointer select-none"
                            onClick={() => setDontShowAgain(!dontShowAgain)}
                        >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${dontShowAgain ? "bg-indigo-600 border-indigo-600" : "border-zinc-300 dark:border-zinc-600"}`}>
                                {dontShowAgain && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">Bir daha gösterme</span>
                        </div>

                        <button
                            onClick={handleClose}
                            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            Hemen Başla
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

function FeatureBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2 text-sm font-medium text-white">
            {icon}
            <span>{text}</span>
        </div>
    );
}

function Step({ number, title, desc, isLast }: { number: number; title: string; desc: string; isLast?: boolean }) {
    return (
        <div className="flex gap-4 relative">
            {!isLast && (
                <div className="absolute left-[15px] top-10 bottom-[-16px] w-0.5 bg-indigo-100 dark:bg-indigo-900/50" />
            )}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 
                ${isLast
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300"
                }`}>
                {isLast ? <Check className="w-4 h-4" /> : number}
            </div>
            <div className="space-y-1">
                <h4 className="font-semibold text-zinc-900 dark:text-white">{title}</h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{desc}</p>
            </div>
        </div>
    );
}
