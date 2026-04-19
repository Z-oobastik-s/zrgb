'use client'

import { MinecraftItemIcon } from '@/components/icons/MinecraftItemSvgs'
import type { EnchantItem } from '@/lib/minecraft-enchantments'

export function EnchantmentItemIcons({ items }: { items: EnchantItem[] }) {
  return (
    <span
      className="inline-flex flex-wrap items-center justify-start gap-0.5"
      title={items.join(', ')}
    >
      {items.map((k) => (
        <MinecraftItemIcon key={k} item={k} />
      ))}
    </span>
  )
}
