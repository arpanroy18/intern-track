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
}: {
  color: string
  onChange: (color: string) => void
}) {
  const [hsl, setHsl] = useState<[number, number, number]>([0, 0, 0])
  const [colorInput, setColorInput] = useState(color)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    onChange(`hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`)
  }, [onChange])

  useEffect(() => {
    handleColorChange(color)
  }, [color, handleColorChange])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleHueChange = (hue: number) => {
    const newHsl: [number, number, number] = [hue, hsl[1], hsl[2]]
    setHsl(newHsl)
    handleColorChange(`hsl(${newHsl[0]}, ${newHsl[1]}%, ${newHsl[2]}%)`)
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
    handleColorChange(`hsl(${newHsl[0]}, ${newHsl[1]}%, ${newHsl[2]}%)`)
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
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-gray-100 hover:bg-slate-800 focus:outline-none focus:border-purple-400 transition-all"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full shadow-sm border-2 border-slate-600"
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
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50"
          >
            <div className="space-y-3">
              <motion.div
                className="w-full h-40 rounded-lg cursor-crosshair relative overflow-hidden border border-slate-700"
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
                  className="flex-grow bg-slate-800/50 border border-slate-700 rounded-md text-sm h-8 px-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  placeholder="#RRGGBB or hsl(h, s%, l%)"
                />
                <motion.div
                  className="w-8 h-8 rounded-full shadow-sm border-2 border-slate-600"
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
                      className="w-8 h-8 rounded-full relative border border-slate-600"
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