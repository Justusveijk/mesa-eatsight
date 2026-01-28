'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Upload, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/components/shared/GlassPanel'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/supabase/auth'

const countries = [
  { code: 'NL', name: 'Netherlands' },
  { code: 'DE', name: 'Germany' },
  { code: 'BE', name: 'Belgium' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'US', name: 'United States' },
]

const timezones = [
  'Europe/Amsterdam',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Paris',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Rome',
  'America/New_York',
  'America/Los_Angeles',
]

const currencies = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
]

const categories = [
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'bar', label: 'Bar' },
  { id: 'cafe', label: 'Café' },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CreateVenuePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [error, setError] = useState('')
  const [slugError, setSlugError] = useState('')
  const [checkingSlug, setCheckingSlug] = useState(false)

  // Required fields
  const [venueName, setVenueName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [country, setCountry] = useState('NL')
  const [city, setCity] = useState('')
  const [timezone, setTimezone] = useState('Europe/Amsterdam')
  const [currency, setCurrency] = useState('EUR')
  const [language, setLanguage] = useState<'en' | 'nl'>('en')
  const [category, setCategory] = useState<string>('restaurant')

  // Optional fields
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [vatNumber, setVatNumber] = useState('')

  // Auto-generate slug from venue name
  useEffect(() => {
    if (!slugEdited && venueName) {
      setSlug(slugify(venueName))
    }
  }, [venueName, slugEdited])

  // Validate slug uniqueness (debounced)
  useEffect(() => {
    if (!slug) {
      setSlugError('')
      return
    }

    const checkSlug = async () => {
      setCheckingSlug(true)
      const supabase = createClient()

      const { data } = await supabase
        .from('venues')
        .select('id')
        .eq('slug', slug)
        .single()

      if (data) {
        setSlugError('This URL is already taken')
      } else {
        setSlugError('')
      }
      setCheckingSlug(false)
    }

    const timer = setTimeout(checkSlug, 500)
    return () => clearTimeout(timer)
  }, [slug])

  const handleSlugChange = (value: string) => {
    setSlug(slugify(value))
    setSlugEdited(true)
  }

  const isValid = venueName.trim() && slug.trim() && city.trim() && category && !slugError

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const user = await getCurrentUser()

      if (!user) {
        setError('You must be logged in to create a venue')
        setIsLoading(false)
        return
      }

      // Get plan from session storage (set during signup)
      const plan = sessionStorage.getItem('selectedPlan') || 'monthly'

      // 1. Create the venue
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .insert({
          name: venueName,
          slug,
          country,
          city,
          timezone,
          currency,
          primary_language: language,
          category,
          phone: phone || null,
          website: website || null,
          vat_number: vatNumber || null,
        })
        .select('id')
        .single()

      if (venueError) {
        console.error('Venue creation error:', venueError?.message, venueError?.details, venueError?.hint, venueError?.code, venueError)
        if (venueError.code === '23505') {
          setError('This venue slug is already taken. Please choose a different one.')
        } else {
          setError(venueError.message || 'Failed to create venue')
        }
        setIsLoading(false)
        return
      }

      // 2. Create or update operator_users record linking auth user to venue
      const { data: existingOperator } = await supabase
        .from('operator_users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      let operatorError
      if (existingOperator) {
        // Update existing record with new venue
        const { error } = await supabase
          .from('operator_users')
          .update({ venue_id: venue.id })
          .eq('auth_user_id', user.id)
        operatorError = error
      } else {
        // Insert new record
        const { error } = await supabase
          .from('operator_users')
          .insert({
            auth_user_id: user.id,
            email: user.email,
            role: 'owner',
            venue_id: venue.id,
          })
        operatorError = error
      }

      if (operatorError) {
        console.error('Operator user creation error:', operatorError?.message, operatorError?.details, operatorError?.hint, operatorError?.code, operatorError)
        // Cleanup: delete the venue we just created
        await supabase.from('venues').delete().eq('id', venue.id)
        setError('Failed to link user to venue')
        setIsLoading(false)
        return
      }

      // 3. Create subscription record
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          venue_id: venue.id,
          status: 'trialing',
          plan,
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        })

      if (subscriptionError) {
        console.error('Subscription creation error:', subscriptionError?.message, subscriptionError?.details, subscriptionError?.hint, subscriptionError?.code, subscriptionError)
        // Non-critical, continue anyway
      }

      // 4. Create a draft menu for the venue
      const { error: menuError } = await supabase
        .from('menus')
        .insert({
          venue_id: venue.id,
          version: 1,
          status: 'draft',
        })

      if (menuError) {
        console.error('Menu creation error:', menuError?.message, menuError?.details, menuError?.hint, menuError?.code, menuError)
        // Non-critical, continue anyway
      }

      // Clear the plan from session storage
      sessionStorage.removeItem('selectedPlan')

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <GlassPanel className="p-8" withNoise>
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-signal flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-text-primary font-semibold">Eatsight</span>
            </Link>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Create your venue
            </h1>
            <p className="text-text-muted text-sm">
              Tell us about your restaurant, bar, or café
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Venue Name */}
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Venue name *
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Bella Taverna"
                required
                className="w-full px-4 py-3 rounded-lg bg-ocean-800 border border-line text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-signal transition-colors"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                URL slug *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-sm">eatsight.com/v/</span>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="bella-taverna"
                    required
                    className={`w-full px-4 py-3 rounded-lg bg-ocean-800 border text-text-primary placeholder-text-muted/50 focus:outline-none transition-colors ${
                      slugError ? 'border-red-500' : 'border-line focus:border-signal'
                    }`}
                  />
                  {checkingSlug && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                      Checking...
                    </span>
                  )}
                </div>
              </div>
              {slugError && (
                <p className="mt-1 text-xs text-red-400">{slugError}</p>
              )}
            </div>

            {/* Country & City */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Country *
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-ocean-800 border border-line text-text-primary focus:outline-none focus:border-signal transition-colors"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Amsterdam"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-ocean-800 border border-line text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-signal transition-colors"
                />
              </div>
            </div>

            {/* Timezone & Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-ocean-800 border border-line text-text-primary focus:outline-none focus:border-signal transition-colors"
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-ocean-800 border border-line text-text-primary focus:outline-none focus:border-signal transition-colors"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Primary language
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                    language === 'en'
                      ? 'bg-signal/20 border-signal text-text-primary'
                      : 'bg-ocean-800 border-line text-text-muted hover:border-text-muted'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('nl')}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                    language === 'nl'
                      ? 'bg-signal/20 border-signal text-text-primary'
                      : 'bg-ocean-800 border-line text-text-muted hover:border-text-muted'
                  }`}
                >
                  Nederlands
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Category *
              </label>
              <div className="flex gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                      category === cat.id
                        ? 'bg-signal/20 border-signal text-text-primary'
                        : 'bg-ocean-800 border-line text-text-muted hover:border-text-muted'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* More Details Toggle */}
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              {showMoreDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Add more details (optional)
            </button>

            {/* Optional Fields */}
            {showMoreDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+31 20 123 4567"
                      className="w-full px-4 py-3 rounded-lg bg-ocean-800 border border-line text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-signal transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-3 rounded-lg bg-ocean-800 border border-line text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-signal transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    VAT number
                  </label>
                  <input
                    type="text"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="NL123456789B01"
                    className="w-full px-4 py-3 rounded-lg bg-ocean-800 border border-line text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-signal transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Logo
                  </label>
                  <div className="border-2 border-dashed border-line rounded-lg p-6 text-center hover:border-text-muted transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 text-text-muted mx-auto mb-2" />
                    <p className="text-sm text-text-muted">Click to upload or drag & drop</p>
                    <p className="text-xs text-text-muted/60 mt-1">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </motion.div>
            )}

            <Button
              type="submit"
              variant="signal"
              size="lg"
              className="w-full"
              disabled={isLoading || !isValid || checkingSlug}
            >
              {isLoading ? 'Creating venue...' : 'Create venue & continue'}
            </Button>
          </form>
        </GlassPanel>
      </motion.div>
    </div>
  )
}
