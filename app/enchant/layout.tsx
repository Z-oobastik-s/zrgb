import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ogImages } from '@/components/SeoCrawlBlock'
import { ENCHANT_KEYWORDS } from '@/lib/seo-keywords'
import { absoluteUrl } from '@/lib/site-url'

const desc =
  'Все ID зачарований Minecraft Java с макс. уровнем — клик копирует. | Minecraft Java enchantment registry IDs with max levels. | Усі ID зачарувань Java Edition.'

export const metadata: Metadata = {
  title: 'ID зачарований Minecraft — список',
  description: desc,
  keywords: ENCHANT_KEYWORDS,
  alternates: { canonical: absoluteUrl('/enchant') },
  openGraph: {
    title: 'ID зачарований Minecraft | RGB Minecraft',
    description: desc,
    url: absoluteUrl('/enchant'),
    images: ogImages(),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ID зачарований Minecraft | RGB Minecraft',
    description: desc,
    images: [absoluteUrl('/og.png')],
  },
}

export default function EnchantLayout({ children }: { children: ReactNode }) {
  return children
}
