"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consented = localStorage.getItem("cookie_consent");
        if (!consented) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookie_consent", "true");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 p-4 border-t shadow-2xl animate-in slide-in-from-bottom duration-500"
            style={{
                backgroundColor: "#ffffff",
                color: "#1e293b",
                zIndex: 2147483647,
                opacity: 1,
                bottom: 0,
                position: "fixed",
                boxShadow: "0 -4px 20px rgba(0,0,0,0.1)"
            }}
        >
            <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-foreground/80 leading-relaxed text-center sm:text-left">
                    Bu uygulama, sizi tanıyabilmek için tarayıcınıza teknik veriler (Local Storage) kaydeder.
                    <span className="font-semibold text-foreground"> Takip çerezi yoktur.</span>
                </p>
                <div className="flex items-center gap-4">
                    <Button onClick={handleAccept} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8">
                        Tamam
                    </Button>
                </div>
            </div>
        </div>
    );
}
