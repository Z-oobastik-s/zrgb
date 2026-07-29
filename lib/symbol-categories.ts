import { MINECRAFT_SYMBOLS } from '@/lib/minecraft-symbols'

export const SYMBOL_CATEGORY_IDS = [
  'popular',
  'frames',
  'arrows',
  'stars',
  'hearts',
  'chess',
  'music',
  'weather',
  'faces',
  'hands',
  'game',
  'shapes',
  'blocks',
  'check',
  'math',
  'numbers',
  'letters',
  'currency',
  'brackets',
  'punctuation',
  'religion',
  'tools',
  'ancient',
  'cjk',
  'other',
] as const

export type SymbolCategoryId = (typeof SYMBOL_CATEGORY_IDS)[number]

export type SymbolCategoryGroup = {
  id: SymbolCategoryId
  symbols: string[]
}

/** Curated seed for Popular when the user has no copy history yet. */
export const POPULAR_COUNT = 48
export const DEFAULT_POPULAR_SYMBOLS: string[] = MINECRAFT_SYMBOLS.slice(
  0,
  POPULAR_COUNT
)

function cp(sym: string): number {
  return sym.codePointAt(0) ?? 0
}

function between(n: number, a: number, b: number): boolean {
  return n >= a && n <= b
}

function oneOf(n: number, list: readonly number[]): boolean {
  return list.includes(n)
}

export function categoryForSymbol(sym: string): SymbolCategoryId {
  const n = cp(sym)

  if (between(n, 0x2654, 0x265f)) return 'chess'

  if (
    between(n, 0x2669, 0x266f) ||
    between(n, 0x1d100, 0x1d1ff) ||
    oneOf(n, [0x1f3b5, 0x1f3b6, 0x1f3bc])
  )
    return 'music'

  if (between(n, 0x2648, 0x2653)) return 'weather'
  if (
    oneOf(n, [
      0x2600, 0x2601, 0x2602, 0x2603, 0x2604, 0x26c4, 0x26c6, 0x26c7, 0x26c8,
      0x263c, 0x263d, 0x263e, 0x263f, 0x26a1, 0x2744, 0x2745, 0x2746, 0x2668,
      0x26c5, 0x26f1,
    ])
  )
    return 'weather'

  if (
    between(n, 0x2660, 0x2667) ||
    between(n, 0x1f0a0, 0x1f0ff) ||
    oneOf(n, [0x2763, 0x2764, 0x2765, 0x2766, 0x2767, 0x2619, 0x2661, 0x2662])
  )
    return 'hearts'

  if (between(n, 0x2680, 0x2685) || between(n, 0x26c0, 0x26c3)) return 'game'

  if (
    oneOf(n, [0x2605, 0x2606, 0x2b50, 0x2b51, 0x22c6, 0x204e, 0x2055, 0x273f, 0x2740, 0x2741, 0x2742]) ||
    between(n, 0x2721, 0x274b) ||
    between(n, 0x2726, 0x273d)
  )
    return 'stars'

  if (
    between(n, 0x2190, 0x21ff) ||
    between(n, 0x27f0, 0x27ff) ||
    between(n, 0x2900, 0x297f) ||
    between(n, 0x2b00, 0x2b11) ||
    between(n, 0x1f800, 0x1f8ff) ||
    between(n, 0x2794, 0x27be)
  )
    return 'arrows'

  if (
    oneOf(n, [
      0x2713, 0x2714, 0x2715, 0x2716, 0x2717, 0x2718, 0x274c, 0x274e, 0x2610,
      0x2611, 0x2612, 0x237b, 0x00d7, 0x2a2f, 0x2715,
    ])
  )
    return 'check'

  if (oneOf(n, [0x2639, 0x263a, 0x263b, 0x3020]) || between(n, 0x1f600, 0x1f64f))
    return 'faces'

  if (
    between(n, 0x261a, 0x261d) ||
    oneOf(n, [0x270a, 0x270b, 0x270c, 0x270d]) ||
    between(n, 0x1f446, 0x1f450)
  )
    return 'hands'

  if (
    oneOf(n, [
      0x262a, 0x262b, 0x262c, 0x262d, 0x262e, 0x262f, 0x2638, 0x2670, 0x2671,
      0x271d, 0x271e, 0x271f, 0x2720, 0x269a, 0x269b, 0x2626, 0x2627, 0x2628,
      0x2629, 0xfdfd, 0x0af0, 0x06de, 0x26ea, 0x269c,
    ])
  )
    return 'religion'

  if (
    between(n, 0x13000, 0x1342f) ||
    between(n, 0x12000, 0x123ff) ||
    between(n, 0x12400, 0x1247f) ||
    between(n, 0x16800, 0x16a3f)
  )
    return 'ancient'

  if (
    between(n, 0x3040, 0x30ff) ||
    between(n, 0x31f0, 0x31ff) ||
    between(n, 0x3200, 0x32ff) ||
    between(n, 0x3300, 0x33ff) ||
    between(n, 0xac00, 0xd7af) ||
    between(n, 0x1100, 0x11ff) ||
    between(n, 0x3130, 0x318f) ||
    between(n, 0xffa0, 0xffdc) ||
    between(n, 0x32d0, 0x32fe)
  )
    return 'cjk'

  if (between(n, 0x25a0, 0x25ff) || between(n, 0x2b12, 0x2b2f) || between(n, 0x1f780, 0x1f7ff))
    return 'shapes'

  if (
    between(n, 0x2500, 0x257f) ||
    between(n, 0x2580, 0x259f) ||
    between(n, 0x2800, 0x28ff) ||
    oneOf(n, [0x2b1b, 0x2b1c, 0x26aa, 0x26ab])
  )
    return 'blocks'

  if (
    between(n, 0x2460, 0x24ff) ||
    between(n, 0x2150, 0x218f) ||
    between(n, 0x2070, 0x209f) ||
    between(n, 0x1d7ce, 0x1d7ff) ||
    between(n, 0xff10, 0xff19) ||
    between(n, 0x2776, 0x2793) ||
    between(n, 0x1f100, 0x1f10f)
  )
    return 'numbers'

  if (
    between(n, 0x20a0, 0x20cf) ||
    oneOf(n, [
      0x0024, 0x00a2, 0x00a3, 0x00a4, 0x00a5, 0x20bf, 0x20bd, 0x20b9, 0x0192,
      0x09f2, 0x09f3, 0x0e3f, 0x17db, 0x20aa, 0x20ab, 0xfdfc, 0x20a9,
    ])
  )
    return 'currency'

  if (
    between(n, 0x2200, 0x22ff) ||
    between(n, 0x2a00, 0x2aff) ||
    between(n, 0x27c0, 0x27ef) ||
    between(n, 0x2980, 0x29ff) ||
    oneOf(n, [0x00b1, 0x00f7, 0x221a, 0x221b, 0x221c, 0x221e, 0x2211, 0x220f]) ||
    between(n, 0x3380, 0x33ff)
  )
    return 'math'

  if (
    between(n, 0x3008, 0x301b) ||
    between(n, 0xfe35, 0xfe44) ||
    between(n, 0xfe59, 0xfe5e) ||
    between(n, 0xff08, 0xff09) ||
    between(n, 0xff1c, 0xff1e) ||
    between(n, 0xff5b, 0xff5d) ||
    between(n, 0x2768, 0x2775) ||
    oneOf(n, [
      0x2018, 0x2019, 0x201a, 0x201b, 0x201c, 0x201d, 0x201e, 0x201f, 0x2039,
      0x203a, 0x00ab, 0x00bb, 0x275b, 0x275c, 0x275d, 0x275e, 0x0022, 0x0027,
      0x0060, 0xff62, 0xff63,
    ])
  )
    return 'brackets'

  if (
    between(n, 0x0370, 0x03ff) ||
    between(n, 0x1d400, 0x1d7ff) ||
    between(n, 0x2100, 0x214f) ||
    between(n, 0xff21, 0xff3a) ||
    between(n, 0xff41, 0xff5a) ||
    between(n, 0x1f110, 0x1f1ac) ||
    between(n, 0x24b6, 0x24e9) ||
    between(n, 0x00c0, 0x024f) ||
    between(n, 0x1d00, 0x1d7f) ||
    between(n, 0x0100, 0x017f)
  )
    return 'letters'

  if (
    between(n, 0x2000, 0x206f) ||
    between(n, 0x2e00, 0x2e7f) ||
    between(n, 0xff01, 0xff0f) ||
    between(n, 0xff1a, 0xff20) ||
    between(n, 0x00a0, 0x00bf)
  )
    return 'punctuation'

  // Crafting / office / warning glyphs in Misc Symbols + Dingbats leftovers
  if (
    oneOf(n, [
      0x2692, 0x2693, 0x2694, 0x2695, 0x2696, 0x2697, 0x2699, 0x26cf, 0x26d3,
      0x26d1, 0x2318, 0x2328, 0x23ce, 0x23cf, 0x26a0, 0x2622, 0x2623, 0x267b,
      0x267e, 0x26a7, 0x2695,
    ]) ||
    between(n, 0x2700, 0x2709) ||
    between(n, 0x270e, 0x2712) ||
    between(n, 0x2600, 0x26ff) ||
    between(n, 0x2700, 0x27bf)
  )
    return 'tools'

  return 'other'
}

function buildGroups(): SymbolCategoryGroup[] {
  // Popular + frames are assembled in the UI (recents / frame templates).
  const skip = new Set<SymbolCategoryId>(['popular', 'frames'])
  const buckets = new Map<Exclude<SymbolCategoryId, 'popular' | 'frames'>, string[]>()

  for (const id of SYMBOL_CATEGORY_IDS) {
    if (skip.has(id)) continue
    buckets.set(id as Exclude<SymbolCategoryId, 'popular' | 'frames'>, [])
  }

  for (const sym of MINECRAFT_SYMBOLS) {
    const id = categoryForSymbol(sym)
    const bucketId = id === 'popular' || id === 'frames' ? 'other' : id
    buckets.get(bucketId)!.push(sym)
  }

  const groups: SymbolCategoryGroup[] = []
  for (const id of SYMBOL_CATEGORY_IDS) {
    if (skip.has(id)) continue
    const symbols = buckets.get(id as Exclude<SymbolCategoryId, 'popular' | 'frames'>) ?? []
    if (symbols.length) groups.push({ id, symbols })
  }
  return groups
}

/** Symbol groups excluding Popular and Frames (those are dynamic / special). */
export const SYMBOL_GROUPS: SymbolCategoryGroup[] = buildGroups()

export const ALL_SYMBOLS_COUNT = MINECRAFT_SYMBOLS.length
