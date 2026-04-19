'use client'

import { useMemo, useRef, useState } from 'react'
import { Copy, Download, ShieldCheck, Upload } from 'lucide-react'
import { parseDocument } from 'yaml'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import {
  CONFIG_FILE_ORDER,
  SERVER_SETTINGS,
  fileDisplayName,
  type ServerConfigFile,
} from '@/lib/server-settings'

type ValueMap = Record<string, string | number | boolean>
type RawFileMap = Partial<Record<ServerConfigFile, string>>
type ErrorMap = Partial<Record<ServerConfigFile, string>>

function setAtPath(root: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.')
  let cur: Record<string, unknown> = root
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]!
    const next = cur[k]
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cur[k] = {}
    }
    cur = cur[k] as Record<string, unknown>
  }
  cur[keys[keys.length - 1]!] = value
}

function pathSegments(path: string): string[] {
  return path.split('.')
}

function castByType(
  raw: unknown,
  type: 'boolean' | 'number' | 'text' | 'select'
): string | number | boolean {
  if (type === 'boolean') {
    if (typeof raw === 'boolean') return raw
    if (typeof raw === 'string') return raw.trim().toLowerCase() === 'true'
    if (typeof raw === 'number') return raw !== 0
    return false
  }
  if (type === 'number') {
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw
    if (typeof raw === 'string') {
      const n = Number(raw.trim())
      return Number.isFinite(n) ? n : 0
    }
    return 0
  }
  return raw === null || raw === undefined ? '' : String(raw)
}

function readProperties(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  const lines = raw.split(/\r?\n/)
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const idx = t.indexOf('=')
    if (idx < 0) continue
    const key = t.slice(0, idx).trim()
    const val = t.slice(idx + 1)
    out[key] = val
  }
  return out
}

function applyPropertiesPatch(raw: string, patch: Record<string, string>): string {
  const lines = raw.split(/\r?\n/)
  const touched = new Set<string>()
  const next = lines.map((line) => {
    const idx = line.indexOf('=')
    if (idx <= 0) return line
    const key = line.slice(0, idx).trim()
    if (!(key in patch)) return line
    touched.add(key)
    return `${key}=${patch[key]}`
  })
  for (const [k, v] of Object.entries(patch)) {
    if (!touched.has(k)) next.push(`${k}=${v}`)
  }
  return next.join('\n')
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function toYaml(value: unknown, depth = 0): string[] {
  const pad = '  '.repeat(depth)
  if (value === null) return [`${pad}null`]
  if (typeof value === 'boolean' || typeof value === 'number') return [`${pad}${value}`]
  if (typeof value === 'string') return [`${pad}${value}`]
  if (Array.isArray(value)) {
    return value.flatMap((v) => {
      if (typeof v === 'object' && v !== null) {
        const nested = toYaml(v, depth + 1)
        if (nested.length === 0) return [`${pad}-`]
        return [`${pad}- ${nested[0]!.trimStart()}`, ...nested.slice(1)]
      }
      return [`${pad}- ${String(v)}`]
    })
  }
  const o = value as Record<string, unknown>
  const lines: string[] = []
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      lines.push(`${pad}${k}:`)
      lines.push(...toYaml(v, depth + 1))
    } else {
      lines.push(`${pad}${k}: ${String(v)}`)
    }
  }
  return lines
}

export function ServerSettingsView() {
  const [query, setQuery] = useState('')
  const [fileFilter, setFileFilter] = useState<ServerConfigFile | 'all'>('all')
  const initialValues = useMemo<ValueMap>(() => {
    const entries = SERVER_SETTINGS.map((s) => [s.id, s.value] as const)
    return Object.fromEntries(entries)
  }, [])
  const [values, setValues] = useState<ValueMap>(initialValues)
  const [rawFiles, setRawFiles] = useState<RawFileMap>({})
  const [parseErrors, setParseErrors] = useState<ErrorMap>({})
  const [copiedFile, setCopiedFile] = useState<string | null>(null)
  const uploadFileRef = useRef<ServerConfigFile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { copiedId, copy } = useCopyFeedback(1800)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SERVER_SETTINGS.filter((s) => {
      const fileOk = fileFilter === 'all' || s.file === fileFilter
      if (!fileOk) return false
      if (!q) return true
      return (
        s.label.toLowerCase().includes(q) ||
        s.keyPath.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      )
    })
  }, [query, fileFilter])

  const exports = useMemo(() => {
    const out: Record<ServerConfigFile, string> = {
      'server.properties': '',
      'bukkit.yml': '',
      'spigot.yml': '',
      'paper-global.yml': '',
      'paper-world-defaults.yml': '',
    }
    for (const file of CONFIG_FILE_ORDER) {
      const rows = SERVER_SETTINGS.filter((s) => s.file === file)
      try {
        if (file === 'server.properties') {
          const patch = Object.fromEntries(rows.map((r) => [r.keyPath, String(values[r.id])]))
          out[file] = rawFiles[file]
            ? applyPropertiesPatch(rawFiles[file]!, patch)
            : rows.map((r) => `${r.keyPath}=${String(values[r.id])}`).join('\n')
          continue
        }
        if (rawFiles[file]) {
          const doc = parseDocument(rawFiles[file]!)
          for (const row of rows) {
            doc.setIn(pathSegments(row.keyPath), values[row.id])
          }
          out[file] = String(doc).trimEnd()
          continue
        }
        const tree: Record<string, unknown> = {}
        for (const row of rows) {
          setAtPath(tree, row.keyPath, values[row.id])
        }
        out[file] = toYaml(tree).join('\n')
      } catch {
        const tree: Record<string, unknown> = {}
        for (const row of rows) {
          setAtPath(tree, row.keyPath, values[row.id])
        }
        out[file] = toYaml(tree).join('\n')
      }
    }
    return out
  }, [rawFiles, values])

  const byFile = useMemo(() => {
    const grouped = new Map<ServerConfigFile, typeof filtered>()
    for (const item of filtered) {
      const arr = grouped.get(item.file) ?? []
      arr.push(item)
      grouped.set(item.file, arr)
    }
    return grouped
  }, [filtered])

  const handlePickFileFor = (file: ServerConfigFile) => {
    uploadFileRef.current = file
    fileInputRef.current?.click()
  }

  const handleFileLoaded = async (f: File) => {
    const target = uploadFileRef.current
    if (!target) return
    const text = await f.text()
    const fileRows = SERVER_SETTINGS.filter((s) => s.file === target)
    try {
      const patchValues: ValueMap = {}
      if (target === 'server.properties') {
        const map = readProperties(text)
        for (const row of fileRows) {
          if (row.keyPath in map) patchValues[row.id] = castByType(map[row.keyPath], row.type)
        }
      } else {
        const doc = parseDocument(text)
        for (const row of fileRows) {
          const raw = doc.getIn(pathSegments(row.keyPath), true)
          if (raw !== undefined) patchValues[row.id] = castByType(raw, row.type)
        }
      }
      setRawFiles((prev) => ({ ...prev, [target]: text }))
      setValues((prev) => ({ ...prev, ...patchValues }))
      setParseErrors((prev) => ({ ...prev, [target]: undefined }))
    } catch (e) {
      setParseErrors((prev) => ({
        ...prev,
        [target]: e instanceof Error ? e.message : String(e),
      }))
    }
  }

  return (
    <section className="mx-auto flex min-h-0 w-full max-w-[min(92rem,calc(100vw-0.75rem))] flex-1 flex-col gap-2 overflow-hidden px-2 pb-1 pt-0.5 sm:px-3 sm:pb-2 sm:pt-1">
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-[12px] text-emerald-100">
        <p className="font-semibold">Панель главных параметров сервера</p>
        <p className="mt-1 text-emerald-100/80">
          Меняйте ключевые настройки Paper/Spigot/Bukkit и сразу копируйте готовые блоки
          для каждого файла. Это рабочий черновик под ваши конфиги из `dddd`.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 xl:grid-cols-[1.35fr_1fr]">
        <div className="flex min-h-0 flex-col gap-2 overflow-hidden rounded-xl border border-white/[0.08] bg-[#141722] p-3">
          <header className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск параметра: motd, anti-xray, max-players..."
              className="min-w-[18rem] flex-1 rounded-lg border border-white/10 bg-[#0d0f14] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-sky-500/60"
            />
            <select
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value as ServerConfigFile | 'all')}
              className="rounded-lg border border-white/10 bg-[#0d0f14] px-2 py-2 text-xs text-zinc-200 outline-none focus:border-sky-500/60"
            >
              <option value="all">Все файлы</option>
              {CONFIG_FILE_ORDER.map((f) => (
                <option key={f} value={f}>
                  {fileDisplayName(f)}
                </option>
              ))}
            </select>
            <input
              ref={fileInputRef}
              type="file"
              accept=".properties,.yml,.yaml,text/plain,text/yaml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleFileLoaded(f)
                e.currentTarget.value = ''
              }}
            />
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {CONFIG_FILE_ORDER.map((file) => {
              const rows = byFile.get(file) ?? []
              if (rows.length === 0) return null
              return (
                <div key={file} className="rounded-lg border border-white/[0.07] bg-black/20 p-2.5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      {fileDisplayName(file)}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handlePickFileFor(file)}
                      className="inline-flex items-center gap-1 rounded border border-white/15 bg-black/30 px-2 py-1 text-[11px] text-zinc-200 hover:bg-white/10"
                    >
                      <Upload className="h-3 w-3" />
                      Загрузить файл
                    </button>
                  </div>
                  {rawFiles[file] ? (
                    <p className="mb-2 text-[10px] text-emerald-300/90">
                      Файл загружен - изменения применяются к реальному содержимому.
                    </p>
                  ) : (
                    <p className="mb-2 text-[10px] text-zinc-500">
                      Можно работать как с шаблоном или загрузить ваш файл для точного редактирования.
                    </p>
                  )}
                  {parseErrors[file] ? (
                    <p className="mb-2 rounded border border-red-500/30 bg-red-900/30 px-2 py-1 text-[10px] text-red-200">
                      Ошибка чтения: {parseErrors[file]}
                    </p>
                  ) : null}
                  <div className="space-y-2">
                    {rows.map((row) => {
                      const current = values[row.id]
                      return (
                        <label
                          key={row.id}
                          className="flex flex-col gap-1 rounded-md border border-white/[0.06] bg-[#0f1219] p-2"
                        >
                          <span className="text-[12px] font-medium text-zinc-100">{row.label}</span>
                          <span className="font-mono text-[10px] text-zinc-500">{row.keyPath}</span>
                          {row.type === 'boolean' ? (
                            <input
                              type="checkbox"
                              checked={Boolean(current)}
                              onChange={(e) =>
                                setValues((prev) => ({ ...prev, [row.id]: e.target.checked }))
                              }
                              className="mt-1 h-4 w-4 rounded border-white/20 bg-[#0d0f14] text-sky-500"
                            />
                          ) : row.type === 'select' ? (
                            <select
                              value={String(current)}
                              onChange={(e) =>
                                setValues((prev) => ({ ...prev, [row.id]: e.target.value }))
                              }
                              className="rounded border border-white/10 bg-[#0d0f14] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-sky-500/60"
                            >
                              {row.options?.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          ) : row.type === 'number' ? (
                            <input
                              type="number"
                              value={Number(current)}
                              onChange={(e) =>
                                setValues((prev) => ({ ...prev, [row.id]: Number(e.target.value) }))
                              }
                              className="rounded border border-white/10 bg-[#0d0f14] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-sky-500/60"
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(current)}
                              onChange={(e) =>
                                setValues((prev) => ({ ...prev, [row.id]: e.target.value }))
                              }
                              className="rounded border border-white/10 bg-[#0d0f14] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-sky-500/60"
                            />
                          )}
                          <span className="text-[11px] text-zinc-400">{row.description}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-2 overflow-hidden rounded-xl border border-white/[0.08] bg-[#141722] p-3">
          <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200">
            <ShieldCheck className="h-4 w-4" />
            Готовые блоки для вставки в конфиг
          </h3>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {CONFIG_FILE_ORDER.map((file) => {
              const text = exports[file]
              const active = copiedFile === file && copiedId === text
              return (
                <article key={file} className="rounded-lg border border-white/[0.07] bg-black/20 p-2">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-zinc-300">{file}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCopiedFile(file)
                        void copy(text)
                      }}
                      className="inline-flex items-center gap-1 rounded border border-white/15 bg-black/30 px-2 py-1 text-[11px] text-zinc-200 hover:bg-white/10"
                    >
                      <Copy className="h-3 w-3" />
                      {active ? 'Скопировано' : 'Копировать'}
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadText(file, text)}
                      className="inline-flex items-center gap-1 rounded border border-white/15 bg-black/30 px-2 py-1 text-[11px] text-zinc-200 hover:bg-white/10"
                    >
                      <Download className="h-3 w-3" />
                      Скачать
                    </button>
                  </div>
                  <textarea
                    value={text}
                    readOnly
                    spellCheck={false}
                    className="h-36 w-full resize-y rounded border border-white/10 bg-[#0d0f14] px-2 py-1.5 font-mono text-[10px] leading-relaxed text-zinc-300 outline-none"
                  />
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
