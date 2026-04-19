'use client'

import { useState, useEffect } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { Generator } from '@/components/Generator'
import { Header } from '@/components/Header'
import type messagesRu from '../messages/ru.json'

const locales = ['ru', 'ua', 'en'] as const
type Locale = (typeof locales)[number]
type Messages = typeof messagesRu

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}

export default function HomePage() {
  const [locale, setLocale] = useState<Locale>('ru')
  const [messages, setMessages] = useState<Messages | null>(null)

  useEffect(() => {
    import(`../messages/${locale}.json`).then((mod) => {
      setMessages(mod.default)
    })
  }, [locale])

  if (!messages) {
    return (
      <div className="flex h-[100dvh] max-h-[100dvh] items-center justify-center overflow-hidden">
        <div className="text-dark-400">Loading...</div>
      </div>
    )
  }

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <main className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden">
        <Header
          currentLocale={locale}
          onLocaleChange={(next) => {
            if (isLocale(next)) setLocale(next)
          }}
        />
        <div className="mx-auto flex min-h-0 w-full max-w-[min(92rem,calc(100vw-0.75rem))] flex-1 flex-col px-2 py-1 sm:px-3 sm:py-2">
          <Generator />
        </div>
      </main>
    </NextIntlClientProvider>
  )
}

