'use client'

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
} from 'react'
import { useTranslations } from 'next-intl'
import { Upload, Download } from 'lucide-react'
import {
  extractYamlStringFields,
  applyYamlStringEdits,
  parseYamlDiagnostics,
  type YamlStringField,
} from '@/lib/yaml-editable'
import { stripToRgbPlainInput } from '@/lib/strip-minecraft-codes'
import type { CodeFormat } from '@/lib/rgb-generator'

const PAGE_SIZE = 20

export type YamlEditorPanelProps = {
  linkedFieldId?: string | null
  /** When set, this string is written into the linked YAML field (generator output). */
  generatorSyncedOutput?: string | null
  /** Current code format (refresh preview when it changes while a field is linked). */
  codeFormat?: CodeFormat
  /** User focused a field: load plain text into the main RGB input. */
  onLinkField?: (fieldId: string, rawValue: string, path: string) => void
  /** User edited the linked field directly: sync plain text back to the preview. */
  onLinkedFieldRawEdit?: (rawValue: string) => void
  /** Set main preview text when format changes (avoids stacked tags after format / YAML toggles). */
  onApplyLinkedPreviewInput?: (text: string) => void
  /** New file loaded or YAML reset: clear link in parent. */
  onYamlEnvironmentReset?: () => void
}

export function YamlEditorPanel({
  linkedFieldId = null,
  generatorSyncedOutput = null,
  codeFormat = 'ampersand',
  onLinkField,
  onLinkedFieldRawEdit,
  onApplyLinkedPreviewInput,
  onYamlEnvironmentReset,
}: YamlEditorPanelProps) {
  const t = useTranslations('generator')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevCodeFormatRef = useRef<CodeFormat | null>(null)

  const [raw, setRaw] = useState('')
  const [fileName, setFileName] = useState('')
  const [fields, setFields] = useState<YamlStringField[]>([])
  const [valuesById, setValuesById] = useState<Record<string, string>>({})
  const [parseError, setParseError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const loadFromText = useCallback((text: string, name: string) => {
    setRaw(text)
    setFileName(name)
    const diag = parseYamlDiagnostics(text)
    if (!diag.valid) {
      setParseError(diag.error ?? 'Invalid YAML')
      setFields([])
      setValuesById({})
      onYamlEnvironmentReset?.()
      return
    }
    setParseError(null)
    const nextFields = extractYamlStringFields(text)
    const init: Record<string, string> = {}
    for (const f of nextFields) init[f.id] = f.value
    setFields(nextFields)
    setValuesById(init)
    setPage(0)
    onYamlEnvironmentReset?.()
  }, [onYamlEnvironmentReset])

  const onPickFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        loadFromText(String(reader.result), file.name)
      }
      reader.onerror = () => {
        setParseError(t('yamlReadError'))
        setFields([])
        setValuesById({})
        onYamlEnvironmentReset?.()
      }
      reader.readAsText(file, 'utf-8')
      e.target.value = ''
    },
    [loadFromText, t, onYamlEnvironmentReset]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return fields
    return fields.filter(
      (f) =>
        f.path.toLowerCase().includes(q) ||
        f.value.toLowerCase().includes(q) ||
        (valuesById[f.id] ?? '').toLowerCase().includes(q)
    )
  }, [fields, search, valuesById])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1))
  }, [pageCount, search])

  useEffect(() => {
    setPage(0)
  }, [search])

  const pageSlice = useMemo(() => {
    const start = page * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const updateValue = useCallback((id: string, v: string) => {
    setValuesById((prev) => ({ ...prev, [id]: v }))
  }, [])

  useEffect(() => {
    if (!linkedFieldId || generatorSyncedOutput === null) return
    setValuesById((prev) => {
      if (prev[linkedFieldId] === generatorSyncedOutput) return prev
      return { ...prev, [linkedFieldId]: generatorSyncedOutput }
    })
  }, [generatorSyncedOutput, linkedFieldId])

  useEffect(() => {
    if (!onApplyLinkedPreviewInput) return
    if (prevCodeFormatRef.current === null) {
      prevCodeFormatRef.current = codeFormat
      return
    }
    if (prevCodeFormatRef.current === codeFormat) return
    prevCodeFormatRef.current = codeFormat
    if (!linkedFieldId) return
    const raw =
      valuesById[linkedFieldId] ??
      fields.find((f) => f.id === linkedFieldId)?.value ??
      ''
    const next =
      codeFormat === 'custom' ? raw : stripToRgbPlainInput(raw)
    onApplyLinkedPreviewInput(next)
  }, [
    codeFormat,
    linkedFieldId,
    valuesById,
    fields,
    onApplyLinkedPreviewInput,
  ])

  const download = useCallback(() => {
    if (!raw || !fields.length) return
    const out = applyYamlStringEdits(raw, fields, valuesById)
    const blob = new Blob([out], { type: 'text/yaml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const base = fileName.replace(/\.ya?ml$/i, '') || 'edited'
    a.href = url
    a.download = `${base}-edited.yml`
    a.click()
    URL.revokeObjectURL(url)
  }, [raw, fields, valuesById, fileName])

  return (
    <div className="panel flex min-h-0 min-w-0 flex-col gap-2 overflow-y-auto rounded-xl border border-white/[0.06] bg-[#161922] p-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {t('columnYaml')}
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".yml,.yaml,text/yaml,text/x-yaml,application/x-yaml"
          className="hidden"
          onChange={onPickFile}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/25 px-2 py-1.5 text-[11px] text-zinc-200 hover:bg-white/10"
        >
          <Upload className="h-3.5 w-3.5" />
          {t('yamlUpload')}
        </button>
        <button
          type="button"
          onClick={download}
          disabled={!raw || !!parseError || fields.length === 0}
          className="inline-flex items-center gap-1 rounded-md border border-sky-500/40 bg-sky-600/25 px-2 py-1.5 text-[11px] text-sky-100 hover:bg-sky-600/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          {t('yamlDownload')}
        </button>
      </div>

      {fileName ? (
        <p className="truncate font-mono text-[10px] text-zinc-500" title={fileName}>
          {fileName}
        </p>
      ) : null}

      {parseError ? (
        <p className="rounded border border-red-500/30 bg-red-950/40 px-2 py-1.5 text-[11px] text-red-200">
          {t('yamlParseError')} {parseError}
        </p>
      ) : null}

      {!raw ? (
        <p className="text-[11px] leading-relaxed text-zinc-500">{t('yamlNoFile')}</p>
      ) : !parseError ? (
        <p className="text-[11px] text-zinc-500">
          {t('yamlFieldsCount', { count: fields.length })}
        </p>
      ) : null}

      {raw && !parseError && fields.length > 0 ? (
        <>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('yamlSearch')}
            className="rounded-lg border border-white/10 bg-[#0d0f14] px-2 py-1.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-sky-500/50"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
            <span>
              {t('yamlPage', { n: page + 1, total: pageCount })}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded border border-white/10 px-2 py-0.5 hover:bg-white/10 disabled:opacity-30"
              >
                {t('yamlPrev')}
              </button>
              <button
                type="button"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="rounded border border-white/10 px-2 py-0.5 hover:bg-white/10 disabled:opacity-30"
              >
                {t('yamlNext')}
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-[11px] text-zinc-500">{t('yamlNoMatches')}</p>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            {pageSlice.map((f) => (
              <label
                key={f.id}
                className={`flex flex-col gap-0.5 rounded-lg border bg-black/20 p-2 ${
                  linkedFieldId === f.id
                    ? 'border-sky-500/55 ring-1 ring-sky-500/35'
                    : 'border-white/[0.06]'
                }`}
              >
                <span className="break-all font-mono text-[9px] leading-tight text-zinc-500">
                  {f.path}
                </span>
                <textarea
                  value={valuesById[f.id] ?? f.value}
                  onFocus={() => {
                    const raw = valuesById[f.id] ?? f.value
                    onLinkField?.(f.id, raw, f.path)
                  }}
                  onChange={(e) => {
                    const v = e.target.value
                    updateValue(f.id, v)
                    if (linkedFieldId === f.id) {
                      onLinkedFieldRawEdit?.(v)
                    }
                  }}
                  spellCheck={false}
                  rows={3}
                  className="min-h-[3.5rem] w-full resize-y rounded border border-white/10 bg-[#0d0f14] px-2 py-1 font-mono text-[10px] leading-relaxed text-zinc-200 outline-none focus:border-sky-500/50"
                />
              </label>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
