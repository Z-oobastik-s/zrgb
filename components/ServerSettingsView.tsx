'use client'

import { useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Copy, Download, ShieldCheck, Upload } from 'lucide-react'
import { parseDocument } from 'yaml'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import {
  CONFIG_FILE_ORDER,
  SERVER_SETTINGS,
  fileDisplayName,
  type ServerConfigFile,
} from '@/lib/server-settings'
import { DEFAULT_SERVER_CONFIG_TEMPLATES } from '@/lib/server-config-templates'

type ValueMap = Record<string, string | number | boolean>
type RawFileMap = Partial<Record<ServerConfigFile, string>>
type ErrorMap = Partial<Record<ServerConfigFile, string>>

/** Произвольный конфиг (permissions.yml и т.д.) - только полноэкранный текстовый редактор. */
type CustomFileState = { name: string; text: string }
type LogFileState = { name: string; text: string }
type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'other'
type LogLine = {
  idx: number
  raw: string
  level: LogLevel
  source: string
}
type LogProblemKind =
  | 'auth'
  | 'realms'
  | 'class_missing'
  | 'dependency'
  | 'version'
  | 'resourcepack'
  | 'settings'
  | 'network'
  | 'other'
type LogProblem = {
  kind: LogProblemKind
  line: number
  text: string
}

function basenameLower(name: string): string {
  const s = name.replace(/\\/g, '/')
  const i = s.lastIndexOf('/')
  return (i >= 0 ? s.slice(i + 1) : s).toLowerCase()
}

function matchPresetByFileName(name: string): ServerConfigFile | null {
  const b = basenameLower(name)
  if (b.endsWith('server.properties')) return 'server.properties'
  if (b.endsWith('bukkit.yml') || b.endsWith('bukkit.yaml')) return 'bukkit.yml'
  if (b.endsWith('spigot.yml') || b.endsWith('spigot.yaml')) return 'spigot.yml'
  if (b.endsWith('paper-global.yml') || b.endsWith('paper_global.yml'))
    return 'paper-global.yml'
  if (
    b.endsWith('paper-world-defaults.yml') ||
    b.endsWith('paper_world_defaults.yml') ||
    b.endsWith('paper-world-defaults.yaml')
  )
    return 'paper-world-defaults.yml'
  return null
}

function isLogFileName(name: string): boolean {
  const b = basenameLower(name)
  return b.endsWith('.log') || b.includes('latest.log')
}

function detectLogLevel(line: string): LogLevel {
  const s = line.toLowerCase()
  if (
    /\b(error|severe|fatal|exception|fail(ed|ure)?|stack trace|traceback)\b/i.test(line) ||
    s.includes('] [server thread/error]')
  )
    return 'error'
  if (/\b(warn|warning)\b/i.test(line) || s.includes('] [server thread/warn]')) return 'warn'
  if (/\b(debug|trace)\b/i.test(line)) return 'debug'
  if (/\b(info|notice|startup|done)\b/i.test(line) || s.includes('] [server thread/info]'))
    return 'info'
  return 'other'
}

function detectLogSource(line: string): string {
  const matches = [...line.matchAll(/\[([^\]]{2,48})\]/g)]
  const skip = new Set([
    'info',
    'warn',
    'warning',
    'error',
    'debug',
    'trace',
    'server thread',
    'async chat thread',
    'main',
    'worker',
  ])
  for (const m of matches) {
    const token = (m[1] || '').trim()
    const lower = token.toLowerCase()
    if (!token) continue
    if (skip.has(lower)) continue
    if (lower.includes('/info') || lower.includes('/warn') || lower.includes('/error')) continue
    if (/^\d{2}:\d{2}:\d{2}$/.test(token)) continue
    if (/^\d{4}-\d{2}-\d{2}/.test(token)) continue
    if (/^[A-Za-z0-9_.-]+$/.test(token)) return token
  }
  return 'core'
}

/** Fabric mod tree: only lines `\t- modId version` are root mods; JAR-in-JAR use `|--` / `\--`. */
const FABRIC_ROOT_MOD_LINE = /^\t-\s+([A-Za-z0-9_.+-]+)\s+(\S.+)$/

/** Not mods in Fabric dependency listing */
const FABRIC_SKIP_ROOT_MOD_IDS = new Set(['java', 'minecraft'])

function levelBadgeClass(level: LogLevel): string {
  if (level === 'error') return 'border-red-500/35 bg-red-500/8 text-red-100'
  if (level === 'warn') return 'border-amber-500/35 bg-amber-500/8 text-amber-100'
  if (level === 'info') return 'border-sky-500/30 bg-sky-500/8 text-accent'
  if (level === 'debug') return 'border-violet-500/30 bg-violet-500/8 text-violet-100'
  return 'border-zinc-500/30 bg-zinc-500/6 text-fg-soft'
}

function levelRowClass(level: LogLevel): string {
  if (level === 'error') return 'border-red-500/20 bg-red-500/[0.06]'
  if (level === 'warn') return 'border-amber-500/20 bg-amber-500/[0.05]'
  if (level === 'info') return 'border-sky-500/20 bg-sky-500/[0.04]'
  if (level === 'debug') return 'border-violet-500/20 bg-violet-500/[0.04]'
  return 'border-edge-strong bg-white/[0.02]'
}

function classifyProblemKind(line: string): LogProblemKind {
  const s = line.toLowerCase()
  if (
    s.includes('invalidcredentialsexception') ||
    s.includes('status: 401') ||
    s.includes('failed to fetch user properties') ||
    s.includes('failed to retrieve profile key pair')
  ) {
    return 'auth'
  }
  if (s.includes('realms')) return 'realms'
  if (s.includes('classnotfoundexception') || s.includes('error loading class')) {
    return 'class_missing'
  }
  if (s.includes('отсутствует') || s.includes('recommends') || s.includes('modmenu')) {
    return 'dependency'
  }
  if (
    s.includes("isn't compatible with loader") ||
    s.includes('could not parse version') ||
    s.includes('semver')
  ) {
    return 'version'
  }
  if (s.includes('resource pack') || s.includes('resourcepack')) return 'resourcepack'
  if (s.includes('outside of range') || s.includes('error saving option')) {
    return 'settings'
  }
  if (s.includes("couldn't connect") || s.includes('connection') || s.includes('timeout')) {
    return 'network'
  }
  return 'other'
}

function kindBadgeClass(kind: LogProblemKind): string {
  if (kind === 'auth') return 'border-red-500/35 bg-red-500/10 text-red-100'
  if (kind === 'realms') return 'border-rose-500/35 bg-rose-500/10 text-rose-100'
  if (kind === 'class_missing') return 'border-orange-500/35 bg-orange-500/10 text-orange-100'
  if (kind === 'dependency') return 'border-amber-500/35 bg-amber-500/10 text-amber-100'
  if (kind === 'version') return 'border-yellow-500/35 bg-yellow-500/10 text-yellow-100'
  if (kind === 'resourcepack') return 'border-cyan-500/35 bg-cyan-500/10 text-cyan-100'
  if (kind === 'settings') return 'border-violet-500/35 bg-violet-500/10 text-violet-100'
  if (kind === 'network') return 'border-blue-500/35 bg-blue-500/10 text-blue-100'
  return 'border-zinc-500/35 bg-zinc-500/10 text-fg-soft'
}

function kindPriority(kind: LogProblemKind): number {
  if (kind === 'auth') return 1
  if (kind === 'realms') return 2
  if (kind === 'class_missing') return 3
  if (kind === 'dependency') return 4
  if (kind === 'version') return 5
  if (kind === 'resourcepack') return 6
  if (kind === 'settings') return 7
  if (kind === 'network') return 8
  return 9
}

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

function readSettingValuesFromText(
  file: ServerConfigFile,
  text: string
): { values: ValueMap; error?: string } {
  const fileRows = SERVER_SETTINGS.filter((s) => s.file === file)
  const patch: ValueMap = {}
  try {
    if (file === 'server.properties') {
      const map = readProperties(text)
      for (const row of fileRows) {
        if (row.keyPath in map) patch[row.id] = castByType(map[row.keyPath], row.type)
      }
    } else {
      const doc = parseDocument(text)
      if (doc.errors.length) {
        return {
          values: patch,
          error: doc.errors.map((e) => e.message).join('; '),
        }
      }
      for (const row of fileRows) {
        const raw = doc.getIn(pathSegments(row.keyPath))
        if (raw !== undefined) patch[row.id] = castByType(raw, row.type)
      }
    }
    return { values: patch }
  } catch (e) {
    return {
      values: patch,
      error: e instanceof Error ? e.message : String(e),
    }
  }
}

export function ServerSettingsView() {
  const t = useTranslations('serverPage')
  const locale = useLocale()
  const [query, setQuery] = useState('')
  const [editorMode, setEditorMode] = useState<'full' | 'quick'>('full')
  const [selectedFile, setSelectedFile] = useState<ServerConfigFile>('server.properties')
  const initialValues = useMemo<ValueMap>(() => {
    const entries = SERVER_SETTINGS.map((s) => [s.id, s.value] as const)
    return Object.fromEntries(entries)
  }, [])
  const [values, setValues] = useState<ValueMap>(initialValues)
  const [rawFiles, setRawFiles] = useState<RawFileMap>({})
  const [parseErrors, setParseErrors] = useState<ErrorMap>({})
  const [copiedFile, setCopiedFile] = useState<string | null>(null)
  const [customFile, setCustomFile] = useState<CustomFileState | null>(null)
  const [logFile, setLogFile] = useState<LogFileState | null>(null)
  const [logQuery, setLogQuery] = useState('')
  const [logSource, setLogSource] = useState('all')
  const [logLevelFilter, setLogLevelFilter] = useState<Record<LogLevel, boolean>>({
    error: true,
    warn: true,
    info: true,
    debug: false,
    other: true,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { copiedId, copy } = useCopyFeedback(1800)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SERVER_SETTINGS.filter((s) => {
      const fileOk = s.file === selectedFile
      if (!fileOk) return false
      if (!q) return true
      return (
        s.label.toLowerCase().includes(q) ||
        s.keyPath.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      )
    })
  }, [query, selectedFile])

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
        const baseTemplate = rawFiles[file] ?? DEFAULT_SERVER_CONFIG_TEMPLATES[file]
        if (file === 'server.properties') {
          const patch = Object.fromEntries(rows.map((r) => [r.keyPath, String(values[r.id])]))
          out[file] = baseTemplate
            ? applyPropertiesPatch(baseTemplate, patch)
            : rows.map((r) => `${r.keyPath}=${String(values[r.id])}`).join('\n')
          continue
        }
        if (baseTemplate) {
          const doc = parseDocument(baseTemplate)
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

  /** Full editor shows raw text; quick mode export applies values on top. */
  const fullEditorText =
    rawFiles[selectedFile] ?? DEFAULT_SERVER_CONFIG_TEMPLATES[selectedFile]

  const activeFileContent =
    editorMode === 'full' ? fullEditorText : exports[selectedFile]

  const switchEditorMode = (mode: 'full' | 'quick') => {
    if (mode === editorMode) return
    if (mode === 'full') {
      setRawFiles((prev) => ({
        ...prev,
        [selectedFile]: exports[selectedFile],
      }))
      setEditorMode('full')
      return
    }
    const text = rawFiles[selectedFile] ?? DEFAULT_SERVER_CONFIG_TEMPLATES[selectedFile]
    const parsed = readSettingValuesFromText(selectedFile, text)
    if (parsed.error) {
      setParseErrors((prev) => ({ ...prev, [selectedFile]: parsed.error }))
    } else {
      setParseErrors((prev) => ({ ...prev, [selectedFile]: undefined }))
      setValues((prev) => ({ ...prev, ...parsed.values }))
    }
    setEditorMode('quick')
  }

  const parsedLogLines = useMemo<LogLine[]>(() => {
    if (!logFile) return []
    return logFile.text.split(/\r?\n/).map((raw, idx) => ({
      idx: idx + 1,
      raw,
      level: detectLogLevel(raw),
      source: detectLogSource(raw),
    }))
  }, [logFile])

  const logSourceCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const row of parsedLogLines) {
      counts[row.source] = (counts[row.source] || 0) + 1
    }
    return counts
  }, [parsedLogLines])

  const topSources = useMemo(() => {
    return Object.entries(logSourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([source]) => source)
  }, [logSourceCounts])

  const logLevelCounts = useMemo<Record<LogLevel, number>>(() => {
    const counts: Record<LogLevel, number> = {
      error: 0,
      warn: 0,
      info: 0,
      debug: 0,
      other: 0,
    }
    for (const row of parsedLogLines) counts[row.level] += 1
    return counts
  }, [parsedLogLines])

  const sourceScopedLogLines = useMemo(() => {
    return parsedLogLines.filter((line) => (logSource === 'all' ? true : line.source === logSource))
  }, [logSource, parsedLogLines])

  const sourceScopedLevelCounts = useMemo<Record<LogLevel, number>>(() => {
    const counts: Record<LogLevel, number> = {
      error: 0,
      warn: 0,
      info: 0,
      debug: 0,
      other: 0,
    }
    for (const row of sourceScopedLogLines) counts[row.level] += 1
    return counts
  }, [sourceScopedLogLines])

  const filteredLogLines = useMemo(() => {
    const q = logQuery.trim().toLowerCase()
    return parsedLogLines.filter((line) => {
      if (!logLevelFilter[line.level]) return false
      if (logSource !== 'all' && line.source !== logSource) return false
      if (!q) return true
      return line.raw.toLowerCase().includes(q)
    })
  }, [logLevelFilter, logQuery, logSource, parsedLogLines])

  const logInsights = useMemo(() => {
    const mods: string[] = []
    const resourcePacks = new Set<string>()
    const problems: LogProblem[] = []
    let readingMods = false
    /** programmer_art as mod namespace overlay: `something_programmer_art` */
    let sawProgrammerArtOverlay = false
    let hadBuiltinProgrammerArt = false

    const parseReloadingResourcePacks = (line: string) => {
      const reloadIdx = line.indexOf('Reloading ResourceManager:')
      if (reloadIdx < 0) return
      const list = line
        .slice(reloadIdx + 'Reloading ResourceManager:'.length)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
      for (const entry of list) {
        if (entry.startsWith('file/')) {
          resourcePacks.add(entry.replace(/^file\//, ''))
          continue
        }
        if (entry === 'programmer_art' || entry === 'high_contrast') {
          resourcePacks.add(entry)
          if (entry === 'programmer_art') hadBuiltinProgrammerArt = true
          continue
        }
        if (entry.endsWith('_programmer_art')) {
          sawProgrammerArtOverlay = true
        }
      }
    }

    for (const row of parsedLogLines) {
      const line = row.raw
      if (/loading\s+\d+\s+mods:/i.test(line)) {
        readingMods = true
        continue
      }
      if (readingMods) {
        const trimmed = line.trimStart()
        const isFabricTreeLine =
          /^\|[\t ]*--/.test(trimmed) || /^\\--/.test(trimmed)
        if (isFabricTreeLine) {
          continue
        }
        const fm = line.match(FABRIC_ROOT_MOD_LINE)
        if (fm) {
          const id = fm[1]!.toLowerCase()
          if (!FABRIC_SKIP_ROOT_MOD_IDS.has(id)) {
            mods.push(`${fm[1]} ${fm[2]!.trim()}`)
          }
          continue
        }
        const isNewTimestampLine = /^\[\d{2}:\d{2}:\d{2}\]/.test(line.trim())
        if (isNewTimestampLine) {
          readingMods = false
          parseReloadingResourcePacks(line)
          continue
        }
        if (trimmed !== '' && !trimmed.startsWith('-')) {
          readingMods = false
        }
      }

      parseReloadingResourcePacks(line)

      if (row.level === 'error' || row.level === 'warn') {
        const s = line.toLowerCase()
        const isInteresting =
          s.includes('exception') ||
          s.includes('failed') ||
          s.includes('error') ||
          s.includes('could not') ||
          s.includes("couldn't") ||
          s.includes('outside of range') ||
          s.includes('not found') ||
          s.includes('отсутствует') ||
          s.includes('не найден')
        if (isInteresting) {
          problems.push({
            kind: classifyProblemKind(line),
            line: row.idx,
            text: line.trim(),
          })
        }
      }
    }

    if (sawProgrammerArtOverlay && !hadBuiltinProgrammerArt) {
      resourcePacks.add('__rp_programmer_art_overlay_only__')
    }

    const uniqueMods = [...new Set(mods)]
    const uniqueProblems = problems
      .filter((p, i, arr) => arr.findIndex((x) => x.text === p.text) === i)
      .sort((a, b) => {
        const pa = kindPriority(a.kind)
        const pb = kindPriority(b.kind)
        if (pa !== pb) return pa - pb
        return a.line - b.line
      })
      .slice(0, 80)
    return {
      mods: uniqueMods,
      resourcePacks: [...resourcePacks].sort((a, b) => a.localeCompare(b)),
      problems: uniqueProblems,
    }
  }, [parsedLogLines])

  const problemCountsByKind = useMemo(() => {
    const counts: Record<LogProblemKind, number> = {
      auth: 0,
      realms: 0,
      class_missing: 0,
      dependency: 0,
      version: 0,
      resourcepack: 0,
      settings: 0,
      network: 0,
      other: 0,
    }
    for (const p of logInsights.problems) counts[p.kind] += 1
    return counts
  }, [logInsights.problems])

  const handleFileLoaded = async (f: File) => {
    const text = await f.text()
    const preset = matchPresetByFileName(f.name)
    const logLike = isLogFileName(f.name)

    if (preset) {
      setLogFile(null)
      setCustomFile(null)
      setSelectedFile(preset)
      const target = preset
      const parsed = readSettingValuesFromText(target, text)
      setRawFiles((prev) => ({ ...prev, [target]: text }))
      if (parsed.error) {
        setParseErrors((prev) => ({ ...prev, [target]: parsed.error }))
      } else {
        setValues((prev) => ({ ...prev, ...parsed.values }))
        setParseErrors((prev) => ({ ...prev, [target]: undefined }))
      }
      return
    }

    if (logLike) {
      setCustomFile(null)
      setLogQuery('')
      setLogSource('all')
      setLogLevelFilter({
        error: true,
        warn: true,
        info: true,
        debug: false,
        other: true,
      })
      setLogFile({ name: f.name, text })
      return
    }

    setLogFile(null)
    setCustomFile({ name: f.name, text })
  }

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-hidden">
      {!customFile && !logFile ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-[12px] text-emerald-900 dark:text-emerald-100">
          <p className="font-semibold">{t('title')}</p>
          <p className="mt-1 text-emerald-800/90 dark:text-emerald-100/80">
            {t('subtitle')}
          </p>
        </div>
      ) : !logFile ? (
        <div className="rounded-xl border border-sky-500/25 bg-sky-500/10 p-3 text-[12px] text-accent">
          <p className="font-semibold">{t('customEditorTitle')}</p>
          <p className="mt-1 text-accent/85">
            {t('customEditorHint')}
          </p>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-edge bg-panel p-3">
        <div className="grid shrink-0 grid-cols-1 gap-2 border-b border-edge pb-3 xl:grid-cols-[1fr_auto_auto]">
          {!customFile && !logFile ? (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="min-w-[18rem] rounded-lg border border-edge-strong bg-input px-3 py-2 text-xs text-fg-soft outline-none focus:border-sky-500/60"
            />
          ) : logFile ? (
            <div className="flex min-h-[2.5rem] flex-wrap items-center gap-2 rounded-lg border border-edge-strong bg-input px-3 py-2 text-xs text-fg-soft">
              <span className="text-muted">{t('logFileLabel')}</span>
              <span className="font-mono text-violet-800 dark:text-violet-200">{logFile.name}</span>
              <button
                type="button"
                onClick={() => setLogFile(null)}
                className="rounded border border-edge-strong bg-muted-fill px-2 py-1 text-[11px] text-fg-soft hover:bg-muted-hover"
              >
                {t('backToTemplates')}
              </button>
            </div>
          ) : (
            <div className="flex min-h-[2.5rem] flex-wrap items-center gap-2 rounded-lg border border-edge-strong bg-input px-3 py-2 text-xs text-fg-soft">
              <span className="text-muted">{t('openedFile')}</span>
              <span className="font-mono text-accent">{customFile?.name ?? ''}</span>
              <button
                type="button"
                onClick={() => setCustomFile(null)}
                className="rounded border border-edge-strong bg-muted-fill px-2 py-1 text-[11px] text-fg-soft hover:bg-muted-hover"
              >
                {t('backToTemplates')}
              </button>
            </div>
          )}
          <select
            value={selectedFile}
            onChange={(e) => {
              const next = e.target.value as ServerConfigFile
              if (editorMode === 'full' && next !== selectedFile) {
                const text =
                  rawFiles[selectedFile] ??
                  DEFAULT_SERVER_CONFIG_TEMPLATES[selectedFile]
                const parsed = readSettingValuesFromText(selectedFile, text)
                if (!parsed.error) {
                  setValues((prev) => ({ ...prev, ...parsed.values }))
                  setParseErrors((prev) => ({
                    ...prev,
                    [selectedFile]: undefined,
                  }))
                } else {
                  setParseErrors((prev) => ({
                    ...prev,
                    [selectedFile]: parsed.error,
                  }))
                }
              }
              setCustomFile(null)
              setLogFile(null)
              setSelectedFile(next)
            }}
            className="rounded-lg border border-edge-strong bg-input px-2 py-2 text-xs text-fg-soft outline-none focus:border-sky-500/60"
          >
            {CONFIG_FILE_ORDER.map((f) => (
              <option key={f} value={f}>
                {fileDisplayName(f)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-1 rounded border border-edge-strong bg-muted-fill px-3 py-2 text-[12px] text-fg-soft hover:bg-muted-hover"
          >
            <Upload className="h-3.5 w-3.5" />
            {t('uploadFile')}
          </button>
          <header className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".properties,.yml,.yaml,.log,text/plain,text/yaml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleFileLoaded(f)
                e.currentTarget.value = ''
              }}
            />
          </header>
        </div>

        {logFile ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden pt-2">
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden xl:flex-row xl:items-stretch">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden">
                <div className="grid shrink-0 grid-cols-1 gap-2 rounded-lg border border-edge bg-panel-2 p-2 xl:grid-cols-[1fr_auto]">
                  <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_auto_auto]">
                    <input
                      value={logQuery}
                      onChange={(e) => setLogQuery(e.target.value)}
                      placeholder={t('logSearchPlaceholder')}
                      className="min-w-0 rounded-lg border border-edge-strong bg-input px-3 py-2 text-xs text-fg-soft outline-none focus:border-violet-500/60"
                    />
                    <select
                      value={logSource}
                      onChange={(e) => setLogSource(e.target.value)}
                      className="rounded-lg border border-edge-strong bg-input px-2 py-2 text-xs text-fg-soft outline-none focus:border-violet-500/60"
                    >
                      <option value="all">
                        {t('allSources')} ({parsedLogLines.length})
                      </option>
                      {topSources.map((source) => (
                        <option key={source} value={source}>
                          {source} ({logSourceCounts[source] || 0})
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setLogQuery('')
                          setLogSource('all')
                          setLogLevelFilter({
                            error: true,
                            warn: true,
                            info: true,
                            debug: false,
                            other: true,
                          })
                        }}
                        className="rounded border border-edge-strong bg-muted-fill px-2 py-1 text-[11px] text-fg-soft hover:bg-muted-hover"
                      >
                        {t('all')}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLogLevelFilter({
                            error: true,
                            warn: true,
                            info: false,
                            debug: false,
                            other: false,
                          })
                        }
                        className="rounded border border-red-500/35 bg-red-500/10 px-2 py-1 text-[11px] text-red-800 hover:bg-red-500/20 dark:text-red-200"
                      >
                        {t('onlyProblems')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogQuery('Exception')}
                        className="rounded border border-violet-500/35 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-800 hover:bg-violet-500/20 dark:text-violet-200"
                      >
                        {t('stacktraces')}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['error', 'warn', 'info', 'debug', 'other'] as LogLevel[]).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() =>
                          setLogLevelFilter((prev) => ({ ...prev, [level]: !prev[level] }))
                        }
                        className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] transition ${
                          logLevelFilter[level]
                            ? levelBadgeClass(level)
                            : 'border-edge-strong bg-muted-fill text-muted hover:bg-muted-hover'
                        }`}
                      >
                        <span>{t(`logLevel.${level}`)}</span>
                        <span className="font-mono opacity-90">
                          {logQuery.trim()
                            ? `${filteredLogLines.filter((row) => row.level === level).length}/${sourceScopedLevelCounts[level]}`
                            : sourceScopedLevelCounts[level]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-edge bg-muted-fill p-2">
                  <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="text-muted">
                      {t('shownRows')}{' '}
                      <span className="font-mono text-fg-soft">{filteredLogLines.length}</span> /{' '}
                      <span className="font-mono text-fg-soft">{parsedLogLines.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCopiedFile('__log__')
                          void copy(filteredLogLines.map((line) => line.raw).join('\n'))
                        }}
                        className="inline-flex items-center gap-1 rounded border border-edge-strong bg-muted-fill px-2 py-1 text-[11px] text-fg-soft hover:bg-muted-hover"
                      >
                        <Copy className="h-3 w-3" />
                        {copiedFile === '__log__' ? t('copied') : t('copyFiltered')}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadText(
                            `${logFile.name.replace(/\.log$/i, '')}-filtered.log`,
                            filteredLogLines.map((line) => line.raw).join('\n')
                          )
                        }
                        className="inline-flex items-center gap-1 rounded border border-edge-strong bg-muted-fill px-2 py-1 text-[11px] text-fg-soft hover:bg-muted-hover"
                      >
                        <Download className="h-3 w-3" />
                        {t('downloadFiltered')}
                      </button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-auto rounded border border-edge-strong bg-input p-2">
                    {filteredLogLines.length === 0 ? (
                      <div className="p-3 text-[12px] text-muted">
                        {t('nothingFound')}
                        {logQuery.trim() ? (
                          <button
                            type="button"
                            onClick={() => setLogQuery('')}
                            className="ml-2 rounded border border-edge-strong bg-muted-fill px-2 py-0.5 text-[11px] text-fg-soft hover:bg-muted-hover"
                          >
                            {t('clearSearch')}
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredLogLines.map((line) => (
                          <div
                            key={`${line.idx}-${line.raw}`}
                            className={`grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-0 rounded border px-2 py-1.5 font-mono text-[11px] leading-snug text-fg-soft ${levelRowClass(line.level)}`}
                          >
                            <span className="shrink-0 text-right tabular-nums text-muted">
                              {line.idx}
                            </span>
                            <span className="w-28 shrink-0 truncate text-fg-soft sm:w-36">
                              {line.source}
                            </span>
                            <span className="min-w-0 whitespace-pre-wrap break-all text-fg-soft">
                              {line.raw || ' '}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <aside className="flex min-h-0 max-h-[40vh] w-full shrink-0 flex-col gap-2 overflow-hidden border-edge-strong xl:max-h-none xl:w-[17.5rem] xl:border-l xl:pl-3">
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-0.5">
                  <div className="shrink-0 rounded-lg border border-red-500/20 bg-red-500/[0.05] p-2">
                    <div className="mb-1 text-[11px] font-semibold text-red-800 dark:text-red-200">
                      {t('logIssuesTitle')} ({logInsights.problems.length})
                    </div>
                    <div className="max-h-32 space-y-1 overflow-y-auto text-[11px]">
                      {logInsights.problems.length === 0 ? (
                        <p className="text-muted">{t('logIssuesEmpty')}</p>
                      ) : (
                        (
                          [
                            'auth',
                            'realms',
                            'class_missing',
                            'dependency',
                            'version',
                            'resourcepack',
                            'settings',
                            'network',
                            'other',
                          ] as LogProblemKind[]
                        )
                          .filter((k) => problemCountsByKind[k] > 0)
                          .map((k) => (
                            <div key={k} className="flex items-center justify-between gap-2">
                              <span
                                className={`rounded border px-1.5 py-0.5 text-[10px] ${kindBadgeClass(k)}`}
                              >
                                {t(`logIssueKind.${k}`)}
                              </span>
                              <span className="font-mono text-fg-soft">{problemCountsByKind[k]}</span>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 rounded-lg border border-edge-strong bg-muted-fill p-2">
                    <div className="mb-0.5 text-[11px] font-semibold text-accent">
                      {t('logModsTitle')} ({logInsights.mods.length})
                    </div>
                    <p className="mb-1 text-[10px] leading-snug text-muted">{t('logModsHint')}</p>
                    <div className="max-h-36 space-y-0.5 overflow-y-auto font-mono text-[10px] text-fg-soft">
                      {logInsights.mods.length === 0 ? (
                        <p className="font-sans text-muted">{t('logModsEmpty')}</p>
                      ) : (
                        logInsights.mods.map((m) => (
                          <div key={m} className="break-all">
                            {m}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 rounded-lg border border-edge-strong bg-muted-fill p-2">
                    <div className="mb-0.5 text-[11px] font-semibold text-cyan-800 dark:text-cyan-200">
                      {t('logResourcepacksTitle')} ({logInsights.resourcePacks.length})
                    </div>
                    <p className="mb-1 text-[10px] leading-snug text-muted">{t('logResourcepacksHint')}</p>
                    <div className="max-h-32 space-y-0.5 overflow-y-auto font-mono text-[10px] text-fg-soft">
                      {logInsights.resourcePacks.length === 0 ? (
                        <p className="font-sans text-muted">{t('logResourcepacksEmpty')}</p>
                      ) : (
                        logInsights.resourcePacks.map((p) => (
                          <div key={p} className="break-all">
                            {p === '__rp_programmer_art_overlay_only__'
                              ? t('logResourcePackOverlayOnly')
                              : p}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {logInsights.problems.length > 0 ? (
                    <div className="shrink-0 rounded-lg border border-edge bg-panel-2 p-2">
                      <div className="mb-1 text-[11px] font-semibold text-fg-soft">
                        {t('logIssueHintsTitle')}
                      </div>
                      <div className="max-h-48 space-y-1 overflow-y-auto text-[11px]">
                        {logInsights.problems.slice(0, 10).map((p) => (
                          <div
                            key={`${p.line}-${p.text}`}
                            className="rounded border border-edge-strong bg-muted-fill px-2 py-1"
                          >
                            <div className="mb-0.5 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded border px-1.5 py-0.5 text-[10px] ${kindBadgeClass(p.kind)}`}
                              >
                                {t(`logIssueKind.${p.kind}`)}
                              </span>
                              <span className="font-mono text-muted">L{p.line}</span>
                            </div>
                            <p className="line-clamp-3 font-mono text-[10px] text-fg-soft">{p.text}</p>
                            <p className="mt-0.5 text-muted">{t(`logIssueHint.${p.kind}`)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </aside>
            </div>
          </div>
        ) : customFile ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2 pt-3">
            <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-edge bg-muted-fill p-2">
              <h3 className="mb-2 inline-flex flex-wrap items-center gap-2 text-sm font-semibold text-accent">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="break-all font-mono text-xs text-fg-soft">{customFile.name}</span>
              </h3>
              <div className="mb-2 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCopiedFile('__custom__')
                    void copy(customFile.text)
                  }}
                  className="inline-flex items-center gap-1 rounded border border-edge-strong bg-muted-fill px-2 py-1 text-[11px] text-fg-soft hover:bg-muted-hover"
                >
                  <Copy className="h-3 w-3" />
                  {copiedFile === '__custom__' && copiedId === customFile.text
                    ? t('copied')
                    : t('copy')}
                </button>
                <button
                  type="button"
                  onClick={() => downloadText(customFile.name, customFile.text)}
                  className="inline-flex items-center gap-1 rounded border border-edge-strong bg-muted-fill px-2 py-1 text-[11px] text-fg-soft hover:bg-muted-hover"
                >
                  <Download className="h-3 w-3" />
                  {t('download')}
                </button>
              </div>
              <textarea
                value={customFile.text}
                onChange={(e) => setCustomFile({ name: customFile.name, text: e.target.value })}
                spellCheck={false}
                className="min-h-[min(70vh,calc(100vh-14rem))] flex-1 resize-y rounded border border-edge-strong bg-input px-2 py-1.5 font-mono text-[11px] leading-relaxed text-fg outline-none focus:border-sky-500/50"
              />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3 pt-3">
            <div className="min-h-0 overflow-y-auto pr-1">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-lg border border-edge-strong bg-input p-0.5">
                  <button
                    type="button"
                    onClick={() => switchEditorMode('full')}
                    className={`rounded px-2 py-1 text-[11px] ${
                      editorMode === 'full'
                        ? 'bg-sky-500/20 text-accent'
                        : 'text-muted hover:bg-muted-hover'
                    }`}
                  >
                    {t('fullTemplateMode')}
                  </button>
                  <button
                    type="button"
                    onClick={() => switchEditorMode('quick')}
                    className={`rounded px-2 py-1 text-[11px] ${
                      editorMode === 'quick'
                        ? 'bg-sky-500/20 text-accent'
                        : 'text-muted hover:bg-muted-hover'
                    }`}
                  >
                    {t('quickParamsMode')}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {selectedFile}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCopiedFile(selectedFile)
                      void copy(activeFileContent)
                    }}
                    className="inline-flex items-center gap-1 rounded border border-edge-strong bg-muted-fill px-2 py-1 text-[11px] text-fg-soft hover:bg-muted-hover"
                  >
                    <Copy className="h-3 w-3" />
                    {copiedFile === selectedFile && copiedId === activeFileContent
                      ? t('copied')
                      : t('copy')}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadText(selectedFile, activeFileContent)}
                    className="inline-flex items-center gap-1 rounded border border-edge-strong bg-muted-fill px-2 py-1 text-[11px] text-fg-soft hover:bg-muted-hover"
                  >
                    <Download className="h-3 w-3" />
                    {t('download')}
                  </button>
                </div>
              </div>
              {rawFiles[selectedFile] ? (
                <p className="mb-2 text-[10px] text-emerald-800 dark:text-emerald-300/90">
                  {t('loadedFileHint')}
                </p>
              ) : (
                <p className="mb-2 text-[10px] text-muted">
                  {t('templateHint')}
                </p>
              )}
              {parseErrors[selectedFile] ? (
                <p className="mb-2 rounded border border-red-500/30 bg-red-900/30 px-2 py-1 text-[10px] text-red-200">
                  {t('parseError')}: {parseErrors[selectedFile]}
                </p>
              ) : null}
              {editorMode === 'full' ? (
                <textarea
                  value={fullEditorText}
                  onChange={(e) => {
                    setRawFiles((prev) => ({
                      ...prev,
                      [selectedFile]: e.target.value,
                    }))
                  }}
                  onBlur={(e) => {
                    const parsed = readSettingValuesFromText(
                      selectedFile,
                      e.currentTarget.value
                    )
                    if (parsed.error) {
                      setParseErrors((prev) => ({
                        ...prev,
                        [selectedFile]: parsed.error,
                      }))
                      return
                    }
                    setParseErrors((prev) => ({
                      ...prev,
                      [selectedFile]: undefined,
                    }))
                    setValues((prev) => ({ ...prev, ...parsed.values }))
                  }}
                  spellCheck={false}
                  className="min-h-[min(70vh,calc(100vh-15rem))] w-full resize-y rounded border border-edge-strong bg-input px-2 py-1.5 font-mono text-[11px] leading-relaxed text-fg outline-none focus:border-sky-500/50"
                />
              ) : (
                <div className="space-y-1">
                  {filtered.map((row) => {
                    const current = values[row.id]
                    return (
                      <label
                        key={row.id}
                        className="flex flex-col gap-1 border-b border-edge py-2 last:border-b-0"
                      >
                        <span className="text-[12px] font-medium text-fg">
                          {locale === 'ru' ? row.label : row.keyPath}
                        </span>
                        <span className="font-mono text-[10px] text-muted">{row.keyPath}</span>
                        {row.type === 'boolean' ? (
                          <input
                            type="checkbox"
                            checked={Boolean(current)}
                            onChange={(e) =>
                              setValues((prev) => ({ ...prev, [row.id]: e.target.checked }))
                            }
                            className="mt-1 h-4 w-4 rounded border-edge-strong bg-input text-sky-500"
                          />
                        ) : row.type === 'select' ? (
                          <select
                            value={String(current)}
                            onChange={(e) =>
                              setValues((prev) => ({ ...prev, [row.id]: e.target.value }))
                            }
                            className="rounded border border-edge-strong bg-input px-2 py-1.5 text-xs text-fg-soft outline-none focus:border-sky-500/60"
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
                            className="rounded border border-edge-strong bg-input px-2 py-1.5 text-xs text-fg-soft outline-none focus:border-sky-500/60"
                          />
                        ) : (
                          <input
                            type="text"
                            value={String(current)}
                            onChange={(e) =>
                              setValues((prev) => ({ ...prev, [row.id]: e.target.value }))
                            }
                            className="rounded border border-edge-strong bg-input px-2 py-1.5 text-xs text-fg-soft outline-none focus:border-sky-500/60"
                          />
                        )}
                        {locale === 'ru' ? (
                          <span className="text-[11px] text-muted">{row.description}</span>
                        ) : null}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
