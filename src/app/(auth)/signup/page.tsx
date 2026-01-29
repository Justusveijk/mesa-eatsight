'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { signUp } from '@/lib/supabase/auth'

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

    const { user, error: signUpError } = await signUp({
      email,
      password,
      plan,
    })

    if (signUpError) {
      setError(signUpError)
      setIsLoading(false)
      return
    }

    if (user) {
      // Store plan in session storage for venue creation
      sessionStorage.setItem('selectedPlan', plan)
      router.push('/onboarding/venue')
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-serif text-3xl text-[#1a1a1a]">Eatsight</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#1a1a1a]/5">
          <h1 className="text-2xl font-medium text-[#1a1a1a] mb-2 text-center">
            Create your account
          </h1>
          <p className="text-[#1a1a1a]/50 text-center mb-8">
            Starting with the {plan === 'annual' ? 'Annual' : 'Monthly'} plan
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-[#1a1a1a]/60 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@restaurant.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 bg-[#FDFBF7] text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 focus:outline-none focus:border-[#722F37] transition"
              />
            </div>

            <div>
              <label className="block text-sm text-[#1a1a1a]/60 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#1a1a1a]/10 bg-[#FDFBF7] text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 focus:outline-none focus:border-[#722F37] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1a1a1a]/40 hover:text-[#1a1a1a]"
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
                              ? 'bg-red-400'
                              : level === 3
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                            : 'bg-[#1a1a1a]/10'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="space-y-1">
                    {passwordStrength.feedback.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-[#1a1a1a]/50">
                        <X className="w-3 h-3 text-red-400" />
                        {item}
                      </div>
                    ))}
                    {password.length >= 8 && (
                      <div className="flex items-center gap-2 text-xs text-green-600">
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
                className="mt-1 w-4 h-4 rounded border-[#1a1a1a]/20 bg-white text-[#722F37] focus:ring-[#722F37] focus:ring-offset-0"
              />
              <span className="text-sm text-[#1a1a1a]/60">
                I agree to the{' '}
                <a href="#" className="text-[#722F37] hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-[#722F37] hover:underline">Privacy Policy</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading || !agreed || !isPasswordValid}
              className="w-full py-3 bg-[#722F37] text-white rounded-xl hover:bg-[#5a252c] transition disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-[#1a1a1a]/50 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#722F37] hover:text-[#5a252c]">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

function SignupFormFallback() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="font-serif text-3xl text-[#1a1a1a]">Eatsight</span>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#1a1a1a]/5">
          <h1 className="text-2xl font-medium text-[#1a1a1a] mb-2 text-center">
            Create your account
          </h1>
          <p className="text-[#1a1a1a]/50 text-center">Loading...</p>
        </div>
      </div>
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
