'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Copy, Pause, Play } from 'lucide-react'
import { hexToRgb, rgbToHexString, type RGBColor } from '@/lib/rgb-generator'
import {
  TAB_ANIM_MODES,
  generateTabFrames,
  generateTabYaml,
  parseTabFramePreview,
  type TabAnimMode,
  type TabGeneratorOptions,
} from '@/lib/tab-animation'

const DEFAULT_A: RGBColor = { r: 251, g: 154, b: 39 }
const DEFAULT_B: RGBColor = { r: 204, g: 253, b: 65 }
const DEFAULT_H: RGBColor = { r: 255, g: 155, b: 38 }

function ColorField({
  label,
  color,
  onChange,
}: {
  label: string
  color: RGBColor
  onChange: (c: RGBColor) => void
}) {
  const hex = `#${rgbToHexString(color)}`
  return (
    <label className="flex min-w-0 flex-col gap-0.5 text-[10px] text-muted">
      <span className="font-medium uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={hex}
          onChange={(e) => {
            const rgb = hexToRgb(e.target.value)
            if (rgb) onChange(rgb)
          }}
          className="h-8 w-10 cursor-pointer rounded border border-edge-strong bg-input"
        />
        <input
          value={hex}
          onChange={(e) => {
            const rgb = hexToRgb(e.target.value)
            if (rgb) onChange(rgb)
          }}
          className="min-w-0 flex-1 rounded border border-edge-strong bg-input px-2 py-1.5 font-mono text-[11px] text-fg-soft outline-none focus:border-sky-500/50"
          spellCheck={false}
        />
      </div>
    </label>
  )
}

export function TabGeneratorView() {
  const t = useTranslations('tabPage')
  const [keyName, setKeyName] = useState('balance')
  const [text, setText] = useState('Баланс⋗')
  const [mode, setMode] = useState<TabAnimMode>('wave')
  const [colorA, setColorA] = useState<RGBColor>(DEFAULT_A)
  const [colorB, setColorB] = useState<RGBColor>(DEFAULT_B)
  const [colorHighlight, setColorHighlight] = useState<RGBColor>(DEFAULT_H)
  const [intervalMs, setIntervalMs] = useState(100)
  const [holdFrames, setHoldFrames] = useState(12)
  const [staticRepeats, setStaticRepeats] = useState(5)
  const [emptyLines, setEmptyLines] = useState(0)
  const [bold, setBold] = useState(false)
  const [lowercaseHex, setLowercaseHex] = useState(false)
  const [copied, setCopied] = useState(false)
  const [previewPlaying, setPreviewPlaying] = useState(true)
  const [previewIndex, setPreviewIndex] = useState(0)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const opts: TabGeneratorOptions = useMemo(
    () => ({
      keyName,
      text,
      mode,
      colorA,
      colorB,
      colorHighlight,
      changeIntervalMs: intervalMs,
      holdFrames,
      staticRepeats,
      emptyLines,
      bold,
      lowercaseHex,
    }),
    [
      keyName,
      text,
      mode,
      colorA,
      colorB,
      colorHighlight,
      intervalMs,
      holdFrames,
      staticRepeats,
      emptyLines,
      bold,
      lowercaseHex,
    ]
  )

  const frames = useMemo(() => generateTabFrames(opts), [opts])
  const yaml = useMemo(() => generateTabYaml(opts), [opts])

  useEffect(() => {
    setPreviewIndex(0)
  }, [frames.length, mode, text])

  useEffect(() => {
    if (!previewPlaying || frames.length === 0) return
    const id = window.setInterval(() => {
      setPreviewIndex((i) => (i + 1) % frames.length)
    }, Math.max(40, intervalMs))
    return () => window.clearInterval(id)
  }, [previewPlaying, frames.length, intervalMs])

  useEffect(
    () => () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    },
    []
  )

  const copyYaml = useCallback(async () => {
    if (!yaml) return
    try {
      await navigator.clipboard.writeText(yaml)
      setCopied(true)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false)
        copyTimeoutRef.current = null
      }, 1500)
    } catch {
      /* ignore */
    }
  }, [yaml])

  const previewFrame = frames[previewIndex] ?? ''
  const previewSegments = useMemo(
    () => parseTabFramePreview(previewFrame),
    [previewFrame]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="shrink-0">
        <h1 className="text-sm font-semibold text-fg sm:text-base">{t('title')}</h1>
        <p className="text-[11px] text-muted sm:text-xs">{t('hint')}</p>
      </div>

      <div className="grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-2">
        {/* Controls */}
        <section className="panel flex min-h-0 flex-col gap-2 overflow-y-auto rounded-xl border border-edge bg-panel p-3 shadow-lg">
          <label className="flex flex-col gap-0.5 text-[10px] text-muted">
            <span className="font-medium uppercase tracking-wide">{t('keyName')}</span>
            <input
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              className="rounded-lg border border-edge-strong bg-input px-2 py-1.5 font-mono text-xs text-fg-soft outline-none focus:border-sky-500/50"
              spellCheck={false}
            />
          </label>

          <label className="flex flex-col gap-0.5 text-[10px] text-muted">
            <span className="font-medium uppercase tracking-wide">{t('text')}</span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="rounded-lg border border-edge-strong bg-input px-2 py-1.5 text-xs text-fg-soft outline-none focus:border-sky-500/50"
              spellCheck={false}
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
              {t('mode')}
            </span>
            <div className="flex flex-wrap gap-1">
              {TAB_ANIM_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-md border px-2 py-1 text-[10px] transition ${
                    mode === m
                      ? 'border-sky-500/50 bg-accent-soft text-accent'
                      : 'border-edge-strong bg-muted-fill text-muted hover:bg-muted-hover hover:text-fg'
                  }`}
                >
                  {t(`modes.${m}`)}
                </button>
              ))}
            </div>
            <p className="text-[10px] leading-snug text-muted">{t(`modeHint.${mode}`)}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <ColorField label={t('colorA')} color={colorA} onChange={setColorA} />
            <ColorField label={t('colorB')} color={colorB} onChange={setColorB} />
            <ColorField
              label={t('colorHighlight')}
              color={colorHighlight}
              onChange={setColorHighlight}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="flex flex-col gap-0.5 text-[10px] text-muted">
              <span className="font-medium uppercase tracking-wide">
                {t('interval')}
              </span>
              <input
                type="number"
                min={20}
                max={60000}
                value={intervalMs}
                onChange={(e) => setIntervalMs(Number(e.target.value) || 100)}
                className="rounded border border-edge-strong bg-input px-2 py-1.5 font-mono text-[11px] text-fg-soft outline-none focus:border-sky-500/50"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[10px] text-muted">
              <span className="font-medium uppercase tracking-wide">
                {t('holdFrames')}
              </span>
              <input
                type="number"
                min={0}
                max={120}
                value={holdFrames}
                onChange={(e) => setHoldFrames(Number(e.target.value) || 0)}
                className="rounded border border-edge-strong bg-input px-2 py-1.5 font-mono text-[11px] text-fg-soft outline-none focus:border-sky-500/50"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[10px] text-muted">
              <span className="font-medium uppercase tracking-wide">
                {t('staticRepeats')}
              </span>
              <input
                type="number"
                min={1}
                max={60}
                value={staticRepeats}
                onChange={(e) => setStaticRepeats(Number(e.target.value) || 1)}
                className="rounded border border-edge-strong bg-input px-2 py-1.5 font-mono text-[11px] text-fg-soft outline-none focus:border-sky-500/50"
              />
            </label>
            <label className="flex flex-col gap-0.5 text-[10px] text-muted">
              <span className="font-medium uppercase tracking-wide">
                {t('emptyLines')}
              </span>
              <input
                type="number"
                min={0}
                max={20}
                value={emptyLines}
                onChange={(e) => setEmptyLines(Number(e.target.value) || 0)}
                className="rounded border border-edge-strong bg-input px-2 py-1.5 font-mono text-[11px] text-fg-soft outline-none focus:border-sky-500/50"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3 text-[11px] text-muted">
            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={bold}
                onChange={(e) => setBold(e.target.checked)}
                className="rounded border-edge-strong bg-input text-sky-500"
              />
              {t('bold')}
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={lowercaseHex}
                onChange={(e) => setLowercaseHex(e.target.checked)}
                className="rounded border-edge-strong bg-input text-sky-500"
              />
              {t('lowercaseHex')}
            </label>
          </div>
        </section>

        {/* Preview + output */}
        <section className="panel flex min-h-0 flex-col gap-2 overflow-hidden rounded-xl border border-edge bg-panel p-3 shadow-lg">
          <div className="flex shrink-0 items-center justify-between gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {t('preview')}
            </h2>
            <div className="flex items-center gap-2">
              <span className="tabular-nums text-[10px] text-muted">
                {frames.length
                  ? `${previewIndex + 1}/${frames.length}`
                  : '0/0'}
              </span>
              <button
                type="button"
                onClick={() => setPreviewPlaying((p) => !p)}
                className="inline-flex items-center gap-1 rounded border border-edge-strong bg-muted-fill px-2 py-1 text-[10px] text-fg-soft hover:bg-muted-hover"
              >
                {previewPlaying ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                {previewPlaying ? t('pause') : t('play')}
              </button>
            </div>
          </div>

          <div className="flex min-h-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#0d0f14] px-3 py-5">
            {previewSegments.length === 0 ? (
              <span className="text-[11px] text-zinc-500">{t('emptyPreview')}</span>
            ) : (
              <div
                className={`minecraft-pixel-preview max-w-full overflow-x-auto text-center text-[13px] leading-relaxed sm:text-[15px] ${
                  previewSegments.some((s) => s.bold) ? 'font-bold' : ''
                }`}
              >
                {previewSegments.map((seg, i) => (
                  <span
                    key={`${i}-${seg.char}`}
                    className={seg.bold ? 'font-bold' : undefined}
                    style={{
                      color: seg.color,
                      textShadow: '1px 1px 0 rgba(0,0,0,0.85)',
                    }}
                  >
                    {seg.char === ' ' ? '\u00A0' : seg.char}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="relative min-h-0 flex-1">
            <textarea
              readOnly
              value={yaml}
              title={t('clickToCopy')}
              onClick={() => void copyYaml()}
              className="box-border h-full min-h-[12rem] w-full cursor-pointer resize-none overflow-y-auto rounded-lg border border-edge-strong bg-input px-2 py-1.5 pb-10 font-mono text-[10px] leading-relaxed text-fg-soft outline-none hover:border-sky-500/50 sm:min-h-[14rem] sm:text-[11px]"
              aria-label={t('output')}
            />
            <button
              type="button"
              onClick={() => void copyYaml()}
              className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-sky-600 px-2 py-1 text-[11px] text-white shadow-md hover:bg-sky-500"
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
        </section>
      </div>
    </div>
  )
}
