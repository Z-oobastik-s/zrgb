'use client'

import { Moon, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { AppTheme } from '@/lib/theme'

interface ThemeToggleProps {
  theme: AppTheme
  onThemeChange: (theme: AppTheme) => void
}

export function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps) {
  const t = useTranslations('common')
  const next: AppTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={() => onThemeChange(next)}
      title={theme === 'dark' ? t('themeLight') : t('themeDark')}
      aria-label={theme === 'dark' ? t('themeLight') : t('themeDark')}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-edge bg-muted-fill text-fg-soft transition-[background-color,border-color,color,transform] duration-300 hover:bg-muted-hover hover:text-fg"
    >
      {theme === 'dark' ? (
        <Sun className="h-3.5 w-3.5 transition-transform duration-300" />
      ) : (
        <Moon className="h-3.5 w-3.5 transition-transform duration-300" />
      )}
    </button>
  )
}
