'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Shuffle, Palette } from 'lucide-react'
import {
  CodeFormat,
  FormattingOptions,
  RGBColor,
  generateRainbowGradient,
  generateSingleColor,
  generateRandomColor,
  generateRandomGradientColors,
  generateGradientText,
  MINECRAFT_COLORS,
} from '@/lib/rgb-generator'
import { ColorPalette } from './ColorPalette'
import { FormatSelector } from './FormatSelector'
import { FormattingButtons } from './FormattingButtons'

export function Generator() {
  const t = useTranslations('generator')
  
  const [inputText, setInputText] = useState('')
  const [format, setFormat] = useState<CodeFormat>('ampersand')
  const [formatting, setFormatting] = useState<FormattingOptions>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    obfuscated: false,
  })
  const [selectedColor, setSelectedColor] = useState<RGBColor | null>(null)
  const [gradientColors, setGradientColors] = useState<RGBColor[]>([])
  const [useGradient, setUseGradient] = useState(false)
  const [useRainbow, setUseRainbow] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (copyResetTimeoutRef.current) clearTimeout(copyResetTimeoutRef.current)
    },
    []
  )

  // Generate output text
  const outputText = useMemo(() => {
    if (!inputText.trim()) return ''

    if (useRainbow) {
      return generateRainbowGradient(inputText, format, formatting)
    }

    if (useGradient && gradientColors.length > 0) {
      return generateGradientText(inputText, gradientColors, format, formatting)
    }

    if (selectedColor) {
      return generateSingleColor(inputText, selectedColor, format, formatting)
    }

    return inputText
  }, [inputText, format, formatting, selectedColor, gradientColors, useGradient, useRainbow])

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    if (!outputText) return

    try {
      await navigator.clipboard.writeText(outputText)
      setCopied(true)
      if (copyResetTimeoutRef.current) clearTimeout(copyResetTimeoutRef.current)
      copyResetTimeoutRef.current = setTimeout(() => {
        setCopied(false)
        copyResetTimeoutRef.current = null
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [outputText])

  // Random color handler
  const handleRandom = useCallback(() => {
    setUseRainbow(false)
    setUseGradient(false)
    setSelectedColor(null)
    setGradientColors([])

    // 70% chance for single color, 30% for gradient
    if (Math.random() < 0.7) {
      setSelectedColor(generateRandomColor())
    } else {
      const colors = generateRandomGradientColors()
      setGradientColors(colors)
      setUseGradient(true)
    }
  }, [])

  // Toggle formatting option
  const toggleFormatting = useCallback((key: keyof FormattingOptions) => {
    setFormatting((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }, [])

  // Select color from palette
  const handleColorSelect = useCallback((color: RGBColor) => {
    setSelectedColor(color)
    setUseGradient(false)
    setUseRainbow(false)
    setGradientColors([])
    setShowPalette(false)
  }, [])

  // Toggle rainbow mode
  const toggleRainbow = useCallback(() => {
    setUseRainbow(!useRainbow)
    setUseGradient(false)
    setSelectedColor(null)
    setGradientColors([])
  }, [useRainbow])

  return (
    <div className="space-y-6">
      {/* Main Generator Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-effect rounded-2xl p-6 shadow-2xl"
      >
        {/* Format Selector */}
        <div className="mb-6">
          <FormatSelector format={format} onFormatChange={setFormat} />
        </div>

        {/* Formatting Buttons */}
        <div className="mb-6">
          <FormattingButtons
            formatting={formatting}
            onToggle={toggleFormatting}
          />
        </div>

        {/* Input Field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-dark-400 mb-2">
            {t('inputLabel')}
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('inputPlaceholder')}
            className="w-full h-32 px-4 py-3 bg-dark-100 border border-dark-200 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
          />
        </div>

        {/* Color Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowPalette(!showPalette)}
            className="flex items-center gap-2 px-4 py-2 bg-dark-200 hover:bg-dark-300 rounded-lg text-dark-400 hover:text-white transition-all"
          >
            <Palette className="w-4 h-4" />
            <span>{t('colorPalette')}</span>
          </button>

          <button
            onClick={toggleRainbow}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              useRainbow
                ? 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white'
                : 'bg-dark-200 hover:bg-dark-300 text-dark-400 hover:text-white'
            }`}
          >
            <span>🌈</span>
            <span>{t('rainbow')}</span>
          </button>

          <button
            onClick={handleRandom}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all"
          >
            <Shuffle className="w-4 h-4" />
            <span>{t('random')}</span>
          </button>
        </div>

        {/* Color Palette */}
        <AnimatePresence>
          {showPalette && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 overflow-hidden"
            >
              <ColorPalette onColorSelect={handleColorSelect} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Color Preview */}
        {(selectedColor || gradientColors.length > 0) && (
          <div className="mb-6 p-4 bg-dark-100 rounded-lg">
            <div className="flex items-center gap-3 flex-wrap">
              {selectedColor && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-dark-500">Color:</span>
                  <div
                    className="w-8 h-8 rounded border-2 border-dark-300"
                    style={{
                      backgroundColor: `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`,
                    }}
                  />
                  <span className="text-sm text-dark-400">
                    RGB({selectedColor.r}, {selectedColor.g}, {selectedColor.b})
                  </span>
                </div>
              )}
              {gradientColors.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-dark-500">Gradient:</span>
                  <div className="flex gap-1">
                    {gradientColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded border border-dark-300"
                        style={{
                          backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Output Field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-dark-400 mb-2">
            {t('outputLabel')}
          </label>
          <div className="relative">
            <textarea
              value={outputText}
              readOnly
              placeholder={t('outputPlaceholder')}
              onClick={copyToClipboard}
              className="w-full h-32 px-4 py-3 bg-dark-100 border border-dark-200 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all cursor-pointer hover:bg-dark-200/50"
            />
            <button
              onClick={copyToClipboard}
              className="absolute top-3 right-3 p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-sm">{t('copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">{t('copy')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview */}
        {outputText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 bg-dark-100 rounded-lg border border-dark-200"
          >
            <p className="text-sm text-dark-500 mb-2">{t('preview')}</p>
            <div className="p-3 bg-dark-50 rounded min-h-[60px] flex items-center">
              <pre className="text-lg font-mono whitespace-pre-wrap break-words text-white">
                {outputText}
              </pre>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

