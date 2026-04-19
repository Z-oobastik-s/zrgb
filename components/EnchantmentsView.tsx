'use client'

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { MINECRAFT_ENCHANTMENTS } from '@/lib/minecraft-enchantments'
import { MinecraftEnchantmentIcon } from '@/components/MinecraftEnchantmentIcon'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'

function nameForLocale(
  row: (typeof MINECRAFT_ENCHANTMENTS)[0],
  locale: string
): string {
  if (locale === 'en') return row.names.en
  if (locale === 'ua') return row.names.ua
  return row.names.ru
}

function splitInTwo<T>(arr: T[]): [T[], T[]] {
  const mid = Math.ceil(arr.length / 2)
  return [arr.slice(0, mid), arr.slice(mid)]
}

export function EnchantmentsView() {
  const t = useTranslations('enchantPage')
  const locale = useLocale()
  const { copiedId, copy } = useCopyFeedback()

  const [colA, colB] = useMemo(
    () => splitInTwo(MINECRAFT_ENCHANTMENTS),
    []
  )

  const renderRow = (row: (typeof MINECRAFT_ENCHANTMENTS)[0]) => {
    const active = copiedId === row.id
    const label = nameForLocale(row, locale)

    return (
      <li key={row.id}>
        <button
          type="button"
          onClick={() => void copy(row.id)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-white/[0.05] sm:gap-2.5 sm:px-2.5 sm:py-1.5"
        >
          <span className="shrink-0 opacity-95">
            <MinecraftEnchantmentIcon items={row.items} />
          </span>
          <span className="min-w-0 flex-1 truncate text-xs leading-snug text-sky-200/95 sm:text-[13px]">
            {label}
          </span>
          <span
            className="shrink-0 tabular-nums text-[10px] text-zinc-500 sm:text-[11px]"
            title={t('maxLevelTitle')}
          >
            {row.max}
          </span>
          <span
            className={`max-w-[min(100%,11rem)] shrink-0 truncate rounded-md border px-1.5 py-0.5 font-mono text-[10px] sm:max-w-[13rem] sm:text-[11px] ${
              active
                ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200'
                : 'border-amber-500/25 bg-amber-500/[0.07] text-amber-200/90'
            }`}
          >
            {active ? t('copied') : row.id}
          </span>
        </button>
      </li>
    )
  }

  return (
    <section className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-2 overflow-hidden px-0 sm:gap-2.5">
      <header className="shrink-0 text-center">
        <h2 className="text-base font-semibold tracking-tight text-sky-300 sm:text-lg">
          {t('title')}
        </h2>
        <p className="text-[11px] text-zinc-500 sm:text-xs">{t('hint')}</p>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#141722] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-2 py-2 sm:px-3 sm:py-2.5">
          <div className="grid grid-cols-1 gap-x-4 gap-y-0 sm:grid-cols-2">
            <ul className="min-w-0 space-y-1">{colA.map((row) => renderRow(row))}</ul>
            <ul className="min-w-0 space-y-1">{colB.map((row) => renderRow(row))}</ul>
          </div>
        </div>
      </div>
    </section>
  )
}
