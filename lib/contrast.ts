import { hslToRgb, type RGBColor } from '@/lib/rgb-generator'

/**
 * Minecraft preview text has a strong black pixel outline, so real-world
 * readability is better than raw WCAG numbers. Keep thresholds soft —
 * otherwise almost every mid-tone “pretty” gradient screams forever.
 */
export const MIN_CONTRAST_RATIO = 2.5
export const WARN_CONTRAST_RATIO = 1.9

function srgbChannelToLinear(c8: number): number {
  const c = c8 / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(color: RGBColor): number {
  const r = srgbChannelToLinear(color.r)
  const g = srgbChannelToLinear(color.g)
  const b = srgbChannelToLinear(color.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: RGBColor, b: RGBColor): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

export function rgbToHsl(color: RGBColor): { h: number; s: number; l: number } {
  const r = color.r / 255
  const g = color.g / 255
  const b = color.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6
      break
    case g:
      h = ((b - r) / d + 2) / 6
      break
    default:
      h = ((r - g) / d + 4) / 6
      break
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

export type ContrastVerdict = 'ok' | 'warn' | 'fail'

export type ContrastReport = {
  minRatio: number
  avgRatio: number
  worstIndex: number
  verdict: ContrastVerdict
  ratios: number[]
}

export function analyzeColorsAgainstBackground(
  colors: RGBColor[],
  background: RGBColor,
  opts?: { minOk?: number; minWarn?: number }
): ContrastReport {
  const minOk = opts?.minOk ?? MIN_CONTRAST_RATIO
  const minWarn = opts?.minWarn ?? WARN_CONTRAST_RATIO
  if (colors.length === 0) {
    return {
      minRatio: Infinity,
      avgRatio: Infinity,
      worstIndex: -1,
      verdict: 'ok',
      ratios: [],
    }
  }
  const ratios = colors.map((c) => contrastRatio(c, background))
  let worstIndex = 0
  let minRatio = ratios[0]!
  let sum = 0
  for (let i = 0; i < ratios.length; i++) {
    const r = ratios[i]!
    sum += r
    if (r < minRatio) {
      minRatio = r
      worstIndex = i
    }
  }
  const avgRatio = sum / ratios.length
  // Gradients often mix dark + light stops — judging by the single worst
  // stop makes every roll look broken. Average better matches “can I read this”.
  const score = avgRatio
  const verdict: ContrastVerdict =
    score >= minOk ? 'ok' : score >= minWarn ? 'warn' : 'fail'
  return { minRatio, avgRatio, worstIndex, verdict, ratios }
}

/**
 * Push lightness away from the background until contrast hits `targetRatio`
 * (or as close as possible). Keeps hue/saturation.
 */
export function boostColorContrast(
  fg: RGBColor,
  background: RGBColor,
  targetRatio = MIN_CONTRAST_RATIO
): RGBColor {
  if (contrastRatio(fg, background) >= targetRatio) return fg

  const { h, s, l: startL } = rgbToHsl(fg)
  const preferLight = relativeLuminance(background) < 0.45

  const tryDirection = (towardLight: boolean): { color: RGBColor; ratio: number; delta: number } => {
    let best = fg
    let bestRatio = contrastRatio(fg, background)
    let lo = towardLight ? startL : 0
    let hi = towardLight ? 100 : startL
    for (let i = 0; i < 22; i++) {
      const mid = (lo + hi) / 2
      const next = hslToRgb(h, s, mid)
      const ratio = contrastRatio(next, background)
      if (ratio >= bestRatio) {
        bestRatio = ratio
        best = next
      }
      if (towardLight) {
        if (ratio >= targetRatio) hi = mid
        else lo = mid
      } else if (ratio >= targetRatio) {
        lo = mid
      } else {
        hi = mid
      }
    }
    return {
      color: best,
      ratio: bestRatio,
      delta: Math.abs(rgbToHsl(best).l - startL),
    }
  }

  const primary = tryDirection(preferLight)
  if (primary.ratio >= targetRatio) return primary.color

  const secondary = tryDirection(!preferLight)
  if (secondary.ratio >= targetRatio) return secondary.color

  // Pick whichever got closer; fall back to white/black if needed
  const better = primary.ratio >= secondary.ratio ? primary.color : secondary.color
  const white = { r: 255, g: 255, b: 255 }
  const black = { r: 0, g: 0, b: 0 }
  const w = contrastRatio(white, background)
  const k = contrastRatio(black, background)
  const betterRatio = contrastRatio(better, background)
  if (w >= targetRatio || k >= targetRatio) {
    if (w >= k && w > betterRatio) return white
    if (k > betterRatio) return black
  }
  return better
}

export function boostColorsForBackground(
  colors: RGBColor[],
  background: RGBColor,
  targetRatio = MIN_CONTRAST_RATIO
): RGBColor[] {
  return colors.map((c) => boostColorContrast(c, background, targetRatio))
}

/**
 * Pick lightness that maximizes the *worst* contrast across several backgrounds.
 * Used so a nick stays readable on grass, nether, end, and white chat together.
 */
export function boostColorForScenes(
  fg: RGBColor,
  backgrounds: RGBColor[],
  targetRatio = MIN_CONTRAST_RATIO
): RGBColor {
  if (backgrounds.length === 0) return fg
  if (backgrounds.length === 1) {
    return boostColorContrast(fg, backgrounds[0]!, targetRatio)
  }

  const minRatioAcross = (c: RGBColor) => {
    let min = Infinity
    for (const bg of backgrounds) {
      min = Math.min(min, contrastRatio(c, bg))
    }
    return min
  }

  if (minRatioAcross(fg) >= targetRatio) return fg

  const { h, s, l: startL } = rgbToHsl(fg)
  let best = fg
  let bestScore = minRatioAcross(fg)
  let bestDelta = 0

  for (let step = 0; step <= 100; step++) {
    const l = step
    const candidate = hslToRgb(h, s, l)
    const score = minRatioAcross(candidate)
    const delta = Math.abs(l - startL)
    if (
      score > bestScore + 0.001 ||
      (Math.abs(score - bestScore) <= 0.001 && delta < bestDelta)
    ) {
      best = candidate
      bestScore = score
      bestDelta = delta
    }
  }

  if (bestScore >= targetRatio) return best

  // Fallback extremes if mid tones can't satisfy every scene
  const white = { r: 255, g: 255, b: 255 }
  const black = { r: 0, g: 0, b: 0 }
  const w = minRatioAcross(white)
  const k = minRatioAcross(black)
  if (w >= bestScore && w >= k) return white
  if (k > bestScore) return black
  return best
}

export function boostColorsForScenes(
  colors: RGBColor[],
  backgrounds: RGBColor[],
  targetRatio = MIN_CONTRAST_RATIO
): RGBColor[] {
  return colors.map((c) => boostColorForScenes(c, backgrounds, targetRatio))
}

export type SceneContrastRow = {
  id: string
  report: ContrastReport
}

export type MultiSceneContrast = {
  rows: SceneContrastRow[]
  worstId: string | null
  worstRatio: number
  verdict: ContrastVerdict
  failingIds: string[]
}

export function analyzeColorsAcrossScenes(
  colors: RGBColor[],
  scenes: { id: string; background: RGBColor }[],
  opts?: { minOk?: number; minWarn?: number }
): MultiSceneContrast {
  const rows: SceneContrastRow[] = scenes.map((s) => ({
    id: s.id,
    report: analyzeColorsAgainstBackground(colors, s.background, opts),
  }))

  let worstId: string | null = null
  let worstRatio = Infinity
  const failingIds: string[] = []
  let verdict: ContrastVerdict = 'ok'

  for (const row of rows) {
    // Prefer avg for “how bad is this scene overall”
    const score = row.report.avgRatio
    if (score < worstRatio) {
      worstRatio = score
      worstId = row.id
    }
    if (row.report.verdict === 'fail' || row.report.verdict === 'warn') {
      failingIds.push(row.id)
    }
    if (row.report.verdict === 'fail') verdict = 'fail'
    else if (row.report.verdict === 'warn' && verdict === 'ok') verdict = 'warn'
  }

  if (rows.length === 0) {
    return {
      rows,
      worstId: null,
      worstRatio: Infinity,
      verdict: 'ok',
      failingIds: [],
    }
  }

  return { rows, worstId, worstRatio, verdict, failingIds }
}

/** Sample rainbow stops for contrast (hue wheel). */
export function sampleRainbowStops(count = 6): RGBColor[] {
  const out: RGBColor[] = []
  for (let i = 0; i < count; i++) {
    const h = (i / count) * 360
    out.push(hslToRgb(h, 90, 55))
  }
  return out
}

/** Average of each color's worst scene contrast — higher is more readable everywhere. */
export function multiSceneScore(
  colors: RGBColor[],
  backgrounds: RGBColor[]
): number {
  if (colors.length === 0 || backgrounds.length === 0) return Infinity
  let sum = 0
  for (const c of colors) {
    let worst = Infinity
    for (const bg of backgrounds) {
      worst = Math.min(worst, contrastRatio(c, bg))
    }
    sum += worst
  }
  return sum / colors.length
}

/**
 * From several candidate palettes, keep the most readable across scenes.
 * Still random — just avoids dumping unreadable mid-mud every roll.
 */
export function pickMostReadablePalette(
  candidates: RGBColor[][],
  backgrounds: RGBColor[]
): RGBColor[] {
  if (candidates.length === 0) return []
  let best = candidates[0]!
  let bestScore = multiSceneScore(best, backgrounds)
  for (let i = 1; i < candidates.length; i++) {
    const c = candidates[i]!
    const score = multiSceneScore(c, backgrounds)
    if (score > bestScore) {
      best = c
      bestScore = score
    }
  }
  if (bestScore >= WARN_CONTRAST_RATIO) return best
  // Gentle lift — don't nuke the vibe of the palette
  return boostColorsForScenes(best, backgrounds, WARN_CONTRAST_RATIO)
}
