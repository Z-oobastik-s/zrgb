import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ogImages } from '@/components/SeoCrawlBlock'
import { EFFECTS_KEYWORDS } from '@/lib/seo-keywords'
import { absoluteUrl } from '@/lib/site-url'

const desc =
  'ID эффектов Minecraft для effect give и плагинов — клик копирует. | Minecraft status effect IDs for commands. | ID ефектів Minecraft для команд.'

export const metadata: Metadata = {
  title: 'ID эффектов Minecraft — список',
  description: desc,
  keywords: EFFECTS_KEYWORDS,
  alternates: { canonical: absoluteUrl('/effects') },
  openGraph: {
    title: 'ID эффектов Minecraft | RGB Minecraft',
    description: desc,
    url: absoluteUrl('/effects'),
    images: ogImages(),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ID эффектов Minecraft | RGB Minecraft',
    description: desc,
    images: [absoluteUrl('/og.png')],
  },
}

export default function EffectsLayout({ children }: { children: ReactNode }) {
  return children
}
