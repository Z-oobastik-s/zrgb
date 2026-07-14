'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { MINECRAFT_SYMBOLS } from '@/lib/minecraft-symbols'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'

function symbolKey(sym: string, index: number): string {
  const cps = [...sym]
    .map((c) => c.codePointAt(0)!.toString(16))
    .join('-')
  return `${index}-${cps}`
}

export function SymbolsView() {
  const t = useTranslations('symbolsPage')
  const { copiedId, copy } = useCopyFeedback()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim()
    if (!q) return MINECRAFT_SYMBOLS
    return MINECRAFT_SYMBOLS.filter((s) => s.includes(q))
  }, [query])

  return (
    <section className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-2 overflow-hidden px-0 sm:gap-2.5">
      <header className="shrink-0 text-center">
        <h2 className="text-base font-semibold tracking-tight text-sky-300 sm:text-lg">
          {t('title')}
        </h2>
        <p className="text-[11px] text-zinc-500 sm:text-xs">{t('hint')}</p>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0d0f14] px-3 py-2 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-sky-500/50"
        />
        <span className="shrink-0 tabular-nums text-[11px] text-zinc-500">
          {t('count', { shown: filtered.length, total: MINECRAFT_SYMBOLS.length })}
        </span>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#141722] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-2 sm:p-2.5">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-[12px] text-zinc-500">{t('noMatches')}</p>
          ) : (
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-[repeat(14,minmax(0,1fr))]">
              {filtered.map((sym, index) => {
                const active = copiedId === sym
                return (
                  <button
                    key={symbolKey(sym, index)}
                    type="button"
                    title={active ? t('copied') : t('copyHint')}
                    onClick={() => void copy(sym)}
                    className={`flex aspect-square items-center justify-center rounded-lg border text-base leading-none transition-colors sm:text-lg ${
                      active
                        ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/40'
                        : 'border-white/[0.07] bg-black/25 text-zinc-100 hover:border-sky-500/40 hover:bg-sky-500/10'
                    }`}
                  >
                    <span className="select-none">{sym}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
