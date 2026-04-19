export type CodeFormat = 'ampersand' | 'section' | 'hex' | 'minimessage'

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

// Format codes
const FORMAT_CODES = {
  bold: { ampersand: '&l', section: '§l', hex: '&l', minimessage: '<bold>' },
  italic: { ampersand: '&o', section: '§o', hex: '&o', minimessage: '<italic>' },
  underline: { ampersand: '&n', section: '§n', hex: '&n', minimessage: '<underlined>' },
  strikethrough: { ampersand: '&m', section: '§m', hex: '&m', minimessage: '<strikethrough>' },
  obfuscated: { ampersand: '&k', section: '§k', hex: '&k', minimessage: '<obfuscated>' },
  reset: { ampersand: '&r', section: '§r', hex: '&r', minimessage: '<reset>' },
}

// Convert RGB to hex (6 chars, uppercase by default)
function rgbToHex(r: number, g: number, b: number, lowercase = false): string {
  const h = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  return lowercase ? h.toLowerCase() : h
}

/** Hex string without `#` prefix */
export function rgbToHexString(color: RGBColor, lowercase = false): string {
  return rgbToHex(color.r, color.g, color.b, lowercase)
}

export function hexToRgb(hex: string): RGBColor | null {
  const h = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

// Generate color code based on format
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
    default:
      return ''
  }
}

// Generate formatting codes
function generateFormatCodes(options: FormattingOptions, format: CodeFormat): string {
  const codes: string[] = []
  
  if (options.bold) codes.push(FORMAT_CODES.bold[format])
  if (options.italic) codes.push(FORMAT_CODES.italic[format])
  if (options.underline) codes.push(FORMAT_CODES.underline[format])
  if (options.strikethrough) codes.push(FORMAT_CODES.strikethrough[format])
  if (options.obfuscated) codes.push(FORMAT_CODES.obfuscated[format])
  
  return codes.join('')
}

// Generate closing tags for MiniMessage
function generateClosingTags(options: FormattingOptions): string {
  const tags: string[] = []
  
  if (options.obfuscated) tags.push('</obfuscated>')
  if (options.strikethrough) tags.push('</strikethrough>')
  if (options.underline) tags.push('</underlined>')
  if (options.italic) tags.push('</italic>')
  if (options.bold) tags.push('</bold>')
  
  return tags.join('')
}

// Generate rainbow gradient effect
export function generateRainbowGradient(
  text: string,
  format: CodeFormat,
  options: FormattingOptions,
  lowercaseHex = false
): string {
  if (!text) return ''
  
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
    const formatCodes = generateFormatCodes(options, format)
    
    if (format === 'minimessage') {
      result.push(`${colorCode}${formatCodes}${char}${generateClosingTags(options)}`)
    } else {
      result.push(`${colorCode}${formatCodes}${char}`)
    }
  })
  
  return result.join('')
}

// HSL to RGB conversion (exported for preview)
export function hslToRgb(h: number, s: number, l: number): RGBColor {
  h /= 360
  s /= 100
  l /= 100
  
  let r, g, b
  
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

// Generate single color text
export function generateSingleColor(
  text: string,
  color: RGBColor,
  format: CodeFormat,
  options: FormattingOptions,
  lowercaseHex = false
): string {
  if (!text) return ''
  
  const colorCode = generateColorCode(color, format, lowercaseHex)
  const formatCodes = generateFormatCodes(options, format)
  
  if (format === 'minimessage') {
    return `${colorCode}${formatCodes}${text}${generateClosingTags(options)}`
  }
  
  return `${colorCode}${formatCodes}${text}`
}

// Generate random color
export function generateRandomColor(): RGBColor {
  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  }
}

// Generate random gradient colors (1000+ variants)
export function generateRandomGradientColors(): RGBColor[] {
  const count = Math.floor(Math.random() * 5) + 2 // 2-6 colors
  const colors: RGBColor[] = []
  
  for (let i = 0; i < count; i++) {
    colors.push(generateRandomColor())
  }
  
  return colors
}

// Generate gradient text (banded: charsPerColor chars per color, then cycle)
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
  const result: string[] = []
  const cpc = Math.max(1, charsPerColor)
  
  chars.forEach((char, index) => {
    if (char === ' ') {
      result.push(char)
      return
    }
    
    const colorIndex = Math.floor(index / cpc) % colors.length
    const color = colors[colorIndex] ?? colors[colors.length - 1]
    const colorCode = generateColorCode(color, format, lowercaseHex)
    const formatCodes = generateFormatCodes(options, format)
    
    if (format === 'minimessage') {
      result.push(`${colorCode}${formatCodes}${char}${generateClosingTags(options)}`)
    } else {
      result.push(`${colorCode}${formatCodes}${char}`)
    }
  })
  
  return result.join('')
}

/** In-game style preview: per-character RGB (not the code string). */
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
    return chars.map((char, index) => {
      if (char === ' ') return { char: ' ', color: spaceColor }
      const colorIndex = Math.floor(index / cpc) % gradientColors.length
      const color = gradientColors[colorIndex] ?? gradientColors[gradientColors.length - 1]
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

