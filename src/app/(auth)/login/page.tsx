'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/components/shared/GlassPanel'
import { signIn, getUserVenue } from '@/lib/supabase/auth'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const { user, error: signInError } = await signIn({ email, password })

    if (signInError) {
      setError(signInError)
      setIsLoading(false)
      return
    }

    if (user) {
      // Check if user has a venue
      const operatorUser = await getUserVenue(user.id)

      if (operatorUser?.venue_id) {
        // User has a venue, redirect to dashboard or original destination
        router.push(redirect || '/dashboard')
      } else {
        // User doesn't have a venue, redirect to onboarding
        router.push('/onboarding/venue')
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
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
            Welcome back
          </h1>
          <p className="text-text-muted text-sm">
            Sign in to your dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@restaurant.com"
              required
              className="w-full px-4 py-3 rounded-lg bg-ocean-800 border border-line text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-signal transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 pr-12 rounded-lg bg-ocean-800 border border-line text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-signal transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <a href="#" className="text-sm text-signal hover:underline">
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            variant="signal"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup?plan=monthly" className="text-signal hover:underline">
            Start free trial
          </Link>
        </p>
      </GlassPanel>
    </motion.div>
  )
}

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md">
      <GlassPanel className="p-8" withNoise>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-signal flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-text-primary font-semibold">Eatsight</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Welcome back
          </h1>
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </GlassPanel>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  )
}
