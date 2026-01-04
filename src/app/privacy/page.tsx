import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl pb-32">
                <h1 className="text-3xl font-bold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600" style={{ marginBottom: "2.5rem" }}>
                    Gizlilik ve Aydınlatma Metni
                </h1>

                <Card className="shadow-sm border-muted/20">
                    <CardContent className="p-6 sm:p-12 max-w-none text-foreground">
                        <p className="text-sm text-muted-foreground mb-10 block font-medium" style={{ marginBottom: "2.5rem" }}>Son Güncelleme: 04.01.2026</p>

                        <section className="mb-10" style={{ marginBottom: "2.5rem" }}>
                            <h3 className="text-xl font-bold text-foreground mb-4" style={{ marginBottom: "1rem" }}>1. Veri Sorumlusu</h3>
                            <p className="text-base leading-7 mb-4" style={{ marginBottom: "1rem" }}>
                                Bu uygulama, <strong>OrtakZaman</strong> tarafından geliştirilmiştir. Önceliğimiz, kullanıcı mahremiyetine maksimum saygı göstererek en hızlı buluşma deneyimini sunmaktır.
                            </p>
                        </section>

                        <section className="mb-10" style={{ marginBottom: "2.5rem" }}>
                            <h3 className="text-xl font-bold text-foreground mb-4" style={{ marginBottom: "1rem" }}>2. Hangi Verileri İşliyoruz ve Ne Kadar Saklıyoruz?</h3>
                            <p className="text-base leading-7 mb-6" style={{ marginBottom: "1.5rem" }}>Sistemimiz "Veri Tasarrufu" (Data Minimization) ilkesiyle çalışır.</p>

                            <div className="pl-4 border-l-4 border-primary/10 ml-1 mb-8" style={{ marginBottom: "2rem" }}>
                                <h4 className="text-lg font-semibold text-foreground mb-3" style={{ marginBottom: "0.75rem" }}>A) Toplantı Verileri (Süre: 8 Hafta)</h4>
                                <p className="text-base leading-7 text-foreground/90">
                                    Toplantı başlığı, açıklaması, seçilen tarihler ve katılımcıların girdiği isim/rumuzlar. Bu veriler, buluşma organizasyonunun sağlanabilmesi amacıyla 8 hafta saklanır ve süre sonunda sistemden kalıcı olarak silinir.
                                </p>
                            </div>

                            <div className="pl-4 border-l-4 border-primary/10 ml-1 mb-8" style={{ marginBottom: "2rem" }}>
                                <h4 className="text-lg font-semibold text-foreground mb-3" style={{ marginBottom: "0.75rem" }}>B) IP Adresleri ve Güvenlik Kayıtları (Süre: 60 Saniye)</h4>
                                <p className="text-base leading-7 mb-3 text-foreground/90" style={{ marginBottom: "0.75rem" }}>
                                    Sisteme yapılan siber saldırıları (spam, DDoS) engellemek amacıyla IP adresiniz işlenir. Ancak bu veri;
                                </p>
                                <ul className="list-disc pl-6 mb-4 space-y-2 text-base leading-7 text-foreground/90" style={{ marginBottom: "1rem" }}>
                                    <li>Doğrudan saklanmaz, kriptografik yöntemlerle geri döndürülemez şekilde özetlenir (Salted Hash).</li>
                                    <li>Oluşan bu özet veri, güvenlik kontrolü (Rate Limiting) için bellekte sadece 60 Saniye tutulur.</li>
                                    <li>60 saniyenin sonunda bu veri kendini otomatik imha eder (TTL).</li>
                                </ul>
                                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">Özetle: Geçmişe dönük IP kaydı tutmuyoruz.</p>
                            </div>

                            <div className="pl-4 border-l-4 border-primary/10 ml-1">
                                <h4 className="text-lg font-semibold text-foreground mb-3" style={{ marginBottom: "0.75rem" }}>C) Cihaz Tanımlayıcıları (Süre: Tarayıcınızı Temizleyene Kadar)</h4>
                                <p className="text-base leading-7 text-foreground/90">
                                    Tekrar giriş yapmanıza gerek kalmadan toplantılarınızı yönetebilmeniz için tarayıcınızın yerel hafızasına (Local Storage) anonim bir kimlik anahtarı (Device Token) kaydedilir. Bu veri sunucularımızda değil, sizin cihazınızda durur.
                                </p>
                            </div>
                        </section>

                        <section className="mb-10" style={{ marginBottom: "2.5rem" }}>
                            <h3 className="text-xl font-bold text-foreground mb-4" style={{ marginBottom: "1rem" }}>3. Verilerin Saklandığı Yer (Yurt Dışı Aktarımı)</h3>
                            <p className="text-base leading-7 mb-6" style={{ marginBottom: "1.5rem" }}>
                                Sunucularımız, Avrupa Birliği veri güvenliği standartlarına (GDPR) tam uyumlu olan Finlandiya (Hetzner Helsinki) veri merkezlerinde bulunmaktadır. Uygulamayı kullanarak verilerinizin Türkiye dışındaki bu güvenli sunucularda işlenmesine açık rıza göstermiş sayılırsınız.
                            </p>
                        </section>

                        <section className="mb-10" style={{ marginBottom: "2.5rem" }}>
                            <h3 className="text-xl font-bold text-foreground mb-4" style={{ marginBottom: "1rem" }}>4. Üçüncü Taraflarla Paylaşım</h3>
                            <p className="text-base leading-7 mb-6" style={{ marginBottom: "1.5rem" }}>
                                Verileriniz reklam, pazarlama veya ticari amaçlarla üçüncü kişilerle asla paylaşılmaz, satılmaz ve kiralanmaz.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-foreground mb-4" style={{ marginBottom: "1rem" }}>5. Yasal Haklarınız</h3>
                            <p className="text-base leading-7">
                                KVKK'nın 11. maddesi ve GDPR uyarınca; verilerinizin silinmesini talep etme hakkınız saklıdır. Ancak IP kayıtları 60 saniye içinde, toplantı verileri ise 8 hafta içinde zaten silindiği için, sistemimizde size ait "unutulacak" bir veri kalmayacaktır.
                            </p>
                        </section>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
