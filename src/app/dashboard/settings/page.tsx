'use client'

import { useState } from 'react'
import { QRCode } from 'react-qrcode-logo'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/components/shared/GlassPanel'

export default function SettingsPage() {
  const [venueName, setVenueName] = useState('Bella Taverna')
  const [venueAddress, setVenueAddress] = useState('123 Main Street, Amsterdam')
  const [tableNumber, setTableNumber] = useState('1')
  const [isSaving, setIsSaving] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mesa.app'
  const venueSlug = venueName.toLowerCase().replace(/\s+/g, '-')
  const qrUrl = `${baseUrl}/v/${venueSlug}${tableNumber ? `?t=${tableNumber}` : ''}`

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  const downloadQR = () => {
    const canvas = document.querySelector('#qr-code canvas') as HTMLCanvasElement
    if (!canvas) return

    const pngFile = canvas.toDataURL('image/png')
    const downloadLink = document.createElement('a')
    downloadLink.download = `qr-table-${tableNumber || 'all'}.png`
    downloadLink.href = pngFile
    downloadLink.click()
  }

  const downloadAllTables = () => {
    alert('This would download a ZIP file with QR codes for tables 1-50')
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted">Manage your venue and generate QR codes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Venue Info */}
        <GlassPanel className="p-6">
          <h3 className="font-semibold text-text-primary mb-6">Venue Information</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Venue Name
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-ocean-700 border border-line text-text-primary focus:outline-none focus:border-signal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Address
              </label>
              <input
                type="text"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-ocean-700 border border-line text-text-primary focus:outline-none focus:border-signal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Logo (optional)
              </label>
              <div className="border-2 border-dashed border-line rounded-xl p-6 text-center hover:border-signal transition-colors cursor-pointer">
                <Upload className="w-6 h-6 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">Click to upload logo</p>
              </div>
            </div>

            <Button onClick={handleSave} variant="signal" disabled={isSaving} className="w-full">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </GlassPanel>

        {/* QR Code Generator */}
        <GlassPanel className="p-6">
          <h3 className="font-semibold text-text-primary mb-6">QR Code Generator</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Table Number
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Leave empty for general QR"
                  className="flex-1 px-4 py-3 rounded-lg bg-ocean-700 border border-line text-text-primary focus:outline-none focus:border-signal"
                />
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="px-4 py-3 rounded-lg bg-ocean-700 border border-line text-text-primary focus:outline-none focus:border-signal"
                >
                  <option value="">No table</option>
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Table {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* QR Preview */}
            <div className="flex flex-col items-center py-4">
              <div id="qr-code" className="bg-white p-4 rounded-xl">
                <QRCode
                  value={qrUrl}
                  size={180}
                  fgColor="#B2472A"
                  bgColor="#ffffff"
                  ecLevel="M"
                  quietZone={0}
                />
              </div>
              <p className="text-xs text-text-muted mt-4 text-center break-all max-w-[250px]">
                {qrUrl}
              </p>
            </div>

            {/* Download Buttons */}
            <div className="space-y-3">
              <Button onClick={downloadQR} variant="signal-outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download PNG
              </Button>
              <Button onClick={downloadAllTables} variant="signal-outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download all tables (ZIP)
              </Button>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
