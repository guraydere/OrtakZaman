"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { WelcomeModal } from "@/components/welcome-modal";
import { usePageView } from "@/hooks/use-page-view";

export function SiteLayout({ children }: { children: React.ReactNode }) {
    const [showWelcome, setShowWelcome] = useState(false);
    const pathname = usePathname();

    // Track page views
    usePageView();

    // Auto-show welcome modal only on home page if not seen
    useEffect(() => {
        if (pathname === "/") {
            const seen = localStorage.getItem("ortakzaman_welcome_seen");
            if (!seen) {
                setShowWelcome(true);
            }
        }
    }, [pathname]);

    return (
        <>
            <Header onOpenHelp={() => setShowWelcome(true)} />
            <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
            {children}
        </>
    );
}
