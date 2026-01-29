'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function OnboardingVenuePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)

  // Form state
  const [venueName, setVenueName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [country, setCountry] = useState('NL')
  const [city, setCity] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [language, setLanguage] = useState<'en' | 'nl'>('en')
  const [category, setCategory] = useState<'restaurant' | 'bar' | 'cafe'>('restaurant')

  // Check if user is logged in on mount
  useEffect(() => {
    const checkUser = async () => {
      console.log('[Onboarding] Checking for authenticated user...')
      const supabase = createClient()

      const { data: { user }, error } = await supabase.auth.getUser()

      console.log('[Onboarding] Auth check result:', { userId: user?.id, email: user?.email, error })

      if (error || !user) {
        console.log('[Onboarding] No authenticated user, redirecting to signup')
        router.push('/signup')
        return
      }

      setUser(user)

      // Check if user already has a venue
      const { data: existingOperator, error: opError } = await supabase
        .from('operator_users')
        .select('venue_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      console.log('[Onboarding] Existing operator check:', { existingOperator, error: opError })

      if (existingOperator?.venue_id) {
        console.log('[Onboarding] User already has venue, redirecting to dashboard')
        router.push('/dashboard')
        return
      }

      setCheckingAuth(false)
    }

    checkUser()
  }, [router])

  // Auto-generate slug from venue name
  useEffect(() => {
    if (!slugEdited && venueName) {
      setSlug(slugify(venueName))
    }
  }, [venueName, slugEdited])

  const handleSlugChange = (value: string) => {
    setSlug(slugify(value))
    setSlugEdited(true)
  }

  const isValid = venueName.trim() && slug.trim() && city.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || !user) return

    setLoading(true)
    setError('')

    console.log('[Onboarding] Starting venue creation for user:', user.id)
    console.log('[Onboarding] Venue data:', { venueName, slug, country, city, currency, language, category })

    const supabase = createClient()

    try {
      // 1. Create the venue
      console.log('[Onboarding] Step 1: Creating venue...')
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .insert({
          name: venueName,
          slug: slug,
          country: country,
          city: city,
          timezone: 'Europe/Amsterdam',
          currency: currency,
          primary_language: language,
          category: category,
        })
        .select('id')
        .single()

      if (venueError) {
        console.error('[Onboarding] Venue creation FAILED:', venueError)
        if (venueError.code === '23505') {
          setError('This URL slug is already taken. Please choose a different name.')
        } else {
          setError(`Failed to create venue: ${venueError.message}`)
        }
        setLoading(false)
        return
      }

      console.log('[Onboarding] Venue created successfully:', venue)

      // 2. Create operator_users link
      console.log('[Onboarding] Step 2: Creating operator link...')
      const { error: operatorError } = await supabase
        .from('operator_users')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          role: 'owner',
          venue_id: venue.id,
        })

      if (operatorError) {
        console.error('[Onboarding] Operator creation FAILED:', operatorError)
        // Cleanup: delete the venue we just created
        console.log('[Onboarding] Cleaning up venue...')
        await supabase.from('venues').delete().eq('id', venue.id)
        setError(`Failed to link account: ${operatorError.message}`)
        setLoading(false)
        return
      }

      console.log('[Onboarding] Operator link created successfully')

      // 3. Create a draft menu for the venue
      console.log('[Onboarding] Step 3: Creating draft menu...')
      const { error: menuError } = await supabase
        .from('menus')
        .insert({
          venue_id: venue.id,
          version: 1,
          status: 'draft',
        })

      if (menuError) {
        console.error('[Onboarding] Menu creation failed (non-critical):', menuError)
        // Non-critical, continue anyway
      } else {
        console.log('[Onboarding] Draft menu created successfully')
      }

      // 4. Try to create venue settings (optional)
      console.log('[Onboarding] Step 4: Creating venue settings...')
      const { error: settingsError } = await supabase
        .from('venue_settings')
        .insert({
          venue_id: venue.id,
          upsell_enabled: false,
          upsell_mode: 'auto',
        })

      if (settingsError) {
        console.error('[Onboarding] Settings creation failed (non-critical):', settingsError)
        // Non-critical, continue anyway
      } else {
        console.log('[Onboarding] Venue settings created successfully')
      }

      console.log('[Onboarding] SUCCESS! All steps completed. Redirecting to dashboard...')

      // Redirect to dashboard
      router.push('/dashboard')

    } catch (err) {
      console.error('[Onboarding] Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Loading state while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#722F37] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#1a1a1a]/50">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-6">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-serif text-3xl text-[#1e3a5f]">Eatsight</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#1a1a1a]/5">
          <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-2 text-center">
            Create your venue
          </h1>
          <p className="text-[#1a1a1a]/50 text-center mb-8">
            Tell us about your restaurant, bar, or café
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Venue Name */}
            <div>
              <label className="block text-sm text-[#1a1a1a]/60 mb-2">
                Venue name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Bella Taverna"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition"
              />
            </div>

            {/* URL Slug */}
            <div>
              <label className="block text-sm text-[#1a1a1a]/60 mb-2">
                URL slug <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="text-[#1a1a1a]/40 text-sm mr-2">eatsight.ai/v/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="bella-taverna"
                  required
                  className="flex-1 px-4 py-3 rounded-xl border border-[#1a1a1a]/10 bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition"
                />
              </div>
            </div>

            {/* Country & City */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#1a1a1a]/60 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#1a1a1a]/60 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Amsterdam"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition"
                />
              </div>
            </div>

            {/* Currency & Language */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#1a1a1a]/60 mb-2">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition"
                >
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                  <option value="USD">$ USD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#1a1a1a]/60 mb-2">Language</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`flex-1 py-3 rounded-xl border-2 transition text-sm ${
                      language === 'en'
                        ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]'
                        : 'border-[#1a1a1a]/10 text-[#1a1a1a]/60'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('nl')}
                    className={`flex-1 py-3 rounded-xl border-2 transition text-sm ${
                      language === 'nl'
                        ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]'
                        : 'border-[#1a1a1a]/10 text-[#1a1a1a]/60'
                    }`}
                  >
                    NL
                  </button>
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm text-[#1a1a1a]/60 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['restaurant', 'bar', 'cafe'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-3 rounded-xl border-2 transition capitalize text-sm ${
                      category === cat
                        ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]'
                        : 'border-[#1a1a1a]/10 text-[#1a1a1a]/60 hover:border-[#1a1a1a]/20'
                    }`}
                  >
                    {cat === 'cafe' ? 'Café' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full py-3 bg-[#722F37] text-white rounded-xl hover:bg-[#5a252c] transition disabled:opacity-50 font-medium mt-2"
            >
              {loading ? 'Creating venue...' : 'Create venue & continue'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#1a1a1a]/40 text-sm mt-6">
          Logged in as {user?.email}
        </p>
      </div>
    </div>
  )
}
