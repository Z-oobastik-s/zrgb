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
    { value: 'hex', label: t('hex'), icon: '#' },
    { value: 'minimessage', label: t('minimessage'), icon: '<>' },
  ]

  return (
    <div>
      <label className="block text-sm font-medium text-dark-400 mb-3">
        {t('label')}
      </label>
      <div className="flex flex-wrap gap-2">
        {formats.map((fmt) => (
          <button
            key={fmt.value}
            onClick={() => onFormatChange(fmt.value)}
            className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              format === fmt.value
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/50'
                : 'bg-dark-200 text-dark-400 hover:bg-dark-300 hover:text-white'
            }`}
          >
            {format === fmt.value && (
              <motion.div
                layoutId="activeFormat"
                className="absolute inset-0 bg-primary-500 rounded-lg"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-lg">{fmt.icon}</span>
              <span className="text-sm">{fmt.label}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

