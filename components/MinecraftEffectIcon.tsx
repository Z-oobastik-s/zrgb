'use client'

import { useState } from 'react'
import Image from 'next/image'
import { minecraftEffectIconSrc } from '@/lib/minecraft-effect-icon'
import { EffectGlyph } from '@/components/icons/EffectGlyphs'

export function MinecraftEffectIcon({
  id,
  kind,
}: {
  id: string
  kind: 'positive' | 'negative'
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <EffectGlyph id={id} kind={kind} />
  }

  return (
    <Image
      src={minecraftEffectIconSrc(id)}
      alt=""
      width={22}
      height={22}
      unoptimized
      className="h-[22px] w-[22px] shrink-0 object-contain [image-rendering:pixelated]"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
