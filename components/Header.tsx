'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { ALargeSmall, FlaskConical, LayoutList, Settings, Sparkles, Wand2 } from 'lucide-react'
import type { AppTheme } from '@/lib/theme'

interface HeaderProps {
  currentLocale: string
  onLocaleChange: (locale: string) => void
  theme: AppTheme
  onThemeChange: (theme: AppTheme) => void
}

function navButtonClass(active: boolean) {
  return [
    'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium transition-colors sm:px-2.5 sm:text-[11px]',
    active
      ? 'border-sky-500/50 bg-accent-soft text-accent shadow-sm shadow-sky-500/10'
      : 'border-edge bg-muted-fill text-muted hover:border-edge-strong hover:bg-muted-hover hover:text-fg',
  ].join(' ')
}

export function Header({
  currentLocale,
  onLocaleChange,
  theme,
  onThemeChange,
}: HeaderProps) {
  const t = useTranslations('common')
  const tn = useTranslations('nav')
  const path = usePathname() ?? ''
  const last = path.split('/').filter(Boolean).pop() ?? ''
  const isEnchant = last === 'enchant'
  const isTab = last === 'tab'
  const isEffects = last === 'effects'
  const isSymbols = last === 'symbols'
  const isServer = last === 'server'
  const isHome = !isEnchant && !isTab && !isEffects && !isSymbols && !isServer

  return (
    <header className="z-50 shrink-0 border-b border-edge bg-panel/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[min(92rem,calc(100vw-0.75rem))] items-center gap-1 px-2 py-1.5 sm:gap-2 sm:px-3">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-lg outline-none ring-sky-500/40 focus-visible:ring-2"
        >
          <Sparkles className="h-5 w-5 shrink-0 text-sky-500 sm:h-6 sm:w-6" />
          <div className="min-w-0 text-left">
            <span className="block truncate text-sm font-semibold leading-tight text-accent sm:text-base">
              {t('title')}
            </span>
            <span className="block truncate text-[10px] text-muted sm:text-xs">
              {t('subtitle')}
            </span>
          </div>
        </Link>

        <nav
          className="flex min-w-0 flex-1 items-center justify-center gap-0.5 sm:gap-1"
          aria-label="Site"
        >
          <Link href="/" className={navButtonClass(isHome)} title={tn('generator')}>
            <Wand2 className="h-3 w-3 shrink-0 opacity-90" />
            <span className="max-w-[5.5rem] truncate sm:max-w-none">{tn('generator')}</span>
          </Link>
          <Link href="/tab" className={navButtonClass(isTab)} title={tn('tab')}>
            <LayoutList className="h-3 w-3 shrink-0 opacity-90" />
            <span className="max-w-[5.5rem] truncate sm:max-w-none">{tn('tab')}</span>
          </Link>
          <Link href="/enchant" className={navButtonClass(isEnchant)} title={tn('enchant')}>
            <Sparkles className="h-3 w-3 shrink-0 opacity-90" />
            <span className="max-w-[5.5rem] truncate sm:max-w-none">{tn('enchant')}</span>
          </Link>
          <Link href="/effects" className={navButtonClass(isEffects)} title={tn('effects')}>
            <FlaskConical className="h-3 w-3 shrink-0 opacity-90" />
            <span className="max-w-[5.5rem] truncate sm:max-w-none">{tn('effects')}</span>
          </Link>
          <Link href="/symbols" className={navButtonClass(isSymbols)} title={tn('symbols')}>
            <ALargeSmall className="h-3 w-3 shrink-0 opacity-90" />
            <span className="max-w-[5.5rem] truncate sm:max-w-none">{tn('symbols')}</span>
          </Link>
          <Link href="/server" className={navButtonClass(isServer)} title={tn('server')}>
            <Settings className="h-3 w-3 shrink-0 opacity-90" />
            <span className="max-w-[5.5rem] truncate sm:max-w-none">{tn('server')}</span>
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
          <LanguageSwitcher currentLocale={currentLocale} onLocaleChange={onLocaleChange} />
          <div className="hidden text-[10px] text-muted sm:block sm:text-xs">
            {t('author')} © {t('year')}
          </div>
        </div>
      </div>
    </header>
  )
}
