import Link from "next/link";

export function Footer() {
    return (
        <footer className="w-full py-6 mt-12 border-t bg-background/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                    <span>&copy; {new Date().getFullYear()} OrtakZaman</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/privacy" className="hover:text-foreground transition-colors hover:underline">
                        Gizlilik ve Aydınlatma Metni
                    </Link>
                    <span className="text-muted-foreground/30">|</span>
                    <Link href="/terms" className="hover:text-foreground transition-colors hover:underline">
                        Kullanım Koşulları
                    </Link>
                    <span className="text-muted-foreground/30">|</span>
                    <a href="mailto:iletisim@ortakzaman.com" className="hover:text-foreground transition-colors hover:underline">
                        İletişim
                    </a>
                </div>
            </div>
        </footer>
    );
}
