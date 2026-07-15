import { hslToRgb, type RGBColor } from '@/lib/rgb-generator'

export const PALETTE_MODE_IDS = [
  'chaos',
  'harmony',
  'complement',
  'pastel',
  'neon',
  'sunset',
  'ocean',
  'fire',
  'ice',
  'gold',
  'mono',
  'candy',
] as const

export type PaletteMode = (typeof PALETTE_MODE_IDS)[number]

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n))
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1))
}

function hueWrap(h: number): number {
  return ((h % 360) + 360) % 360
}

function hsl(h: number, s: number, l: number): RGBColor {
  return hslToRgb(hueWrap(h), clamp(s, 0, 100), clamp(l, 0, 100))
}

/** Evenly space hues with a slight jitter so it never looks too mechanical. */
function spacedHues(count: number, start: number, span: number): number[] {
  if (count <= 1) return [start]
  const out: number[] = []
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    out.push(hueWrap(start + span * t + rand(-6, 6)))
  }
  return out
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function generatePalette(mode: PaletteMode, count: number): RGBColor[] {
  const n = clamp(Math.round(count), 1, 8)

  switch (mode) {
    case 'chaos': {
      return Array.from({ length: n }, () =>
        hsl(rand(0, 360), rand(55, 100), rand(38, 68))
      )
    }
    case 'harmony': {
      const base = rand(0, 360)
      return spacedHues(n, base - 28, 56).map((h, i) =>
        hsl(h, rand(62, 92), lerp(42, 62, n === 1 ? 0.5 : i / (n - 1)) + rand(-4, 4))
      )
    }
    case 'complement': {
      const base = rand(0, 360)
      if (n === 1) return [hsl(base, rand(70, 95), rand(45, 58))]
      const hues = spacedHues(n, base, 180)
      return hues.map((h, i) =>
        hsl(h, rand(68, 96), lerp(40, 60, i / (n - 1)) + rand(-3, 3))
      )
    }
    case 'pastel': {
      const base = rand(0, 360)
      return spacedHues(n, base, rand(40, 100)).map((h) =>
        hsl(h, rand(35, 62), rand(68, 84))
      )
    }
    case 'neon': {
      const base = rand(0, 360)
      return spacedHues(n, base, rand(80, 200)).map((h) =>
        hsl(h, rand(90, 100), rand(48, 60))
      )
    }
    case 'sunset': {
      const start = rand(8, 28)
      return spacedHues(n, start, rand(40, 70)).map((h, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1)
        return hsl(h + rand(-4, 8), lerp(85, 70, t), lerp(48, 62, t))
      })
    }
    case 'ocean': {
      const start = rand(170, 200)
      return spacedHues(n, start, rand(50, 90)).map((h, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1)
        return hsl(h, lerp(70, 90, t), lerp(36, 62, t))
      })
    }
    case 'fire': {
      const start = rand(-10, 15)
      return spacedHues(n, start, rand(35, 55)).map((h, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1)
        return hsl(h, lerp(95, 80, t), lerp(40, 58, t))
      })
    }
    case 'ice': {
      const start = rand(185, 210)
      return spacedHues(n, start, rand(35, 70)).map((h, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1)
        return hsl(h, lerp(55, 85, t), lerp(58, 78, t))
      })
    }
    case 'gold': {
      const start = rand(32, 48)
      return spacedHues(n, start, rand(18, 36)).map((h, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1)
        return hsl(h, lerp(80, 95, t), lerp(42, 68, t))
      })
    }
    case 'mono': {
      const h = rand(0, 360)
      const s = rand(40, 85)
      return Array.from({ length: n }, (_, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1)
        return hsl(h, s + rand(-6, 6), lerp(28, 78, t))
      })
    }
    case 'candy': {
      const base = rand(0, 360)
      return spacedHues(n, base, rand(120, 280)).map((h) =>
        hsl(h, rand(75, 100), rand(55, 72))
      )
    }
    default:
      return Array.from({ length: n }, () =>
        hsl(rand(0, 360), rand(55, 100), rand(40, 65))
      )
  }
}

/** Roll color count too — fun “lucky” spin. */
export function luckyColorCount(): number {
  const weights = [1, 2, 3, 3, 2, 2, 1, 1] // bias toward 3–4
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]!
    if (r <= 0) return i + 1
  }
  return 3
}

export function palettePreviewStyle(colors: RGBColor[]): string {
  if (colors.length === 0) return 'linear-gradient(90deg,#52525b,#52525b)'
  if (colors.length === 1) {
    const c = colors[0]!
    return `linear-gradient(90deg,rgb(${c.r},${c.g},${c.b}),rgb(${c.r},${c.g},${c.b}))`
  }
  const stops = colors.map((c) => `rgb(${c.r},${c.g},${c.b})`).join(',')
  return `linear-gradient(90deg,${stops})`
}

export function nextPaletteMode(current: PaletteMode): PaletteMode {
  const i = PALETTE_MODE_IDS.indexOf(current)
  return PALETTE_MODE_IDS[(i + 1) % PALETTE_MODE_IDS.length]!
}

export function randomPaletteMode(): PaletteMode {
  return PALETTE_MODE_IDS[randInt(0, PALETTE_MODE_IDS.length - 1)]!
}

/**
 * Stable swatch for mode chips (no Math.random) so the strip does not flicker on re-render.
 */
export function paletteModeSwatch(mode: PaletteMode): RGBColor[] {
  switch (mode) {
    case 'chaos':
      return [hsl(12, 90, 52), hsl(280, 85, 55), hsl(160, 80, 45), hsl(45, 95, 50)]
    case 'harmony':
      return [hsl(200, 75, 48), hsl(220, 72, 52), hsl(240, 70, 56), hsl(255, 68, 58)]
    case 'complement':
      return [hsl(10, 88, 52), hsl(40, 80, 55), hsl(190, 70, 48), hsl(200, 75, 42)]
    case 'pastel':
      return [hsl(330, 50, 78), hsl(280, 45, 80), hsl(200, 48, 78), hsl(150, 42, 76)]
    case 'neon':
      return [hsl(300, 100, 55), hsl(190, 100, 50), hsl(100, 95, 52), hsl(50, 100, 54)]
    case 'sunset':
      return [hsl(12, 90, 50), hsl(28, 88, 54), hsl(40, 85, 58), hsl(320, 55, 45)]
    case 'ocean':
      return [hsl(185, 75, 40), hsl(195, 80, 48), hsl(210, 78, 55), hsl(225, 70, 60)]
    case 'fire':
      return [hsl(5, 95, 45), hsl(18, 92, 50), hsl(32, 90, 55), hsl(45, 88, 58)]
    case 'ice':
      return [hsl(190, 60, 72), hsl(200, 70, 68), hsl(210, 75, 62), hsl(220, 65, 70)]
    case 'gold':
      return [hsl(36, 85, 42), hsl(42, 90, 52), hsl(48, 92, 60), hsl(52, 80, 68)]
    case 'mono':
      return [hsl(265, 55, 30), hsl(265, 55, 45), hsl(265, 55, 60), hsl(265, 50, 74)]
    case 'candy':
      return [hsl(330, 90, 62), hsl(280, 85, 60), hsl(200, 80, 58), hsl(50, 90, 60)]
    default:
      return [hsl(200, 70, 50), hsl(220, 70, 55)]
  }
}
