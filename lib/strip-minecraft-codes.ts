/**
 * Strip common Minecraft legacy codes (&, §, simple &# hex).
 * Coverage is best-effort: exotic MiniMessage or plugin-specific tags may remain.
 */
export function stripMinecraftColorCodes(input: string): string {
  let s = input
  s = s.replace(/&x(?:&[0-9a-fA-F]){6}/g, '')
  s = s.replace(/&#[0-9a-fA-F]{6}/gi, '')
  s = s.replace(/§x(?:§[0-9a-fA-F]){6}/g, '')
  s = s.replace(/§#[0-9a-fA-F]{6}/gi, '')
  s = s.replace(/&[0-9a-fk-or]/gi, '')
  s = s.replace(/§[0-9a-fk-or]/gi, '')
  s = s.replace(/<#[0-9a-fA-F]{6}>/gi, '')
  return s
}

/**
 * Unwrap nested MiniMessage-style paired tags so RGB preview does not stack
 * new gradients on top of existing `<gradient:...>...</gradient>` output.
 */
function unwrapMiniMessagePairs(input: string): string {
  const patterns: RegExp[] = [
    /<gradient:[^>]+>([\s\S]*?)<\/gradient>/gi,
    /<color:[^>]+>([\s\S]*?)<\/color>/gi,
    /<rainbow>([\s\S]*?)<\/rainbow>/gi,
    /<b>([\s\S]*?)<\/b>/gi,
    /<i>([\s\S]*?)<\/i>/gi,
    /<u>([\s\S]*?)<\/u>/gi,
    /<st>([\s\S]*?)<\/st>/gi,
    /<obf>([\s\S]*?)<\/obf>/gi,
    /<bold>([\s\S]*?)<\/bold>/gi,
    /<italic>([\s\S]*?)<\/italic>/gi,
    /<underlined>([\s\S]*?)<\/underlined>/gi,
    /<strikethrough>([\s\S]*?)<\/strikethrough>/gi,
    /<obfuscated>([\s\S]*?)<\/obfuscated>/gi,
  ]
  let t = input
  let prev = ''
  while (t !== prev) {
    prev = t
    for (const re of patterns) {
      t = t.replace(re, '$1')
    }
  }
  return t
}

function stripBbcodeColorLayers(input: string): string {
  let t = input
  let prev = ''
  while (t !== prev) {
    prev = t
    t = t.replace(/\[COLOR=#[0-9a-fA-F]{6}\]([\s\S]*?)\[\/COLOR\]/gi, '$1')
  }
  return t
}

/**
 * Reduce YAML / pasted strings to plain text for the RGB generator input
 * (avoids duplicate MiniMessage gradients when switching linked fields).
 */
export function stripToRgbPlainInput(input: string): string {
  let s = unwrapMiniMessagePairs(input)
  s = stripBbcodeColorLayers(s)
  s = s.replace(/<\/?reset>/gi, '')
  s = stripMinecraftColorCodes(s)
  return s.trim()
}
