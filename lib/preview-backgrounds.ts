import type { CSSProperties } from 'react'
import { assetUrl } from '@/lib/asset-url'
import type { RGBColor } from '@/lib/rgb-generator'

export type PreviewBgId = 'solid' | 'overworld' | 'nether' | 'end' | 'chat'

export type PreviewBackground = {
  id: PreviewBgId
  /** Public image path, if any */
  imageUrl: string | null
  /** Approximate scene color before dim overlay (for contrast checks) */
  scene: RGBColor
  /** Black overlay alphas matching the CSS gradient on the preview */
  overlayTop: number
  overlayBottom: number
  backgroundPosition: string
  /** Solid CSS fallback when no image */
  solidCss: string
}

export const PREVIEW_BG_ORDER: PreviewBgId[] = [
  'solid',
  'overworld',
  'nether',
  'end',
  'chat',
]

/** In-game scenes used by the contrast checker (not the solid UI canvas). */
export const CONTRAST_SCENE_IDS: PreviewBgId[] = [
  'overworld',
  'nether',
  'end',
  'chat',
]

export const PREVIEW_BACKGROUNDS: Record<PreviewBgId, PreviewBackground> = {
  solid: {
    id: 'solid',
    imageUrl: null,
    scene: { r: 13, g: 15, b: 20 },
    overlayTop: 0,
    overlayBottom: 0,
    backgroundPosition: 'center',
    solidCss: '#0d0f14',
  },
  overworld: {
    id: 'overworld',
    imageUrl: assetUrl('/text-background/world.png'),
    scene: { r: 68, g: 118, b: 52 },
    overlayTop: 0.28,
    overlayBottom: 0.42,
    backgroundPosition: 'center 22%',
    solidCss: '#0d0f14',
  },
  nether: {
    id: 'nether',
    imageUrl: assetUrl('/text-background/world_the_nether.png'),
    scene: { r: 92, g: 28, b: 22 },
    overlayTop: 0.3,
    overlayBottom: 0.45,
    backgroundPosition: 'center 30%',
    solidCss: '#1a0808',
  },
  end: {
    id: 'end',
    imageUrl: assetUrl('/text-background/world_the_end.png'),
    scene: { r: 48, g: 22, b: 72 },
    overlayTop: 0.3,
    overlayBottom: 0.45,
    backgroundPosition: 'center 28%',
    solidCss: '#120818',
  },
  chat: {
    id: 'chat',
    imageUrl: null,
    scene: { r: 236, g: 236, b: 236 },
    overlayTop: 0,
    overlayBottom: 0,
    backgroundPosition: 'center',
    solidCss: '#ececec',
  },
}

/** Migrate legacy stored value `minecraft` → `overworld`. */
export function normalizePreviewBgId(raw: string | null | undefined): PreviewBgId {
  if (raw === 'minecraft' || raw === 'overworld') return 'overworld'
  if (raw === 'nether' || raw === 'end' || raw === 'chat' || raw === 'solid') {
    return raw
  }
  return 'solid'
}

/** Effective background color after the dim overlay (what eyes roughly see). */
export function effectivePreviewBgColor(bg: PreviewBackground): RGBColor {
  const a = (bg.overlayTop + bg.overlayBottom) / 2
  return {
    r: Math.round(bg.scene.r * (1 - a)),
    g: Math.round(bg.scene.g * (1 - a)),
    b: Math.round(bg.scene.b * (1 - a)),
  }
}

export function previewBgCss(bg: PreviewBackground): CSSProperties {
  if (bg.imageUrl) {
    return {
      backgroundColor: bg.solidCss,
      backgroundImage: `linear-gradient(rgba(0,0,0,${bg.overlayTop}), rgba(0,0,0,${bg.overlayBottom})), url(${bg.imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: bg.backgroundPosition,
      backgroundRepeat: 'no-repeat',
    }
  }
  return { backgroundColor: bg.solidCss }
}
