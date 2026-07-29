import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ogImages } from '@/components/SeoCrawlBlock'
import { TAB_KEYWORDS } from '@/lib/seo-keywords'
import { absoluteUrl } from '@/lib/site-url'

const desc =
  'Генератор анимаций для плагина TAB: волна, glow, typewriter, радуга, YAML texts + change-interval. Готовые шаблоны. | TAB animation generator for Minecraft (YAML). | Генератор анімацій TAB (YAML).'

export const metadata: Metadata = {
  title: 'Генератор анимаций TAB Minecraft',
  description: desc,
  keywords: TAB_KEYWORDS,
  alternates: { canonical: absoluteUrl('/tab') },
  openGraph: {
    title: 'Генератор анимаций TAB Minecraft | RGB Minecraft',
    description: desc,
    url: absoluteUrl('/tab'),
    images: ogImages(),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Генератор анимаций TAB Minecraft | RGB Minecraft',
    description: desc,
    images: [absoluteUrl('/og.png')],
  },
}

export default function TabLayout({ children }: { children: ReactNode }) {
  return children
}
