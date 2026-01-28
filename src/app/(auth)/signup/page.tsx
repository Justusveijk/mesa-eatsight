'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/components/shared/GlassPanel'

interface PasswordStrength {
  score: number
  feedback: string[]
}

function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('At least 8 characters')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('One uppercase letter')
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('One lowercase letter')
  }

  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('One number')
  }

  return { score, feedback }
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'monthly'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordStrength = checkPasswordStrength(password)
  const isPasswordValid = passwordStrength.score >= 3

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed || !isPasswordValid) return

    setIsLoading(true)
    setError('')

    try {
      // In production, this would call Supabase auth
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Store plan in session storage for onboarding
      sessionStorage.setItem('selectedPlan', plan)
      sessionStorage.setItem('userEmail', email)

      // Redirect to venue creation
      router.push('/onboarding/venue')
    } catch {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    // In production, this would trigger OAuth flow
    sessionStorage.setItem('selectedPlan', plan)
    router.push('/onboarding/venue')
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
            Create your account
          </h1>
          <p className="text-text-muted text-sm">
            Starting with the {plan === 'annual' ? 'Annual' : 'Monthly'} plan
          </p>
        </div>

        {/* Google Sign Up */}
        <button
          onClick={handleGoogleSignUp}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-white text-gray-800 font-medium hover:bg-gray-50 transition-colors mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-line" />
          <span className="text-text-muted text-sm">or</span>
          <div className="flex-1 h-px bg-line" />
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
                placeholder="Create a password"
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

            {/* Password strength */}
            {password && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        passwordStrength.score >= level
                          ? level <= 2
                            ? 'bg-red-500'
                            : level === 3
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                          : 'bg-line'
                      }`}
                    />
                  ))}
                </div>
                <div className="space-y-1">
                  {passwordStrength.feedback.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-text-muted">
                      <X className="w-3 h-3 text-red-400" />
                      {item}
                    </div>
                  ))}
                  {password.length >= 8 && (
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <Check className="w-3 h-3" />
                      At least 8 characters
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-line bg-ocean-800 text-signal focus:ring-signal focus:ring-offset-0"
            />
            <span className="text-sm text-text-muted">
              I agree to the{' '}
              <a href="#" className="text-signal hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-signal hover:underline">Privacy Policy</a>
            </span>
          </label>

          <Button
            type="submit"
            variant="signal"
            size="lg"
            className="w-full"
            disabled={isLoading || !agreed || !isPasswordValid}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-signal hover:underline">
            Log in
          </Link>
        </p>
      </GlassPanel>
    </motion.div>
  )
}

function SignupFormFallback() {
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
            Create your account
          </h1>
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </GlassPanel>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignupFormFallback />}>
      <SignupForm />
    </Suspense>
  )
}
