'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, MapPin, Store, User, Loader2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PlacesAutocomplete } from '@/components/PlacesAutocomplete'

type Step = 'account' | 'restaurant' | 'location' | 'confirm'

interface SignupData {
  // Account
  email: string
  password: string
  fullName: string
  // Restaurant
  restaurantName: string
  restaurantType: string
  cuisineType: string
  // Location
  address: string
  city: string
  postalCode: string
  country: string
  placeId: string | null
  coordinates: { lat: number; lng: number } | null
}

interface Place {
  placeId: string
  name: string
  address: string
  city: string
  postalCode: string
  country: string
  coordinates: { lat: number; lng: number }
}

const RESTAURANT_TYPES = [
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'cafe', label: 'Cafe', icon: '☕' },
  { value: 'bar', label: 'Bar', icon: '🍸' },
  { value: 'bistro', label: 'Bistro', icon: '🥂' },
  { value: 'brasserie', label: 'Brasserie', icon: '🍺' },
  { value: 'food_truck', label: 'Food Truck', icon: '🚚' },
  { value: 'hotel_restaurant', label: 'Hotel Restaurant', icon: '🏨' },
  { value: 'other', label: 'Other', icon: '🏪' },
]

const CUISINE_TYPES = [
  'Dutch', 'French', 'Italian', 'Mediterranean', 'Asian', 'Japanese',
  'Chinese', 'Indian', 'Mexican', 'American', 'Middle Eastern',
  'Fusion', 'Vegetarian/Vegan', 'Seafood', 'Steakhouse', 'International', 'Other'
]

export default function SignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('account')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [data, setData] = useState<SignupData>({
    email: '',
    password: '',
    fullName: '',
    restaurantName: '',
    restaurantType: '',
    cuisineType: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Netherlands',
    placeId: null,
    coordinates: null,
  })

  const steps: Step[] = ['account', 'restaurant', 'location', 'confirm']
  const currentIndex = steps.indexOf(currentStep)

  const updateData = (updates: Partial<SignupData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    const nextIndex = currentIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex])
    }
  }

  const prevStep = () => {
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex])
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Failed to create user')
      }

      // 2. Create venue with slug
      const slug = data.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        + '-' + Math.random().toString(36).substring(2, 6)

      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .insert({
          name: data.restaurantName,
          slug,
          category: data.restaurantType,
          cuisine_type: data.cuisineType || null,
          address: data.address || null,
          city: data.city || null,
          postal_code: data.postalCode || null,
          country: data.country,
          google_place_id: data.placeId,
          timezone: 'Europe/Amsterdam',
          currency: 'EUR',
          primary_language: 'en',
        })
        .select('id')
        .single()

      if (venueError) {
        console.error('Venue creation error:', venueError)
        throw new Error('Failed to create venue: ' + venueError.message)
      }

      // 3. Create operator_users link
      const { error: operatorError } = await supabase
        .from('operator_users')
        .insert({
          auth_user_id: authData.user.id,
          email: authData.user.email,
          role: 'owner',
          venue_id: venue.id,
        })

      if (operatorError) {
        console.error('Operator link error:', operatorError)
        // Cleanup venue
        await supabase.from('venues').delete().eq('id', venue.id)
        throw new Error('Failed to link account')
      }

      // 4. Create default menu for venue
      await supabase
        .from('menus')
        .insert({
          venue_id: venue.id,
          version: 1,
          status: 'draft',
        })

      // 5. Track signup event
      await supabase
        .from('events')
        .insert({
          venue_id: venue.id,
          name: 'user_signed_up',
          props: {
            venue_type: data.restaurantType,
            city: data.city,
            country: data.country,
            has_place_id: !!data.placeId,
          },
          ts: new Date().toISOString(),
        })

      // Redirect to dashboard
      router.push('/dashboard?welcome=true')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1a1a] p-12 flex-col justify-between">
        <div>
          <Link href="/" className="text-2xl font-serif text-white">
            Eatsight
          </Link>
        </div>

        <div>
          <h1 className="text-4xl font-serif text-white mb-6">
            Join 50+ restaurants already delighting their guests
          </h1>
          <div className="space-y-4">
            {[
              'Set up in under 10 minutes',
              'No hardware or app downloads required',
              '14-day free trial, no credit card needed',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/70">
                <div className="w-5 h-5 rounded-full bg-[#722F37] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {['MV', 'TB', 'SG'].map((initials, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-[#722F37] flex items-center justify-center text-sm text-white font-medium border-2 border-[#1a1a1a]">
                {initials}
              </div>
            ))}
          </div>
          <p className="text-white/50 text-sm">
            Trusted by restaurant owners across the Netherlands
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden p-4 border-b border-[#1a1a1a]/5">
          <Link href="/" className="text-xl font-serif text-[#1a1a1a]">
            Eatsight
          </Link>
        </div>

        {/* Progress bar */}
        <div className="p-6 border-b border-[#1a1a1a]/5">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, i) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    i < currentIndex
                      ? 'bg-[#722F37] text-white'
                      : i === currentIndex
                        ? 'bg-[#722F37] text-white'
                        : 'bg-[#1a1a1a]/10 text-[#1a1a1a]/40'
                  }`}>
                    {i < currentIndex ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-12 sm:w-20 h-1 mx-1 sm:mx-2 rounded transition-colors ${
                      i < currentIndex ? 'bg-[#722F37]' : 'bg-[#1a1a1a]/10'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-[#1a1a1a]/50">
              <span>Account</span>
              <span>Restaurant</span>
              <span>Location</span>
              <span>Confirm</span>
            </div>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {currentStep === 'account' && (
                <AccountStep
                  key="account"
                  data={data}
                  updateData={updateData}
                  onNext={nextStep}
                  error={error}
                />
              )}
              {currentStep === 'restaurant' && (
                <RestaurantStep
                  key="restaurant"
                  data={data}
                  updateData={updateData}
                  onNext={nextStep}
                  onBack={prevStep}
                />
              )}
              {currentStep === 'location' && (
                <LocationStep
                  key="location"
                  data={data}
                  updateData={updateData}
                  onNext={nextStep}
                  onBack={prevStep}
                />
              )}
              {currentStep === 'confirm' && (
                <ConfirmStep
                  key="confirm"
                  data={data}
                  onBack={prevStep}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  error={error}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#1a1a1a]/5 text-center">
          <p className="text-sm text-[#1a1a1a]/50">
            Already have an account?{' '}
            <Link href="/login" className="text-[#722F37] font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// Step Components

interface StepProps {
  data: SignupData
  updateData: (updates: Partial<SignupData>) => void
  onNext: () => void
  onBack?: () => void
  error?: string | null
}

function AccountStep({ data, updateData, onNext, error }: StepProps) {
  const [localError, setLocalError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const validateAndNext = () => {
    if (!data.fullName.trim()) {
      setLocalError('Please enter your name')
      return
    }
    if (!data.email.trim() || !data.email.includes('@')) {
      setLocalError('Please enter a valid email')
      return
    }
    if (data.password.length < 8) {
      setLocalError('Password must be at least 8 characters')
      return
    }
    setLocalError(null)
    onNext()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#722F37]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-[#722F37]" />
        </div>
        <h2 className="text-2xl font-serif text-[#1a1a1a] mb-2">
          Create your account
        </h2>
        <p className="text-[#1a1a1a]/60">
          Let&apos;s start with your personal details
        </p>
      </div>

      {(localError || error) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {localError || error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
            Full name
          </label>
          <input
            type="text"
            value={data.fullName}
            onChange={(e) => updateData({ fullName: e.target.value })}
            placeholder="Jan de Vries"
            className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 focus:border-[#722F37] focus:ring-1 focus:ring-[#722F37] outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
            Email address
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => updateData({ email: e.target.value })}
            placeholder="jan@restaurant.nl"
            autoComplete="email"
            className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 focus:border-[#722F37] focus:ring-1 focus:ring-[#722F37] outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={data.password}
              onChange={(e) => updateData({ password: e.target.value })}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 focus:border-[#722F37] focus:ring-1 focus:ring-[#722F37] outline-none transition pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1a1a1a]/40 hover:text-[#1a1a1a]/60"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={validateAndNext}
        className="w-full mt-8 px-6 py-4 bg-[#722F37] text-white rounded-xl font-medium hover:bg-[#5a252c] transition flex items-center justify-center gap-2"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </button>

      <p className="mt-6 text-xs text-center text-[#1a1a1a]/40">
        By continuing, you agree to our{' '}
        <Link href="/terms" className="underline">Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy" className="underline">Privacy Policy</Link>
      </p>
    </motion.div>
  )
}

function RestaurantStep({ data, updateData, onNext, onBack }: StepProps) {
  const [localError, setLocalError] = useState<string | null>(null)

  const validateAndNext = () => {
    if (!data.restaurantName.trim()) {
      setLocalError('Please enter your restaurant name')
      return
    }
    if (!data.restaurantType) {
      setLocalError('Please select a venue type')
      return
    }
    setLocalError(null)
    onNext()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#722F37]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-[#722F37]" />
        </div>
        <h2 className="text-2xl font-serif text-[#1a1a1a] mb-2">
          Tell us about your restaurant
        </h2>
        <p className="text-[#1a1a1a]/60">
          This helps us personalize your experience
        </p>
      </div>

      {localError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {localError}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
            Restaurant name
          </label>
          <input
            type="text"
            value={data.restaurantName}
            onChange={(e) => updateData({ restaurantName: e.target.value })}
            placeholder="De Gouden Lepel"
            className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 focus:border-[#722F37] focus:ring-1 focus:ring-[#722F37] outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-3">
            Venue type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {RESTAURANT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => updateData({ restaurantType: type.value })}
                className={`p-4 rounded-xl border-2 text-left transition ${
                  data.restaurantType === type.value
                    ? 'border-[#722F37] bg-[#722F37]/5'
                    : 'border-[#1a1a1a]/10 hover:border-[#1a1a1a]/20'
                }`}
              >
                <span className="text-2xl mb-2 block">{type.icon}</span>
                <span className="text-sm font-medium text-[#1a1a1a]">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
            Cuisine type <span className="text-[#1a1a1a]/40">(optional)</span>
          </label>
          <select
            value={data.cuisineType}
            onChange={(e) => updateData({ cuisineType: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 focus:border-[#722F37] focus:ring-1 focus:ring-[#722F37] outline-none transition bg-white"
          >
            <option value="">Select cuisine type</option>
            {CUISINE_TYPES.map((cuisine) => (
              <option key={cuisine} value={cuisine}>{cuisine}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-4 border border-[#1a1a1a]/20 rounded-xl font-medium hover:border-[#1a1a1a]/40 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={validateAndNext}
          className="flex-1 px-6 py-4 bg-[#722F37] text-white rounded-xl font-medium hover:bg-[#5a252c] transition flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

function LocationStep({ data, updateData, onNext, onBack }: StepProps) {
  const [localError, setLocalError] = useState<string | null>(null)
  const [searchValue, setSearchValue] = useState(data.address || '')
  const [manualEntry, setManualEntry] = useState(false)

  const handlePlaceSelect = (place: Place) => {
    updateData({
      address: place.address,
      city: place.city,
      postalCode: place.postalCode,
      country: place.country,
      placeId: place.placeId,
      coordinates: place.coordinates,
    })
    setSearchValue(place.address)
  }

  const validateAndNext = () => {
    // Location is optional, so we can proceed without it
    setLocalError(null)
    onNext()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#722F37]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-[#722F37]" />
        </div>
        <h2 className="text-2xl font-serif text-[#1a1a1a] mb-2">
          Where is {data.restaurantName || 'your restaurant'}?
        </h2>
        <p className="text-[#1a1a1a]/60">
          Search for your address or enter it manually
        </p>
      </div>

      {localError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {localError}
        </div>
      )}

      <div className="space-y-6">
        {!manualEntry ? (
          <>
            <PlacesAutocomplete
              value={searchValue}
              onChange={setSearchValue}
              onPlaceSelect={handlePlaceSelect}
              placeholder={`Search for "${data.restaurantName || 'your restaurant'}"...`}
              restaurantName={data.restaurantName}
            />

            {data.address && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Location found</p>
                    <p className="text-sm text-green-600 mt-1">{data.address}</p>
                    {data.city && (
                      <p className="text-sm text-green-600">{data.postalCode} {data.city}, {data.country}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setManualEntry(true)}
              className="text-sm text-[#722F37] hover:underline"
            >
              Can&apos;t find your address? Enter manually
            </button>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Street address
              </label>
              <input
                type="text"
                value={data.address}
                onChange={(e) => updateData({ address: e.target.value })}
                placeholder="Kalverstraat 123"
                className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 focus:border-[#722F37] focus:ring-1 focus:ring-[#722F37] outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  Postal code
                </label>
                <input
                  type="text"
                  value={data.postalCode}
                  onChange={(e) => updateData({ postalCode: e.target.value })}
                  placeholder="1012 AA"
                  className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 focus:border-[#722F37] focus:ring-1 focus:ring-[#722F37] outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={data.city}
                  onChange={(e) => updateData({ city: e.target.value })}
                  placeholder="Amsterdam"
                  className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 focus:border-[#722F37] focus:ring-1 focus:ring-[#722F37] outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Country
              </label>
              <select
                value={data.country}
                onChange={(e) => updateData({ country: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 focus:border-[#722F37] focus:ring-1 focus:ring-[#722F37] outline-none transition bg-white"
              >
                <option value="Netherlands">Netherlands</option>
                <option value="Belgium">Belgium</option>
                <option value="Germany">Germany</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setManualEntry(false)}
              className="text-sm text-[#722F37] hover:underline"
            >
              Back to search
            </button>
          </>
        )}

        <p className="text-xs text-[#1a1a1a]/40 text-center">
          Location is optional. You can add it later in settings.
        </p>
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-4 border border-[#1a1a1a]/20 rounded-xl font-medium hover:border-[#1a1a1a]/40 transition flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={validateAndNext}
          className="flex-1 px-6 py-4 bg-[#722F37] text-white rounded-xl font-medium hover:bg-[#5a252c] transition flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}

interface ConfirmStepProps {
  data: SignupData
  onBack: () => void
  onSubmit: () => void
  isLoading: boolean
  error: string | null
}

function ConfirmStep({ data, onBack, onSubmit, isLoading, error }: ConfirmStepProps) {
  const restaurantTypeLabel = RESTAURANT_TYPES.find(t => t.value === data.restaurantType)?.label || data.restaurantType

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-serif text-[#1a1a1a] mb-2">
          Ready to launch!
        </h2>
        <p className="text-[#1a1a1a]/60">
          Please confirm your details
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Account summary */}
        <div className="p-4 bg-[#F5F3EF] rounded-xl border border-[#1a1a1a]/5">
          <div className="flex items-center gap-3 mb-3">
            <User className="w-5 h-5 text-[#722F37]" />
            <span className="font-medium text-[#1a1a1a]">Account</span>
          </div>
          <p className="text-sm text-[#1a1a1a]/70">{data.fullName}</p>
          <p className="text-sm text-[#1a1a1a]/70">{data.email}</p>
        </div>

        {/* Restaurant summary */}
        <div className="p-4 bg-[#F5F3EF] rounded-xl border border-[#1a1a1a]/5">
          <div className="flex items-center gap-3 mb-3">
            <Store className="w-5 h-5 text-[#722F37]" />
            <span className="font-medium text-[#1a1a1a]">Restaurant</span>
          </div>
          <p className="text-sm text-[#1a1a1a]/70 font-medium">{data.restaurantName}</p>
          <p className="text-sm text-[#1a1a1a]/50">{restaurantTypeLabel}{data.cuisineType ? ` • ${data.cuisineType}` : ''}</p>
        </div>

        {/* Location summary */}
        <div className="p-4 bg-[#F5F3EF] rounded-xl border border-[#1a1a1a]/5">
          <div className="flex items-center gap-3 mb-3">
            <MapPin className="w-5 h-5 text-[#722F37]" />
            <span className="font-medium text-[#1a1a1a]">Location</span>
          </div>
          {data.address || data.city ? (
            <>
              <p className="text-sm text-[#1a1a1a]/70">{data.address || 'Not specified'}</p>
              {data.city && (
                <p className="text-sm text-[#1a1a1a]/50">{data.postalCode} {data.city}, {data.country}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-[#1a1a1a]/50 italic">Not specified (can add later)</p>
          )}
        </div>

        {/* Trial info */}
        <div className="p-4 bg-[#722F37]/5 rounded-xl border border-[#722F37]/20">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🎉</div>
            <div>
              <p className="font-medium text-[#722F37]">14-day free trial</p>
              <p className="text-sm text-[#722F37]/70 mt-1">
                No credit card required. Full access to all features.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="px-6 py-4 border border-[#1a1a1a]/20 rounded-xl font-medium hover:border-[#1a1a1a]/40 transition flex items-center gap-2 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="flex-1 px-6 py-4 bg-[#722F37] text-white rounded-xl font-medium hover:bg-[#5a252c] transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}
