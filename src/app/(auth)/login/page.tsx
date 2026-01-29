'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { signIn } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/client'

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

    const supabase = createClient()

    console.log('[Login] Attempting sign in for:', email)

    const { user, error: signInError } = await signIn({ email, password })

    if (signInError) {
      console.error('[Login] Sign in error:', signInError)
      setError(signInError)
      setIsLoading(false)
      return
    }

    if (!user) {
      console.error('[Login] No user returned after sign in')
      setError('Login failed')
      setIsLoading(false)
      return
    }

    console.log('[Login] User ID:', user.id)
    console.log('[Login] User email:', user.email)

    // First check operator_users table by auth_user_id
    const { data: operator, error: operatorError } = await supabase
      .from('operator_users')
      .select('id, venue_id, email, auth_user_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    console.log('[Login] Operator by auth_user_id:', operator, 'Error:', operatorError)

    if (operator?.venue_id) {
      // Found venue by auth_user_id - go to dashboard
      console.log('[Login] User has venue via auth_user_id, redirecting to dashboard')
      router.push(redirect || '/dashboard')
      return
    }

    // If no operator found by auth_user_id, check by email
    // This handles cases where operator was created before auth link was established
    const { data: operatorByEmail } = await supabase
      .from('operator_users')
      .select('id, venue_id, email, auth_user_id')
      .eq('email', user.email)
      .maybeSingle()

    console.log('[Login] Operator by email:', operatorByEmail)

    if (operatorByEmail?.venue_id) {
      // Found by email - update the auth_user_id link if missing
      if (!operatorByEmail.auth_user_id) {
        console.log('[Login] Linking auth_user_id to existing operator')
        await supabase
          .from('operator_users')
          .update({ auth_user_id: user.id })
          .eq('id', operatorByEmail.id)
      }
      console.log('[Login] User has venue via email lookup, redirecting to dashboard')
      router.push(redirect || '/dashboard')
      return
    }

    // No venue found - go to onboarding
    console.log('[Login] No venue found, going to onboarding')
    router.push('/onboarding/venue')
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
            Welcome back
          </h1>
          <p className="text-[#1a1a1a]/50 text-center mb-8">
            Sign in to your dashboard
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
                  placeholder="Enter your password"
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
            </div>

            <div className="text-right">
              <a href="#" className="text-sm text-[#722F37] hover:text-[#5a252c]">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#722F37] text-white rounded-xl hover:bg-[#5a252c] transition disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[#1a1a1a]/50 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup?plan=monthly" className="text-[#722F37] hover:text-[#5a252c]">
              Start free trial
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

function LoginFormFallback() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="font-serif text-3xl text-[#1a1a1a]">Eatsight</span>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#1a1a1a]/5">
          <h1 className="text-2xl font-medium text-[#1a1a1a] mb-2 text-center">
            Welcome back
          </h1>
          <p className="text-[#1a1a1a]/50 text-center">Loading...</p>
        </div>
      </div>
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
