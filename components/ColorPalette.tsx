'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { RGBColor, MINECRAFT_COLORS } from '@/lib/rgb-generator'

interface ColorPaletteProps {
  onColorSelect: (color: RGBColor) => void
}

export function ColorPalette({ onColorSelect }: ColorPaletteProps) {
  const t = useTranslations('colors')

  const colorEntries = Object.entries(MINECRAFT_COLORS) as [
    keyof typeof MINECRAFT_COLORS,
    RGBColor
  ][]

  return (
    <div className="p-4 bg-dark-100 rounded-lg border border-dark-200">
      <p className="text-sm text-dark-500 mb-4">{t('paletteTitle')}</p>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {colorEntries.map(([name, color]) => (
          <motion.button
            key={name}
            onClick={() => onColorSelect(color)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="group relative"
            title={t(name)}
          >
            <div
              className="w-12 h-12 rounded-lg border-2 border-dark-300 group-hover:border-primary-400 transition-all shadow-lg"
              style={{
                backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
              }}
            />
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-dark-400 whitespace-nowrap">
                {t(name)}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Custom RGB Picker */}
      <div className="mt-6 pt-6 border-t border-dark-200">
        <p className="text-sm text-dark-500 mb-3">{t('customRgb')}</p>
        <CustomColorPicker onColorSelect={onColorSelect} />
      </div>
    </div>
  )
}

function CustomColorPicker({
  onColorSelect,
}: {
  onColorSelect: (color: RGBColor) => void
}) {
  const t = useTranslations('colors')
  const [r, setR] = useState(255)
  const [g, setG] = useState(255)
  const [b, setB] = useState(255)

  const handleChange = (component: 'r' | 'g' | 'b', value: number) => {
    const clamped = Math.max(0, Math.min(255, value))
    if (component === 'r') setR(clamped)
    if (component === 'g') setG(clamped)
    if (component === 'b') setB(clamped)
  }

  const color: RGBColor = { r, g, b }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-lg border-2 border-dark-300 shadow-lg"
          style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-dark-400 w-8">R:</label>
            <input
              type="range"
              min="0"
              max="255"
              value={r}
              onChange={(e) => handleChange('r', parseInt(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min="0"
              max="255"
              value={r}
              onChange={(e) => handleChange('r', parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 bg-dark-200 border border-dark-300 rounded text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-dark-400 w-8">G:</label>
            <input
              type="range"
              min="0"
              max="255"
              value={g}
              onChange={(e) => handleChange('g', parseInt(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min="0"
              max="255"
              value={g}
              onChange={(e) => handleChange('g', parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 bg-dark-200 border border-dark-300 rounded text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-dark-400 w-8">B:</label>
            <input
              type="range"
              min="0"
              max="255"
              value={b}
              onChange={(e) => handleChange('b', parseInt(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              min="0"
              max="255"
              value={b}
              onChange={(e) => handleChange('b', parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 bg-dark-200 border border-dark-300 rounded text-white text-sm"
            />
          </div>
        </div>
      </div>
      <button
        onClick={() => onColorSelect(color)}
        className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all"
      >
        {t('applyColor')}
      </button>
    </div>
  )
}

