'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Eye, Users } from 'lucide-react'
import {
  cleanupStalePresence,
  getOrCreatePresenceId,
  heartbeatPresence,
  isFirebaseConfigured,
  leavePresence,
  PRESENCE_HEARTBEAT_MS,
  recordUniqueVisitorOnce,
  subscribeVisitorStats,
} from '@/lib/firebase-visitor-stats'

function formatCount(n: number | null): string {
  if (n === null) return '—'
  return n.toLocaleString('ru-RU')
}

export function VisitorStatsFooter() {
  const t = useTranslations('common')
  const [visits, setVisits] = useState<number | null>(null)
  const [online, setOnline] = useState<number | null>(null)
  const configured = isFirebaseConfigured()

  useEffect(() => {
    if (!configured) return

    const presenceId = getOrCreatePresenceId()
    let stopped = false

    void (async () => {
      await cleanupStalePresence()
      const v = await recordUniqueVisitorOnce()
      if (!stopped && v !== null) setVisits(v)
      await heartbeatPresence(presenceId)
    })()

    const unsub = subscribeVisitorStats((stats) => {
      if (stats.visits !== null) setVisits(stats.visits)
      if (stats.online !== null) setOnline(stats.online)
    })

    const beat = window.setInterval(() => {
      void heartbeatPresence(presenceId)
      void cleanupStalePresence()
    }, PRESENCE_HEARTBEAT_MS)

    const onLeave = () => {
      void leavePresence(presenceId)
    }
    window.addEventListener('pagehide', onLeave)
    window.addEventListener('beforeunload', onLeave)

    return () => {
      stopped = true
      unsub()
      window.clearInterval(beat)
      window.removeEventListener('pagehide', onLeave)
      window.removeEventListener('beforeunload', onLeave)
      void leavePresence(presenceId)
    }
  }, [configured])

  if (!configured) {
    return (
      <footer className="shrink-0 border-t border-edge bg-panel/80 px-2 py-1 text-center text-[10px] text-muted sm:text-[11px]">
        {t('author')} © {t('year')}
        <span className="mx-1.5 opacity-40">·</span>
        <span className="opacity-70">{t('statsNeedConfig')}</span>
      </footer>
    )
  }

  return (
    <footer className="shrink-0 border-t border-edge bg-panel/80 px-2 py-1">
      <div className="mx-auto flex max-w-[min(92rem,calc(100vw-0.75rem))] flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[10px] text-muted sm:justify-between sm:text-[11px]">
        <span className="hidden sm:inline">
          {t('author')} © {t('year')}
        </span>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
          <span className="inline-flex items-center gap-1" title={t('statsVisitsHint')}>
            <Eye className="h-3 w-3 opacity-70" />
            <span>
              {t('statsVisits')}:{' '}
              <strong className="font-semibold text-fg-soft tabular-nums">
                {formatCount(visits)}
              </strong>
            </span>
          </span>
          <span className="inline-flex items-center gap-1" title={t('statsOnlineHint')}>
            <Users className="h-3 w-3 opacity-70" />
            <span>
              {t('statsOnline')}:{' '}
              <strong className="font-semibold text-emerald-700 tabular-nums dark:text-emerald-300">
                {formatCount(online)}
              </strong>
            </span>
          </span>
        </div>
      </div>
    </footer>
  )
}
