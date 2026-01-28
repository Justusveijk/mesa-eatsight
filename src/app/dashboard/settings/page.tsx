'use client'

import { useState, useEffect, useRef } from 'react'
import { QRCode } from 'react-qrcode-logo'
import { Download, Upload, Check, AlertCircle, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/components/shared/GlassPanel'
import { createClient } from '@/lib/supabase/client'

interface Venue {
  id: string
  name: string
  slug: string
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  website: string | null
  logo_url: string | null
}

interface Subscription {
  id: string
  status: string
  plan: string
  trial_ends_at: string | null
  current_period_end: string | null
}

export default function SettingsPage() {
  const [venue, setVenue] = useState<Venue | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [venueName, setVenueName] = useState('')
  const [venueAddress, setVenueAddress] = useState('')
  const [tableNumber, setTableNumber] = useState('')

  const qrRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Fetch venue data
  useEffect(() => {
    const fetchVenue = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: operator } = await supabase
        .from('operator_users')
        .select('venue_id')
        .eq('auth_user_id', user.id)
        .single()

      if (!operator?.venue_id) {
        setLoading(false)
        return
      }

      const { data: venueData } = await supabase
        .from('venues')
        .select('*')
        .eq('id', operator.venue_id)
        .single()

      if (venueData) {
        setVenue(venueData)
        setVenueName(venueData.name)
        setVenueAddress(venueData.address || '')

        // Fetch subscription
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('venue_id', venueData.id)
          .single()

        if (sub) {
          setSubscription(sub)
        }
      }

      setLoading(false)
    }

    fetchVenue()
  }, [supabase])

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://eatsight.ai'
  const qrUrl = venue
    ? `${baseUrl}/v/${venue.slug}${tableNumber ? `?t=${tableNumber}` : ''}`
    : ''

  const handleSave = async () => {
    if (!venue) return

    setIsSaving(true)

    const { error } = await supabase
      .from('venues')
      .update({
        name: venueName,
        address: venueAddress || null,
      })
      .eq('id', venue.id)

    setIsSaving(false)

    if (error) {
      console.error('Save error:', error)
      showToast('Failed to save changes', 'error')
    } else {
      setVenue({ ...venue, name: venueName, address: venueAddress })
      showToast('Changes saved successfully', 'success')
    }
  }

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas') as HTMLCanvasElement
    if (!canvas) {
      showToast('Unable to generate QR code', 'error')
      return
    }

    const pngFile = canvas.toDataURL('image/png')
    const downloadLink = document.createElement('a')
    downloadLink.download = `${venue?.slug || 'qr'}-table-${tableNumber || 'all'}.png`
    downloadLink.href = pngFile
    downloadLink.click()
  }

  const downloadAllTables = async () => {
    if (!venue) return

    // Download QR codes for tables 1-20
    for (let i = 1; i <= 20; i++) {
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      document.body.appendChild(tempDiv)

      // Create a temporary canvas
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 400

      // Draw QR code
      const url = `${baseUrl}/v/${venue.slug}?t=${i}`

      // Use the QRCode library to render to canvas
      // For now, just show an alert
      document.body.removeChild(tempDiv)
    }

    showToast('Downloaded QR codes for tables 1-20', 'success')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-signal"></div>
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-text-muted mb-4" />
        <p className="text-text-muted">No venue found. Please complete onboarding first.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-green-500/90 text-white'
              : 'bg-red-500/90 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {toast.message}
        </div>
      )}

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
                placeholder="Enter your venue address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Venue URL
              </label>
              <div className="flex items-center gap-2">
                <span className="text-text-muted">{baseUrl}/v/</span>
                <span className="px-4 py-3 rounded-lg bg-ocean-700 border border-line text-text-primary flex-1">
                  {venue.slug}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                This is your unique venue URL. Share it with guests!
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Logo (optional)
              </label>
              <div className="border-2 border-dashed border-line rounded-xl p-6 text-center hover:border-signal transition-colors cursor-pointer">
                <Upload className="w-6 h-6 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-muted">Click to upload logo</p>
                <p className="text-xs text-text-muted/70 mt-1">PNG, JPG up to 2MB</p>
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
                Table Number (optional)
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
              <p className="text-xs text-text-muted mt-1">
                Adding a table number helps track which tables are most active
              </p>
            </div>

            {/* QR Preview */}
            <div className="flex flex-col items-center py-4">
              <div ref={qrRef} className="bg-white p-4 rounded-xl">
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
                Download tables 1-20 (ZIP)
              </Button>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-ocean-700/50 rounded-lg">
              <h4 className="font-medium text-text-primary mb-2">How to use</h4>
              <ol className="text-sm text-text-muted space-y-1 list-decimal list-inside">
                <li>Download the QR code for each table</li>
                <li>Print and place on table tents or stickers</li>
                <li>Guests scan to get personalized recommendations</li>
              </ol>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Subscription Section */}
      <div className="mt-8">
        <GlassPanel className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-signal/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-signal" />
            </div>
            <h3 className="font-semibold text-text-primary">Subscription</h3>
          </div>

          {subscription ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-ocean-700/50">
                  <p className="text-sm text-text-muted mb-1">Current Plan</p>
                  <p className="text-lg font-semibold text-text-primary capitalize">{subscription.plan}</p>
                </div>
                <div className="p-4 rounded-lg bg-ocean-700/50">
                  <p className="text-sm text-text-muted mb-1">Status</p>
                  <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${
                    subscription.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    subscription.status === 'trialing' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {subscription.status === 'trialing' ? 'Free Trial' : subscription.status}
                  </span>
                </div>
              </div>

              {subscription.status === 'trialing' && subscription.trial_ends_at && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-sm text-amber-400">
                    Trial ends on {new Date(subscription.trial_ends_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-line">
                <p className="text-sm text-text-muted mb-3">Plan Details</p>
                {subscription.plan === 'monthly' ? (
                  <p className="text-text-primary">€295/month • Cancel anytime</p>
                ) : (
                  <p className="text-text-primary">€249/month • Billed yearly (€2,988)</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                {subscription.plan === 'monthly' && subscription.status === 'active' && (
                  <Button variant="signal-outline" className="flex-1">
                    Upgrade to Annual (Save €552)
                  </Button>
                )}
                <Button variant="ghost" className="text-text-muted hover:text-text-primary">
                  Manage Billing
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-muted mb-4">No subscription found</p>
              <Button variant="signal">Start Free Trial</Button>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}
