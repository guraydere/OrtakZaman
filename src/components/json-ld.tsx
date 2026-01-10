export function JsonLd() {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'OrtakZaman',
        url: 'https://bulusma.uzmani.app',
        description: 'Grup buluşmaları için ortak müsait zamanı kolayca belirleyin. Kayıt gerektirmez, link paylaşın, herkes zamanını işaretlesin.',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'All',
        browserRequirements: 'Requires JavaScript',
        inLanguage: 'tr',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'TRY',
        },
        featureList: [
            'Hesap gerektirmez',
            'Anlık senkronizasyon',
            'Mobil uyumlu',
            'Isı haritası görselleştirme',
        ],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
    );
}
