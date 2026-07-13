'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { Header } from '@/components/Header'
import type messagesRu from '@/messages/ru.json'
import ruPkg from '@/messages/ru.json'
import enPkg from '@/messages/en.json'
import uaPkg from '@/messages/ua.json'

const locales = ['ru', 'ua', 'en'] as const
export type AppLocale = (typeof locales)[number]
type Messages = typeof messagesRu

const LOCALE_STORAGE_KEY = 'zrgb-locale'

const LOADING_TEXT: Record<AppLocale, string> = {
  ru: ruPkg.common.loading,
  ua: uaPkg.common.loading,
  en: enPkg.common.loading,
}

function documentLang(locale: AppLocale): string {
  if (locale === 'ua') return 'uk'
  return locale
}

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value)
}

function readStoredLocale(): AppLocale {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (raw && isAppLocale(raw)) return raw
  } catch {
    /* ignore */
  }
  return 'ru'
}

export function SiteProviders({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>('ru')
  const [messages, setMessages] = useState<Messages | null>(null)
  const [localeReady, setLocaleReady] = useState(false)

  useEffect(() => {
    setLocale(readStoredLocale())
    setLocaleReady(true)
  }, [])

  useEffect(() => {
    if (!localeReady) return
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    } catch {
      /* ignore */
    }
  }, [locale, localeReady])

  useEffect(() => {
    if (!localeReady) return
    void import(`../messages/${locale}.json`).then((mod) => {
      setMessages(mod.default)
    })
  }, [locale, localeReady])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = documentLang(locale)
  }, [locale])

  if (!messages) {
    return (
      <div className="flex h-[100dvh] max-h-[100dvh] items-center justify-center overflow-hidden">
        <div className="text-zinc-500">{LOADING_TEXT[locale]}</div>
      </div>
    )
  }

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden">
        <Header
          currentLocale={locale}
          onLocaleChange={(next) => {
            if (isAppLocale(next)) setLocale(next)
          }}
        />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </NextIntlClientProvider>
  )
}
