import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { absoluteUrl } from '@/lib/site-url'

const desc =
  'TAB plugin animation generator: wave, typewriter, blink — YAML texts + change-interval. | Генератор анимаций для плагина TAB (YAML). | Генератор анімацій для плагіна TAB.'

export const metadata: Metadata = {
  title: 'TAB animation generator',
  description: desc,
  keywords: [
    'TAB plugin',
    'TAB animation',
    'Minecraft TAB',
    'TAB texts generator',
    'change-interval',
    'TAB YAML',
    'генератор TAB',
    'анимация TAB',
    'плагин TAB',
  ],
  alternates: { canonical: absoluteUrl('/tab') },
  openGraph: {
    title: 'TAB animation generator | RGB Minecraft',
    description: desc,
    url: absoluteUrl('/tab'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TAB animation generator | RGB Minecraft',
    description: desc,
  },
}

export default function TabLayout({ children }: { children: ReactNode }) {
  return children
}
