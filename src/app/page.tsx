"use client";

import { useState, useEffect } from "react";
import { CreateMeetingForm } from "@/components/create-meeting-form";
import { WelcomeModal } from "@/components/welcome-modal";
import { Calendar, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("ortakzaman_welcome_seen");
    if (!seen) {
      setShowWelcome(true);
    }
  }, []);

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />

      {/* Decorative Elements - Hidden on mobile for performance */}
      <div className="hidden sm:block fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-pulse-soft" style={{ animationDelay: "1s" }} />
      </div>

      {/* Header */}
      <header className="relative container mx-auto px-4 py-4 sm:py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-gradient">OrtakZaman</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowWelcome(true)}
          className="text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 gap-2 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Yardım</span>
        </Button>
      </header>

      <main className="relative flex-1 container mx-auto px-4 flex flex-col items-center justify-center pb-8 z-10">

        {/* Main Form Container */}
        <div className="w-full max-w-[600px] animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-4">
          <div className="glass rounded-3xl p-1 shadow-2xl ring-1 ring-white/20 dark:ring-white/10">
            <div className="bg-card/80 backdrop-blur-xl rounded-[22px] p-4 sm:p-8">
              <CreateMeetingForm />
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8 opacity-60">
            Hesap açmadan, saniyeler içinde planlayın.
          </p>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative container mx-auto px-4 py-6 text-center z-10">
        <p className="text-xs text-muted-foreground/50">
          OrtakZaman &copy; {new Date().getFullYear()} — Tüm hakları saklıdır.
        </p>
      </footer>
    </div>
  );
}
