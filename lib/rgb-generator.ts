export type CodeFormat =
  | 'ampersand'
  | 'section'
  | 'hex'
  | 'minimessage'
  | 'bracket_hex'
  | 'json'
  | 'bbcode'

export interface FormattingOptions {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  obfuscated: boolean
}

export interface RGBColor {
  r: number
  g: number
  b: number
}

// Minecraft color codes
export const MINECRAFT_COLORS = {
  black: { r: 0, g: 0, b: 0 },
  darkBlue: { r: 0, g: 0, b: 170 },
  darkGreen: { r: 0, g: 170, b: 0 },
  darkAqua: { r: 0, g: 170, b: 170 },
  darkRed: { r: 170, g: 0, b: 0 },
  darkPurple: { r: 170, g: 0, b: 170 },
  gold: { r: 255, g: 170, b: 0 },
  gray: { r: 170, g: 170, b: 170 },
  darkGray: { r: 85, g: 85, b: 85 },
  blue: { r: 85, g: 85, b: 255 },
  green: { r: 85, g: 255, b: 85 },
  aqua: { r: 85, g: 255, b: 255 },
  red: { r: 255, g: 85, b: 85 },
  lightPurple: { r: 255, g: 85, b: 255 },
  yellow: { r: 255, g: 255, b: 85 },
  white: { r: 255, g: 255, b: 255 },
}

const FORMAT_CODES = {
  bold: { ampersand: '&l', section: '§l', hex: '&l', bracket_hex: '&l', bbcode: '', json: '' },
  italic: { ampersand: '&o', section: '§o', hex: '&o', bracket_hex: '&o', bbcode: '', json: '' },
  underline: { ampersand: '&n', section: '§n', hex: '&n', bracket_hex: '&n', bbcode: '', json: '' },
  strikethrough: { ampersand: '&m', section: '§m', hex: '&m', bracket_hex: '&m', bbcode: '', json: '' },
  obfuscated: { ampersand: '&k', section: '§k', hex: '&k', bracket_hex: '&k', bbcode: '', json: '' },
  reset: { ampersand: '&r', section: '§r', hex: '&r', bracket_hex: '&r', bbcode: '', json: '' },
}

function rgbToHex(r: number, g: number, b: number, lowercase = false): string {
  const h = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  return lowercase ? h.toLowerCase() : h
}

export function rgbToHexString(color: RGBColor, lowercase = false): string {
  return rgbToHex(color.r, color.g, color.b, lowercase)
}

export function hexToRgb(hex: string): RGBColor | null {
  const h = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function generateColorCode(
  color: RGBColor,
  format: CodeFormat,
  lowercaseHex = false
): string {
  const hex = rgbToHex(color.r, color.g, color.b, lowercaseHex)
  const hexDigits = hex.split('')

  switch (format) {
    case 'ampersand':
    case 'hex':
      return `&x&${hexDigits[0]}&${hexDigits[1]}&${hexDigits[2]}&${hexDigits[3]}&${hexDigits[4]}&${hexDigits[5]}`
    case 'section':
      return `§x§${hexDigits[0]}§${hexDigits[1]}§${hexDigits[2]}§${hexDigits[3]}§${hexDigits[4]}§${hexDigits[5]}`
    case 'minimessage':
      return `<color:#${hex}>`
    case 'bracket_hex':
      return `<#${hex}>`
    case 'json':
    case 'bbcode':
      return ''
    default:
      return ''
  }
}

function generateLegacyFormatCodes(options: FormattingOptions, format: CodeFormat): string {
  if (format === 'json' || format === 'bbcode' || format === 'minimessage') return ''
  const codes: string[] = []
  const f = format === 'hex' ? 'ampersand' : format
  type LegacyKey = 'ampersand' | 'section' | 'bracket_hex'
  const key = (f === 'section' ? 'section' : f === 'bracket_hex' ? 'bracket_hex' : 'ampersand') as LegacyKey
  if (options.bold) codes.push(FORMAT_CODES.bold[key])
  if (options.italic) codes.push(FORMAT_CODES.italic[key])
  if (options.underline) codes.push(FORMAT_CODES.underline[key])
  if (options.strikethrough) codes.push(FORMAT_CODES.strikethrough[key])
  if (options.obfuscated) codes.push(FORMAT_CODES.obfuscated[key])
  return codes.join('')
}

function minimessageWrapInner(text: string, options: FormattingOptions): string {
  if (!text) return ''
  let s = text
  if (options.obfuscated) s = `<obfuscated>${s}</obfuscated>`
  if (options.strikethrough) s = `<strikethrough>${s}</strikethrough>`
  if (options.underline) s = `<underlined>${s}</underlined>`
  if (options.italic) s = `<italic>${s}</italic>`
  if (options.bold) s = `<bold>${s}</bold>`
  return s
}

function minimessageGradientTag(colors: RGBColor[], lowercaseHex: boolean): string {
  return colors.map((c) => `#${rgbToHexString(c, lowercaseHex)}`).join(':')
}

export function generateMinimessageGradientOutput(
  text: string,
  colors: RGBColor[],
  options: FormattingOptions,
  lowercaseHex: boolean
): string {
  if (!text || colors.length < 2) return ''
  const stops = minimessageGradientTag(colors, lowercaseHex)
  const inner = minimessageWrapInner(text, options)
  return `<gradient:${stops}>${inner}</gradient>`
}

export function generateRainbowGradient(
  text: string,
  format: CodeFormat,
  options: FormattingOptions,
  lowercaseHex = false
): string {
  if (!text) return ''

  if (format === 'minimessage') {
    const chars = text.split('')
    const result: string[] = []
    chars.forEach((char, index) => {
      if (char === ' ') {
        result.push(char)
        return
      }
      const hue = (index * 360) / chars.length
      const color = hslToRgb(hue, 100, 50)
      const hex = rgbToHex(color.r, color.g, color.b, lowercaseHex)
      const inner = minimessageWrapInner(char, options)
      result.push(`<color:#${hex}>${inner}</color>`)
    })
    return result.join('')
  }

  if (format === 'json') {
    return generateJsonColored(
      text,
      (_, index, len) => {
        const hue = (index * 360) / Math.max(len, 1)
        return hslToRgb(hue, 100, 50)
      },
      options,
      lowercaseHex
    )
  }

  if (format === 'bbcode') {
    const chars = text.split('')
    const parts = chars.map((char, index) => {
      if (char === ' ') return ' '
      const hue = (index * 360) / chars.length
      const c = hslToRgb(hue, 100, 50)
      const h = rgbToHexString(c, lowercaseHex)
      return `[COLOR=#${h}]${char}[/COLOR]`
    })
    return wrapBbcodeFormatting(parts.join(''), options)
  }

  const chars = text.split('')
  const result: string[] = []
  chars.forEach((char, index) => {
    if (char === ' ') {
      result.push(char)
      return
    }
    const hue = (index * 360) / chars.length
    const color = hslToRgb(hue, 100, 50)
    const colorCode = generateColorCode(color, format, lowercaseHex)
    const formatCodes = generateLegacyFormatCodes(options, format)
    result.push(`${colorCode}${formatCodes}${char}`)
  })
  return result.join('')
}

export function hslToRgb(h: number, s: number, l: number): RGBColor {
  h /= 360
  s /= 100
  l /= 100
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

export function generateSingleColor(
  text: string,
  color: RGBColor,
  format: CodeFormat,
  options: FormattingOptions,
  lowercaseHex = false
): string {
  if (!text) return ''

  if (format === 'minimessage') {
    const hex = rgbToHexString(color, lowercaseHex)
    const inner = minimessageWrapInner(text, options)
    return `<color:#${hex}>${inner}</color>`
  }

  if (format === 'json') {
    return generateJsonColored(
      text,
      () => color,
      options,
      lowercaseHex
    )
  }

  if (format === 'bbcode') {
    const h = rgbToHexString(color, lowercaseHex)
    const inner = wrapBbcodeFormatting(`[COLOR=#${h}]${text}[/COLOR]`, options)
    return inner
  }

  const colorCode = generateColorCode(color, format, lowercaseHex)
  const formatCodes = generateLegacyFormatCodes(options, format)
  return `${colorCode}${formatCodes}${text}`
}

export function generateRandomColor(): RGBColor {
  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  }
}

export function lerpRgb(a: RGBColor, b: RGBColor, t: number): RGBColor {
  const u = Math.max(0, Math.min(1, t))
  return {
    r: Math.round(a.r + (b.r - a.r) * u),
    g: Math.round(a.g + (b.g - a.g) * u),
    b: Math.round(a.b + (b.b - a.b) * u),
  }
}

export function sampleRgbGradientStops(position01: number, colors: RGBColor[]): RGBColor {
  if (colors.length === 0) return { r: 200, g: 200, b: 210 }
  if (colors.length === 1) return colors[0]
  const u = Math.max(0, Math.min(1, position01))
  const f = u * (colors.length - 1)
  const j = Math.floor(f)
  const t = f - j
  const c0 = colors[j]!
  const c1 = colors[Math.min(j + 1, colors.length - 1)]!
  return lerpRgb(c0, c1, t)
}

export function smoothGradientColorAtIndex(
  index: number,
  textLength: number,
  colors: RGBColor[]
): RGBColor {
  if (textLength <= 1) return sampleRgbGradientStops(0.5, colors)
  return sampleRgbGradientStops(index / (textLength - 1), colors)
}

export function generateRandomGradientColors(): RGBColor[] {
  const count = Math.floor(Math.random() * 5) + 2
  const colors: RGBColor[] = []
  for (let i = 0; i < count; i++) {
    colors.push(generateRandomColor())
  }
  return colors
}

function generateJsonColored(
  text: string,
  colorAt: (char: string, index: number, len: number) => RGBColor | null,
  options: FormattingOptions,
  lowercaseHex: boolean
): string {
  const chars = text.split('')
  const extra = chars.map((char, index) => {
    const o: Record<string, unknown> = { text: char === '\n' ? '\n' : char }
    const col = colorAt(char, index, chars.length)
    if (col && char !== ' ' && char !== '\n') {
      o.color = `#${rgbToHexString(col, lowercaseHex)}`
    }
    if (options.bold) o.bold = true
    if (options.italic) o.italic = true
    if (options.underline) o.underlined = true
    if (options.strikethrough) o.strikethrough = true
    if (options.obfuscated) o.obfuscated = true
    return o
  })
  return JSON.stringify({ extra })
}

function wrapBbcodeFormatting(coloredInner: string, options: FormattingOptions): string {
  let s = coloredInner
  if (options.strikethrough) s = `[S]${s}[/S]`
  if (options.underline) s = `[U]${s}[/U]`
  if (options.italic) s = `[I]${s}[/I]`
  if (options.bold) s = `[B]${s}[/B]`
  return s
}

export function generateGradientText(
  text: string,
  colors: RGBColor[],
  format: CodeFormat,
  options: FormattingOptions,
  charsPerColor = 1,
  lowercaseHex = false
): string {
  if (!text || colors.length === 0) return ''

  const chars = text.split('')
  const cpc = Math.max(1, charsPerColor)
  const banded = cpc > 1

  if (format === 'minimessage' && !banded && colors.length >= 2) {
    return generateMinimessageGradientOutput(text, colors, options, lowercaseHex)
  }

  if (format === 'json') {
    return generateJsonColored(
      text,
      (char, index) => {
        if (char === ' ' || char === '\n') return null
        return banded
          ? colors[Math.floor(index / cpc) % colors.length]!
          : smoothGradientColorAtIndex(index, chars.length, colors)
      },
      options,
      lowercaseHex
    )
  }

  if (format === 'bbcode') {
    const parts = chars.map((char, index) => {
      if (char === ' ' || char === '\n') return char
      const color = banded
        ? colors[Math.floor(index / cpc) % colors.length]!
        : smoothGradientColorAtIndex(index, chars.length, colors)
      const h = rgbToHexString(color, lowercaseHex)
      return `[COLOR=#${h}]${char}[/COLOR]`
    })
    return wrapBbcodeFormatting(parts.join(''), options)
  }

  const result: string[] = []
  chars.forEach((char, index) => {
    if (char === ' ') {
      result.push(char)
      return
    }
    const color = banded
      ? colors[Math.floor(index / cpc) % colors.length]!
      : smoothGradientColorAtIndex(index, chars.length, colors)
    const colorCode = generateColorCode(color, format, lowercaseHex)
    const formatCodes = generateLegacyFormatCodes(options, format)

    if (format === 'minimessage') {
      const inner = minimessageWrapInner(char, options)
      result.push(`${colorCode}${inner}</color>`)
    } else {
      result.push(`${colorCode}${formatCodes}${char}`)
    }
  })
  return result.join('')
}

export interface PreviewSegment {
  char: string
  color: RGBColor
}

export function buildPreviewSegments(
  text: string,
  selectedColor: RGBColor | null,
  gradientColors: RGBColor[],
  useGradient: boolean,
  useRainbow: boolean,
  charsPerColor = 1
): PreviewSegment[] {
  if (!text) return []

  const spaceColor: RGBColor = { r: 120, g: 120, b: 130 }
  const plainColor: RGBColor = { r: 210, g: 215, b: 230 }

  if (!useRainbow && !useGradient && !selectedColor) {
    return text.split('').map((char) => ({
      char,
      color: char === ' ' ? spaceColor : plainColor,
    }))
  }

  if (useRainbow) {
    const chars = text.split('')
    return chars.map((char, index) => {
      if (char === ' ') return { char: ' ', color: spaceColor }
      const hue = (index * 360) / Math.max(chars.length, 1)
      return { char, color: hslToRgb(hue, 100, 50) }
    })
  }

  if (useGradient && gradientColors.length > 0) {
    const chars = text.split('')
    const cpc = Math.max(1, charsPerColor)
    const banded = cpc > 1
    return chars.map((char, index) => {
      const color = banded
        ? (() => {
            if (char === ' ') return spaceColor
            const colorIndex = Math.floor(index / cpc) % gradientColors.length
            return gradientColors[colorIndex] ?? gradientColors[gradientColors.length - 1]
          })()
        : smoothGradientColorAtIndex(index, chars.length, gradientColors)
      return { char, color }
    })
  }

  if (selectedColor) {
    return text.split('').map((char) => ({
      char,
      color: char === ' ' ? spaceColor : selectedColor,
    }))
  }

  return text.split('').map((char) => ({
    char,
    color: char === ' ' ? spaceColor : plainColor,
  }))
}
