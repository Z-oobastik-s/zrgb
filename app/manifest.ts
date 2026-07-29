import type { MetadataRoute } from 'next'
import { siteBasePath } from '@/lib/site-url'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  const base = siteBasePath()
  const prefix = base || ''
  return {
    name: 'RGB Minecraft — Zoobastiks',
    short_name: 'RGB Minecraft',
    description:
      'Minecraft RGB/gradient text, TAB animations, symbols, enchant & effect IDs, server configs.',
    start_url: `${prefix}/`,
    scope: `${prefix}/`,
    display: 'standalone',
    background_color: '#0d0f14',
    theme_color: '#0d0f14',
    lang: 'ru',
    icons: [
      {
        src: `${prefix}/og.png`,
        sizes: '1200x630',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
