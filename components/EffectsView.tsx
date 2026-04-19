'use client'

import { useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { MINECRAFT_EFFECTS } from '@/lib/minecraft-effects'
import { MinecraftEffectIcon } from '@/components/MinecraftEffectIcon'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'

function labelForLocale(
  row: (typeof MINECRAFT_EFFECTS)[0],
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

export function EffectsView() {
  const t = useTranslations('effectsPage')
  const locale = useLocale()
  const { copiedId, copy } = useCopyFeedback()

  const { positive, negative } = useMemo(() => {
    const pos = MINECRAFT_EFFECTS.filter((e) => e.kind === 'positive')
    const neg = MINECRAFT_EFFECTS.filter((e) => e.kind === 'negative')
    return { positive: pos, negative: neg }
  }, [])

  const renderRow = (
    row: (typeof MINECRAFT_EFFECTS)[0],
    kind: 'positive' | 'negative'
  ) => {
    const active = copiedId === row.id
    const nameClass =
      kind === 'positive' ? 'text-emerald-300/95' : 'text-rose-300/95'
    return (
      <li key={row.id}>
        <button
          type="button"
          onClick={() => void copy(row.id)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-white/[0.05] sm:gap-2.5 sm:px-2.5 sm:py-1.5"
        >
          <span className="shrink-0 opacity-95">
            <MinecraftEffectIcon id={row.id} kind={kind} />
          </span>
          <span
            className={`min-w-0 flex-1 truncate text-xs leading-snug sm:text-[13px] ${nameClass}`}
          >
            {labelForLocale(row, locale)}
          </span>
          <span
            className={`shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] sm:text-[11px] ${
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

  const renderColumn = (
    title: string,
    rows: typeof MINECRAFT_EFFECTS,
    kind: 'positive' | 'negative'
  ) => {
    const [colA, colB] = splitInTwo(rows)
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#141722] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <h3 className="shrink-0 border-b border-white/[0.07] bg-[#131722] px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-zinc-400 sm:py-2.5 sm:text-xs">
          {title}
        </h3>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-2 py-2 sm:px-3 sm:py-2.5">
          <div className="grid grid-cols-2 gap-x-3 gap-y-0 sm:gap-x-4">
            <ul className="min-w-0 space-y-1">{colA.map((row) => renderRow(row, kind))}</ul>
            <ul className="min-w-0 space-y-1">{colB.map((row) => renderRow(row, kind))}</ul>
          </div>
        </div>
      </div>
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
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-hidden md:grid-cols-2 md:gap-4">
        {renderColumn(t('positive'), positive, 'positive')}
        {renderColumn(t('negative'), negative, 'negative')}
      </div>
    </section>
  )
}
