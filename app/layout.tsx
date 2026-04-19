import type { Metadata } from 'next'
import { Inter, Press_Start_2P } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'RGB Minecraft - Text Generator',
  description: 'Powerful RGB text generator for Minecraft plugins and chat',
  keywords: 'minecraft, rgb, text generator, color codes, minimessage',
  authors: [{ name: 'Zoobastiks' }],
  creator: 'Zoobastiks',
  icons: {
    icon: [{ url: faviconUrl, sizes: '64x64', type: 'image/png' }],
  },
  openGraph: {
    title: 'RGB Minecraft - Text Generator',
    description: 'Powerful RGB text generator for Minecraft plugins and chat',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={`dark ${inter.variable} ${mcPixel.variable}`}>
      <body
        className={`${inter.className} h-[100dvh] overflow-hidden bg-[#12141d] text-zinc-100 antialiased`}
      >
        {children}
      </body>
    </html>
  )
}

