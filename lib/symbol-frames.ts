/**
 * Decorative multi-line frames for nicks / MOTD / TAB (copy as whole block).
 */
export type SymbolFrame = {
  id: string
  /** Full text copied to clipboard */
  text: string
}

export const SYMBOL_FRAMES: SymbolFrame[] = [
  {
    id: 'corners-tri',
    text: '◤                     ◥\n◣                     ◢',
  },
  {
    id: 'round-plain',
    text: '╭──────────╮\n╰──────────╯',
  },
  {
    id: 'plant-seed',
    text: '┎────«🌱»────┒\n┖─────«»─────┚',
  },
  {
    id: 'mushroom-eq',
    text: '╭═════ 🍄 ═════╮\n╰═════ 🍄 ═════╯',
  },
  {
    id: 'heart-dots',
    text: '╭─────•♡•─────╮\n╰─────•♡•─────╯',
  },
  {
    id: 'heart-fold',
    text: '╭─────╯•╰─────╮\n╰─────╮•╭─────╯',
  },
  {
    id: 'heart-heavy',
    text: '╭━━━━━━╯•╰━━━━━━╮\n╰━━━━━━╮•╭━━━━━━╯',
  },
  {
    id: 'asterisk-box',
    text: '┌── ✽ ──────────┐\n└────────── ✽ ──┘',
  },
  {
    id: 'dots-box',
    text: '┌── ⋅ ⋅ ─── ─── ⋅ ⋅ ──┐\n└── ⋅ ⋅ ─── ─── ⋅ ⋅ ──┘',
  },
  {
    id: 'star-orb',
    text: '┌────── ●✰● ──────┐\n└───── ●✰● ──────┘',
  },
  {
    id: 'snow-ornament',
    text: '┌────── ∘°❉°∘ ──────┐\n└────── °∘❉∘° ──────┘',
  },
  {
    id: 'flower-wave',
    text: '﹀﹀﹀﹀﹀﹀✿───────╮\n╰───────✿︿︿︿︿︿︿',
  },
  {
    id: 'snow-ornament-alt',
    text: '┌────── ∘°❉°∘ ──────┐\n└─────── °∘❉∘° ─────┘',
  },
  {
    id: 'double-line',
    text: '╔════════════╗\n╚════════════╝',
  },
  {
    id: 'heavy-box',
    text: '┏━━━━━━━━━━┓\n┗━━━━━━━━━━┛',
  },
  {
    id: 'bracket-stars',
    text: '〔 ★ ────────── ★ 〕\n〔 ★ ────────── ★ 〕',
  },
  {
    id: 'diamond-bar',
    text: '◈────────────────◈\n◈────────────────◈',
  },
  {
    id: 'arrow-frame',
    text: '⟪──────────────⟫\n⟪──────────────⟫',
  },
  {
    id: 'wave-soft',
    text: '╭⁓⁓⁓⁓⁓⁓⁓⁓⁓⁓╮\n╰⁓⁓⁓⁓⁓⁓⁓⁓⁓⁓╯',
  },
  {
    id: 'skull-bar',
    text: '╭──── ☠ ────╮\n╰──── ☠ ────╯',
  },
  {
    id: 'sword-bar',
    text: '╭──── ⚔ ────╮\n╰──── ⚔ ────╯',
  },
  {
    id: 'fire-bar',
    text: '╭──── ✦ ────╮\n╰──── ✦ ────╯',
  },
  {
    id: 'crown-bar',
    text: '╭──── ♛ ────╮\n╰──── ♛ ────╯',
  },
  {
    id: 'heart-bar',
    text: '╭──── ♥ ────╮\n╰──── ♥ ────╯',
  },
  {
    id: 'sparkle-wide',
    text: '✧･ﾟ: *✧･ﾟ:* 　　 *:･ﾟ✧*:･ﾟ✧',
  },
  {
    id: 'line-ornament',
    text: '━━━━━━━ ★ ━━━━━━━',
  },
  {
    id: 'line-ornament-diamond',
    text: '═══════ ◈ ═══════',
  },
  {
    id: 'corner-fancy',
    text: '⌜                  ⌝\n⌞                  ⌟',
  },
  {
    id: 'paren-wide',
    text: '︵‿︵‿︵‿︵‿︵\n︶⁀︶⁀︶⁀︶⁀︶',
  },
  {
    id: 'block-frame',
    text: '▓░░░░░░░░░░░▓\n▓░░░░░░░░░░░▓',
  },
  {
    id: 'slash-frame',
    text: '╱════════════╲\n╲════════════╱',
  },
  {
    id: 'angle-frame',
    text: '❮──────────────❯\n❮──────────────❯',
  },
  {
    id: 'flower-box',
    text: '❀──────────────❀\n❀──────────────❀',
  },
  {
    id: 'note-box',
    text: '♪──────────────♪\n♪──────────────♪',
  },
  {
    id: 'tri-bar',
    text: '▲──────────────▲\n▼──────────────▼',
  },
  {
    id: 'round-stars',
    text: '╭─── ★ ⋆ ★ ───╮\n╰─── ★ ⋆ ★ ───╯',
  },
  {
    id: 'dashed-heart',
    text: '┄┄┄┄┄ ♡ ┄┄┄┄┄',
  },
  {
    id: 'dot-leader',
    text: '· · · · · · · · · · · ·',
  },
  {
    id: 'mc-style',
    text: '»──────────────«\n»──────────────«',
  },
  {
    id: 'pill-ends',
    text: '◖──────────────◗\n◖──────────────◗',
  },

  // Floral / ornament bars
  { id: 'floral-bar-1', text: '──❁•❁•❁──' },
  { id: 'floral-bar-2', text: '──✿•✿•✿──' },
  { id: 'floral-bar-3', text: '───✿◦✿◦✿───' },
  { id: 'floral-bar-4', text: '───❀•❀•❀───' },
  { id: 'floral-bar-5', text: '────❁ • ❁ • ❁────' },
  { id: 'floral-bar-6', text: '───❃•❃•❃───' },
  { id: 'floral-bar-7', text: '───❀◦❀◦❀───' },
  { id: 'floral-bar-8', text: '───•❀•───' },
  { id: 'floral-bar-9', text: '───«•❁•»───' },
  { id: 'floral-bar-10', text: '───── »◦✿◦« ─────' },

  // Floral boxed
  {
    id: 'floral-box-1',
    text: '┌───── »◦❀◦« ─────┐\n└───── »◦❀◦« ─────┘',
  },
  {
    id: 'floral-box-2',
    text: '┎─────«•✿•»─────┒\n┖─────«•✿•»─────┚',
  },
  {
    id: 'floral-box-3',
    text: '┎─────« • ❁ • »─────┒\n┖─────« • ❁ • »─────┚',
  },
  {
    id: 'floral-box-daisy',
    text: '╔═.🌼.══════╗\n╚══════.🌼.═╝',
  },
  {
    id: 'floral-box-4',
    text: '┌─────❀◦❀◦❀─────┐\n└─────❀◦❀◦❀─────┘',
  },

  // Split / mirrored ornaments
  {
    id: 'split-flower-1',
    text: '──────────❀◦∘\n∘◦❀──────────',
  },
  {
    id: 'split-flower-2',
    text: '•──────────•❁•\n•❁•──────────•',
  },
  {
    id: 'split-flower-3',
    text: '✿ -------------------- ✿\n----------------------- ✿',
  },
  {
    id: 'split-flower-4',
    text: '──────────❁◦•\n•◦❁──────────',
  },

  // Fancy dividers
  { id: 'divider-lotus', text: '• ────── ✾ ────── •' },
  { id: 'divider-eq-flower', text: '════ ∘◦❁◦∘ ════' },
  { id: 'divider-sparkle-flower', text: '❈──────•°•°•❀•°°•──────❈' },
  { id: 'divider-snow-flower', text: '≫──────°❅•❀•❅°──────≪' },
  { id: 'divider-stars-eq', text: '═══════ ≪ •❈• ≫ ═══════' },
  { id: 'divider-wave-flowers', text: '❀~✿ ❀~✿ ❀~✿ ❀~✿' },
  {
    id: 'divider-dot-flowers',
    text: '❀.•° ✿.•° ❀.•° ✿.•°•.✿ °•.❀ °•.✿ °•.❀',
  },
  { id: 'divider-daisy-eq', text: '═════════.🌼.════════' },
  { id: 'divider-heart-lace', text: '°.♡┈┈∘*┈୨୧┈*∘┈┈♡.°' },
  { id: 'divider-heart-soft', text: '━━━━━━━ ∙ʚ♡ɞ∙ ━━━━━━━' },
  { id: 'divider-heart-plain', text: '•───────♡───────•' },
  { id: 'divider-daisy-dots', text: '┈┈┈┈┈┈┈🌼┈┈┈┈┈┈┈' },
]

export const SYMBOL_FRAMES_COUNT = SYMBOL_FRAMES.length
