import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
    title: 'Kullanım Koşulları',
    description: 'OrtakZaman kullanım koşulları ve sorumluluk reddi.',
    alternates: { canonical: '/terms' },
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl pb-32">
                <h1 className="text-3xl font-bold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600" style={{ marginBottom: "2.5rem" }}>
                    Kullanım Koşulları
                </h1>

                <Card className="shadow-sm border-muted/20">
                    <CardContent className="p-6 sm:p-12 max-w-none text-foreground">

                        <section className="mb-10" style={{ marginBottom: "2.5rem" }}>
                            <h3 className="text-xl font-bold text-foreground mb-4" style={{ marginBottom: "1rem" }}>1. Hizmetin Niteliği</h3>
                            <p className="text-base leading-7" style={{ marginBottom: "1rem" }}>
                                OrtakZaman, kullanıcıların kayıt olmadan ortak zaman dilimi belirlemesini sağlayan bir araçtır.
                            </p>
                        </section>

                        <section className="mb-10" style={{ marginBottom: "2.5rem" }}>
                            <h3 className="text-xl font-bold text-foreground mb-6" style={{ marginBottom: "1.5rem" }}>2. Sorumluluk Reddi (Disclaimer)</h3>

                            <div className="pl-4 border-l-4 border-orange-500/20 ml-1 mb-8" style={{ marginBottom: "2rem" }}>
                                <h4 className="text-lg font-semibold text-foreground mb-3" style={{ marginBottom: "0.75rem" }}>İçerik Sorumluluğu</h4>
                                <p className="text-base leading-7 text-foreground/90">
                                    Oluşturulan buluşma başlıklarından ve girilen rumuzlardan tamamen kullanıcı sorumludur. Yasadışı içerik barındıran toplantılar tespit edildiğinde derhal silinir.
                                </p>
                            </div>

                            <div className="pl-4 border-l-4 border-orange-500/20 ml-1">
                                <h4 className="text-lg font-semibold text-foreground mb-3" style={{ marginBottom: "0.75rem" }}>Hizmet Garantisi</h4>
                                <p className="text-base leading-7 text-foreground/90">
                                    Hizmet "olduğu gibi" (AS-IS) sunulmaktadır. Kesintisiz çalışma garantisi verilmez. Kritik organizasyonlarınız için verilerinizi yedeklemeniz önerilir.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-foreground mb-4" style={{ marginBottom: "1rem" }}>3. Hassas Veri Uyarısı</h3>
                            <p className="text-base leading-7">
                                Kullanıcılar; toplantı başlıklarında veya isim alanlarında T.C. Kimlik No, telefon numarası, sağlık verisi, siyasi görüş gibi Özel Nitelikli Kişisel Veri veya suç oluşturabilecek nitelikte içerik girmemeyi kabul ve taahhüt eder. Tespit edilen uygunsuz içerikler derhal silinir ve gerektiğinde yasal mercilere bildirilir.
                            </p>
                        </section>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
