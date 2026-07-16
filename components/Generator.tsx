'use client'

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react'
import { useTranslations } from 'next-intl'
import {
  Copy,
  Check,
  Shuffle,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Eye,
  Link2,
  Trash2,
  ArrowLeftRight,
  Plus,
  Minus,
  Dices,
  Undo2,
  Sparkles,
  Trees,
  Flame,
  MoonStar,
  MessageSquare,
  Square,
  SunMedium,
} from 'lucide-react'
import type { CodeFormat } from '@/lib/rgb-generator'
import {
  FormattingOptions,
  RGBColor,
  generateRainbowGradient,
  generateSingleColor,
  generateRandomColor,
  generateGradientText,
  buildPreviewSegments,
  rgbToHexString,
  hexToRgb,
  normalizeCodeFormat,
} from '@/lib/rgb-generator'
import {
  PALETTE_MODE_IDS,
  generatePalette,
  luckyColorCount,
  paletteModeSwatch,
  palettePreviewStyle,
  randomPaletteMode,
  type PaletteMode,
} from '@/lib/random-palettes'
import { stripToRgbPlainInput } from '@/lib/strip-minecraft-codes'
import {
  analyzeColorsAcrossScenes,
  boostColorsForScenes,
  sampleRainbowStops,
} from '@/lib/contrast'
import {
  CONTRAST_SCENE_IDS,
  PREVIEW_BACKGROUNDS,
  PREVIEW_BG_ORDER,
  effectivePreviewBgColor,
  normalizePreviewBgId,
  previewBgCss,
  type PreviewBgId,
} from '@/lib/preview-backgrounds'
import { YamlEditorPanel } from './YamlEditorPanel'

const PALETTE_HISTORY_MAX = 10

const HASH_PREFIX = 's='
/** Reject oversized hash fragments before atob/JSON.parse blocks the main thread. */
const MAX_HASH_B64_LENGTH = 65536
const STORAGE_KEY = 'zrgb-generator-v1'
const PREVIEW_BG_KEY = 'zrgb-preview-bg'
/** Cap stored input so a huge paste cannot blow localStorage quota. */
const MAX_STORED_INPUT_LENGTH = 50000
const SAVE_DEBOUNCE_MS = 250

const PREVIEW_BG_ICONS = {
  solid: Square,
  overworld: Trees,
  nether: Flame,
  end: MoonStar,
  chat: MessageSquare,
} as const

type PresetPayload = {
  v: 1
  inputText: string
  format: CodeFormat
  formatting: FormattingOptions
  gradientColors: RGBColor[]
  useRainbow: boolean
  charsPerColor: number
  prefix: string
  suffix: string
  lowercaseHex: boolean
}

function defaultPayload(): PresetPayload {
  return {
    v: 1,
    inputText: '',
    format: 'ampersand',
    formatting: {
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      obfuscated: false,
    },
    gradientColors: [
      { r: 123, g: 0, b: 89 },
      { r: 209, g: 164, b: 51 },
    ],
    useRainbow: false,
    charsPerColor: 1,
    prefix: '',
    suffix: '',
    lowercaseHex: false,
  }
}

function clampByte(n: unknown, fallback: number): number {
  if (typeof n === 'number' && Number.isFinite(n)) {
    return Math.max(0, Math.min(255, Math.round(n)))
  }
  return fallback
}

function defaultFormatting(): FormattingOptions {
  return { ...defaultPayload().formatting }
}

function sanitizePresetPayload(raw: unknown): PresetPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  if (p.v !== 1) return null
  const inputText = typeof p.inputText === 'string' ? p.inputText : ''
  const format = normalizeCodeFormat(String(p.format ?? 'ampersand'))
  const fo = p.formatting
  const formatting: FormattingOptions =
    fo && typeof fo === 'object'
      ? {
          bold: !!(fo as FormattingOptions).bold,
          italic: !!(fo as FormattingOptions).italic,
          underline: !!(fo as FormattingOptions).underline,
          strikethrough: !!(fo as FormattingOptions).strikethrough,
          obfuscated: !!(fo as FormattingOptions).obfuscated,
        }
      : defaultFormatting()
  let gradientColors = defaultPayload().gradientColors
  if (Array.isArray(p.gradientColors)) {
    const mapped = p.gradientColors
      .map((c) => {
        if (!c || typeof c !== 'object') return null
        const o = c as Record<string, unknown>
        return {
          r: clampByte(o.r, 128),
          g: clampByte(o.g, 128),
          b: clampByte(o.b, 128),
        }
      })
      .filter((c): c is RGBColor => c !== null)
    if (mapped.length > 0) gradientColors = mapped
  }
  const cpcRaw = p.charsPerColor
  const charsPerColor = Math.max(
    1,
    Math.min(
      24,
      typeof cpcRaw === 'number' && Number.isFinite(cpcRaw) ? cpcRaw : 1
    )
  )
  return {
    v: 1,
    inputText,
    format,
    formatting,
    gradientColors,
    useRainbow: !!p.useRainbow,
    charsPerColor,
    prefix: typeof p.prefix === 'string' ? p.prefix : '',
    suffix: typeof p.suffix === 'string' ? p.suffix : '',
    lowercaseHex: !!p.lowercaseHex,
  }
}

function encodeHash(payload: PresetPayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return `${HASH_PREFIX}${btoa(binary)}`
}

function decodeHash(hash: string): PresetPayload | null {
  if (!hash.startsWith(HASH_PREFIX)) return null
  try {
    const raw = hash.slice(HASH_PREFIX.length)
    if (raw.length > MAX_HASH_B64_LENGTH) return null
    const bin = atob(raw)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i)
    }
    const candidates: string[] = [new TextDecoder('utf-8').decode(bytes)]
    try {
      candidates.push(decodeURIComponent(escape(bin)))
    } catch {
      /* ignore */
    }
    for (const json of candidates) {
      try {
        const parsed: unknown = JSON.parse(json)
        const s = sanitizePresetPayload(parsed)
        if (s) return s
      } catch {
        /* next candidate */
      }
    }
  } catch {
    return null
  }
  return null
}

function loadStoredPreset(): PresetPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return sanitizePresetPayload(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

function saveStoredPreset(payload: PresetPayload): void {
  try {
    const toStore: PresetPayload = {
      ...payload,
      inputText:
        payload.inputText.length > MAX_STORED_INPUT_LENGTH
          ? payload.inputText.slice(0, MAX_STORED_INPUT_LENGTH)
          : payload.inputText,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch {
    /* private mode / quota */
  }
}

function loadPreviewBg(): PreviewBgId {
  try {
    return normalizePreviewBgId(localStorage.getItem(PREVIEW_BG_KEY))
  } catch {
    return 'solid'
  }
}

function savePreviewBg(bg: PreviewBgId): void {
  try {
    localStorage.setItem(PREVIEW_BG_KEY, bg)
  } catch {
    /* ignore quota */
  }
}

export function Generator() {
  const t = useTranslations('generator')
  const tFmt = useTranslations('formats')
  const tForm = useTranslations('formatting')

  const [inputText, setInputText] = useState('')
  const [format, setFormat] = useState<CodeFormat>('ampersand')
  const [formatting, setFormatting] = useState<FormattingOptions>(
    defaultPayload().formatting
  )
  const [gradientColors, setGradientColors] = useState<RGBColor[]>(
    defaultPayload().gradientColors
  )
  const [useRainbow, setUseRainbow] = useState(false)
  const [charsPerColor, setCharsPerColor] = useState(1)
  const [prefix, setPrefix] = useState('')
  const [suffix, setSuffix] = useState('')
  const [lowercaseHex, setLowercaseHex] = useState(false)

  const [copied, setCopied] = useState(false)
  const [urlCopied, setUrlCopied] = useState(false)
  /** Lets user type partial hex; commit when valid 6-digit. */
  const [hexDraftByIndex, setHexDraftByIndex] = useState<Record<number, string>>(
    {}
  )
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [yamlLinkedFieldId, setYamlLinkedFieldId] = useState<string | null>(
    null
  )
  const [yamlLinkedPath, setYamlLinkedPath] = useState('')
  const [yamlExpanded, setYamlExpanded] = useState(false)
  const [storageReady, setStorageReady] = useState(false)
  const [paletteMode, setPaletteMode] = useState<PaletteMode>('chaos')
  const [luckyCount, setLuckyCount] = useState(false)
  const [paletteHistory, setPaletteHistory] = useState<RGBColor[][]>([])
  const [diceSpin, setDiceSpin] = useState(false)
  const [previewBg, setPreviewBg] = useState<PreviewBgId>('solid')
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const urlCopyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const diceSpinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (copyResetTimeoutRef.current) clearTimeout(copyResetTimeoutRef.current)
      if (urlCopyResetTimeoutRef.current) clearTimeout(urlCopyResetTimeoutRef.current)
      if (diceSpinTimeoutRef.current) clearTimeout(diceSpinTimeoutRef.current)
    },
    []
  )

  useEffect(() => {
    setHexDraftByIndex({})
  }, [gradientColors.length])

  const applyPayload = useCallback((p: PresetPayload) => {
    setInputText(p.inputText)
    setFormat(normalizeCodeFormat(String(p.format)))
    setFormatting(p.formatting)
    const gc =
      p.gradientColors?.length ? p.gradientColors : defaultPayload().gradientColors
    setGradientColors(gc)
    setUseRainbow(p.useRainbow)
    setCharsPerColor(Math.max(1, Math.min(24, p.charsPerColor ?? 1)))
    setPrefix(p.prefix)
    setSuffix(p.suffix)
    setLowercaseHex(p.lowercaseHex)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const h = window.location.hash.replace(/^#/, '')
    const fromHash = decodeHash(h)
    if (fromHash) {
      applyPayload(fromHash)
      saveStoredPreset(fromHash)
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      )
    } else {
      const stored = loadStoredPreset()
      if (stored) applyPayload(stored)
    }
    setPreviewBg(loadPreviewBg())
    setStorageReady(true)
  }, [applyPayload])

  useEffect(() => {
    if (!storageReady) return
    savePreviewBg(previewBg)
  }, [storageReady, previewBg])

  useEffect(() => {
    if (!storageReady) return
    const payload: PresetPayload = {
      v: 1,
      inputText,
      format,
      formatting,
      gradientColors,
      useRainbow,
      charsPerColor,
      prefix,
      suffix,
      lowercaseHex,
    }
    const timer = window.setTimeout(() => {
      saveStoredPreset(payload)
    }, SAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [
    storageReady,
    inputText,
    format,
    formatting,
    gradientColors,
    useRainbow,
    charsPerColor,
    prefix,
    suffix,
    lowercaseHex,
  ])

  const clearYamlLink = useCallback(() => {
    setYamlLinkedFieldId(null)
    setYamlLinkedPath('')
  }, [])

  const handleYamlLinkField = useCallback(
    (fieldId: string, rawValue: string, path: string) => {
      setYamlLinkedFieldId(fieldId)
      setYamlLinkedPath(path)
      setInputText(
        format === 'custom' ? rawValue : stripToRgbPlainInput(rawValue)
      )
    },
    [format]
  )

  const handleYamlLinkedRawEdit = useCallback(
    (rawValue: string) => {
      setInputText(
        format === 'custom' ? rawValue : stripToRgbPlainInput(rawValue)
      )
    },
    [format]
  )

  const applyLinkedPreviewInput = useCallback((text: string) => {
    setInputText(text)
  }, [])

  const solidColor = useMemo(() => {
    if (useRainbow) return null
    if (gradientColors.length === 1) return gradientColors[0]
    return null
  }, [useRainbow, gradientColors])

  const isGradientMode = !useRainbow && gradientColors.length >= 2

  const outputCore = useMemo(() => {
    if (!inputText.trim()) return ''
    if (format === 'custom') return inputText

    if (useRainbow) {
      return generateRainbowGradient(
        inputText,
        format,
        formatting,
        lowercaseHex
      )
    }

    if (isGradientMode) {
      return generateGradientText(
        inputText,
        gradientColors,
        format,
        formatting,
        charsPerColor,
        lowercaseHex
      )
    }

    if (solidColor) {
      return generateSingleColor(
        inputText,
        solidColor,
        format,
        formatting,
        lowercaseHex
      )
    }

    return inputText
  }, [
    inputText,
    format,
    formatting,
    solidColor,
    gradientColors,
    isGradientMode,
    useRainbow,
    charsPerColor,
    lowercaseHex,
  ])

  const outputText = useMemo(
    () => `${prefix}${outputCore}${suffix}`,
    [outputCore, prefix, suffix]
  )

  const previewSegments = useMemo(
    () =>
      buildPreviewSegments(
        inputText,
        solidColor,
        gradientColors,
        isGradientMode,
        useRainbow,
        charsPerColor,
        format
      ),
    [
      inputText,
      solidColor,
      gradientColors,
      isGradientMode,
      useRainbow,
      charsPerColor,
      format,
    ]
  )

  const gradientBarStyle = useMemo(() => {
    if (useRainbow) {
      return {
        background:
          'linear-gradient(90deg,#ef4444,#f97316,#eab308,#22c55e,#06b6d4,#6366f1,#a855f7)',
      } as const
    }
    if (isGradientMode) {
      const stops = gradientColors.map(
        (c) => `rgb(${c.r},${c.g},${c.b})`
      )
      return {
        background: `linear-gradient(90deg,${stops.join(',')})`,
      } as const
    }
    if (solidColor) {
      const c = `rgb(${solidColor.r},${solidColor.g},${solidColor.b})`
      return { background: `linear-gradient(90deg,${c},${c})` } as const
    }
    return {
      background: 'linear-gradient(90deg,#3f3f46,#52525b)',
    } as const
  }, [useRainbow, isGradientMode, gradientColors, solidColor])

  const copyToClipboard = useCallback(async () => {
    if (!outputText) return
    try {
      await navigator.clipboard.writeText(outputText)
      setCopied(true)
      if (copyResetTimeoutRef.current) clearTimeout(copyResetTimeoutRef.current)
      copyResetTimeoutRef.current = setTimeout(() => {
        setCopied(false)
        copyResetTimeoutRef.current = null
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [outputText])

  const copyUrl = useCallback(async () => {
    const payload: PresetPayload = {
      v: 1,
      inputText,
      format,
      formatting,
      gradientColors,
      useRainbow,
      charsPerColor,
      prefix,
      suffix,
      lowercaseHex,
    }
    const base =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}${window.location.search}`
        : ''
    const url = `${base}#${encodeHash(payload)}`
    const markUrlCopied = () => {
      setUrlCopied(true)
      if (urlCopyResetTimeoutRef.current) clearTimeout(urlCopyResetTimeoutRef.current)
      urlCopyResetTimeoutRef.current = setTimeout(() => {
        setUrlCopied(false)
        urlCopyResetTimeoutRef.current = null
      }, 2000)
    }
    try {
      await navigator.clipboard.writeText(url)
      markUrlCopied()
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = url
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        // Deprecated API: fallback when Clipboard API is unavailable (non-secure context).
        document.execCommand('copy')
        document.body.removeChild(ta)
        markUrlCopied()
      } catch {
        /* ignore */
      }
    }
  }, [
    inputText,
    format,
    formatting,
    gradientColors,
    useRainbow,
    charsPerColor,
    prefix,
    suffix,
    lowercaseHex,
  ])

  const pushPaletteHistory = useCallback((colors: RGBColor[]) => {
    setPaletteHistory((prev) => {
      const next = [colors.map((c) => ({ ...c })), ...prev]
      return next.slice(0, PALETTE_HISTORY_MAX)
    })
  }, [])

  const applyRolledPalette = useCallback(
    (colors: RGBColor[]) => {
      setUseRainbow(false)
      setGradientColors(colors)
      pushPaletteHistory(colors)
      setDiceSpin(true)
      if (diceSpinTimeoutRef.current) clearTimeout(diceSpinTimeoutRef.current)
      diceSpinTimeoutRef.current = setTimeout(() => {
        setDiceSpin(false)
        diceSpinTimeoutRef.current = null
      }, 450)
    },
    [pushPaletteHistory]
  )

  const handleRandom = useCallback(() => {
    const count = luckyCount ? luckyColorCount() : gradientColors.length
    applyRolledPalette(generatePalette(paletteMode, count))
  }, [applyRolledPalette, gradientColors.length, luckyCount, paletteMode])

  const handleLuckySurprise = useCallback(() => {
    const mode = randomPaletteMode()
    setPaletteMode(mode)
    applyRolledPalette(generatePalette(mode, luckyColorCount()))
  }, [applyRolledPalette])

  const restoreHistoryPalette = useCallback((colors: RGBColor[]) => {
    setUseRainbow(false)
    setGradientColors(colors.map((c) => ({ ...c })))
  }, [])

  const undoLastRoll = useCallback(() => {
    setPaletteHistory((prev) => {
      if (prev.length < 2) return prev
      const [, ...rest] = prev
      const restore = rest[0]
      if (restore) {
        setUseRainbow(false)
        setGradientColors(restore.map((c) => ({ ...c })))
      }
      return rest
    })
  }, [])

  const toggleFormatting = useCallback((key: keyof FormattingOptions) => {
    setFormatting((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const toggleRainbow = useCallback(() => {
    setUseRainbow((r) => !r)
  }, [])

  const setColorCount = useCallback((n: number) => {
    const next = Math.max(1, Math.min(8, n))
    setGradientColors((prev) => {
      const copy = [...prev]
      while (copy.length < next) copy.push(generateRandomColor())
      while (copy.length > next) copy.pop()
      return copy
    })
    setUseRainbow(false)
  }, [])

  const updateColorHex = useCallback((index: number, hex: string) => {
    const rgb = hexToRgb(hex)
    if (!rgb) return
    setHexDraftByIndex((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
    setGradientColors((prev) => {
      const n = [...prev]
      n[index] = rgb
      return n
    })
    setUseRainbow(false)
  }, [])

  const removeColorAt = useCallback(
    (index: number) => {
      setGradientColors((prev) => {
        if (prev.length <= 1) return prev
        return prev.filter((_, i) => i !== index)
      })
      setUseRainbow(false)
    },
    []
  )

  const reverseColors = useCallback(() => {
    setGradientColors((prev) => [...prev].reverse())
  }, [])

  const shuffleColors = useCallback(() => {
    setGradientColors((prev) => {
      const a = [...prev]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    })
  }, [])

  const copyColorsJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(gradientColors))
    } catch {
      /* ignore */
    }
  }, [gradientColors])

  const bumpCharsPerColor = useCallback((d: number) => {
    setCharsPerColor((c) => Math.max(1, Math.min(24, c + d)))
  }, [])

  const previewBgDef = PREVIEW_BACKGROUNDS[previewBg]

  const contrastSceneList = useMemo(
    () =>
      CONTRAST_SCENE_IDS.map((id) => ({
        id,
        background: effectivePreviewBgColor(PREVIEW_BACKGROUNDS[id]),
      })),
    []
  )

  const contrastColors = useMemo(() => {
    if (useRainbow) return sampleRainbowStops(6)
    return gradientColors
  }, [useRainbow, gradientColors])

  const contrastMulti = useMemo(
    () => analyzeColorsAcrossScenes(contrastColors, contrastSceneList),
    [contrastColors, contrastSceneList]
  )

  const showContrastPanel = contrastMulti.verdict === 'fail'

  const applyBoostedColors = useCallback((next: RGBColor[]) => {
    setUseRainbow(false)
    setGradientColors(next)
  }, [])

  const boostContrastAllScenes = useCallback(() => {
    const base = useRainbow ? sampleRainbowStops(5) : gradientColors
    const bgs = contrastSceneList.map((s) => s.background)
    applyBoostedColors(boostColorsForScenes(base, bgs))
  }, [useRainbow, gradientColors, contrastSceneList, applyBoostedColors])

  const mirrorObfuscation =
    formatting.obfuscated ? 'mc-obfuscated ' : ''

  const previewVisualFmt = [
    formatting.bold ? 'rgb-fmt-bold' : '',
    formatting.italic ? 'rgb-fmt-italic' : '',
    formatting.underline ? 'underline' : '',
    formatting.strikethrough ? 'line-through' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const fmtOptions: { value: CodeFormat; label: string }[] = [
    { value: 'minimessage', label: tFmt('minimessage') },
    { value: 'entity_hex', label: tFmt('entityHex') },
    { value: 'ampersand', label: tFmt('ampersand') },
    { value: 'section', label: tFmt('section') },
    { value: 'bracket_hex', label: tFmt('bracketHex') },
    { value: 'json', label: tFmt('json') },
    { value: 'bbcode', label: tFmt('bbcode') },
    { value: 'custom', label: tFmt('custom') },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      {/* Hero: input + live preview + gradient strip */}
      <section className="panel flex max-h-[min(42vh,20rem)] shrink-0 flex-col gap-2 rounded-xl border border-edge bg-panel p-3 shadow-lg">
        <div
          className="relative min-h-[5.5rem] flex-1 overflow-hidden rounded-lg border border-white/10"
          style={previewBgCss(previewBgDef)}
        >
          <div className="absolute bottom-2 left-2 z-20 flex items-center gap-0.5 rounded-lg border border-white/10 bg-[#161922]/95 p-0.5 backdrop-blur-sm">
            {PREVIEW_BG_ORDER.map((id) => {
              const Icon = PREVIEW_BG_ICONS[id]
              const active = previewBg === id
              return (
                <button
                  key={id}
                  type="button"
                  title={t(`previewBg.${id}`)}
                  aria-pressed={active}
                  onClick={() => setPreviewBg(id)}
                  className={`rounded p-1.5 transition-colors ${
                    active
                      ? 'bg-emerald-500/35 text-white ring-1 ring-emerald-400/70'
                      : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              )
            })}
          </div>

          <div className="absolute right-2 top-2 z-20 flex items-center gap-0.5 rounded-lg border border-white/10 bg-[#161922]/95 p-0.5 backdrop-blur-sm">
            {(
              [
                ['bold', Bold],
                ['italic', Italic],
                ['underline', Underline],
                ['strikethrough', Strikethrough],
                ['obfuscated', Eye],
              ] as const
            ).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                title={tForm(key)}
                onClick={() => toggleFormatting(key)}
                className={`rounded p-1.5 transition-colors ${
                  formatting[key]
                    ? 'bg-sky-500/40 text-white ring-1 ring-sky-400/70'
                    : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onScroll={(e) => {
              setScrollTop(e.currentTarget.scrollTop)
              setScrollLeft(e.currentTarget.scrollLeft)
            }}
            spellCheck={false}
            placeholder=""
            aria-label={t('inputPlaceholder')}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            className={`rgb-editor-stack absolute inset-0 z-10 box-border resize-none bg-transparent px-3 py-3 pb-10 pr-14 text-transparent caret-sky-400 outline-none ring-0 selection:bg-sky-500/35 ${previewVisualFmt}`}
          />

          <div
            className={`rgb-editor-stack pointer-events-none absolute inset-0 z-0 overflow-hidden px-3 py-3 pb-10 pr-14 ${previewVisualFmt}`}
            aria-hidden
          >
            <div
              style={{
                transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`,
              }}
            >
              {!inputText ? (
                <span
                  className={
                    previewBg === 'chat' ? 'text-zinc-500' : 'text-zinc-400'
                  }
                >
                  {t('inputPlaceholder')}
                </span>
              ) : (
                <div className={`rgb-editor-pixel-layer text-[inherit] ${mirrorObfuscation}`}>
                  {previewSegments.map((seg, i) => (
                    <span
                      key={`${i}-${seg.char}`}
                      style={{
                        color: `rgb(${seg.color.r},${seg.color.g},${seg.color.b})`,
                      }}
                    >
                      {seg.char === ' ' ? '\u00A0' : seg.char}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="h-2 w-full shrink-0 rounded-full shadow-inner"
          style={gradientBarStyle}
          aria-hidden
        />

        {showContrastPanel ? (
          <div className="flex shrink-0 flex-wrap items-center gap-1 rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-950 dark:text-amber-100">
            <span className="font-medium opacity-75">{t('contrastScenesLabel')}</span>
            {contrastMulti.rows.map((row) => {
              const Icon = PREVIEW_BG_ICONS[row.id as PreviewBgId]
              const v = row.report.verdict
              return (
                <button
                  key={row.id}
                  type="button"
                  title={`${t(`previewBg.${row.id}`)} · avg ${row.report.avgRatio.toFixed(1)}:1 (min ${row.report.minRatio.toFixed(1)})`}
                  onClick={() => setPreviewBg(row.id as PreviewBgId)}
                  className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 tabular-nums ${
                    v === 'ok'
                      ? 'text-emerald-800 dark:text-emerald-200'
                      : v === 'warn'
                        ? 'text-yellow-900 dark:text-yellow-100'
                        : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {row.report.avgRatio.toFixed(1)}
                </button>
              )
            })}
            <button
              type="button"
              onClick={boostContrastAllScenes}
              className="ml-auto inline-flex items-center gap-1 rounded border border-sky-500/40 bg-sky-500/15 px-1.5 py-0.5 font-medium text-sky-950 hover:bg-sky-500/25 dark:text-sky-50"
            >
              <SunMedium className="h-3 w-3" />
              {t('contrastBoostAll')}
            </button>
          </div>
        ) : null}

        {yamlLinkedFieldId ? (
          <p className="shrink-0 text-[10px] leading-snug text-sky-800 dark:text-sky-400/90">
            {t('yamlPreviewLinked', { path: yamlLinkedPath })}
          </p>
        ) : null}
      </section>

      {/* Full-width generated output: compact strip under input, above settings */}
      <section className="panel shrink-0 rounded-xl border border-edge bg-panel p-2 shadow-lg">
        <div className="relative h-[4.75rem] sm:h-[5.25rem]">
          <textarea
            value={outputText}
            readOnly
            placeholder={t('outputPlaceholder')}
            className="box-border h-full w-full resize-none overflow-y-auto rounded-lg border border-edge-strong bg-input px-2 py-1.5 pb-9 font-mono text-[10px] leading-relaxed text-fg-soft outline-none"
            aria-label={t('outputPlaceholder')}
          />
          <div className="pointer-events-auto absolute bottom-1.5 right-1.5 z-20 flex items-center gap-1">
            <button
              type="button"
              onClick={copyUrl}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-edge-strong bg-panel px-2 py-1 text-[11px] text-fg-soft shadow-md hover:bg-muted-hover"
            >
              {urlCopied ? (
                <>
                  <Check className="h-3 w-3" />
                  {t('copied')}
                </>
              ) : (
                <>
                  <Link2 className="h-3 w-3" />
                  {t('copyUrl')}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-sky-600 px-2 py-1 text-[11px] text-white shadow-md hover:bg-sky-500"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  {t('copied')}
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  {t('copy')}
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Three columns - YAML can expand to full width under the preview */}
      <section
        className={`min-h-0 min-w-0 flex-1 gap-2 overflow-hidden ${
          yamlExpanded
            ? 'flex flex-col'
            : 'grid grid-cols-1 xl:grid-cols-3'
        }`}
      >
        {!yamlExpanded ? (
          <>
        {/* Colors */}
        <div className="panel flex min-h-0 min-w-0 flex-col gap-1.5 overflow-hidden rounded-xl border border-edge bg-panel p-2.5">
          <div className="flex shrink-0 items-center justify-between gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {t('columnColors')}
          </h2>
            <div className="flex items-center gap-2 text-[10px] text-muted">
              <div className="flex items-center gap-0.5" title={t('charsPerColor')}>
                <span className="mr-0.5 hidden sm:inline">{t('charsPerColorShort')}</span>
                <button
                  type="button"
                  className="rounded border border-edge-strong bg-muted-fill p-0.5 hover:bg-muted-hover"
                  onClick={() => bumpCharsPerColor(-1)}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="min-w-[1.1rem] text-center tabular-nums text-fg-soft">
                  {charsPerColor}
                </span>
                <button
                  type="button"
                  className="rounded border border-edge-strong bg-muted-fill p-0.5 hover:bg-muted-hover"
                  onClick={() => bumpCharsPerColor(1)}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center gap-0.5" title={t('colorCount')}>
                <span className="mr-0.5 hidden sm:inline">{t('colorCountShort')}</span>
                <button
                  type="button"
                  className="rounded border border-edge-strong bg-muted-fill p-0.5 hover:bg-muted-hover"
                  onClick={() => setColorCount(gradientColors.length - 1)}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="min-w-[1.1rem] text-center tabular-nums text-fg-soft">
                  {gradientColors.length}
                </span>
                <button
                  type="button"
                  className="rounded border border-edge-strong bg-muted-fill p-0.5 hover:bg-muted-hover"
                  onClick={() => setColorCount(gradientColors.length + 1)}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <div className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {PALETTE_MODE_IDS.map((mode) => {
                const active = paletteMode === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaletteMode(mode)}
                    title={`${t(`palette.${mode}`)} — ${t(`paletteHint.${mode}`)}`}
                    className={`h-5 w-6 shrink-0 overflow-hidden rounded border transition ${
                      active
                        ? 'border-sky-500 ring-1 ring-sky-400/60'
                        : 'border-edge-strong hover:border-sky-500/40'
                    }`}
                    style={{ background: palettePreviewStyle(paletteModeSwatch(mode)) }}
                  >
                    <span className="sr-only">{t(`palette.${mode}`)}</span>
                  </button>
                )
              })}
            </div>
            <label
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded border border-edge px-1.5 py-0.5 text-[10px] text-muted"
              title={t('luckyCount')}
            >
              <input
                type="checkbox"
                checked={luckyCount}
                onChange={(e) => setLuckyCount(e.target.checked)}
                className="h-3 w-3 rounded border-edge-strong bg-input text-sky-500"
              />
              <span className="max-w-[4.5rem] truncate">{t('luckyCountShort')}</span>
            </label>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={handleRandom}
              title={t(`palette.${paletteMode}`)}
              className="group relative inline-flex h-7 min-w-0 flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-md border border-sky-400/50 bg-gradient-to-r from-sky-600 via-violet-600 to-fuchsia-600 px-2 text-[11px] font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
            >
              <Dices
                className={`relative h-3.5 w-3.5 ${diceSpin ? 'animate-spin' : 'group-hover:rotate-12'}`}
              />
              <span className="relative truncate">{t('randomRoll')}</span>
            </button>
            <button
              type="button"
              onClick={handleLuckySurprise}
              title={t('luckySurprise')}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-fuchsia-500/45 bg-fuchsia-600/20 text-fuchsia-600 transition hover:bg-fuchsia-600/35 dark:text-fuchsia-200"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={undoLastRoll}
              disabled={paletteHistory.length < 2}
              title={t('undoRoll')}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-edge-strong bg-muted-fill text-muted transition hover:bg-muted-hover hover:text-fg disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleRainbow}
              className={`h-7 rounded-md px-2 text-[11px] ${
                useRainbow
                  ? 'bg-gradient-to-r from-red-500 via-lime-500 to-violet-600 text-white'
                  : 'border border-edge-strong bg-muted-fill text-fg-soft hover:bg-muted-hover'
              }`}
            >
              {t('rainbow')}
            </button>
            <button
              type="button"
              onClick={reverseColors}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-edge-strong text-muted hover:bg-muted-hover hover:text-fg-soft"
              title={t('reverseColors')}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={shuffleColors}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-edge-strong text-muted hover:bg-muted-hover hover:text-fg-soft"
              title={t('shuffleColors')}
            >
              <Shuffle className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={copyColorsJson}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-edge-strong text-muted hover:bg-muted-hover hover:text-fg-soft"
              title={t('copyColors')}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          {paletteHistory.length > 0 ? (
            <div className="flex shrink-0 gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {paletteHistory.map((colors, i) => (
                <button
                  key={`hist-${i}-${colors.map((c) => `${c.r}${c.g}${c.b}`).join('-')}`}
                  type="button"
                  onClick={() => restoreHistoryPalette(colors)}
                  title={t('restorePalette')}
                  className="h-3.5 w-8 shrink-0 rounded-sm border border-edge-strong transition hover:border-sky-400/60"
                  style={{ background: palettePreviewStyle(colors) }}
                />
              ))}
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain">
            {gradientColors.map((c, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 rounded-lg border border-edge bg-muted-fill px-1.5 py-1"
              >
                <input
                  type="color"
                  value={`#${rgbToHexString(c)}`}
                  onChange={(e) => updateColorHex(idx, e.target.value)}
                  className="h-7 w-8 shrink-0 cursor-pointer rounded border border-edge-strong bg-transparent p-0"
                />
                <input
                  type="text"
                  value={
                    hexDraftByIndex[idx] !== undefined
                      ? hexDraftByIndex[idx]!
                      : `#${rgbToHexString(c)}`
                  }
                  onChange={(e) => {
                    const v = e.target.value
                    setHexDraftByIndex((prev) => ({ ...prev, [idx]: v }))
                    const rgb = hexToRgb(v)
                    if (rgb) {
                      setGradientColors((prev) => {
                        const n = [...prev]
                        n[idx] = rgb
                        return n
                      })
                      setUseRainbow(false)
                    }
                  }}
                  onBlur={(e) => {
                    const v = e.target.value
                    const rgb = hexToRgb(v)
                    setHexDraftByIndex((prev) => {
                      if (!(idx in prev)) return prev
                      const next = { ...prev }
                      delete next[idx]
                      return next
                    })
                    if (rgb) {
                      setGradientColors((prev) => {
                        const n = [...prev]
                        n[idx] = rgb
                        return n
                      })
                      setUseRainbow(false)
                    }
                  }}
                  className="relative z-10 min-w-0 flex-1 rounded border border-edge-strong bg-input px-1.5 py-0.5 font-mono text-[11px] text-fg-soft outline-none focus:border-sky-500/50"
                  spellCheck={false}
                  autoComplete="off"
                  aria-label={t('hexInputAria')}
                />
                <button
                  type="button"
                  onClick={() => removeColorAt(idx)}
                  disabled={gradientColors.length <= 1}
                  className="shrink-0 rounded p-1 text-muted hover:bg-red-500/20 hover:text-red-300 disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Output */}
        <div className="panel flex min-h-0 min-w-0 flex-col gap-2 overflow-y-auto rounded-xl border border-edge bg-panel p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
            {t('columnOutput')}
          </h2>

          <label className="text-[10px] font-medium uppercase tracking-wide text-muted">
            {t('format')}
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as CodeFormat)}
            className="rounded-lg border border-edge-strong bg-input px-2 py-1.5 text-xs text-fg-soft outline-none focus:border-sky-500/50"
          >
            {fmtOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium uppercase tracking-wide text-muted">
              {t('prefix')}
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="rounded-lg border border-edge-strong bg-input px-2 py-1 font-mono text-[10px] text-fg-soft outline-none focus:border-sky-500/50"
              spellCheck={false}
              autoComplete="off"
            />
            <label className="text-[10px] font-medium uppercase tracking-wide text-muted">
              {t('suffix')}
            </label>
            <input
              type="text"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              className="rounded-lg border border-edge-strong bg-input px-2 py-1 font-mono text-[10px] text-fg-soft outline-none focus:border-sky-500/50"
              spellCheck={false}
              autoComplete="off"
            />
            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-muted">
              <input
                type="checkbox"
                checked={lowercaseHex}
                onChange={(e) => setLowercaseHex(e.target.checked)}
                className="rounded border-edge-strong bg-input text-sky-500"
              />
              {t('lowercaseHex')}
            </label>
          </div>
        </div>
          </>
        ) : null}

        <div
          className={
            yamlExpanded
              ? 'flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden'
              : 'flex h-full min-h-0 min-w-0 flex-col'
          }
        >
          <YamlEditorPanel
            expanded={yamlExpanded}
            onExpand={() => setYamlExpanded(true)}
            onCollapse={() => setYamlExpanded(false)}
            linkedFieldId={yamlLinkedFieldId}
            generatorSyncedOutput={
              yamlLinkedFieldId ? outputText : null
            }
            codeFormat={format}
            onLinkField={handleYamlLinkField}
            onLinkedFieldRawEdit={handleYamlLinkedRawEdit}
            onApplyLinkedPreviewInput={applyLinkedPreviewInput}
            onYamlEnvironmentReset={clearYamlLink}
          />
        </div>
      </section>
    </div>
  )
}
