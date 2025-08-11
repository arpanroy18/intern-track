import React, { useEffect, useState, useRef, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Check, ChevronDown } from "lucide-react"

// Helper functions for color conversion

const hexToHsl = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return [0, 0, 0]

  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  let l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

const hslToHex = (h: number, s: number, l: number): string => {
  const sNormalized = s / 100
  const lNormalized = l / 100

  const c = (1 - Math.abs(2 * lNormalized - 1)) * sNormalized
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = lNormalized - c / 2

  let r = 0, g = 0, b = 0

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x
  }

  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)

  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

const normalizeColor = (color: string): string => {
  if (color.startsWith("#")) {
    return color.toUpperCase()
  } else if (color.startsWith("hsl")) {
    const [h, s, l] = color.match(/\d+(\.\d+)?/g)?.map(Number) || [0, 0, 0]
    return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
  }
  return color
}

const trimColorString = (color: string, maxLength: number = 20): string => {
  if (color.length <= maxLength) return color
  return `${color.slice(0, maxLength - 3)}...`
}

export function ColorPicker({
  color,
  onChange,
  variant = 'dark',
}: {
  color: string
  onChange: (color: string) => void
  variant?: 'light' | 'dark'
}) {
  const [hsl, setHsl] = useState<[number, number, number]>([0, 0, 0])
  const [colorInput, setColorInput] = useState(color)
  const [isOpen, setIsOpen] = useState(false)
  const [fixedPosition, setFixedPosition] = useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const isLight = variant === 'light'

  const buttonClasses = isLight
    ? 'w-full flex items-center justify-between px-3 py-2 bg-[#F7F3E9] border border-[#E5D8C7] rounded-xl text-[#2F1F12] hover:bg-[#F2E9DD] focus:outline-none focus:border-[#2b1e1a] focus:ring-1 focus:ring-[#2b1e1a]/10 transition-all'
    : 'w-full flex items-center justify-between px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-100 hover:bg-slate-800 focus:outline-none focus:border-purple-400 transition-all'

  const swatchBorderClass = isLight ? 'border-[#E5D8C7]' : 'border-slate-600'
  const dropdownClasses = isLight
    ? 'fixed p-3 bg-white border border-[#E5D8C7] rounded-xl shadow-2xl'
    : 'fixed p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl'
  const panelBorderClass = isLight ? 'border-[#E5D8C7]' : 'border-slate-700'
  const inputFieldClasses = isLight
    ? 'flex-grow bg-[#F7F3E9] border border-[#E5D8C7] rounded-md text-sm h-8 px-2 text-[#2F1F12] placeholder-[#8B6E5A] focus:outline-none focus:border-[#2b1e1a] focus:ring-1 focus:ring-[#2b1e1a]/10'
    : 'flex-grow bg-slate-800/50 border border-slate-700 rounded-md text-sm h-8 px-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:border-purple-400'

  const handleColorChange = useCallback((newColor: string) => {
    const normalizedColor = normalizeColor(newColor)
    setColorInput(normalizedColor)

    let h, s, l
    if (normalizedColor.startsWith("#")) {
      [h, s, l] = hexToHsl(normalizedColor)
    } else {
      [h, s, l] = normalizedColor.match(/\d+(\.\d+)?/g)?.map(Number) || [
        0, 0, 0,
      ]
    }

    setHsl([h, s, l])
    // Always send hex color to the parent component
    const hexColor = hslToHex(h, s, l)
    onChange(hexColor)
  }, [onChange])

  useEffect(() => {
    handleColorChange(color)
  }, [color, handleColorChange])

  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return

    const buttonRect = buttonRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const dropdownHeight = 300 // Approximate height of the dropdown
    const spaceBelow = viewportHeight - buttonRect.bottom - 20
    const spaceAbove = buttonRect.top - 20

    // Determine if we should position above or below
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      // Position above
      setFixedPosition({
        top: buttonRect.top - dropdownHeight - 8,
        left: buttonRect.left,
        width: buttonRect.width
      })
    } else {
      // Position below
      setFixedPosition({
        top: buttonRect.bottom + 8,
        left: buttonRect.left,
        width: buttonRect.width
      })
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleResize = () => {
      if (isOpen) {
        calculateDropdownPosition()
      }
    }

    if (isOpen) {
      calculateDropdownPosition()
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('resize', handleResize)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, calculateDropdownPosition])

  const handleHueChange = (hue: number) => {
    const newHsl: [number, number, number] = [hue, hsl[1], hsl[2]]
    setHsl(newHsl)
    const hexColor = hslToHex(newHsl[0], newHsl[1], newHsl[2])
    onChange(hexColor)
  }

  const handleSaturationLightnessChange = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const s = Math.round((x / rect.width) * 100)
    const l = Math.round(100 - (y / rect.height) * 100)
    const newHsl: [number, number, number] = [hsl[0], s, l]
    setHsl(newHsl)
    const hexColor = hslToHex(newHsl[0], newHsl[1], newHsl[2])
    onChange(hexColor)
  }

  const handleColorInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newColor = event.target.value
    setColorInput(newColor)
    if (
      /^#[0-9A-Fa-f]{6}$/.test(newColor) ||
      /^hsl\(\d+,\s*\d+%,\s*\d+%\)$/.test(newColor)
    ) {
      handleColorChange(newColor)
    }
  }

  const colorPresets = [
    "#FF3B30",
    "#FF9500",
    "#FFCC00",
    "#4CD964",
    "#5AC8FA",
    "#007AFF",
    "#5856D6",
    "#FF2D55",
    "#8E8E93",
    "#EFEFF4",
    "#E5E5EA",
    "#D1D1D6",
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClasses}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-5 h-5 rounded-full shadow-sm border-2 ${swatchBorderClass}`}
            style={{ backgroundColor: colorInput }}
          />
          <span className="text-sm">{trimColorString(colorInput)}</span>
        </div>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className={dropdownClasses}
            style={{
              top: `${fixedPosition.top}px`,
              left: `${fixedPosition.left}px`,
              width: `${Math.max(fixedPosition.width, 280)}px`,
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 9999
            }}
          >
            <div className="space-y-3">
              <motion.div
                className={`w-full h-40 rounded-lg cursor-crosshair relative overflow-hidden border ${panelBorderClass}`}
                style={{
                  background: `
                    linear-gradient(to top, rgba(0, 0, 0, 1), transparent),
                    linear-gradient(to right, rgba(255, 255, 255, 1), rgba(255, 0, 0, 0)),
                    hsl(${hsl[0]}, 100%, 50%)
                  `,
                }}
                onClick={handleSaturationLightnessChange}
              >
                <motion.div
                  className="w-4 h-4 rounded-full border-2 border-white absolute shadow-md"
                  style={{
                    left: `${Math.max(0, Math.min(100, hsl[1]))}%`,
                    top: `${Math.max(0, Math.min(100, 100 - hsl[2]))}%`,
                    backgroundColor: `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              </motion.div>
              
              <motion.input
                type="range"
                min="0"
                max="360"
                value={hsl[0]}
                onChange={(e) => handleHueChange(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, 
                    hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), 
                    hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%)
                  )`,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              />
              
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={colorInput}
                  onChange={handleColorInputChange}
                  className={inputFieldClasses}
                  placeholder="#RRGGBB or hsl(h, s%, l%)"
                />
                <motion.div
                  className={`w-8 h-8 rounded-full shadow-sm border-2 ${swatchBorderClass}`}
                  style={{ backgroundColor: colorInput }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                />
              </div>
              
              <div className="grid grid-cols-6 gap-2">
                <AnimatePresence>
                  {colorPresets.map((preset) => (
                    <motion.button
                      key={preset}
                      type="button"
                      className={`w-8 h-8 rounded-full relative border ${swatchBorderClass}`}
                      style={{ backgroundColor: preset }}
                      onClick={() => handleColorChange(preset)}
                      whileHover={{ scale: 1.2, zIndex: 1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {colorInput === preset && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}