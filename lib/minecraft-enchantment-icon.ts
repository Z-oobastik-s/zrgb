import { assetUrl } from '@/lib/asset-url'
import type { EnchantItem } from '@/lib/minecraft-enchantments'

/** PNGs in public/minecraft-enchantments/ (your asset pack). */
const FILES = {
  sword: 'enchanted_iron_sword.png',
  bow: 'enchanted_bow.png',
  crossbow: 'enchanted_crossbow.png',
  trident: 'enchanted_trident.png',
  fishingRod: 'enchanted_fishing_rod.png',
  mace: 'enchanted_mace.png',
  helmet: 'enchanted_iron_helmet.png',
  leggings: 'enchanted_iron_leggings.png',
  boots: 'enchanted_iron_boots.png',
  toolsFour: 'pickaxe_shovel_axe_sm.png',
  armorFour: 'armor_sm.png',
  universal: 'sword_chestplate_pickaxe_fishing_rod_sm.png',
  chestplateFocus: 'sword_chestplate_pickaxe_fishing_rod_sm.png',
} as const

const ARMOR_FULL: readonly EnchantItem[] = [
  'helmet',
  'chestplate',
  'leggings',
  'boots',
]

const TOOLS_FOUR: readonly EnchantItem[] = [
  'pickaxe',
  'axe',
  'shovel',
  'hoe',
]

function isExactSet(
  items: EnchantItem[],
  exact: readonly EnchantItem[]
): boolean {
  const s = new Set(items)
  if (s.size !== exact.length) return false
  return exact.every((e) => s.has(e)) && [...s].every((x) => exact.includes(x))
}

/**
 * Picks one PNG for the enchant row from `items` (equipment categories).
 */
export function enchantmentIconFilename(items: EnchantItem[]): string {
  if (items.length === 0) return FILES.universal

  if (isExactSet(items, TOOLS_FOUR)) {
    return FILES.toolsFour
  }

  if (isExactSet(items, ARMOR_FULL)) {
    return FILES.armorFour
  }

  if (items.length >= 10) {
    return FILES.universal
  }

  if (items.length === 1) {
    const k = items[0]!
    const single: Partial<Record<EnchantItem, string>> = {
      sword: FILES.sword,
      bow: FILES.bow,
      crossbow: FILES.crossbow,
      trident: FILES.trident,
      fishing_rod: FILES.fishingRod,
      mace: FILES.mace,
      helmet: FILES.helmet,
      leggings: FILES.leggings,
      boots: FILES.boots,
      chestplate: FILES.chestplateFocus,
      pickaxe: FILES.toolsFour,
      axe: FILES.toolsFour,
      shovel: FILES.toolsFour,
      hoe: FILES.toolsFour,
      shears: FILES.universal,
      shield: FILES.universal,
      elytra: FILES.universal,
      flint: FILES.universal,
    }
    return single[k] ?? FILES.universal
  }

  return FILES.universal
}

export function minecraftEnchantmentIconSrcFromItems(
  items: EnchantItem[]
): string {
  return assetUrl(`/minecraft-enchantments/${enchantmentIconFilename(items)}`)
}
