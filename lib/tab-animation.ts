import {
  hexToRgb,
  lerpRgb,
  rgbToHexString,
  type RGBColor,
} from '@/lib/rgb-generator'

export type TabAnimMode =
  | 'wave'
  | 'wave_bounce'
  | 'wave_reverse'
  | 'wave_thick'
  | 'middle_out'
  | 'edges_in'
  | 'zipper'
  | 'dual_wave'
  | 'color_chase'
  | 'scanline'
  | 'glow'
  | 'glow_bounce'
  | 'glow_fill'
  | 'ping_pong_fill'
  | 'typewriter'
  | 'typewriter_delete'
  | 'typewriter_reverse'
  | 'erase'
  | 'scatter_in'
  | 'explode'
  | 'strike_reveal'
  | 'strike_wave'
  | 'corrupt'
  | 'scramble'
  | 'matrix'
  | 'glitch'
  | 'sparkle'
  | 'neon_flicker'
  | 'rainbow'
  | 'rainbow_wave'
  | 'gradient_slide'
  | 'pulse'
  | 'breathe'
  | 'blink'
  | 'flash'
  | 'heartbeat'
  | 'strobe'
  | 'marquee'
  | 'static'

export type TabAnimCategoryId =
  | 'highlight'
  | 'glow'
  | 'build'
  | 'fx'
  | 'color'
  | 'motion'

export const TAB_ANIM_CATEGORIES: {
  id: TabAnimCategoryId
  modes: TabAnimMode[]
}[] = [
  {
    id: 'highlight',
    modes: [
      'wave',
      'wave_bounce',
      'wave_reverse',
      'wave_thick',
      'middle_out',
      'edges_in',
      'zipper',
      'dual_wave',
      'color_chase',
      'scanline',
    ],
  },
  {
    id: 'glow',
    modes: ['glow', 'glow_bounce', 'glow_fill', 'ping_pong_fill'],
  },
  {
    id: 'build',
    modes: [
      'typewriter',
      'typewriter_delete',
      'typewriter_reverse',
      'erase',
      'scatter_in',
      'explode',
    ],
  },
  {
    id: 'fx',
    modes: [
      'strike_reveal',
      'strike_wave',
      'corrupt',
      'scramble',
      'matrix',
      'glitch',
      'sparkle',
      'neon_flicker',
    ],
  },
  {
    id: 'color',
    modes: [
      'rainbow',
      'rainbow_wave',
      'gradient_slide',
      'pulse',
      'breathe',
      'blink',
      'flash',
      'heartbeat',
      'strobe',
    ],
  },
  {
    id: 'motion',
    modes: ['marquee', 'static'],
  },
]

export const TAB_ANIM_MODES: TabAnimMode[] = TAB_ANIM_CATEGORIES.flatMap(
  (c) => c.modes
)

export type TabGeneratorOptions = {
  keyName: string
  text: string
  mode: TabAnimMode
  colorA: RGBColor
  colorB: RGBColor
  colorHighlight: RGBColor
  changeIntervalMs: number
  holdFrames: number
  staticRepeats: number
  emptyLines: number
  bold: boolean
  lowercaseHex: boolean
  /** If set, skip algorithmic generation and use these frames */
  customFrames?: string[] | null
}

function hex(c: RGBColor, lower: boolean): string {
  return rgbToHexString(c, lower)
}

export function tabColorWrap(color: RGBColor, text: string, lower: boolean): string {
  if (!text) return ''
  const h = hex(color, lower)
  return `<#${h}>${text}</#${h}>`
}

export function tabGradientWrap(
  start: RGBColor,
  end: RGBColor,
  text: string,
  lower: boolean
): string {
  if (!text) return ''
  return `<#${hex(start, lower)}>${text}</#${hex(end, lower)}>`
}

function withBold(inner: string, bold: boolean): string {
  if (!bold || !inner) return inner
  return inner.replace(/^(<#[0-9a-fA-F]{6}>)/, '$1§l')
}

function yamlEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

const STRIKE = '\u0337'
const SCRAMBLE_POOL = [...'░▒▓█▌▐|/\\-_#@$%&*+?=<>~']
const MATRIX_POOL = [...'01アイウエオカキクケコΑΒΓΔЖШЮ☀✦✧★☆']

function hash32(n: number): number {
  let x = (n | 0) ^ 0x9e3779b9
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b)
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35)
  return (x ^ (x >>> 16)) >>> 0
}

function hslToRgbSimple(h: number, s: number, l: number): RGBColor {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4)),
  }
}

function middleOutOrder(len: number): number[] {
  if (len <= 0) return []
  const mid = Math.floor((len - 1) / 2)
  const order = [mid]
  for (let d = 1; order.length < len; d++) {
    if (mid - d >= 0) order.push(mid - d)
    if (mid + d < len) order.push(mid + d)
  }
  return order
}

function edgesInOrder(len: number): number[] {
  if (len <= 0) return []
  const order: number[] = []
  let L = 0
  let R = len - 1
  while (L <= R) {
    order.push(L)
    if (L !== R) order.push(R)
    L++
    R--
  }
  return order
}

function scatterOrder(len: number): number[] {
  const order = Array.from({ length: len }, (_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = hash32(i * 2654435761 + len) % (i + 1)
    ;[order[i], order[j]] = [order[j]!, order[i]!]
  }
  return order
}

function pushHold(frames: string[], frame: string, hold: number) {
  for (let h = 0; h < hold; h++) frames.push(frame)
}

type ColorOpts = Pick<
  TabGeneratorOptions,
  'colorA' | 'colorB' | 'colorHighlight' | 'bold' | 'lowercaseHex'
>

export function buildWaveFrame(
  text: string,
  highlightIndex: number,
  opts: ColorOpts
): string {
  const chars = [...text]
  if (chars.length === 0) return ''
  const i = Math.max(0, Math.min(chars.length - 1, highlightIndex))
  const before = chars.slice(0, i).join('')
  const mid = chars[i]!
  const after = chars.slice(i + 1).join('')

  const parts: string[] = []
  if (before) {
    parts.push(tabGradientWrap(opts.colorA, opts.colorB, before, opts.lowercaseHex))
  }
  parts.push(tabColorWrap(opts.colorHighlight, mid, opts.lowercaseHex))
  if (after) {
    parts.push(tabGradientWrap(opts.colorA, opts.colorB, after, opts.lowercaseHex))
  }
  return withBold(parts.join(''), opts.bold)
}

function buildMultiHighlightFrame(
  text: string,
  highlightSet: Set<number>,
  opts: ColorOpts
): string {
  const chars = [...text]
  if (chars.length === 0) return ''
  const parts: string[] = []
  let buf = ''
  let bufHi = false

  const flush = () => {
    if (!buf) return
    parts.push(
      bufHi
        ? tabColorWrap(opts.colorHighlight, buf, opts.lowercaseHex)
        : tabGradientWrap(opts.colorA, opts.colorB, buf, opts.lowercaseHex)
    )
    buf = ''
  }

  for (let i = 0; i < chars.length; i++) {
    const hi = highlightSet.has(i)
    if (buf && hi !== bufHi) flush()
    bufHi = hi
    buf += chars[i]
  }
  flush()
  return withBold(parts.join(''), opts.bold)
}

/** Glow trail like web1: `{#accent}` + `<#base>…</#end>` */
export function buildGlowFrame(
  text: string,
  step: number,
  opts: ColorOpts
): string {
  const chars = [...text]
  if (chars.length === 0) return ''
  const L = opts.lowercaseHex
  const a = hex(opts.colorA, L)
  const b = hex(opts.colorB, L)
  const h = hex(opts.colorHighlight, L)
  const full = `<#${a}>${text}</#${b}>`

  if (step <= 0) return withBold(full, opts.bold)
  if (step === 1) return withBold(`{#${h}}${full}`, opts.bold)

  const i = step - 2
  if (i < 0 || i >= chars.length) return withBold(full, opts.bold)

  if (i === 0) {
    const rest = chars.slice(1).join('')
    return withBold(
      `<#${h}>${chars[0]}</#${b}>` + (rest ? `<#${a}>${rest}</#${b}>` : ''),
      opts.bold
    )
  }

  const before = chars.slice(0, i).join('')
  const mid = chars[i]!
  const after = chars.slice(i + 1).join('')
  return withBold(
    `<#${a}>${before}</#${b}>{#${h}}${mid}` +
      (after ? `<#${a}>${after}</#${b}>` : ''),
    opts.bold
  )
}

function buildFullGradientFrame(
  text: string,
  opts: Pick<TabGeneratorOptions, 'colorA' | 'colorB' | 'bold' | 'lowercaseHex'>
): string {
  return withBold(
    tabGradientWrap(opts.colorA, opts.colorB, text, opts.lowercaseHex),
    opts.bold
  )
}

function buildHighlightAllFrame(
  text: string,
  opts: Pick<TabGeneratorOptions, 'colorHighlight' | 'bold' | 'lowercaseHex'>
): string {
  return withBold(
    tabColorWrap(opts.colorHighlight, text, opts.lowercaseHex),
    opts.bold
  )
}

function buildSolidFrame(
  text: string,
  color: RGBColor,
  opts: Pick<TabGeneratorOptions, 'bold' | 'lowercaseHex'>
): string {
  return withBold(tabColorWrap(color, text, opts.lowercaseHex), opts.bold)
}

function buildStrikeRevealFrame(
  text: string,
  revealedCount: number,
  opts: Pick<TabGeneratorOptions, 'colorA' | 'colorB' | 'bold' | 'lowercaseHex'>
): string {
  const chars = [...text]
  const count = Math.max(0, Math.min(chars.length, revealedCount))
  let body = ''
  for (let i = 0; i < chars.length; i++) {
    body += chars[i]
    if (i >= count) body += STRIKE
  }
  return buildFullGradientFrame(body, opts)
}

function buildCorruptFrame(
  text: string,
  corruptCount: number,
  opts: Pick<TabGeneratorOptions, 'colorA' | 'colorB' | 'bold' | 'lowercaseHex'>,
  symbol = '☠'
): string {
  const chars = [...text]
  if (chars.length === 0) return ''
  const count = Math.max(0, Math.min(chars.length, corruptCount))
  const mid = (chars.length - 1) / 2
  const out = chars
    .map((ch, i) => (Math.abs(i - mid) <= (count - 1) / 2 ? symbol : ch))
    .join('')
  return buildFullGradientFrame(out, opts)
}

function buildPerCharColorsFrame(
  text: string,
  colorAt: (i: number, ch: string) => RGBColor,
  opts: Pick<TabGeneratorOptions, 'bold' | 'lowercaseHex'>
): string {
  const chars = [...text]
  if (chars.length === 0) return ''
  return withBold(
    chars
      .map((ch, i) => tabColorWrap(colorAt(i, ch), ch, opts.lowercaseHex))
      .join(''),
    opts.bold
  )
}

function buildRainbowFrame(
  text: string,
  hueOffset: number,
  opts: Pick<TabGeneratorOptions, 'bold' | 'lowercaseHex'>
): string {
  const chars = [...text]
  if (chars.length === 0) return ''
  return buildPerCharColorsFrame(
    text,
    (i) => {
      const hue =
        (hueOffset + (i / Math.max(1, chars.length)) * 360) % 360
      return hslToRgbSimple(hue, 90, 55)
    },
    opts
  )
}

function buildGlowFillFrame(
  text: string,
  filled: number,
  opts: ColorOpts
): string {
  const chars = [...text]
  const i = Math.max(0, Math.min(chars.length, filled))
  const left = chars.slice(0, i).join('')
  const right = chars.slice(i).join('')
  const L = opts.lowercaseHex
  const part =
    (left ? tabColorWrap(opts.colorHighlight, left, L) : '') +
    (right ? tabGradientWrap(opts.colorA, opts.colorB, right, L) : '')
  return withBold(part || buildFullGradientFrame(text, opts), opts.bold)
}

function buildMaskedTextFrame(
  text: string,
  visible: Set<number>,
  opts: ColorOpts,
  placeholder = '·'
): string {
  const chars = [...text]
  const body = chars.map((ch, i) => (visible.has(i) ? ch : placeholder)).join('')
  return buildFullGradientFrame(body, opts)
}

export function generateTabFrames(opts: TabGeneratorOptions): string[] {
  if (opts.customFrames && opts.customFrames.length > 0) {
    return [...opts.customFrames]
  }

  const text = opts.text
  const chars = [...text]
  const n = chars.length
  const frames: string[] = []
  const hold = Math.max(0, Math.min(120, Math.round(opts.holdFrames)))
  const endGrad = () => buildFullGradientFrame(text, opts)
  const endHi = () => buildHighlightAllFrame(text, opts)

  switch (opts.mode) {
    case 'wave': {
      for (let i = 0; i < n; i++) frames.push(buildWaveFrame(text, i, opts))
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'wave_bounce': {
      for (let i = 0; i < n; i++) frames.push(buildWaveFrame(text, i, opts))
      for (let i = n - 2; i >= 1; i--) frames.push(buildWaveFrame(text, i, opts))
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'wave_reverse': {
      for (let i = n - 1; i >= 0; i--) frames.push(buildWaveFrame(text, i, opts))
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'wave_thick': {
      for (let i = 0; i < n; i++) {
        const set = new Set<number>()
        for (let d = -1; d <= 1; d++) {
          const j = i + d
          if (j >= 0 && j < n) set.add(j)
        }
        frames.push(buildMultiHighlightFrame(text, set, opts))
      }
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'middle_out': {
      for (const i of middleOutOrder(n)) frames.push(buildWaveFrame(text, i, opts))
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'edges_in': {
      for (const i of edgesInOrder(n)) frames.push(buildWaveFrame(text, i, opts))
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'zipper': {
      let L = 0
      let R = n - 1
      let leftTurn = true
      while (L <= R) {
        frames.push(buildWaveFrame(text, leftTurn ? L : R, opts))
        if (leftTurn) L++
        else R--
        leftTurn = !leftTurn
      }
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'dual_wave': {
      const steps = Math.max(n, 1)
      for (let s = 0; s < steps; s++) {
        const a = s % Math.max(n, 1)
        const b = (n - 1 - s + n * 10) % Math.max(n, 1)
        frames.push(buildMultiHighlightFrame(text, new Set([a, b]), opts))
      }
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'color_chase': {
      for (let i = 0; i <= n; i++) {
        const set = new Set<number>()
        for (let j = 0; j < i; j++) set.add(j)
        frames.push(buildMultiHighlightFrame(text, set, opts))
      }
      pushHold(frames, endHi(), hold)
      break
    }
    case 'scanline': {
      const width = Math.max(2, Math.min(4, Math.ceil(n / 4) || 2))
      for (let i = -width; i < n; i++) {
        const set = new Set<number>()
        for (let j = i; j < i + width; j++) {
          if (j >= 0 && j < n) set.add(j)
        }
        frames.push(buildMultiHighlightFrame(text, set, opts))
      }
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'glow': {
      const steps = 2 + n
      for (let s = 0; s < steps; s++) frames.push(buildGlowFrame(text, s, opts))
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'glow_bounce': {
      const steps = 2 + n
      for (let s = 0; s < steps; s++) frames.push(buildGlowFrame(text, s, opts))
      for (let s = steps - 2; s >= 0; s--) frames.push(buildGlowFrame(text, s, opts))
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'glow_fill': {
      for (let i = 0; i <= n; i++) frames.push(buildGlowFillFrame(text, i, opts))
      pushHold(frames, endHi(), hold)
      break
    }
    case 'ping_pong_fill': {
      for (let i = 0; i <= n; i++) frames.push(buildGlowFillFrame(text, i, opts))
      for (let i = n - 1; i >= 0; i--) frames.push(buildGlowFillFrame(text, i, opts))
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'typewriter': {
      for (let i = 1; i <= n; i++) {
        frames.push(buildFullGradientFrame(chars.slice(0, i).join(''), opts))
      }
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'typewriter_delete': {
      for (let i = 1; i <= n; i++) {
        frames.push(buildFullGradientFrame(chars.slice(0, i).join(''), opts))
      }
      pushHold(frames, endGrad(), Math.max(2, Math.floor(hold / 2)))
      for (let i = n - 1; i >= 1; i--) {
        frames.push(buildFullGradientFrame(chars.slice(0, i).join(''), opts))
      }
      frames.push('&r')
      break
    }
    case 'typewriter_reverse': {
      for (let i = 1; i <= n; i++) {
        frames.push(buildFullGradientFrame(chars.slice(n - i).join(''), opts))
      }
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'erase': {
      pushHold(frames, endGrad(), Math.max(1, Math.floor(hold / 2)))
      for (let i = n; i >= 0; i--) {
        frames.push(buildFullGradientFrame(chars.slice(0, i).join(''), opts))
      }
      break
    }
    case 'scatter_in': {
      const order = scatterOrder(n)
      const visible = new Set<number>()
      frames.push(buildMaskedTextFrame(text, visible, opts))
      for (const idx of order) {
        visible.add(idx)
        frames.push(buildMaskedTextFrame(text, new Set(visible), opts))
      }
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'explode': {
      pushHold(frames, endGrad(), Math.max(1, Math.floor(hold / 3)))
      const order = scatterOrder(n)
      const visible = new Set(order)
      for (const idx of order) {
        visible.delete(idx)
        frames.push(buildMaskedTextFrame(text, new Set(visible), opts, '·'))
      }
      frames.push(buildMaskedTextFrame(text, new Set(), opts, '·'))
      for (const idx of order) {
        visible.add(idx)
        frames.push(buildMaskedTextFrame(text, new Set(visible), opts, '·'))
      }
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'strike_reveal': {
      for (let i = 0; i <= n; i++) frames.push(buildStrikeRevealFrame(text, i, opts))
      pushHold(frames, buildStrikeRevealFrame(text, n, opts), hold)
      break
    }
    case 'strike_wave': {
      for (let i = 0; i < n; i++) {
        let body = ''
        for (let j = 0; j < n; j++) {
          body += chars[j]
          if (j === i) body += STRIKE
        }
        frames.push(buildFullGradientFrame(body, opts))
      }
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'corrupt': {
      for (let i = 0; i <= n; i++) frames.push(buildCorruptFrame(text, i, opts))
      for (let i = n; i >= 0; i--) frames.push(buildCorruptFrame(text, i, opts))
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'scramble': {
      const steps = Math.max(n * 2, 8)
      for (let s = 0; s < steps; s++) {
        const resolved = Math.floor((s / steps) * n)
        const body = chars
          .map((ch, i) => {
            if (i < resolved) return ch
            const r = hash32(s * 31 + i * 17)
            return SCRAMBLE_POOL[r % SCRAMBLE_POOL.length]!
          })
          .join('')
        frames.push(buildFullGradientFrame(body, opts))
      }
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'matrix': {
      const steps = Math.max(n * 2, 10)
      for (let s = 0; s < steps; s++) {
        const resolved = Math.floor((s / steps) * n)
        const body = chars
          .map((ch, i) => {
            if (i < resolved) return ch
            const r = hash32(s * 97 + i * 13 + 7)
            return MATRIX_POOL[r % MATRIX_POOL.length]!
          })
          .join('')
        frames.push(
          buildPerCharColorsFrame(
            body,
            (i) =>
              i < resolved
                ? lerpRgb(opts.colorA, opts.colorB, n <= 1 ? 0 : i / (n - 1))
                : opts.colorHighlight,
            opts
          )
        )
      }
      pushHold(frames, endGrad(), hold)
      break
    }
    case 'glitch': {
      const steps = Math.max(16, Math.min(40, hold || 20))
      for (let s = 0; s < steps; s++) {
        frames.push(
          buildPerCharColorsFrame(
            text,
            (i) => {
              const r = hash32(s * 101 + i * 19) % 3
              return r === 0
                ? opts.colorA
                : r === 1
                  ? opts.colorB
                  : opts.colorHighlight
            },
            opts
          )
        )
      }
      pushHold(frames, endGrad(), Math.max(2, Math.floor(hold / 2)))
      break
    }
    case 'sparkle': {
      const steps = Math.max(16, Math.min(48, (hold || 12) * 2))
      for (let s = 0; s < steps; s++) {
        const set = new Set<number>()
        if (n > 0) {
          set.add(hash32(s * 3 + 1) % n)
          if (n > 2) set.add(hash32(s * 7 + 5) % n)
        }
        frames.push(buildMultiHighlightFrame(text, set, opts))
      }
      pushHold(frames, endGrad(), Math.max(2, Math.floor(hold / 2)))
      break
    }
    case 'neon_flicker': {
      const steps = Math.max(12, Math.min(36, hold || 16))
      for (let s = 0; s < steps; s++) {
        const r = hash32(s * 53)
        if (r % 5 === 0) frames.push(endHi())
        else if (r % 7 === 0) frames.push(buildSolidFrame(text, opts.colorB, opts))
        else frames.push(endGrad())
      }
      pushHold(frames, endGrad(), Math.max(2, Math.floor(hold / 2)))
      break
    }
    case 'rainbow': {
      const steps = Math.max(12, Math.min(48, hold || 24))
      for (let s = 0; s < steps; s++) {
        frames.push(buildRainbowFrame(text, (s / steps) * 360, opts))
      }
      break
    }
    case 'rainbow_wave': {
      const steps = Math.max(16, Math.min(48, hold || 24))
      for (let s = 0; s < steps; s++) {
        const hueBase = (s / steps) * 360
        frames.push(
          buildPerCharColorsFrame(
            text,
            (i) => {
              const hue = (hueBase + (i / Math.max(1, n)) * 360) % 360
              const c = hslToRgbSimple(hue, 90, 55)
              const wave = Math.sin((s / steps) * Math.PI * 2 + i * 0.7)
              return wave > 0.55 ? opts.colorHighlight : c
            },
            opts
          )
        )
      }
      break
    }
    case 'gradient_slide': {
      const steps = Math.max(16, Math.min(48, hold || 24))
      for (let s = 0; s < steps; s++) {
        const offset = s / steps
        frames.push(
          buildPerCharColorsFrame(
            text,
            (i) => {
              const t = (i / Math.max(1, n - 1) + offset) % 1
              if (t < 0.5) return lerpRgb(opts.colorA, opts.colorHighlight, t * 2)
              return lerpRgb(opts.colorHighlight, opts.colorB, (t - 0.5) * 2)
            },
            opts
          )
        )
      }
      break
    }
    case 'pulse': {
      const steps = Math.max(12, Math.min(40, hold || 16))
      for (let s = 0; s < steps; s++) {
        const t = (Math.sin((s / steps) * Math.PI * 2) + 1) / 2
        frames.push(
          buildSolidFrame(text, lerpRgb(opts.colorA, opts.colorHighlight, t), opts)
        )
      }
      break
    }
    case 'breathe': {
      const steps = Math.max(16, Math.min(48, hold || 24))
      for (let s = 0; s < steps; s++) {
        const t = (Math.sin((s / steps) * Math.PI * 2) + 1) / 2
        const c1 = lerpRgb(opts.colorA, opts.colorB, t)
        const c2 = lerpRgb(opts.colorB, opts.colorHighlight, t)
        frames.push(
          withBold(tabGradientWrap(c1, c2, text, opts.lowercaseHex), opts.bold)
        )
      }
      break
    }
    case 'blink': {
      const a = endGrad()
      const b = endHi()
      const pairs = Math.max(2, Math.min(40, hold || 8))
      for (let i = 0; i < pairs; i++) frames.push(i % 2 === 0 ? a : b)
      break
    }
    case 'flash': {
      const a = endGrad()
      const b = endHi()
      frames.push(a, b, a, b, a)
      pushHold(frames, a, hold)
      break
    }
    case 'heartbeat': {
      const a = endGrad()
      const b = endHi()
      const beats = Math.max(2, Math.min(8, Math.ceil(hold / 4) || 3))
      for (let i = 0; i < beats; i++) {
        frames.push(b, a, b, a, a, a)
      }
      pushHold(frames, a, Math.max(2, Math.floor(hold / 2)))
      break
    }
    case 'strobe': {
      const a = endGrad()
      const b = endHi()
      const pairs = Math.max(8, Math.min(60, (hold || 10) * 2))
      for (let i = 0; i < pairs; i++) frames.push(i % 2 === 0 ? a : b)
      break
    }
    case 'marquee': {
      const pad = '   '
      const track = [...(pad + text + pad)]
      const window = Math.max(text.length + 2, Math.min(track.length, text.length + 6))
      const steps = track.length
      for (let s = 0; s < steps; s++) {
        const slice: string[] = []
        for (let i = 0; i < window; i++) {
          slice.push(track[(s + i) % track.length]!)
        }
        frames.push(buildFullGradientFrame(slice.join(''), opts))
      }
      break
    }
    case 'static':
    default: {
      const line = endGrad()
      const count = Math.max(1, Math.min(60, Math.round(opts.staticRepeats)))
      for (let i = 0; i < count; i++) frames.push(line)
      break
    }
  }

  const empties = Math.max(0, Math.min(20, Math.round(opts.emptyLines)))
  for (let i = 0; i < empties; i++) frames.push('&r')

  return frames
}

export function framesToTabYaml(
  keyName: string,
  changeIntervalMs: number,
  frames: string[]
): string {
  const key = (keyName.trim() || 'animation').replace(/[:#{}[\],&*?|>!%@`']/g, '_')
  const interval = Math.max(20, Math.min(60_000, Math.round(changeIntervalMs)))
  const lines = [
    `${key}:`,
    `  change-interval: ${interval}`,
    `  texts:`,
    ...frames.map((f) => {
      if (f.includes('"') && !f.includes("'")) {
        return `  - '${f.replace(/'/g, "''")}'`
      }
      return `  - "${yamlEscape(f)}"`
    }),
  ]
  return lines.join('\n')
}

export function generateTabYaml(opts: TabGeneratorOptions): string {
  return framesToTabYaml(
    opts.keyName,
    opts.changeIntervalMs,
    generateTabFrames(opts)
  )
}

export type TabPreviewSegment = {
  char: string
  color: string
  bold: boolean
}

const LEGACY_COLORS: Record<string, string> = {
  '0': '#000000',
  '1': '#0000aa',
  '2': '#00aa00',
  '3': '#00aaaa',
  '4': '#aa0000',
  '5': '#aa00aa',
  '6': '#ffaa00',
  '7': '#aaaaaa',
  '8': '#555555',
  '9': '#5555ff',
  a: '#55ff55',
  b: '#55ffff',
  c: '#ff5555',
  d: '#ff55ff',
  e: '#ffff55',
  f: '#ffffff',
}

/**
 * Stateful parser: `<#hex>`, `{#hex}`, `</#hex>`, §/& codes → preview segments.
 */
export function parseTabFramePreview(frame: string): TabPreviewSegment[] {
  if (!frame || frame === '&r' || frame === '§r') return []

  const out: TabPreviewSegment[] = []
  let i = 0
  let color = '#e4e4e7'
  let endColor: string | null = null
  let bold = false
  let gradientBuf: string[] = []

  const flushGradient = () => {
    if (gradientBuf.length === 0) return
    const start = hexToRgb(color.replace('#', '')) ?? { r: 228, g: 228, b: 231 }
    const end =
      (endColor && hexToRgb(endColor.replace('#', ''))) || start
    for (let k = 0; k < gradientBuf.length; k++) {
      const t = gradientBuf.length === 1 ? 0 : k / (gradientBuf.length - 1)
      const c = lerpRgb(start, end, t)
      out.push({
        char: gradientBuf[k]!,
        color: `#${rgbToHexString(c)}`,
        bold,
      })
    }
    gradientBuf = []
    endColor = null
  }

  const pushChar = (ch: string) => {
    if (endColor) {
      gradientBuf.push(ch)
      return
    }
    out.push({ char: ch, color, bold })
  }

  while (i < frame.length) {
    if (frame[i] === '{' && frame.slice(i, i + 2) === '{#') {
      flushGradient()
      const m = frame.slice(i).match(/^\{#([0-9a-fA-F]{6})\}/)
      if (m) {
        color = `#${m[1]}`
        endColor = null
        i += m[0].length
        continue
      }
    }
    if (frame[i] === '<' && frame.slice(i, i + 2) === '<#') {
      flushGradient()
      const open = frame.slice(i).match(/^<#([0-9a-fA-F]{6})>/)
      if (open) {
        color = `#${open[1]}`
        endColor = null
        i += open[0].length
        if (frame.slice(i, i + 2) === '§l' || frame.slice(i, i + 2) === '&l') {
          bold = true
          i += 2
        }
        const closeRe = /<\/#([0-9a-fA-F]{6})>/
        const rest = frame.slice(i)
        const close = rest.match(closeRe)
        if (close && close.index !== undefined) {
          const inner = rest.slice(0, close.index)
          const closeHex = close[1]!
          endColor = `#${closeHex}`
          let j = 0
          while (j < inner.length) {
            if (inner.slice(j, j + 2) === '§l' || inner.slice(j, j + 2) === '&l') {
              bold = true
              j += 2
              continue
            }
            if (/^[§&][0-9a-fk-or]/i.test(inner.slice(j, j + 2))) {
              const code = inner[j + 1]!.toLowerCase()
              if (LEGACY_COLORS[code]) color = LEGACY_COLORS[code]!
              if (code === 'l') bold = true
              if (code === 'r') bold = false
              j += 2
              continue
            }
            gradientBuf.push(inner[j]!)
            j++
          }
          endColor = `#${closeHex}`
          if (open[1]!.toLowerCase() === closeHex.toLowerCase()) {
            endColor = null
            for (const ch of gradientBuf) {
              out.push({ char: ch, color: `#${open[1]}`, bold })
            }
            gradientBuf = []
          } else {
            flushGradient()
          }
          i += close.index + close[0].length
          continue
        }
        continue
      }
    }
    if (frame.slice(i, i + 3) === '</#') {
      flushGradient()
      const m = frame.slice(i).match(/^<\/#([0-9a-fA-F]{6})>/)
      if (m) {
        i += m[0].length
        continue
      }
    }
    if ((frame[i] === '§' || frame[i] === '&') && i + 1 < frame.length) {
      flushGradient()
      const code = frame[i + 1]!.toLowerCase()
      if (LEGACY_COLORS[code]) {
        color = LEGACY_COLORS[code]!
        endColor = null
      }
      if (code === 'l') bold = true
      if (code === 'r') {
        bold = false
        color = '#e4e4e7'
      }
      i += 2
      continue
    }

    pushChar(frame[i]!)
    i++
  }
  flushGradient()
  return out.filter((s) => s.char !== '\n')
}
