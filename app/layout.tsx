import type { Metadata } from 'next'
import { Inter, Press_Start_2P } from 'next/font/google'
import { SiteProviders } from '@/components/SiteProviders'
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

// GitHub Pages: BASE_PATH=/repo — без префикса /icon.png уходит на github.io/icon.png (404).
const basePath = process.env.BASE_PATH ?? ''
const faviconUrl = `${basePath}/icon.png`

const rootDescription =
  'RGB Minecraft: gradient and solid RGB text for chat and configs (MiniMessage, & and § codes, JSON, BBCode), YAML or JSON string editor, enchantment and effect ID lists. EN / RU / UA. | Генератор RGB текста для Minecraft, редактор YAML/JSON, ID зачарований и эффектов. | Генератор RGB тексту Minecraft, YAML/JSON, ID зачарувань та ефектів.'

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl('/')),
  title: {
    default: 'RGB Minecraft - Text Generator',
    template: '%s | RGB Minecraft',
  },
  description: rootDescription,
  keywords: SITE_KEYWORDS,
  authors: [{ name: 'Zoobastiks' }],
  creator: 'Zoobastiks',
  icons: {
    icon: [{ url: faviconUrl, sizes: '64x64', type: 'image/png' }],
  },
  alternates: {
    canonical: absoluteUrl('/'),
    languages: {
      'ru-RU': absoluteUrl('/'),
      'en-US': absoluteUrl('/'),
      'uk-UA': absoluteUrl('/'),
      'x-default': absoluteUrl('/'),
    },
  },
  openGraph: {
    title: 'RGB Minecraft - Text Generator',
    description: rootDescription,
    url: absoluteUrl('/'),
    siteName: 'RGB Minecraft',
    locale: 'ru_RU',
    alternateLocale: ['en_US', 'uk_UA'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RGB Minecraft - Text Generator',
    description: rootDescription,
  },
  robots: {
    index: true,
    follow: true,
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
        <SiteProviders>{children}</SiteProviders>
      </body>
    </html>
  )
}
