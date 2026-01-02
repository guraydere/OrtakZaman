import { CreateMeetingForm } from "@/components/create-meeting-form";
import { Calendar, Users, Zap, Share2, Sparkles, Clock, Check, ChevronDown } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen gradient-hero">
      {/* Decorative Elements - Hidden on mobile for performance */}
      <div className="hidden sm:block fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl animate-pulse-soft" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-pulse-soft" style={{ animationDelay: "1s" }} />
      </div>

      {/* Header - Compact on mobile */}
      <header className="relative container mx-auto px-4 py-4 sm:py-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-gradient">OrtakZaman</span>
        </div>
      </header>

      <main className="relative container mx-auto px-4 pb-8">
        {/* Mobile: Form first, then info */}
        {/* Desktop: Side by side */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-12 items-start">

          {/* Hero Section - Compact on mobile */}
          <div className="order-2 lg:order-1 space-y-6 lg:space-y-8">
            {/* Badge - Smaller on mobile */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">Kayıt gerektirmez</span>
            </div>

            {/* Title - Responsive sizing */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]">
                Ortak müsait zamanı
                <span className="text-gradient"> saniyeler içinde</span> bulun
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground">
                Link paylaş, isim seç, zamanı işaretle.
                <span className="font-semibold text-foreground"> WhatsApp mesajlaşmalarına son!</span>
              </p>
            </div>

            {/* Features - 2x2 grid on all sizes */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <FeatureCard
                icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
                title="Hesap Açma Yok"
                color="primary"
              />
              <FeatureCard
                icon={<Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
                title="Anlık Sync"
                color="accent"
              />
              <FeatureCard
                icon={<Share2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                title="Tek Link"
                color="success"
              />
              <FeatureCard
                icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />}
                title="Isı Haritası"
                color="warning"
              />
            </div>

            {/* How it works - Collapsible on mobile, visible on desktop */}
            <details className="glass rounded-2xl overflow-hidden lg:open" open>
              <summary className="p-4 sm:p-5 cursor-pointer flex items-center justify-between hover:bg-muted/30 transition-colors lg:pointer-events-none">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg gradient-primary flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-sm sm:text-base">Nasıl Çalışır?</span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground lg:hidden transition-transform" />
              </summary>
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-2 sm:space-y-3">
                <Step number={1} text="Başlık ve katılımcıları gir" />
                <Step number={2} text="Linki WhatsApp'a yapıştır" />
                <Step number={3} text="Herkes saatlerini işaretlesin" />
                <Step number={4} text="En yeşil = Ortak müsait zaman!" highlight />
              </div>
            </details>
          </div>

          {/* Form - First on mobile */}
          <div className="order-1 lg:order-2 w-full lg:sticky lg:top-6">
            <div className="glass rounded-2xl p-1 shadow-glow">
              <div className="bg-card rounded-xl p-3 sm:p-4">
                <CreateMeetingForm />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Minimal on mobile */}
      <footer className="relative container mx-auto px-4 py-6 sm:py-8 mt-8 sm:mt-16">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 sm:pt-8 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg gradient-primary flex items-center justify-center">
              <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            </div>
            <span className="font-semibold text-sm sm:text-base">OrtakZaman</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            Grup buluşmalarını kolaylaştırır
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  color: "primary" | "accent" | "success" | "warning";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    accent: "bg-accent/20 text-accent-foreground border-accent/30",
    success: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    warning: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  };

  const iconClasses = {
    primary: "bg-primary/20 text-primary",
    accent: "bg-accent/30 text-accent-foreground",
    success: "bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-300",
    warning: "bg-amber-200 text-amber-700 dark:bg-amber-800 dark:text-amber-300",
  };

  return (
    <div className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl border backdrop-blur-sm transition-all active:scale-[0.98] ${colorClasses[color]}`}>
      <div className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center ${iconClasses[color]}`}>
        {icon}
      </div>
      <span className="font-medium text-xs sm:text-sm leading-tight">{title}</span>
    </div>
  );
}

function Step({ number, text, highlight }: { number: number; text: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl transition-all ${highlight ? "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800" : "hover:bg-muted/30"}`}>
      <span className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${highlight
          ? "bg-green-500 text-white shadow-glow-success"
          : "gradient-primary text-white shadow-sm"
        }`}>
        {highlight ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : number}
      </span>
      <span className={`text-xs sm:text-sm ${highlight ? "text-green-700 dark:text-green-300 font-medium" : "text-muted-foreground"}`}>
        {text}
      </span>
    </div>
  );
}
