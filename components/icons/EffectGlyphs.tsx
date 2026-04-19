'use client'

import type { ReactNode } from 'react'

const base =
  'h-[22px] w-[22px] shrink-0'

function G({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={`${base} ${className ?? ''}`}
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** Small SVG glyph per effect id — readable at 16px, no raster. */
export function EffectGlyph({
  id,
  kind,
}: {
  id: string
  kind: 'positive' | 'negative'
}) {
  const pos = kind === 'positive'
  const cPos = 'text-emerald-400/90'
  const cNeg = 'text-rose-400/90'
  const tone = pos ? cPos : cNeg

  switch (id) {
    case 'speed':
      return (
        <G className={tone}>
          <path d="M2 8h12M4 5l-1.5 3L4 11M12 5l1.5 3L12 11" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <path d="M8 3v2M8 11v2" stroke="currentColor" strokeWidth="1" fill="none" />
        </G>
      )
    case 'haste':
      return (
        <G className={tone}>
          <path d="M8 2v3M8 11v3M11 8h3M2 8h3" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <circle cx="8" cy="8" r="2.2" opacity="0.85" />
        </G>
      )
    case 'strength':
      return (
        <G className={tone}>
          <path d="M6 4h4v8H6V4z" opacity="0.9" />
          <path d="M5 6H4M12 6h-1M8 2v1" stroke="currentColor" strokeWidth="1" fill="none" />
        </G>
      )
    case 'instant_health':
      return (
        <G className={tone}>
          <path d="M8 3.5l1.2 2.5H12L9.8 7.8 11 11 8 9.2 5 11l1.2-3.2L4 6h2.8L8 3.5z" />
        </G>
      )
    case 'jump_boost':
      return (
        <G className={tone}>
          <path d="M8 12V4M5 7l3-3 3 3" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </G>
      )
    case 'regeneration':
      return (
        <G className={tone}>
          <path
            d="M8 3a5 5 0 105 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <circle cx="8" cy="8" r="1.5" />
        </G>
      )
    case 'resistance':
      return (
        <G className={tone}>
          <path d="M8 2l5 3v5c0 2.5-2 4.5-5 5-3-.5-5-2.5-5-5V5l5-3z" opacity="0.9" />
        </G>
      )
    case 'fire_resistance':
      return (
        <G className={tone}>
          <path d="M8 2c2 2 3 4 3 6a3 3 0 11-6 0c0-2 1-4 3-6z" />
        </G>
      )
    case 'water_breathing':
      return (
        <G className={tone}>
          <circle cx="5" cy="6" r="1" opacity="0.7" />
          <circle cx="9" cy="5" r="1.2" opacity="0.5" />
          <circle cx="11" cy="8" r="0.9" opacity="0.6" />
          <path d="M3 11c2 1 4 1 6 0" stroke="currentColor" strokeWidth="1" fill="none" />
        </G>
      )
    case 'invisibility':
      return (
        <G className={tone}>
          <circle cx="8" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" />
        </G>
      )
    case 'night_vision':
      return (
        <G className={tone}>
          <circle cx="8" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="8" cy="8" r="1.2" />
        </G>
      )
    case 'luck':
      return (
        <G className={tone}>
          <path d="M8 2l1 3h3l-2.5 2 1 3L8 9l-2.5 3 1-3L4 5h3l1-3z" />
        </G>
      )
    case 'slow_falling':
      return (
        <G className={tone}>
          <path d="M8 3c-2 3-3 5-3 7h6c0-2-1-4-3-7z" opacity="0.85" />
          <path d="M6 13h4" stroke="currentColor" strokeWidth="1" />
        </G>
      )
    case 'conduit_power':
      return (
        <G className={tone}>
          <path d="M8 2l6 4v6l-6 4-6-4V6l6-4z" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="8" cy="8" r="2" />
        </G>
      )
    case 'dolphins_grace':
      return (
        <G className={tone}>
          <path d="M3 9c2-1 4-1 6 0 2 1 4 1 5-1l-1-2c-1 .5-2 .5-3 0" opacity="0.9" />
        </G>
      )
    case 'hero_of_the_village':
      return (
        <G className={tone}>
          <path d="M3 12V6l5-3 5 3v6H3z" opacity="0.85" />
          <path d="M8 4v3" stroke="currentColor" strokeWidth="1" fill="none" />
        </G>
      )
    case 'saturation':
      return (
        <G className={tone}>
          <ellipse cx="8" cy="9" rx="4" ry="2.5" />
          <path d="M8 4v3" stroke="currentColor" strokeWidth="1.2" />
        </G>
      )
    case 'health_boost':
      return (
        <G className={tone}>
          <path d="M8 4l1.5 3H13l-3.5 2.5L11 13 8 11 5 13l1.5-3.5L3 7h3.5L8 4z" />
        </G>
      )
    case 'absorption':
      return (
        <G className={tone}>
          <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <circle cx="8" cy="8" r="2.5" opacity="0.6" />
        </G>
      )
    case 'slowness':
      return (
        <G className={cNeg}>
          <path d="M2 8h12M5 6l-1 2 1 2M11 6l1 2-1 2" stroke="currentColor" strokeWidth="1.1" fill="none" />
        </G>
      )
    case 'mining_fatigue':
      return (
        <G className={cNeg}>
          <path d="M4 4l2 2-1 1M3 6h4" stroke="currentColor" strokeWidth="1" fill="none" />
          <path d="M9 10l3 3" stroke="currentColor" strokeWidth="1.2" />
        </G>
      )
    case 'instant_damage':
      return (
        <G className={cNeg}>
          <path d="M8 3l1 4h4l-3 3 1 4-3-2.5L5 14l1-4-3-3h4l1-4z" />
        </G>
      )
    case 'nausea':
      return (
        <G className={cNeg}>
          <path
            d="M3 8c2-2 8-2 10 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path d="M4 10c2 2 6 2 8 0" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        </G>
      )
    case 'blindness':
      return (
        <G className={cNeg}>
          <path d="M3 8h10" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1" />
        </G>
      )
    case 'hunger':
      return (
        <G className={cNeg}>
          <rect x="4" y="5" width="8" height="6" rx="1" />
          <path d="M6 8h4M6 10h4" stroke="currentColor" strokeWidth="0.8" opacity="0.5" fill="none" />
        </G>
      )
    case 'weakness':
      return (
        <G className={cNeg}>
          <path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
        </G>
      )
    case 'poison':
      return (
        <G className={cNeg}>
          <path d="M8 2v8c-2 0-3 1.5-3 3h6c0-1.5-1-3-3-3V2z" />
        </G>
      )
    case 'wither':
      return (
        <G className={cNeg}>
          <circle cx="6" cy="7" r="1.2" />
          <circle cx="10" cy="7" r="1.2" />
          <path d="M6 10h4v2H6v-2z" />
        </G>
      )
    case 'levitation':
      return (
        <G className={cNeg}>
          <path d="M8 13V5M5 8l3-3 3 3" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </G>
      )
    case 'darkness':
      return (
        <G className={cNeg}>
          <circle cx="8" cy="8" r="5" fill="currentColor" opacity="0.25" />
          <circle cx="8" cy="8" r="2" />
        </G>
      )
    case 'bad_omen':
      return (
        <G className={cNeg}>
          <path d="M8 3l6 4v6l-6 3-6-3V7l6-4z" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="8" cy="9" r="1.2" />
        </G>
      )
    case 'infested':
      return (
        <G className={cNeg}>
          <circle cx="5" cy="6" r="1" />
          <circle cx="10" cy="5" r="0.8" />
          <circle cx="8" cy="10" r="1" />
        </G>
      )
    case 'oozing':
      return (
        <G className={cNeg}>
          <path d="M8 3v6c-2 0-3 1-3 3h6c0-2-1-3-3-3V3z" />
        </G>
      )
    case 'weaving':
      return (
        <G className={cNeg}>
          <path d="M3 4h10M4 8h8M3 12h10" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
          <path d="M5 4v8M11 4v8" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
        </G>
      )
    case 'wind_charged':
      return (
        <G className={cNeg}>
          <path d="M4 8h6l-2-3M10 8H4l2 3" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </G>
      )
    default:
      return (
        <G className={tone}>
          <path d="M8 2l5 3v6l-5 3-5-3V5l5-3z" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="8" cy="8" r="1.5" opacity="0.8" />
        </G>
      )
  }
}
