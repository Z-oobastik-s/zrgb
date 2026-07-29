'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export function useCopyFeedback(duration = 1400) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  const copy = useCallback(
    async (text: string) => {
      let ok = false
      try {
        await navigator.clipboard.writeText(text)
        ok = true
      } catch {
        try {
          const ta = document.createElement('textarea')
          ta.value = text
          ta.style.position = 'fixed'
          ta.style.left = '-9999px'
          document.body.appendChild(ta)
          ta.select()
          ok = document.execCommand('copy')
          document.body.removeChild(ta)
        } catch {
          /* ignore */
        }
      }
      if (!ok) return false
      setCopiedId(text)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setCopiedId(null)
        timerRef.current = null
      }, duration)
      return true
    },
    [duration]
  )

  return { copiedId, copy }
}
