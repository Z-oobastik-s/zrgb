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
  Palette,
  X,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Eye,
  Link2,
  FileJson,
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
} from '@/lib/rgb-generator'
import { ColorPalette } from './ColorPalette'

const PRESETS_KEY = 'zrgb-presets-v1'
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

function encodeHash(payload: PresetPayload): string {
  return `${HASH_PREFIX}${btoa(unescape(encodeURIComponent(JSON.stringify(payload))))}`
}

function decodeHash(hash: string): PresetPayload | null {
  if (!hash.startsWith(HASH_PREFIX)) return null
  try {
    const raw = hash.slice(HASH_PREFIX.length)
    const json = decodeURIComponent(escape(atob(raw)))
    const p = JSON.parse(json) as PresetPayload
    if (p.v !== 1) return null
    return p
  } catch {
    return null
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
  const [showPalette, setShowPalette] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [importText, setImportText] = useState('')
  const [presetName, setPresetName] = useState('')
  const [presetList, setPresetList] = useState<string[]>([])

  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (copyResetTimeoutRef.current) clearTimeout(copyResetTimeoutRef.current)
    },
    []
  )

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRESETS_KEY)
      if (raw) {
        const o = JSON.parse(raw) as Record<string, PresetPayload>
        setPresetList(Object.keys(o).sort())
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const h = window.location.hash.replace(/^#/, '')
    const p = decodeHash(h)
    if (!p) return
    applyPayload(p)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [])

  const applyPayload = (p: PresetPayload & { selectedColor?: RGBColor | null; useGradient?: boolean }) => {
    setInputText(p.inputText)
    setFormat(p.format)
    setFormatting(p.formatting)
    const gc =
      p.gradientColors?.length ? p.gradientColors : defaultPayload().gradientColors
    setGradientColors(gc)
    setUseRainbow(p.useRainbow)
    setCharsPerColor(Math.max(1, p.charsPerColor ?? 1))
    setPrefix(p.prefix ?? '')
    setSuffix(p.suffix ?? '')
    setLowercaseHex(!!p.lowercaseHex)
  }

  const solidColor = useMemo(() => {
    if (useRainbow) return null
    if (gradientColors.length === 1) return gradientColors[0]
    return null
  }, [useRainbow, gradientColors])

  const isGradientMode = !useRainbow && gradientColors.length >= 2

  const outputCore = useMemo(() => {
    if (!inputText.trim()) return ''

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
    () => (outputCore ? `${prefix}${outputCore}${suffix}` : ''),
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
        charsPerColor
      ),
    [
      inputText,
      solidColor,
      gradientColors,
      isGradientMode,
      useRainbow,
      charsPerColor,
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
    const url = `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}#${encodeHash(payload)}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* ignore */
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

  const handleColorSelect = useCallback((color: RGBColor) => {
    setGradientColors([color])
    setUseRainbow(false)
    setShowPalette(false)
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

  const savePreset = useCallback(() => {
    const name = presetName.trim()
    if (!name) return
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
    try {
      const raw = localStorage.getItem(PRESETS_KEY)
      const o = raw ? (JSON.parse(raw) as Record<string, PresetPayload>) : {}
      o[name] = payload
      localStorage.setItem(PRESETS_KEY, JSON.stringify(o))
      setPresetList(Object.keys(o).sort())
    } catch {
      /* ignore */
    }
  }, [
    presetName,
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

  const loadPreset = useCallback((name: string) => {
    if (!name) return
    try {
      const raw = localStorage.getItem(PRESETS_KEY)
      if (!raw) return
      const o = JSON.parse(raw) as Record<string, PresetPayload>
      if (o[name]) applyPayload(o[name])
    } catch {
      /* ignore */
    }
  }, [])

  const deletePreset = useCallback((name: string) => {
    if (!name) return
    try {
      const raw = localStorage.getItem(PRESETS_KEY)
      if (!raw) return
      const o = JSON.parse(raw) as Record<string, PresetPayload>
      delete o[name]
      localStorage.setItem(PRESETS_KEY, JSON.stringify(o))
      setPresetList(Object.keys(o).sort())
    } catch {
      /* ignore */
    }
  }, [])

  const decodeImport = useCallback(() => {
    try {
      const p = JSON.parse(importText) as PresetPayload
      if (p.v === 1) applyPayload(p)
    } catch {
      /* ignore */
    }
  }, [importText])

  const mirrorObfuscation =
    formatting.obfuscated ? 'mc-obfuscated ' : ''

  const fmtOptions: { value: CodeFormat; label: string }[] = [
    { value: 'ampersand', label: tFmt('ampersand') },
    { value: 'section', label: tFmt('section') },
    { value: 'hex', label: tFmt('hex') },
    { value: 'minimessage', label: tFmt('minimessage') },
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
                title={`${tForm(key)} (${t('formattingAppliesToOutput')})`}
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
            className="rgb-editor-stack absolute inset-0 z-10 box-border resize-none bg-transparent px-3 py-3 pr-14 text-transparent caret-sky-400 outline-none ring-0 selection:bg-sky-500/35"
          />

          <div
            className="rgb-editor-stack pointer-events-none absolute inset-0 z-0 overflow-hidden px-3 py-3 pr-14"
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
      </section>

      {/* Three columns */}
      <section className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-2 overflow-hidden xl:grid-cols-3">
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
              onClick={() => setShowPalette(true)}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/25 px-2 py-1 text-[11px] text-zinc-300 hover:bg-white/10"
            >
              <Palette className="h-3 w-3" />
              {t('colorPalette')}
            </button>
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
                  className="h-9 w-10 cursor-pointer rounded border border-white/10 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={`#${rgbToHexString(c, lowercaseHex)}`}
                  onChange={(e) => updateColorHex(idx, e.target.value)}
                  className="min-w-0 flex-1 rounded border border-white/10 bg-[#0d0f14] px-2 py-1 font-mono text-[11px] text-zinc-200 outline-none focus:border-sky-500/50"
                  spellCheck={false}
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] uppercase text-zinc-500">
                {t('prefix')}
              </label>
              <input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="w-full rounded border border-white/10 bg-[#0d0f14] px-2 py-1 font-mono text-[11px] text-zinc-200 outline-none focus:border-sky-500/50"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] uppercase text-zinc-500">
                {t('suffix')}
              </label>
              <input
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                className="w-full rounded border border-white/10 bg-[#0d0f14] px-2 py-1 font-mono text-[11px] text-zinc-200 outline-none focus:border-sky-500/50"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-zinc-400">
            <input
              type="checkbox"
              checked={lowercaseHex}
              onChange={(e) => setLowercaseHex(e.target.checked)}
              className="rounded border-white/20 bg-[#0d0f14] text-sky-500"
            />
            {t('lowercaseHex')}
          </label>

          <div className="relative min-h-[6rem] flex-1">
            <textarea
              value={outputText}
              readOnly
              placeholder={t('outputPlaceholder')}
              className="h-full min-h-[6rem] w-full resize-none rounded-lg border border-white/10 bg-[#0d0f14] px-2 py-2 pb-10 font-mono text-[10px] leading-relaxed text-zinc-300 outline-none"
            />
            <button
              type="button"
              onClick={copyToClipboard}
              className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-sky-600 px-2 py-1 text-[11px] text-white hover:bg-sky-500"
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

        {/* Presets */}
        <div className="panel flex min-h-0 min-w-0 flex-col gap-2 overflow-y-auto rounded-xl border border-white/[0.06] bg-[#161922] p-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t('columnPresets')}
          </h2>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase text-zinc-500">{t('loadPreset')}</label>
            <select
              className="rounded-lg border border-white/10 bg-[#0d0f14] px-2 py-1.5 text-xs text-zinc-200 outline-none"
              defaultValue=""
              onChange={(e) => {
                loadPreset(e.target.value)
                e.target.value = ''
              }}
            >
              <option value="" disabled>
                {t('pickPreset')}
              </option>
              {presetList.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder={t('presetNamePlaceholder')}
              className="min-w-0 flex-1 rounded border border-white/10 bg-[#0d0f14] px-2 py-1 text-xs text-zinc-200 outline-none"
            />
            <button
              type="button"
              onClick={savePreset}
              className="shrink-0 rounded bg-sky-600/40 px-2 py-1 text-xs text-sky-100 hover:bg-sky-600/60"
            >
              {t('savePreset')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => deletePreset(presetName.trim())}
            className="inline-flex items-center gap-1 self-start rounded border border-white/10 px-2 py-1 text-[11px] text-zinc-400 hover:bg-red-500/15 hover:text-red-300"
          >
            <Trash2 className="h-3 w-3" />
            {t('deletePreset')}
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyUrl}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/25 px-2 py-1 text-[11px] text-zinc-300 hover:bg-white/10"
            >
              <Link2 className="h-3 w-3" />
              {t('copyUrl')}
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1">
            <label className="text-[10px] uppercase text-zinc-500">{t('importJson')}</label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={t('importPlaceholder')}
              className="min-h-[4rem] flex-1 resize-none rounded-lg border border-white/10 bg-[#0d0f14] px-2 py-1 font-mono text-[10px] text-zinc-300 outline-none"
            />
            <button
              type="button"
              onClick={decodeImport}
              className="inline-flex items-center gap-1 self-start rounded-md bg-zinc-700/50 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-600/60"
            >
              <FileJson className="h-3 w-3" />
              {t('decodeImport')}
            </button>
          </div>
        </div>
      </section>

      {showPalette && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-3"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-[#161922] p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 rounded-md p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              onClick={() => setShowPalette(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <ColorPalette onColorSelect={handleColorSelect} />
          </div>
        </div>
      )}
    </div>
  )
}
