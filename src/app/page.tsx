"use client";

import { CreateMeetingForm } from "@/components/create-meeting-form";

export default function Home() {
  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Decorative Elements - Hidden on mobile for performance */}
      <div className="hidden sm:block fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-pulse-soft" style={{ animationDelay: "1s" }} />
      </div>

      <main className="relative flex-1 container mx-auto px-4 flex flex-col items-center justify-start pb-8 z-10" style={{ paddingTop: "40px" }}>

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
    </div>
  );
}
