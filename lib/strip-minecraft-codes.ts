/**
 * Strip common Minecraft color and legacy hex codes so the RGB preview edits plain text.
 * Not a full MiniMessage parser; good enough for typical & / § / &# style strings.
 */
export function stripMinecraftColorCodes(input: string): string {
  let s = input
  // Legacy &x&r&r&g&g&b&b
  s = s.replace(/&x(?:&[0-9a-fA-F]){6}/g, '')
  // &#rrggbb
  s = s.replace(/&#[0-9a-fA-F]{6}/gi, '')
  // §x§r§r§g§g§b§b
  s = s.replace(/§x(?:§[0-9a-fA-F]){6}/g, '')
  // §#rrggbb
  s = s.replace(/§#[0-9a-fA-F]{6}/gi, '')
  // Single & / § format codes (colors + klmnor)
  s = s.replace(/&[0-9a-fk-or]/gi, '')
  s = s.replace(/§[0-9a-fk-or]/gi, '')
  // Simple bracket hex like <#rrggbb> (MiniMessage)
  s = s.replace(/<#[0-9a-fA-F]{6}>/gi, '')
  return s
}
