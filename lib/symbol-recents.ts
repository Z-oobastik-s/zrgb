const STORAGE_KEY = 'zrgb-symbol-recents-v1'
const MAX_TRACKED = 120
const POPULAR_LIMIT = 48

export type SymbolRecentEntry = {
  s: string
  c: number
  t: number
}

function canTrack(text: string): boolean {
  if (!text || text.includes('\n')) return false
  // Single grapheme / short cluster (emoji + FE0E etc.)
  const units = [...text]
  return units.length >= 1 && units.length <= 4
}

function readRaw(): SymbolRecentEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (e): e is SymbolRecentEntry =>
          !!e &&
          typeof e === 'object' &&
          typeof (e as SymbolRecentEntry).s === 'string' &&
          typeof (e as SymbolRecentEntry).c === 'number' &&
          typeof (e as SymbolRecentEntry).t === 'number'
      )
      .filter((e) => canTrack(e.s))
      .slice(0, MAX_TRACKED)
  } catch {
    return []
  }
}

function writeRaw(entries: SymbolRecentEntry[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_TRACKED)))
  } catch {
    /* quota / private mode */
  }
}

/** Record a copied symbol for Popular ranking. */
export function recordSymbolCopy(text: string): SymbolRecentEntry[] {
  if (!canTrack(text)) return readRaw()
  const now = Date.now()
  const entries = readRaw()
  const idx = entries.findIndex((e) => e.s === text)
  if (idx >= 0) {
    const cur = entries[idx]!
    entries.splice(idx, 1)
    entries.unshift({ s: text, c: cur.c + 1, t: now })
  } else {
    entries.unshift({ s: text, c: 1, t: now })
  }
  writeRaw(entries)
  return entries
}

export function loadSymbolRecents(): SymbolRecentEntry[] {
  return readRaw()
}

/**
 * Popular = frequent/recent copies first, then curated defaults.
 * Score favors both copy count and recency.
 */
export function buildPopularSymbols(
  recents: SymbolRecentEntry[],
  defaults: string[],
  limit = POPULAR_LIMIT
): string[] {
  const now = Date.now()
  const day = 86_400_000
  const ranked = [...recents].sort((a, b) => {
    const score = (e: SymbolRecentEntry) => {
      const daysAgo = Math.max(0, (now - e.t) / day)
      const recency = Math.max(0, 14 - daysAgo) // last ~2 weeks
      return e.c * 8 + recency
    }
    return score(b) - score(a) || b.t - a.t
  })

  const out: string[] = []
  const seen = new Set<string>()
  for (const e of ranked) {
    if (out.length >= limit) break
    if (seen.has(e.s)) continue
    out.push(e.s)
    seen.add(e.s)
  }
  for (const s of defaults) {
    if (out.length >= limit) break
    if (seen.has(s)) continue
    out.push(s)
    seen.add(s)
  }
  return out
}

export const POPULAR_SYMBOL_LIMIT = POPULAR_LIMIT
