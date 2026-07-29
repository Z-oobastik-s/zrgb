import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ogImages } from '@/components/SeoCrawlBlock'
import { SERVER_KEYWORDS } from '@/lib/seo-keywords'
import { absoluteUrl } from '@/lib/site-url'

const desc =
  'Панель настроек Minecraft-сервера: server.properties, bukkit.yml, spigot.yml, Paper — с пояснениями. | Minecraft server config editor (Paper/Spigot). | Редактор конфігів сервера Minecraft (Paper/Spigot).'

export const metadata: Metadata = {
  title: 'Настройки сервера Minecraft — панель',
  description: desc,
  keywords: SERVER_KEYWORDS,
  alternates: { canonical: absoluteUrl('/server') },
  openGraph: {
    title: 'Настройки сервера Minecraft | RGB Minecraft',
    description: desc,
    url: absoluteUrl('/server'),
    images: ogImages(),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Настройки сервера Minecraft | RGB Minecraft',
    description: desc,
    images: [absoluteUrl('/og.png')],
  },
}

export default function ServerLayout({ children }: { children: ReactNode }) {
  return children
}
