'use client'

import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Sparkles } from 'lucide-react'

interface HeaderProps {
  currentLocale: string
  onLocaleChange: (locale: string) => void
}

export function Header({ currentLocale, onLocaleChange }: HeaderProps) {
  const t = useTranslations('common')

  return (
    <header className="z-50 shrink-0 border-b border-white/[0.06] bg-[#161922]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[min(92rem,calc(100vw-0.75rem))] items-center justify-between gap-2 px-2 py-1.5 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-5 w-5 shrink-0 text-sky-400 sm:h-6 sm:w-6" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold leading-tight text-sky-300 sm:text-base">
              {t('title')}
            </h1>
            <p className="truncate text-[10px] text-zinc-500 sm:text-xs">
              {t('subtitle')}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitcher currentLocale={currentLocale} onLocaleChange={onLocaleChange} />
          <div className="hidden text-[10px] text-zinc-500 sm:block sm:text-xs">
            {t('author')} © {t('year')}
          </div>
        </div>
      </div>
    </header>
  )
}

