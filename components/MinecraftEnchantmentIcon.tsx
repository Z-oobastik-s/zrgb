'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import type { EnchantItem } from '@/lib/minecraft-enchantments'
import { minecraftEnchantmentIconSrcFromItems } from '@/lib/minecraft-enchantment-icon'

export function MinecraftEnchantmentIcon({ items }: { items: EnchantItem[] }) {
  const [failed, setFailed] = useState(false)
  const src = useMemo(
    () => minecraftEnchantmentIconSrcFromItems(items),
    [items]
  )

  if (failed) {
    return (
      <span
        className="inline-block h-[22px] w-[22px] shrink-0"
        aria-hidden
      />
    )
  }

  return (
    <Image
      key={src}
      src={src}
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
