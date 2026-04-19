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

export const metadata: Metadata = {
  title: 'RGB Minecraft - Text Generator',
  description: 'Powerful RGB text generator for Minecraft plugins and chat',
  keywords: 'minecraft, rgb, text generator, color codes, minimessage',
  authors: [{ name: 'Zoobastiks' }],
  creator: 'Zoobastiks',
  icons: {
    icon: [{ url: '/icon.png', sizes: '64x64', type: 'image/png' }],
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
      <head>
        <meta
          httpEquiv="Cache-Control"
          content="no-cache, no-store, must-revalidate"
        />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body
        className={`${inter.className} h-[100dvh] overflow-hidden bg-[#12141d] text-zinc-100 antialiased`}
      >
        {children}
      </body>
    </html>
  )
}

