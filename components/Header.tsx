'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ALargeSmall, FlaskConical, Settings, Sparkles, Wand2 } from 'lucide-react'

interface HeaderProps {
  currentLocale: string
  onLocaleChange: (locale: string) => void
}

function navButtonClass(active: boolean) {
  return [
    'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-medium transition-colors sm:px-2.5 sm:text-[11px]',
    active
      ? 'border-sky-500/50 bg-sky-500/15 text-sky-200 shadow-sm shadow-sky-500/10'
      : 'border-white/[0.08] bg-black/20 text-zinc-400 hover:border-white/15 hover:bg-white/[0.06] hover:text-zinc-100',
  ].join(' ')
}

export function Header({ currentLocale, onLocaleChange }: HeaderProps) {
  const t = useTranslations('common')
  const tn = useTranslations('nav')
  const path = usePathname() ?? ''
  const last = path.split('/').filter(Boolean).pop() ?? ''
  const isEnchant = last === 'enchant'
  const isEffects = last === 'effects'
  const isSymbols = last === 'symbols'
  const isServer = last === 'server'
  const isHome = !isEnchant && !isEffects && !isSymbols && !isServer

  return (
    <header className="z-50 shrink-0 border-b border-white/[0.06] bg-[#161922]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[min(92rem,calc(100vw-0.75rem))] items-center gap-1 px-2 py-1.5 sm:gap-2 sm:px-3">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-lg outline-none ring-sky-500/40 focus-visible:ring-2"
        >
          <Sparkles className="h-5 w-5 shrink-0 text-sky-400 sm:h-6 sm:w-6" />
          <div className="min-w-0 text-left">
            <span className="block truncate text-sm font-semibold leading-tight text-sky-300 sm:text-base">
              {t('title')}
            </span>
            <span className="block truncate text-[10px] text-zinc-500 sm:text-xs">
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
          <LanguageSwitcher currentLocale={currentLocale} onLocaleChange={onLocaleChange} />
          <div className="hidden text-[10px] text-zinc-500 sm:block sm:text-xs">
            {t('author')} © {t('year')}
          </div>
        </div>
      </div>
    </header>
  )
}
