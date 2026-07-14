'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  ALL_SYMBOLS_COUNT,
  SYMBOL_GROUPS,
  type SymbolCategoryId,
} from '@/lib/symbol-categories'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'

function symbolKey(sym: string, index: number): string {
  const cps = [...sym]
    .map((c) => c.codePointAt(0)!.toString(16))
    .join('-')
  return `${index}-${cps}`
}

type FilterId = 'all' | SymbolCategoryId

export function SymbolsView() {
  const t = useTranslations('symbolsPage')
  const { copiedId, copy } = useCopyFeedback()
  const [filter, setFilter] = useState<FilterId>('popular')

  const visibleGroups = useMemo(() => {
    if (filter === 'all') return SYMBOL_GROUPS
    return SYMBOL_GROUPS.filter((g) => g.id === filter)
  }, [filter])

  const shownCount = useMemo(
    () => visibleGroups.reduce((n, g) => n + g.symbols.length, 0),
    [visibleGroups]
  )

  const chipClass = (active: boolean) =>
    [
      'shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors',
      active
        ? 'border-sky-500/50 bg-sky-500/20 text-sky-100'
        : 'border-white/10 bg-black/30 text-zinc-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-zinc-200',
    ].join(' ')

  return (
    <section className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-2 overflow-hidden px-0 sm:gap-2.5">
      <header className="shrink-0 text-center">
        <h2 className="text-base font-semibold tracking-tight text-sky-300 sm:text-lg">
          {t('title')}
        </h2>
        <p className="text-[11px] text-zinc-500 sm:text-xs">{t('hint')}</p>
      </header>

      <div className="flex shrink-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={chipClass(filter === 'all')}
          >
            {t('cat.all')}
            <span className="ml-1 tabular-nums opacity-70">{ALL_SYMBOLS_COUNT}</span>
          </button>
          {SYMBOL_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setFilter(g.id)}
              className={chipClass(filter === g.id)}
              title={t(`cat.${g.id}`)}
            >
              <span className="mr-1 opacity-90">{g.symbols[0]}</span>
              {t(`cat.${g.id}`)}
              <span className="ml-1 tabular-nums opacity-70">{g.symbols.length}</span>
            </button>
          ))}
        </div>
        <span className="hidden shrink-0 tabular-nums text-[11px] text-zinc-500 sm:inline">
          {t('count', { shown: shownCount, total: ALL_SYMBOLS_COUNT })}
        </span>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#141722] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-2 sm:p-3">
          {visibleGroups.length === 0 ? (
            <p className="p-4 text-center text-[12px] text-zinc-500">{t('noMatches')}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {visibleGroups.map((group) => (
                <section key={group.id} className="min-w-0">
                  {filter === 'all' || visibleGroups.length > 1 ? (
                    <h3 className="mb-2 flex items-center gap-2 border-b border-white/[0.06] pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      <span className="text-base font-normal normal-case tracking-normal text-zinc-200">
                        {group.symbols[0]}
                      </span>
                      {t(`cat.${group.id}`)}
                      <span className="font-normal normal-case tracking-normal text-zinc-600">
                        {group.symbols.length}
                      </span>
                    </h3>
                  ) : null}
                  <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-[repeat(14,minmax(0,1fr))]">
                    {group.symbols.map((sym, index) => {
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
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
