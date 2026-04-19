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
    <div className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-black/25 p-0.5">
      <Globe className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
      {languages.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => onLocaleChange(lang.code)}
          className={`relative rounded px-2 py-0.5 text-xs font-medium transition-all duration-200 ${
            currentLocale === lang.code
              ? 'bg-sky-500/20 text-sky-300'
              : 'text-zinc-500 hover:bg-white/10 hover:text-zinc-200'
          }`}
        >
          {currentLocale === lang.code && (
            <motion.div
              layoutId="activeLang"
              className="absolute inset-0 rounded-md bg-sky-500/15"
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

