'use client'

import { Globe } from 'lucide-react'
import { motion } from 'framer-motion'

const languages = [
  { code: 'ru', name: 'RU', flag: '🇷🇺' },
  { code: 'ua', name: 'UA', flag: '🇺🇦' },
  { code: 'en', name: 'EN', flag: '🇬🇧' },
]

interface LanguageSwitcherProps {
  currentLocale: string
  onLocaleChange: (locale: string) => void
}

export function LanguageSwitcher({ currentLocale, onLocaleChange }: LanguageSwitcherProps) {
  return (
    <div className="flex items-center gap-2 glass-effect rounded-lg p-1">
      <Globe className="w-4 h-4 text-dark-500" />
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onLocaleChange(lang.code)}
          className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
            currentLocale === lang.code
              ? 'text-primary-400 bg-primary-400/10'
              : 'text-dark-500 hover:text-dark-400 hover:bg-dark-200/30'
          }`}
        >
          {currentLocale === lang.code && (
            <motion.div
              layoutId="activeLang"
              className="absolute inset-0 bg-primary-400/10 rounded-md"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

