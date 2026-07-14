import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { SYMBOLS_KEYWORDS } from '@/lib/seo-keywords'
import { absoluteUrl } from '@/lib/site-url'

const desc =
  'Unicode symbols for Minecraft nicknames, MOTD and configs. Click to copy. | Символы Unicode для ников и конфигов Minecraft. | Символи Unicode для ніків і конфігів Minecraft.'

export const metadata: Metadata = {
  title: 'Minecraft symbols',
  description: desc,
  keywords: SYMBOLS_KEYWORDS,
  alternates: { canonical: absoluteUrl('/symbols') },
  openGraph: {
    title: 'Minecraft symbols | RGB Minecraft',
    description: desc,
    url: absoluteUrl('/symbols'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Minecraft symbols | RGB Minecraft',
    description: desc,
  },
}

export default function SymbolsLayout({ children }: { children: ReactNode }) {
  return children
}
