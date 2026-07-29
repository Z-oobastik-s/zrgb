'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslations } from 'next-intl'
import {
  ALL_SYMBOLS_COUNT,
  DEFAULT_POPULAR_SYMBOLS,
  SYMBOL_GROUPS,
  type SymbolCategoryId,
  type SymbolCategoryGroup,
} from '@/lib/symbol-categories'
import { SYMBOL_FRAMES, SYMBOL_FRAMES_COUNT } from '@/lib/symbol-frames'
import {
  buildPopularSymbols,
  loadSymbolRecents,
  recordSymbolCopy,
  type SymbolRecentEntry,
} from '@/lib/symbol-recents'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'

function symbolKey(sym: string, index: number): string {
  const cps = [...sym]
    .map((c) => c.codePointAt(0)!.toString(16))
    .join('-')
  return `${index}-${cps}`
}

/** Horizontal chip/row scroll via wheel/trackpad — no visible scrollbar. */
function useHiddenHorizontalScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth + 1) return
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (delta === 0) return

      const max = el.scrollWidth - el.clientWidth
      const canScroll =
        (delta > 0 && el.scrollLeft < max - 0.5) ||
        (delta < 0 && el.scrollLeft > 0.5)
      if (!canScroll) return

      e.preventDefault()
      el.scrollLeft = Math.min(max, Math.max(0, el.scrollLeft + delta))
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return ref
}

function FrameCard({
  text,
  active,
  copiedLabel,
  copyLabel,
  onCopy,
}: {
  text: string
  active: boolean
  copiedLabel: string
  copyLabel: string
  onCopy: () => void
}) {
  const shellRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const shell = shellRef.current
    const pre = preRef.current
    if (!shell || !pre) return

    const fit = () => {
      pre.style.transform = 'scale(1)'
      const pad = 8
      const avail = Math.max(0, shell.clientWidth - pad)
      const need = pre.scrollWidth
      setScale(need > avail && avail > 0 ? avail / need : 1)
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(shell)
    return () => ro.disconnect()
  }, [text])

  return (
    <button
      type="button"
      title={active ? copiedLabel : copyLabel}
      onClick={onCopy}
      className={`flex min-h-[4.25rem] min-w-0 flex-col justify-center overflow-hidden rounded-lg border px-3 py-2.5 transition-colors ${
        active
          ? 'border-emerald-500/50 bg-emerald-500/20 ring-1 ring-emerald-400/40'
          : 'border-edge bg-muted-fill hover:border-sky-500/40 hover:bg-sky-500/10'
      }`}
    >
      <div
        ref={shellRef}
        className="flex w-full min-w-0 items-center justify-center overflow-hidden"
      >
        <pre
          ref={preRef}
          className="symbol-frame-preview m-0 max-w-none origin-center whitespace-pre text-center text-[11px] leading-[1.55] text-fg-soft sm:text-[12px]"
          style={{ transform: `scale(${scale})` }}
        >
          {text}
        </pre>
      </div>
    </button>
  )
}

type FilterId = 'all' | SymbolCategoryId

export function SymbolsView() {
  const t = useTranslations('symbolsPage')
  const { copiedId, copy } = useCopyFeedback()
  const [filter, setFilter] = useState<FilterId>('popular')
  const [recents, setRecents] = useState<SymbolRecentEntry[]>([])

  useEffect(() => {
    setRecents(loadSymbolRecents())
  }, [])

  const popularSymbols = useMemo(
    () => buildPopularSymbols(recents, DEFAULT_POPULAR_SYMBOLS),
    [recents]
  )

  const copySymbol = useCallback(
    async (text: string) => {
      const ok = await copy(text)
      if (ok && !text.includes('\n')) {
        setRecents(recordSymbolCopy(text))
      }
    },
    [copy]
  )

  const visibleGroups = useMemo((): SymbolCategoryGroup[] => {
    if (filter === 'popular') {
      return [{ id: 'popular', symbols: popularSymbols }]
    }
    if (filter === 'frames') return []
    if (filter === 'all') {
      return [
        { id: 'popular', symbols: popularSymbols },
        ...SYMBOL_GROUPS,
      ]
    }
    return SYMBOL_GROUPS.filter((g) => g.id === filter)
  }, [filter, popularSymbols])

  const showFrames = filter === 'frames' || filter === 'all'

  const shownCount = useMemo(() => {
    let n = visibleGroups.reduce((sum, g) => sum + g.symbols.length, 0)
    if (filter === 'frames') n = SYMBOL_FRAMES_COUNT
    else if (filter === 'all') n += SYMBOL_FRAMES_COUNT
    return n
  }, [visibleGroups, filter])

  const chipsScrollRef = useHiddenHorizontalScroll<HTMLDivElement>()

  const chipClass = (active: boolean) =>
    [
      'shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors',
      active
        ? 'border-sky-500/50 bg-accent-soft text-accent'
        : 'border-edge-strong bg-muted-fill text-muted hover:border-edge-strong hover:bg-muted-hover hover:text-fg-soft',
    ].join(' ')

  return (
    <section className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-2 overflow-hidden px-0 sm:gap-2.5">
      <header className="shrink-0 text-center">
        <h2 className="text-base font-semibold tracking-tight text-accent sm:text-lg">
          {t('title')}
        </h2>
        <p className="text-[11px] text-muted sm:text-xs">{t('hint')}</p>
      </header>

      <div className="flex shrink-0 items-center gap-2">
        <div
          ref={chipsScrollRef}
          className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={chipClass(filter === 'all')}
          >
            {t('cat.all')}
            <span className="ml-1 tabular-nums opacity-70">
              {ALL_SYMBOLS_COUNT + SYMBOL_FRAMES_COUNT}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('popular')}
            className={chipClass(filter === 'popular')}
            title={t('cat.popular')}
          >
            <span className="mr-1 opacity-90">
              {popularSymbols[0] ?? '★'}
            </span>
            {t('cat.popular')}
            <span className="ml-1 tabular-nums opacity-70">
              {popularSymbols.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('frames')}
            className={chipClass(filter === 'frames')}
            title={t('cat.frames')}
          >
            <span className="mr-1 opacity-90">╭</span>
            {t('cat.frames')}
            <span className="ml-1 tabular-nums opacity-70">
              {SYMBOL_FRAMES_COUNT}
            </span>
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
              <span className="ml-1 tabular-nums opacity-70">
                {g.symbols.length}
              </span>
            </button>
          ))}
        </div>
        <span className="hidden shrink-0 tabular-nums text-[11px] text-muted sm:inline">
          {t('count', {
            shown: shownCount,
            total: ALL_SYMBOLS_COUNT + SYMBOL_FRAMES_COUNT,
          })}
        </span>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-edge bg-panel shadow-inset-panel">
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-2 sm:p-3">
          {visibleGroups.length === 0 && !showFrames ? (
            <p className="p-4 text-center text-[12px] text-muted">
              {t('noMatches')}
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {visibleGroups.map((group) => (
                <section key={group.id} className="min-w-0">
                  {filter === 'all' || visibleGroups.length > 1 ? (
                    <h3 className="mb-2 flex items-center gap-2 border-b border-edge pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      <span className="text-base font-normal normal-case tracking-normal text-fg-soft">
                        {group.symbols[0] ?? '★'}
                      </span>
                      {t(`cat.${group.id}`)}
                      <span className="font-normal normal-case tracking-normal text-muted">
                        {group.symbols.length}
                      </span>
                    </h3>
                  ) : null}
                  {group.id === 'popular' && filter === 'popular' ? (
                    <p className="mb-2 text-[10px] leading-snug text-muted">
                      {t('popularHint')}
                    </p>
                  ) : null}
                  <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-[repeat(14,minmax(0,1fr))]">
                    {group.symbols.map((sym, index) => {
                      const active = copiedId === sym
                      return (
                        <button
                          key={symbolKey(sym, index)}
                          type="button"
                          title={active ? t('copied') : t('copyHint')}
                          onClick={() => void copySymbol(sym)}
                          className={`flex aspect-square items-center justify-center rounded-lg border text-base leading-none transition-colors sm:text-lg ${
                            active
                              ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-800 ring-1 ring-emerald-400/40 dark:text-emerald-100'
                              : 'border-edge bg-muted-fill text-fg hover:border-sky-500/40 hover:bg-sky-500/10'
                          }`}
                        >
                          <span className="select-none">{sym}</span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}

              {showFrames ? (
                <section className="min-w-0">
                  {filter === 'all' ? (
                    <h3 className="mb-2 flex items-center gap-2 border-b border-edge pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      <span className="text-base font-normal normal-case tracking-normal text-fg-soft">
                        ╭
                      </span>
                      {t('cat.frames')}
                      <span className="font-normal normal-case tracking-normal text-muted">
                        {SYMBOL_FRAMES_COUNT}
                      </span>
                    </h3>
                  ) : (
                    <p className="mb-2 text-[10px] leading-snug text-muted">
                      {t('framesHint')}
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {SYMBOL_FRAMES.map((frame) => (
                      <FrameCard
                        key={frame.id}
                        text={frame.text}
                        active={copiedId === frame.text}
                        copiedLabel={t('copied')}
                        copyLabel={t('copyHint')}
                        onCopy={() => void copy(frame.text)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
