'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  Printer,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { createClient } from '@/lib/supabase/client'

export default function QRCodePage() {
  const [venue, setVenue] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [qrColor, setQrColor] = useState('#171717')
  const [qrSize, setQrSize] = useState<'sm' | 'md' | 'lg'>('md')
  const qrRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()
  const guestUrl = venue ? `${typeof window !== 'undefined' ? window.location.origin : ''}/v/${venue.slug}` : ''

  const sizes = { sm: 180, md: 256, lg: 360 }
  const colors = ['#171717', '#722F37', '#1e3a5f', '#2d5a4a', '#6b21a8']

  useEffect(() => {
    async function fetchVenue() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: operator } = await supabase
        .from('operator_users')
        .select('venue_id')
        .eq('auth_user_id', user.id)
        .single()

      if (operator?.venue_id) {
        const { data } = await supabase
          .from('venues')
          .select('*')
          .eq('id', operator.venue_id)
          .single()
        setVenue(data)
      }
      setLoading(false)
    }
    fetchVenue()
  }, [])

  async function copyLink() {
    await navigator.clipboard.writeText(guestUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadQR(format: 'png' | 'svg') {
    if (!qrRef.current) return
    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svg)
      const blob = new Blob([svgData], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${venue?.slug}-qr.svg`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      const svgData = new XMLSerializer().serializeToString(svg)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      img.onload = () => {
        canvas.width = sizes[qrSize] * 2
        canvas.height = sizes[qrSize] * 2
        ctx?.drawImage(img, 0, 0, sizes[qrSize] * 2, sizes[qrSize] * 2)
        const pngUrl = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = `${venue?.slug}-qr.png`
        a.click()
        URL.revokeObjectURL(url)
      }
      img.src = url
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-lg font-semibold text-neutral-900">QR Code</h1>
          <p className="text-sm text-neutral-500">Download and print for your tables</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Preview */}
          <div className="bg-white border border-neutral-200 rounded-lg p-8">
            <div className="flex flex-col items-center">
              <div
                ref={qrRef}
                className="p-6 bg-white border border-neutral-100 rounded-lg"
              >
                <QRCodeSVG
                  value={guestUrl || 'https://mesa.app'}
                  size={sizes[qrSize]}
                  fgColor={qrColor}
                  bgColor="#FFFFFF"
                  level="H"
                />
              </div>

              <div className="mt-6 text-center">
                <h2 className="text-base font-medium text-neutral-900">{venue?.name}</h2>
                <p className="text-sm text-neutral-500 mt-1">Scan for recommendations</p>
              </div>

              {/* URL Copy */}
              <div className="mt-4 flex items-center gap-2 w-full max-w-xs">
                <div className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md">
                  <code className="text-xs text-neutral-600 truncate block">{guestUrl}</code>
                </div>
                <button
                  onClick={copyLink}
                  className="p-2 border border-neutral-200 rounded-md hover:bg-neutral-50 transition"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-neutral-600" />
                  )}
                </button>
                <a
                  href={guestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-neutral-200 rounded-md hover:bg-neutral-50 transition"
                >
                  <ExternalLink className="w-4 h-4 text-neutral-600" />
                </a>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Size */}
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <label className="text-sm font-medium text-neutral-900 mb-3 block">Size</label>
              <div className="flex gap-2">
                {([
                  { value: 'sm', label: 'Small', desc: '180px' },
                  { value: 'md', label: 'Medium', desc: '256px' },
                  { value: 'lg', label: 'Large', desc: '360px' },
                ] as const).map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setQrSize(size.value)}
                    className={`flex-1 p-3 rounded-md text-center transition ${
                      qrSize === size.value
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="block text-sm font-medium">{size.label}</span>
                    <span className={`block text-xs mt-0.5 ${
                      qrSize === size.value ? 'text-neutral-300' : 'text-neutral-400'
                    }`}>{size.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <label className="text-sm font-medium text-neutral-900 mb-3 block">Color</label>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setQrColor(color)}
                    className={`w-10 h-10 rounded-md transition ${
                      qrColor === color ? 'ring-2 ring-offset-2 ring-neutral-900' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <label className="relative w-10 h-10 rounded-md bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 cursor-pointer overflow-hidden">
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Download */}
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <label className="text-sm font-medium text-neutral-900 mb-3 block">Download</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => downloadQR('png')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition"
                >
                  <Download className="w-4 h-4" />
                  PNG
                </button>
                <button
                  onClick={() => downloadQR('svg')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-md hover:bg-neutral-50 transition"
                >
                  <Download className="w-4 h-4" />
                  SVG
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
