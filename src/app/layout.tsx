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
  metadataBase: new URL('https://bulusma.uzmani.app'),
  title: {
    default: "OrtakZaman - Ortak Müsait Zamanı Bul",
    template: "%s | OrtakZaman",
  },
  description:
    "Grup buluşmaları için ortak müsait zamanı hızlıca belirleyin. Kayıt gerektirmez, link paylaşın, herkes zamanını işaretlesin.",
  keywords: ["buluşma planlama", "müsaitlik", "takvim", "grup buluşma", "zaman bulma", "toplantı planlama", "ortak zaman"],
  authors: [{ name: "OrtakZaman" }],
  creator: "OrtakZaman",
  publisher: "OrtakZaman",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: "/favicon.webp",
    shortcut: "/favicon.webp",
    apple: "/favicon.webp",
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "OrtakZaman - Ortak Müsait Zamanı Bul",
    description: "Link paylaş, isim seç, zamanı işaretle. Kayıt gerektirmez!",
    type: "website",
    url: 'https://bulusma.uzmani.app',
    siteName: 'OrtakZaman',
    locale: 'tr_TR',
    images: [
      {
        url: '/ortakzaman_title.webp',
        width: 2400,
        height: 1260,
        alt: 'OrtakZaman - Buluşma Planlayıcı',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OrtakZaman - Ortak Müsait Zamanı Bul',
    description: 'Link paylaş, isim seç, zamanı işaretle. Kayıt gerektirmez!',
    images: ['/ortakzaman_title.webp'],
  },
};


import { CookieBanner } from "@/components/cookie-banner";
import { Footer } from "@/components/footer";
import { SiteLayout } from "@/components/site-layout";
import { JsonLd } from "@/components/json-ld";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <JsonLd />
      </head>
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
