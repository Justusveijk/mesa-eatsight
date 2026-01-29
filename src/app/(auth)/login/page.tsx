'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Login failed')
      setLoading(false)
      return
    }

    // Check if user has a venue
    const { data: operator } = await supabase
      .from('operator_users')
      .select('venue_id')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()

    if (operator?.venue_id) {
      router.push('/dashboard')
    } else {
      router.push('/onboarding/venue')
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="font-serif text-3xl text-[#1e3a5f]">Eatsight</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#1a1a1a]/5">
          <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-2 text-center">
            Welcome back
          </h1>
          <p className="text-[#1a1a1a]/50 text-center mb-8">
            Sign in to your dashboard
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-[#1a1a1a]/60 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@restaurant.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-[#1a1a1a]/60">Password</label>
                <Link href="/forgot-password" className="text-sm text-[#722F37] hover:text-[#5a252c]">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition pr-12"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#722F37] text-white rounded-xl hover:bg-[#5a252c] transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[#1a1a1a]/50 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#722F37] hover:text-[#5a252c] font-medium">
              Start free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
