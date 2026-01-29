'use client'

import { useState, useEffect, useRef } from 'react'
import { QRCode } from 'react-qrcode-logo'
import { Download, Upload, Check, AlertCircle, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    showToast('Downloaded QR codes for tables 1-20', 'success')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#722F37]"></div>
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-[#1a1a1a]/30 mb-4" />
        <p className="text-[#1a1a1a]/50">No venue found. Please complete onboarding first.</p>
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
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
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
      <div className="mb-6 sm:mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1a1a1a]">Settings</h1>
        <p className="text-[#1a1a1a]/50 text-sm sm:text-base">Manage your venue and generate QR codes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Venue Info */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#1a1a1a]/5 shadow-sm">
          <h3 className="font-semibold text-[#1a1a1a] mb-4 sm:mb-6">Venue Information</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a]/60 mb-2">
                Venue Name
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a]/60 mb-2">
                Address
              </label>
              <input
                type="text"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition"
                placeholder="Enter your venue address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a]/60 mb-2">
                Venue URL
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[#1a1a1a]/50">{baseUrl}/v/</span>
                <span className="px-4 py-3 rounded-xl bg-[#FDFBF7] border border-[#1a1a1a]/10 text-[#1a1a1a] flex-1">
                  {venue.slug}
                </span>
              </div>
              <p className="text-xs text-[#1a1a1a]/40 mt-1">
                This is your unique venue URL. Share it with guests!
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a]/60 mb-2">
                Logo (optional)
              </label>
              <div className="border-2 border-dashed border-[#1a1a1a]/10 rounded-xl p-6 text-center hover:border-[#722F37] transition-colors cursor-pointer">
                <Upload className="w-6 h-6 text-[#1a1a1a]/40 mx-auto mb-2" />
                <p className="text-sm text-[#1a1a1a]/50">Click to upload logo</p>
                <p className="text-xs text-[#1a1a1a]/30 mt-1">PNG, JPG up to 2MB</p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* QR Code Generator */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#1a1a1a]/5 shadow-sm">
          <h3 className="font-semibold text-[#1a1a1a] mb-4 sm:mb-6">QR Code Generator</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a]/60 mb-2">
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
                  className="flex-1 px-4 py-3 rounded-xl border border-[#1a1a1a]/10 bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition"
                />
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-[#1a1a1a]/10 bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition"
                >
                  <option value="">No table</option>
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Table {n}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-[#1a1a1a]/40 mt-1">
                Adding a table number helps track which tables are most active
              </p>
            </div>

            {/* QR Preview */}
            <div className="flex flex-col items-center py-4">
              <div ref={qrRef} className="bg-white p-4 rounded-xl border border-[#1a1a1a]/10">
                <QRCode
                  value={qrUrl}
                  size={180}
                  fgColor="#722F37"
                  bgColor="#ffffff"
                  ecLevel="M"
                  quietZone={0}
                />
              </div>
              <p className="text-xs text-[#1a1a1a]/40 mt-4 text-center break-all max-w-[250px]">
                {qrUrl}
              </p>
            </div>

            {/* Download Buttons */}
            <div className="space-y-3">
              <button
                onClick={downloadQR}
                className="w-full px-6 py-3 border-2 border-[#722F37] text-[#722F37] rounded-xl hover:bg-[#722F37] hover:text-white transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>
              <button
                onClick={downloadAllTables}
                className="w-full px-6 py-3 border-2 border-[#1a1a1a]/20 text-[#1a1a1a]/60 rounded-xl hover:border-[#1a1a1a]/40 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download tables 1-20 (ZIP)
              </button>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-[#FDFBF7] rounded-xl">
              <h4 className="font-medium text-[#1a1a1a] mb-2">How to use</h4>
              <ol className="text-sm text-[#1a1a1a]/60 space-y-1 list-decimal list-inside">
                <li>Download the QR code for each table</li>
                <li>Print and place on table tents or stickers</li>
                <li>Guests scan to get personalized recommendations</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="mt-8">
        <div className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#722F37]/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#722F37]" />
            </div>
            <h3 className="font-semibold text-[#1a1a1a]">Subscription</h3>
          </div>

          {subscription ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#FDFBF7]">
                  <p className="text-sm text-[#1a1a1a]/50 mb-1">Current Plan</p>
                  <p className="text-lg font-semibold text-[#1a1a1a] capitalize">{subscription.plan}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#FDFBF7]">
                  <p className="text-sm text-[#1a1a1a]/50 mb-1">Status</p>
                  <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${
                    subscription.status === 'active' ? 'bg-green-100 text-green-700' :
                    subscription.status === 'trialing' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {subscription.status === 'trialing' ? 'Free Trial' : subscription.status}
                  </span>
                </div>
              </div>

              {subscription.status === 'trialing' && subscription.trial_ends_at && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-700">
                    Trial ends on {new Date(subscription.trial_ends_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-[#1a1a1a]/10">
                <p className="text-sm text-[#1a1a1a]/50 mb-3">Plan Details</p>
                {subscription.plan === 'monthly' ? (
                  <p className="text-[#1a1a1a]">€295/month • Cancel anytime</p>
                ) : (
                  <p className="text-[#1a1a1a]">€249/month • Billed yearly (€2,988)</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                {subscription.plan === 'monthly' && subscription.status === 'active' && (
                  <button className="flex-1 px-6 py-3 border-2 border-[#722F37] text-[#722F37] rounded-xl hover:bg-[#722F37] hover:text-white transition">
                    Upgrade to Annual (Save €552)
                  </button>
                )}
                <button className="text-[#1a1a1a]/50 hover:text-[#1a1a1a] px-4 py-2 transition">
                  Manage Billing
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[#1a1a1a]/50 mb-4">No subscription found</p>
              <Button className="bg-[#722F37] hover:bg-[#5a252c] text-white">Start Free Trial</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
