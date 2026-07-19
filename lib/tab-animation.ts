import {
  hexToRgb,
  lerpRgb,
  rgbToHexString,
  type RGBColor,
} from '@/lib/rgb-generator'

export type TabAnimMode =
  | 'wave'
  | 'wave_bounce'
  | 'typewriter'
  | 'blink'
  | 'static'
  | 'flash'

export const TAB_ANIM_MODES: TabAnimMode[] = [
  'wave',
  'wave_bounce',
  'typewriter',
  'blink',
  'static',
  'flash',
]

export type TabGeneratorOptions = {
  keyName: string
  text: string
  mode: TabAnimMode
  /** Base / gradient start */
  colorA: RGBColor
  /** Gradient end (or second base) */
  colorB: RGBColor
  /** Highlight / accent */
  colorHighlight: RGBColor
  changeIntervalMs: number
  /** Extra hold frames after animation (wave / typewriter) */
  holdFrames: number
  /** How many times to repeat the same static line */
  staticRepeats: number
  /** Trailing empty `&r` lines (like header spacer) */
  emptyLines: number
  bold: boolean
  lowercaseHex: boolean
}

function hex(c: RGBColor, lower: boolean): string {
  return rgbToHexString(c, lower)
}

/** TAB MiniMessage-style solid color wrap */
export function tabColorWrap(color: RGBColor, text: string, lower: boolean): string {
  if (!text) return ''
  const h = hex(color, lower)
  return `<#${h}>${text}</#${h}>`
}

/** TAB gradient wrap: `<#start>text</#end>` */
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
  // Match common TAB configs: §l right after color open
  return inner.replace(/^(<#[0-9a-fA-F]{6}>)/, '$1§l')
}

function yamlEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/** Build one wave frame: highlight character at index. */
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
    parts.push(
      tabGradientWrap(opts.colorA, opts.colorB, before, opts.lowercaseHex)
    )
  }
  parts.push(tabColorWrap(opts.colorHighlight, mid, opts.lowercaseHex))
  if (after) {
    parts.push(
      tabGradientWrap(opts.colorA, opts.colorB, after, opts.lowercaseHex)
    )
  }
  return withBold(parts.join(''), opts.bold)
}

function buildFullGradientFrame(
  text: string,
  opts: Pick<
    TabGeneratorOptions,
    'colorA' | 'colorB' | 'bold' | 'lowercaseHex'
  >
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

export function generateTabFrames(opts: TabGeneratorOptions): string[] {
  const text = opts.text
  const chars = [...text]
  const frames: string[] = []
  const hold = Math.max(0, Math.min(120, Math.round(opts.holdFrames)))

  switch (opts.mode) {
    case 'wave': {
      if (chars.length === 0) break
      for (let i = 0; i < chars.length; i++) {
        frames.push(buildWaveFrame(text, i, opts))
      }
      const end = buildFullGradientFrame(text, opts)
      for (let h = 0; h < hold; h++) frames.push(end)
      break
    }
    case 'wave_bounce': {
      if (chars.length === 0) break
      for (let i = 0; i < chars.length; i++) {
        frames.push(buildWaveFrame(text, i, opts))
      }
      for (let i = chars.length - 2; i >= 1; i--) {
        frames.push(buildWaveFrame(text, i, opts))
      }
      const end = buildFullGradientFrame(text, opts)
      for (let h = 0; h < hold; h++) frames.push(end)
      break
    }
    case 'typewriter': {
      if (chars.length === 0) break
      for (let i = 1; i <= chars.length; i++) {
        const slice = chars.slice(0, i).join('')
        frames.push(buildFullGradientFrame(slice, opts))
      }
      const end = buildFullGradientFrame(text, opts)
      for (let h = 0; h < hold; h++) frames.push(end)
      break
    }
    case 'blink': {
      const a = buildFullGradientFrame(text, opts)
      const b = buildHighlightAllFrame(text, opts)
      const pairs = Math.max(2, Math.min(40, hold || 8))
      for (let i = 0; i < pairs; i++) {
        frames.push(i % 2 === 0 ? a : b)
      }
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
  const key = (keyName.trim() || 'animation').replace(/[:#{}[\],&*?|>!%@`]/g, '_')
  const interval = Math.max(20, Math.min(60_000, Math.round(changeIntervalMs)))
  const lines = [
    `${key}:`,
    `  change-interval: ${interval}`,
    `  texts:`,
    ...frames.map((f) => `  - "${yamlEscape(f)}"`),
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

const FORMAT_CODE_RE = /§[0-9a-fk-or]|§l|&[0-9a-fk-or]|&l/gi

function pushPlainText(raw: string, out: TabPreviewSegment[]): void {
  const bold = /§l|&l/i.test(raw)
  const clean = raw.replace(FORMAT_CODE_RE, '')
  for (const char of clean) {
    if (char === '\n') continue
    out.push({ char, color: '#e4e4e7', bold })
  }
}

/**
 * Parse a TAB frame (`<#aabbcc>…</#ddeeff>`, §l, &r) into colored preview chars.
 */
export function parseTabFramePreview(frame: string): TabPreviewSegment[] {
  if (!frame || frame === '&r' || frame === '§r') return []

  const out: TabPreviewSegment[] = []
  const re = /<#([0-9a-fA-F]{6})>([\s\S]*?)<\/#([0-9a-fA-F]{6})>/gi
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(frame)) !== null) {
    if (m.index > last) {
      pushPlainText(frame.slice(last, m.index), out)
    }
    const start = hexToRgb(m[1]!)
    const end = hexToRgb(m[3]!)
    const raw = m[2] ?? ''
    const bold = /§l|&l/i.test(raw)
    const clean = raw.replace(FORMAT_CODE_RE, '')
    const chars = [...clean]
    if (start && end && chars.length > 0) {
      for (let i = 0; i < chars.length; i++) {
        const t = chars.length === 1 ? 0 : i / (chars.length - 1)
        const c = lerpRgb(start, end, t)
        out.push({
          char: chars[i]!,
          color: `#${rgbToHexString(c)}`,
          bold,
        })
      }
    } else {
      pushPlainText(raw, out)
    }
    last = m.index + m[0].length
  }

  if (last < frame.length) {
    pushPlainText(frame.slice(last), out)
  }

  return out
}
