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
import { stripToRgbPlainInput } from '@/lib/strip-minecraft-codes'
import { YamlEditorPanel } from './YamlEditorPanel'

const HASH_PREFIX = 's='

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
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (copyResetTimeoutRef.current) clearTimeout(copyResetTimeoutRef.current)
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
    const p = decodeHash(h)
    if (!p) return
    applyPayload(p)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [applyPayload])

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
    try {
      await navigator.clipboard.writeText(url)
      setUrlCopied(true)
      if (copyResetTimeoutRef.current) clearTimeout(copyResetTimeoutRef.current)
      copyResetTimeoutRef.current = setTimeout(() => {
        setUrlCopied(false)
        copyResetTimeoutRef.current = null
      }, 2000)
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
        setUrlCopied(true)
        if (copyResetTimeoutRef.current) clearTimeout(copyResetTimeoutRef.current)
        copyResetTimeoutRef.current = setTimeout(() => {
          setUrlCopied(false)
          copyResetTimeoutRef.current = null
        }, 2000)
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

  const handleRandom = useCallback(() => {
    setUseRainbow(false)
    setGradientColors((prev) => prev.map(() => generateRandomColor()))
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

  const mirrorObfuscation =
    formatting.obfuscated ? 'mc-obfuscated ' : ''

  const previewVisualFmt = [
    formatting.bold ? 'font-bold' : '',
    formatting.italic ? 'italic' : '',
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
      <section className="panel flex max-h-[min(38vh,19rem)] shrink-0 flex-col gap-2 rounded-xl border border-white/[0.06] bg-[#161922] p-3 shadow-lg">
        <div className="relative min-h-[5.5rem] flex-1 overflow-hidden rounded-lg border border-white/[0.08] bg-[#0d0f14]">
          <div className="absolute right-2 top-2 z-20 flex items-center gap-0.5 rounded-lg border border-white/10 bg-black/50 p-0.5">
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
            className={`rgb-editor-stack absolute inset-0 z-10 box-border resize-none bg-transparent px-3 py-3 pr-14 text-transparent caret-sky-400 outline-none ring-0 selection:bg-sky-500/35 ${previewVisualFmt}`}
          />

          <div
            className={`rgb-editor-stack pointer-events-none absolute inset-0 z-0 overflow-hidden px-3 py-3 pr-14 ${previewVisualFmt}`}
            aria-hidden
          >
            <div
              style={{
                transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`,
              }}
            >
              {!inputText ? (
                <span className="text-zinc-500">{t('inputPlaceholder')}</span>
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

        {yamlLinkedFieldId ? (
          <p className="shrink-0 text-[10px] leading-snug text-sky-400/90">
            {t('yamlPreviewLinked', { path: yamlLinkedPath })}
          </p>
        ) : null}
      </section>

      {/* Full-width generated output: compact strip under input, above settings */}
      <section className="panel shrink-0 rounded-xl border border-white/[0.06] bg-[#161922] p-2 shadow-lg">
        <div className="relative h-[4.75rem] sm:h-[5.25rem]">
          <textarea
            value={outputText}
            readOnly
            placeholder={t('outputPlaceholder')}
            className="box-border h-full w-full resize-none overflow-y-auto rounded-lg border border-white/10 bg-[#0d0f14] px-2 py-1.5 pb-9 font-mono text-[10px] leading-relaxed text-zinc-300 outline-none"
            aria-label={t('outputPlaceholder')}
          />
          <div className="pointer-events-auto absolute bottom-1.5 right-1.5 z-20 flex items-center gap-1">
            <button
              type="button"
              onClick={copyUrl}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-white/10 bg-black/90 px-2 py-1 text-[11px] text-zinc-200 shadow-md hover:bg-zinc-800"
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
        className={`grid min-h-0 min-w-0 flex-1 gap-2 overflow-hidden ${
          yamlExpanded ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-3'
        }`}
      >
        {!yamlExpanded ? (
          <>
        {/* Colors */}
        <div className="panel flex min-h-0 min-w-0 flex-col gap-2 overflow-y-auto rounded-xl border border-white/[0.06] bg-[#161922] p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t('columnColors')}
          </h2>

          <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
            <span>{t('charsPerColor')}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded border border-white/10 bg-black/30 p-1 hover:bg-white/10"
                onClick={() => bumpCharsPerColor(-1)}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[1.5rem] text-center tabular-nums text-zinc-200">
                {charsPerColor}
              </span>
              <button
                type="button"
                className="rounded border border-white/10 bg-black/30 p-1 hover:bg-white/10"
                onClick={() => bumpCharsPerColor(1)}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
            <span>{t('colorCount')}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded border border-white/10 bg-black/30 p-1 hover:bg-white/10"
                onClick={() => setColorCount(gradientColors.length - 1)}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[1.5rem] text-center tabular-nums text-zinc-200">
                {gradientColors.length}
              </span>
              <button
                type="button"
                className="rounded border border-white/10 bg-black/30 p-1 hover:bg-white/10"
                onClick={() => setColorCount(gradientColors.length + 1)}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={toggleRainbow}
              className={`rounded-md px-2 py-1 text-[11px] ${
                useRainbow
                  ? 'bg-gradient-to-r from-red-500 via-lime-500 to-violet-600 text-white'
                  : 'border border-white/10 bg-black/25 text-zinc-300 hover:bg-white/10'
              }`}
            >
              {t('rainbow')}
            </button>
            <button
              type="button"
              onClick={handleRandom}
              className="inline-flex items-center gap-1 rounded-md border border-sky-500/40 bg-sky-600/30 px-2 py-1 text-[11px] text-sky-200 hover:bg-sky-600/45"
            >
              <Shuffle className="h-3 w-3" />
              {t('random')}
            </button>
            <button
              type="button"
              onClick={reverseColors}
              className="rounded-md border border-white/10 p-1 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
              title={t('reverseColors')}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={shuffleColors}
              className="rounded-md border border-white/10 p-1 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
              title={t('shuffleColors')}
            >
              <Shuffle className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={copyColorsJson}
              className="rounded-md border border-white/10 p-1 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
              title={t('copyColors')}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {gradientColors.map((c, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-black/25 p-2"
              >
                <input
                  type="color"
                  value={`#${rgbToHexString(c)}`}
                  onChange={(e) => updateColorHex(idx, e.target.value)}
                  className="h-9 w-10 shrink-0 cursor-pointer rounded border border-white/10 bg-transparent p-0"
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
                  className="relative z-10 min-w-0 flex-1 rounded border border-white/10 bg-[#0d0f14] px-2 py-1 font-mono text-[11px] text-zinc-200 outline-none focus:border-sky-500/50"
                  spellCheck={false}
                  autoComplete="off"
                  aria-label={t('hexInputAria')}
                />
                <button
                  type="button"
                  onClick={() => removeColorAt(idx)}
                  disabled={gradientColors.length <= 1}
                  className="shrink-0 rounded p-1 text-zinc-500 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Output */}
        <div className="panel flex min-h-0 min-w-0 flex-col gap-2 overflow-y-auto rounded-xl border border-white/[0.06] bg-[#161922] p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t('columnOutput')}
          </h2>

          <label className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {t('format')}
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as CodeFormat)}
            className="rounded-lg border border-white/10 bg-[#0d0f14] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-sky-500/50"
          >
            {fmtOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {t('prefix')}
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0d0f14] px-2 py-1 font-mono text-[10px] text-zinc-200 outline-none focus:border-sky-500/50"
              spellCheck={false}
              autoComplete="off"
            />
            <label className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {t('suffix')}
            </label>
            <input
              type="text"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0d0f14] px-2 py-1 font-mono text-[10px] text-zinc-200 outline-none focus:border-sky-500/50"
              spellCheck={false}
              autoComplete="off"
            />
            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-zinc-400">
              <input
                type="checkbox"
                checked={lowercaseHex}
                onChange={(e) => setLowercaseHex(e.target.checked)}
                className="rounded border-white/20 bg-[#0d0f14] text-sky-500"
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
              ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
              : 'min-h-0 min-w-0'
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
