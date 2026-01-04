"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
    onOpenHelp: () => void;
}

export function Header({ onOpenHelp }: HeaderProps) {
    const pathname = usePathname();
    const isHome = pathname === "/";

    return (
        <header
            className={cn(
                "w-full z-50 transition-all duration-300",
                isHome
                    ? "absolute top-0 left-0 bg-transparent py-4 sm:py-6"
                    : "relative bg-white shadow-sm border-b py-3"
            )}
        >
            <div className="container mx-auto px-4 flex items-center justify-between">
                {/* Logo Area */}
                <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
                    <img
                        src="/ortakzaman_title.webp"
                        alt="Ortak Zaman"
                        className={cn("w-auto transition-all", isHome ? "h-8 sm:h-10 drop-shadow-md" : "h-6 sm:h-8")}
                    />
                </Link>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onOpenHelp}
                        className={cn(
                            "gap-2 transition-colors",
                            isHome
                                ? "text-white/90 hover:text-white hover:bg-white/10"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        )}
                    >
                        <HelpCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Yardım</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
