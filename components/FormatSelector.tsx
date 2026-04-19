'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { CodeFormat } from '@/lib/rgb-generator'

interface FormatSelectorProps {
  format: CodeFormat
  onFormatChange: (format: CodeFormat) => void
}

export function FormatSelector({ format, onFormatChange }: FormatSelectorProps) {
  const t = useTranslations('formats')

  const formats: { value: CodeFormat; label: string; icon: string }[] = [
    { value: 'ampersand', label: t('ampersand'), icon: '&' },
    { value: 'section', label: t('section'), icon: '§' },
    { value: 'bracket_hex', label: t('bracketHex'), icon: '#' },
    { value: 'minimessage', label: t('minimessage'), icon: '<>' },
  ]

  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-dark-500">
        {t('label')}
      </label>
      <div className="flex flex-wrap gap-1">
        {formats.map((fmt) => (
          <button
            key={fmt.value}
            type="button"
            onClick={() => onFormatChange(fmt.value)}
            className={`relative rounded-md px-2 py-1 text-xs font-medium transition-all duration-200 ${
              format === fmt.value
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/40'
                : 'bg-dark-200 text-dark-400 hover:bg-dark-300 hover:text-white'
            }`}
          >
            {format === fmt.value && (
              <motion.div
                layoutId="activeFormat"
                className="absolute inset-0 rounded-md bg-primary-500"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1">
              <span className="text-sm leading-none">{fmt.icon}</span>
              <span className="max-w-[9rem] truncate leading-tight sm:max-w-none">
                {fmt.label}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

