import {
  hexToRgb,
  lerpRgb,
  rgbToHexString,
  type RGBColor,
} from '@/lib/rgb-generator'

export type TabAnimMode =
  | 'wave'
  | 'wave_bounce'
  | 'middle_out'
  | 'glow'
  | 'glow_fill'
  | 'typewriter'
  | 'strike_reveal'
  | 'corrupt'
  | 'rainbow'
  | 'blink'
  | 'flash'
  | 'static'

export const TAB_ANIM_MODES: TabAnimMode[] = [
  'wave',
  'wave_bounce',
  'middle_out',
  'glow',
  'glow_fill',
  'typewriter',
  'strike_reveal',
  'corrupt',
  'rainbow',
  'blink',
  'flash',
  'static',
]

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

const STRIKE = '\u0337' // combining short solidus overlay

export function buildWaveFrame(
  text: string,
  highlightIndex: number,
  opts: Pick<
    TabGeneratorOptions,
    'colorA' | 'colorB' | 'colorHighlight' | 'bold' | 'lowercaseHex'
  >
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

/** Glow trail like web1: `{#accent}` + `<#base>…</#end>` */
export function buildGlowFrame(
  text: string,
  step: number,
  opts: Pick<
    TabGeneratorOptions,
    'colorA' | 'colorB' | 'colorHighlight' | 'bold' | 'lowercaseHex'
  >
): string {
  const chars = [...text]
  if (chars.length === 0) return ''
  const L = opts.lowercaseHex
  const a = hex(opts.colorA, L)
  const b = hex(opts.colorB, L)
  const h = hex(opts.colorHighlight, L)
  const full = `<#${a}>${text}</#${b}>`

  // step 0: normal, 1: full glow, 2..n+1: char index 0..n-1
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

function buildStrikeRevealFrame(
  text: string,
  revealedCount: number,
  opts: Pick<TabGeneratorOptions, 'colorA' | 'colorB' | 'bold' | 'lowercaseHex'>
): string {
  const chars = [...text]
  const n = Math.max(0, Math.min(chars.length, revealedCount))
  let body = ''
  for (let i = 0; i < chars.length; i++) {
    body += chars[i]
    if (i >= n) body += STRIKE
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
  const n = Math.max(0, Math.min(chars.length, corruptCount))
  const mid = (chars.length - 1) / 2
  const out = chars
    .map((ch, i) => (Math.abs(i - mid) <= (n - 1) / 2 ? symbol : ch))
    .join('')
  return buildFullGradientFrame(out, opts)
}

function buildRainbowFrame(
  text: string,
  hueOffset: number,
  opts: Pick<TabGeneratorOptions, 'bold' | 'lowercaseHex'>
): string {
  const chars = [...text]
  if (chars.length === 0) return ''
  const parts: string[] = []
  for (let i = 0; i < chars.length; i++) {
    const hue = (hueOffset + (i / Math.max(1, chars.length)) * 360) % 360
    // HSL to rough RGB
    const c = hslToRgbSimple(hue, 90, 55)
    parts.push(tabColorWrap(c, chars[i]!, opts.lowercaseHex))
  }
  return withBold(parts.join(''), opts.bold)
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

export function generateTabFrames(opts: TabGeneratorOptions): string[] {
  if (opts.customFrames && opts.customFrames.length > 0) {
    return [...opts.customFrames]
  }

  const text = opts.text
  const chars = [...text]
  const frames: string[] = []
  const hold = Math.max(0, Math.min(120, Math.round(opts.holdFrames)))

  switch (opts.mode) {
    case 'wave': {
      for (let i = 0; i < chars.length; i++) frames.push(buildWaveFrame(text, i, opts))
      const end = buildFullGradientFrame(text, opts)
      for (let h = 0; h < hold; h++) frames.push(end)
      break
    }
    case 'wave_bounce': {
      for (let i = 0; i < chars.length; i++) frames.push(buildWaveFrame(text, i, opts))
      for (let i = chars.length - 2; i >= 1; i--) frames.push(buildWaveFrame(text, i, opts))
      const end = buildFullGradientFrame(text, opts)
      for (let h = 0; h < hold; h++) frames.push(end)
      break
    }
    case 'middle_out': {
      for (const i of middleOutOrder(chars.length)) {
        frames.push(buildWaveFrame(text, i, opts))
      }
      const end = buildFullGradientFrame(text, opts)
      for (let h = 0; h < hold; h++) frames.push(end)
      break
    }
    case 'glow': {
      const steps = 2 + chars.length
      for (let s = 0; s < steps; s++) frames.push(buildGlowFrame(text, s, opts))
      const end = buildFullGradientFrame(text, opts)
      for (let h = 0; h < hold; h++) frames.push(end)
      break
    }
    case 'glow_fill': {
      for (let i = 0; i <= chars.length; i++) {
        const left = chars.slice(0, i).join('')
        const right = chars.slice(i).join('')
        const L = opts.lowercaseHex
        const part =
          (left ? tabColorWrap(opts.colorHighlight, left, L) : '') +
          (right ? tabGradientWrap(opts.colorA, opts.colorB, right, L) : '')
        frames.push(withBold(part || buildFullGradientFrame(text, opts), opts.bold))
      }
      const end = buildHighlightAllFrame(text, opts)
      for (let h = 0; h < hold; h++) frames.push(end)
      break
    }
    case 'typewriter': {
      for (let i = 1; i <= chars.length; i++) {
        frames.push(buildFullGradientFrame(chars.slice(0, i).join(''), opts))
      }
      const end = buildFullGradientFrame(text, opts)
      for (let h = 0; h < hold; h++) frames.push(end)
      break
    }
    case 'strike_reveal': {
      for (let i = 0; i <= chars.length; i++) {
        frames.push(buildStrikeRevealFrame(text, i, opts))
      }
      for (let h = 0; h < hold; h++) {
        frames.push(buildStrikeRevealFrame(text, chars.length, opts))
      }
      break
    }
    case 'corrupt': {
      for (let i = 0; i <= chars.length; i++) {
        frames.push(buildCorruptFrame(text, i, opts))
      }
      for (let i = chars.length; i >= 0; i--) {
        frames.push(buildCorruptFrame(text, i, opts))
      }
      const end = buildFullGradientFrame(text, opts)
      for (let h = 0; h < hold; h++) frames.push(end)
      break
    }
    case 'rainbow': {
      const steps = Math.max(12, Math.min(48, hold || 24))
      for (let s = 0; s < steps; s++) {
        frames.push(buildRainbowFrame(text, (s / steps) * 360, opts))
      }
      break
    }
    case 'blink': {
      const a = buildFullGradientFrame(text, opts)
      const b = buildHighlightAllFrame(text, opts)
      const pairs = Math.max(2, Math.min(40, hold || 8))
      for (let i = 0; i < pairs; i++) frames.push(i % 2 === 0 ? a : b)
      break
    }
    case 'flash': {
      const a = buildFullGradientFrame(text, opts)
      const b = buildHighlightAllFrame(text, opts)
      frames.push(a, b, a, b, a)
      for (let h = 0; h < hold; h++) frames.push(a)
      break
    }
    case 'static':
    default: {
      const line = buildFullGradientFrame(text, opts)
      const n = Math.max(1, Math.min(60, Math.round(opts.staticRepeats)))
      for (let i = 0; i < n; i++) frames.push(line)
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
      // Prefer single quotes if string has " 
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
    // `{#RRGGBB}`
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
    // `<#RRGGBB>`
    if (frame[i] === '<' && frame.slice(i, i + 2) === '<#') {
      flushGradient()
      const open = frame.slice(i).match(/^<#([0-9a-fA-F]{6})>/)
      if (open) {
        color = `#${open[1]}`
        endColor = null
        // peek if we'll see a different close later — collect until close
        i += open[0].length
        // Check for §l right after
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
          // parse inner for nested simple chars (no nested tags usually)
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
          // If open === close, solid; else gradient
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
    // `</#RRGGBB>` stray
    if (frame.slice(i, i + 3) === '</#') {
      flushGradient()
      const m = frame.slice(i).match(/^<\/#([0-9a-fA-F]{6})>/)
      if (m) {
        i += m[0].length
        continue
      }
    }
    // §X or &X
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
