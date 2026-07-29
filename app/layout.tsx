import type { Metadata } from 'next'
import { Inter, Press_Start_2P } from 'next/font/google'
import { SiteProviders } from '@/components/SiteProviders'
import { ogImages } from '@/components/SeoCrawlBlock'
import { SITE_KEYWORDS } from '@/lib/seo-keywords'
import { websiteJsonLd } from '@/lib/seo-jsonld'
import { absoluteUrl } from '@/lib/site-url'
import { THEME_BOOT_SCRIPT } from '@/lib/theme'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-ui',
})

const mcPixel = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
})

const basePath = process.env.BASE_PATH ?? ''
const faviconUrl = `${basePath}/icon.png`

const rootDescription =
  'Генератор RGB и градиента Minecraft: MiniMessage, коды &/§, JSON, MOTD, ники, lore. TAB-анимации, символы, ID зачарований и эффектов, настройки сервера. Бесплатно, EN/RU/UA. | Free Minecraft RGB gradient text generator, TAB YAML animations, Unicode symbols, enchant/effect IDs. | Генератор RGB/градієнта Minecraft, TAB, символи, ID зачарувань і ефектів.'

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl('/')),
  title: {
    default: 'RGB Minecraft — генератор градиента и цветного текста',
    template: '%s | RGB Minecraft',
  },
  description: rootDescription,
  keywords: SITE_KEYWORDS,
  authors: [{ name: 'Zoobastiks' }],
  creator: 'Zoobastiks',
  category: 'games',
  icons: {
    icon: [{ url: faviconUrl, sizes: 'any', type: 'image/png' }],
  },
  alternates: {
    canonical: absoluteUrl('/'),
    languages: {
      'x-default': absoluteUrl('/'),
      ru: absoluteUrl('/'),
      en: absoluteUrl('/'),
      uk: absoluteUrl('/'),
    },
  },
  openGraph: {
    title: 'RGB Minecraft — генератор градиента и цветного текста',
    description: rootDescription,
    url: absoluteUrl('/'),
    siteName: 'RGB Minecraft',
    locale: 'ru_RU',
    alternateLocale: ['en_US', 'uk_UA'],
    type: 'website',
    images: ogImages(),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RGB Minecraft — генератор градиента и цветного текста',
    description: rootDescription,
    images: [absoluteUrl('/og.png')],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`dark ${inter.variable} ${mcPixel.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body
        className={`${inter.className} h-[100dvh] overflow-hidden bg-surface text-fg antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd()),
          }}
        />
        <noscript>
          <div>
            <h1>RGB Minecraft — Zoobastiks</h1>
            <p>{rootDescription}</p>
            <ul>
              <li>
                <a href={absoluteUrl('/')}>Генератор RGB</a>
              </li>
              <li>
                <a href={absoluteUrl('/tab')}>TAB анимации</a>
              </li>
              <li>
                <a href={absoluteUrl('/enchant')}>Зачарования</a>
              </li>
              <li>
                <a href={absoluteUrl('/effects')}>Эффекты</a>
              </li>
              <li>
                <a href={absoluteUrl('/symbols')}>Символы</a>
              </li>
              <li>
                <a href={absoluteUrl('/server')}>Сервер</a>
              </li>
            </ul>
          </div>
        </noscript>
        <SiteProviders>{children}</SiteProviders>
      </body>
    </html>
  )
}
