'use client'

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { MINECRAFT_ENCHANTMENTS } from '@/lib/minecraft-enchantments'
import { EnchantmentItemIcons } from '@/components/EnchantmentItemIcons'
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

export function EnchantmentsView() {
  const t = useTranslations('enchantPage')
  const locale = useLocale()
  const { copiedId, copy } = useCopyFeedback()

  const [left, right] = useMemo(() => {
    const all = MINECRAFT_ENCHANTMENTS
    const mid = Math.ceil(all.length / 2)
    return [all.slice(0, mid), all.slice(mid)] as const
  }, [])

  const grid =
    'grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto_2.25rem] gap-x-2 gap-y-0 text-[11px] leading-tight sm:text-xs sm:gap-x-3'

  const renderBlock = (rows: typeof MINECRAFT_ENCHANTMENTS) => (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={`${grid} shrink-0 border-b border-white/[0.08] bg-[#131722] px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-500 sm:px-2.5 sm:text-[10px]`}
      >
        <span className="truncate">{t('colName')}</span>
        <span>{t('colId')}</span>
        <span className="text-right">{t('colItems')}</span>
        <span className="text-center">{t('colMax')}</span>
      </div>
      <div className="min-h-0 flex-1 divide-y divide-white/[0.05]">
        {rows.map((row) => {
          const label = nameForLocale(row, locale)
          const active = copiedId === row.id
          return (
            <div
              key={row.id}
              className={`${grid} items-center px-2 py-[0.28rem] transition-colors hover:bg-white/[0.04] sm:px-2.5 sm:py-1`}
            >
              <span className="flex min-w-0 items-center gap-2 text-zinc-200">
                <MinecraftEnchantmentIcon items={row.items} />
                <span className="min-w-0 truncate">{label}</span>
              </span>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => void copy(row.id)}
                  className={`inline-flex max-w-full truncate rounded-md border px-1.5 py-0.5 font-mono text-[10px] transition-colors sm:text-[11px] ${
                    active
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200'
                      : 'border-orange-500/25 bg-orange-500/[0.08] text-orange-300 hover:border-orange-400/40 hover:bg-orange-500/15'
                  }`}
                  title={row.id}
                >
                  {active ? t('copied') : row.id}
                </button>
              </div>
              <div className="flex justify-end">
                <EnchantmentItemIcons items={row.items} />
              </div>
              <span className="text-center tabular-nums text-zinc-500">{row.max}</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <section className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-2 overflow-hidden px-0 sm:gap-2.5">
      <header className="shrink-0 text-center">
        <h2 className="text-base font-semibold tracking-tight text-sky-300 sm:text-lg">
          {t('title')}
        </h2>
        <p className="text-[11px] text-zinc-500">{t('hint')}</p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-hidden md:grid-cols-2 md:gap-3">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-[#141722] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          {renderBlock(left)}
        </div>
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-[#141722] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          {renderBlock(right)}
        </div>
      </div>
    </section>
  )
}
