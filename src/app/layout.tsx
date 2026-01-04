import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OrtakZaman - Ortak Müsait Zamanı Bul",
  description:
    "Grup buluşmaları için ortak müsait zamanı hızlıca belirleyin. Kayıt gerektirmez, link paylaşın, herkes zamanını işaretlesin.",
  keywords: ["buluşma planlama", "müsaitlik", "takvim", "grup buluşma", "zaman bulma"],
  icons: {
    icon: "/favicon.webp",
    shortcut: "/favicon.webp",
    apple: "/favicon.webp",
  },
  openGraph: {
    title: "OrtakZaman - Ortak Müsait Zamanı Bul",
    description: "Link paylaş, isim seç, zamanı işaretle. Kayıt gerektirmez!",
    type: "website",
  },
};

import { CookieBanner } from "@/components/cookie-banner";
import { Footer } from "@/components/footer";
import { SiteLayout } from "@/components/site-layout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SiteLayout>
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </SiteLayout>
        <CookieBanner />
      </body>
    </html>
  );
}
