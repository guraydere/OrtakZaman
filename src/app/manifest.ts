import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'OrtakZaman - Buluşma Planlayıcı',
        short_name: 'OrtakZaman',
        description: 'Grup buluşmaları için ortak müsait zamanı kolayca belirleyin. Kayıt gerektirmez!',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#8b5cf6',
        icons: [
            {
                src: '/favicon.webp',
                sizes: '192x192',
                type: 'image/webp',
            },
        ],
    }
}
