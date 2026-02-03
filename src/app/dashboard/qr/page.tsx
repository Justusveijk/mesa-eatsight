'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import {
  Download,
  Printer,
  Palette,
  Maximize2,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ScrollReveal } from '@/components/ScrollReveal'

interface QRSettings {
  size: number
  fgColor: string
  bgColor: string
  includeMargin: boolean
  includeLogo: boolean
}

const presetColors = [
  { name: 'Burgundy', fg: '#722F37', bg: '#FFFFFF' },
  { name: 'Charcoal', fg: '#1C1C1C', bg: '#FFFFFF' },
  { name: 'Terracotta', fg: '#C4654A', bg: '#FFFFFF' },
  { name: 'Inverted', fg: '#FFFFFF', bg: '#1C1C1C' },
  { name: 'Cream', fg: '#722F37', bg: '#F5F0EB' },
  { name: 'Forest', fg: '#2D5016', bg: '#FFFFFF' },
]

const sizeOptions = [
  { label: 'Small', value: 128, desc: 'Table tents' },
  { label: 'Medium', value: 256, desc: 'Posters' },
  { label: 'Large', value: 512, desc: 'Banners' },
]

export default function QRPage() {
  const [venueSlug, setVenueSlug] = useState<string | null>(null)
  const [venueName, setVenueName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [settings, setSettings] = useState<QRSettings>({
    size: 256,
    fgColor: '#722F37',
    bgColor: '#FFFFFF',
    includeMargin: true,
    includeLogo: true,
  })

  const canvasRef = useRef<HTMLDivElement>(null)

  const fetchVenueData = useCallback(async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: operatorUser } = await supabase
      .from('operator_users')
      .select('venue_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!operatorUser?.venue_id) return

    const { data: venue } = await supabase
      .from('venues')
      .select('slug, name')
      .eq('id', operatorUser.venue_id)
      .single()

    if (venue) {
      setVenueSlug(venue.slug)
      setVenueName(venue.name)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchVenueData()
  }, [fetchVenueData])

  const menuUrl = venueSlug ? `${window.location.origin}/menu/${venueSlug}` : ''

  const copyToClipboard = async () => {
    if (!menuUrl) return
    await navigator.clipboard.writeText(menuUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPNG = () => {
    const canvas = document.querySelector('#qr-canvas canvas') as HTMLCanvasElement
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `${venueSlug || 'menu'}-qr-code.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const downloadSVG = () => {
    const svg = document.querySelector('#qr-svg svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.download = `${venueSlug || 'menu'}-qr-code.svg`
    link.href = url
    link.click()

    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const svg = document.querySelector('#qr-svg svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${venueName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 40px;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .qr-container {
              text-align: center;
            }
            h1 {
              margin: 0 0 20px;
              font-size: 24px;
              color: #1C1C1C;
            }
            p {
              margin: 20px 0 0;
              font-size: 14px;
              color: #666;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>${venueName}</h1>
            ${svgData}
            <p>Scan to view our menu</p>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mesa-burgundy"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-serif text-mesa-charcoal">QR Code</h1>
          <p className="text-sm text-mesa-charcoal/50 mt-1">
            Generate and customize your menu QR code
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview */}
          <ScrollReveal>
            <div className="glass rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-mesa-charcoal">Preview</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-mesa-charcoal/40">
                    {settings.size}×{settings.size}px
                  </span>
                </div>
              </div>

              {/* QR Code Display */}
              <div
                className="flex items-center justify-center p-8 rounded-xl mb-6"
                style={{ backgroundColor: settings.bgColor === '#FFFFFF' ? '#F5F5F5' : settings.bgColor }}
              >
                <motion.div
                  key={`${settings.fgColor}-${settings.bgColor}-${settings.size}`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="relative"
                >
                  {/* Hidden canvas for PNG download */}
                  <div id="qr-canvas" className="hidden">
                    <QRCodeCanvas
                      value={menuUrl || 'https://example.com'}
                      size={settings.size}
                      fgColor={settings.fgColor}
                      bgColor={settings.bgColor}
                      includeMargin={settings.includeMargin}
                      level="H"
                      imageSettings={settings.includeLogo ? {
                        src: '/logo-icon.png',
                        x: undefined,
                        y: undefined,
                        height: settings.size * 0.2,
                        width: settings.size * 0.2,
                        excavate: true,
                      } : undefined}
                    />
                  </div>

                  {/* Visible SVG */}
                  <div id="qr-svg">
                    <QRCodeSVG
                      value={menuUrl || 'https://example.com'}
                      size={Math.min(settings.size, 280)}
                      fgColor={settings.fgColor}
                      bgColor={settings.bgColor}
                      includeMargin={settings.includeMargin}
                      level="H"
                      imageSettings={settings.includeLogo ? {
                        src: '/logo-icon.png',
                        x: undefined,
                        y: undefined,
                        height: Math.min(settings.size, 280) * 0.2,
                        width: Math.min(settings.size, 280) * 0.2,
                        excavate: true,
                      } : undefined}
                    />
                  </div>
                </motion.div>
              </div>

              {/* Menu URL */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-mesa-charcoal">Menu URL</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-4 py-3 glass rounded-xl">
                    <QrCode className="w-4 h-4 text-mesa-charcoal/40 flex-shrink-0" />
                    <span className="text-sm text-mesa-charcoal truncate">
                      {menuUrl || 'No venue configured'}
                    </span>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    disabled={!menuUrl}
                    className="p-3 glass rounded-xl text-mesa-charcoal/60 hover:text-mesa-charcoal transition disabled:opacity-50"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Copy className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                  <a
                    href={menuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 glass rounded-xl text-mesa-charcoal/60 hover:text-mesa-charcoal transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Download Actions */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <button
                  onClick={downloadPNG}
                  disabled={!menuUrl}
                  className="flex flex-col items-center gap-2 p-4 glass rounded-xl hover:bg-mesa-charcoal/5 transition disabled:opacity-50"
                >
                  <Download className="w-5 h-5 text-mesa-burgundy" />
                  <span className="text-xs font-medium text-mesa-charcoal">PNG</span>
                </button>
                <button
                  onClick={downloadSVG}
                  disabled={!menuUrl}
                  className="flex flex-col items-center gap-2 p-4 glass rounded-xl hover:bg-mesa-charcoal/5 transition disabled:opacity-50"
                >
                  <Download className="w-5 h-5 text-mesa-burgundy" />
                  <span className="text-xs font-medium text-mesa-charcoal">SVG</span>
                </button>
                <button
                  onClick={handlePrint}
                  disabled={!menuUrl}
                  className="flex flex-col items-center gap-2 p-4 glass rounded-xl hover:bg-mesa-charcoal/5 transition disabled:opacity-50"
                >
                  <Printer className="w-5 h-5 text-mesa-burgundy" />
                  <span className="text-xs font-medium text-mesa-charcoal">Print</span>
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* Settings */}
          <div className="space-y-6">
            {/* Size Selection */}
            <ScrollReveal delay={0.1}>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Maximize2 className="w-5 h-5 text-mesa-burgundy" />
                  <h2 className="font-semibold text-mesa-charcoal">Size</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {sizeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSettings({ ...settings, size: option.value })}
                      className={`p-4 rounded-xl border-2 transition text-center ${
                        settings.size === option.value
                          ? 'border-mesa-burgundy bg-mesa-burgundy/5'
                          : 'border-transparent glass hover:border-mesa-charcoal/10'
                      }`}
                    >
                      <span className="block text-sm font-medium text-mesa-charcoal">
                        {option.label}
                      </span>
                      <span className="block text-xs text-mesa-charcoal/50 mt-1">
                        {option.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Color Presets */}
            <ScrollReveal delay={0.2}>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-5 h-5 text-mesa-burgundy" />
                  <h2 className="font-semibold text-mesa-charcoal">Color Scheme</h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {presetColors.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setSettings({
                        ...settings,
                        fgColor: preset.fg,
                        bgColor: preset.bg,
                      })}
                      className={`p-3 rounded-xl border-2 transition ${
                        settings.fgColor === preset.fg && settings.bgColor === preset.bg
                          ? 'border-mesa-burgundy'
                          : 'border-transparent glass hover:border-mesa-charcoal/10'
                      }`}
                    >
                      <div
                        className="w-full h-8 rounded-lg mb-2"
                        style={{ backgroundColor: preset.bg, border: `2px solid ${preset.fg}` }}
                      >
                        <div
                          className="w-4 h-4 rounded m-1"
                          style={{ backgroundColor: preset.fg }}
                        />
                      </div>
                      <span className="text-xs font-medium text-mesa-charcoal">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Custom Colors */}
                <div className="mt-4 pt-4 border-t border-mesa-charcoal/5">
                  <p className="text-xs text-mesa-charcoal/50 mb-3">Or choose custom colors</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-mesa-charcoal/70">QR</label>
                      <input
                        type="color"
                        value={settings.fgColor}
                        onChange={(e) => setSettings({ ...settings, fgColor: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-mesa-charcoal/70">Background</label>
                      <input
                        type="color"
                        value={settings.bgColor}
                        onChange={(e) => setSettings({ ...settings, bgColor: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Options */}
            <ScrollReveal delay={0.3}>
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-mesa-burgundy" />
                  <h2 className="font-semibold text-mesa-charcoal">Options</h2>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="w-4 h-4 text-mesa-charcoal/50" />
                      <span className="text-sm text-mesa-charcoal">Include logo</span>
                    </div>
                    <div
                      onClick={() => setSettings({ ...settings, includeLogo: !settings.includeLogo })}
                      className={`relative w-11 h-6 rounded-full transition cursor-pointer ${
                        settings.includeLogo ? 'bg-mesa-burgundy' : 'bg-mesa-charcoal/20'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.includeLogo ? 20 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Maximize2 className="w-4 h-4 text-mesa-charcoal/50" />
                      <span className="text-sm text-mesa-charcoal">Include margin</span>
                    </div>
                    <div
                      onClick={() => setSettings({ ...settings, includeMargin: !settings.includeMargin })}
                      className={`relative w-11 h-6 rounded-full transition cursor-pointer ${
                        settings.includeMargin ? 'bg-mesa-burgundy' : 'bg-mesa-charcoal/20'
                      }`}
                    >
                      <motion.div
                        animate={{ x: settings.includeMargin ? 20 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                      />
                    </div>
                  </label>
                </div>
              </div>
            </ScrollReveal>

            {/* Tips */}
            <ScrollReveal delay={0.4}>
              <div className="glass-warm rounded-2xl p-6">
                <h3 className="font-semibold text-mesa-charcoal mb-3">Printing Tips</h3>
                <ul className="space-y-2 text-sm text-mesa-charcoal/70">
                  <li className="flex items-start gap-2">
                    <span className="text-mesa-burgundy">•</span>
                    Use high contrast colors for better scanning
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-mesa-burgundy">•</span>
                    Minimum print size: 2×2 cm (0.8×0.8 in)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-mesa-burgundy">•</span>
                    SVG format is best for print materials
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-mesa-burgundy">•</span>
                    Test scan the QR code after printing
                  </li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  )
}
