import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ogImages } from '@/components/SeoCrawlBlock'
import { SYMBOLS_KEYWORDS } from '@/lib/seo-keywords'
import { absoluteUrl } from '@/lib/site-url'

const desc =
  'Символы Unicode и декоративные рамки для ников, MOTD и TAB Minecraft — клик копирует. | Unicode symbols and frames for Minecraft nicks & MOTD. | Символи та рамки для ніків і MOTD Minecraft.'

export const metadata: Metadata = {
  title: 'Символы и рамки Minecraft',
  description: desc,
  keywords: SYMBOLS_KEYWORDS,
  alternates: { canonical: absoluteUrl('/symbols') },
  openGraph: {
    title: 'Символы и рамки Minecraft | RGB Minecraft',
    description: desc,
    url: absoluteUrl('/symbols'),
    images: ogImages(),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Символы и рамки Minecraft | RGB Minecraft',
    description: desc,
    images: [absoluteUrl('/og.png')],
  },
}

export default function SymbolsLayout({ children }: { children: ReactNode }) {
  return children
}
