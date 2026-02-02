'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#722F37]/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-[#722F37]" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-4">
            Check your email
          </h1>
          <p className="text-[#1a1a1a]/60 mb-8">
            We&apos;ve sent a password reset link to <strong>{email}</strong>
          </p>
          <Link href="/login" className="text-[#722F37] hover:text-[#5a252c] font-medium">
            &larr; Back to login
          </Link>
        </div>
      </div>
    )
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
            Reset your password
          </h1>
          <p className="text-[#1a1a1a]/50 text-center mb-8">
            Enter your email and we&apos;ll send you a reset link
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#722F37] text-white rounded-xl hover:bg-[#5a252c] transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <p className="text-center text-[#1a1a1a]/50 mt-6">
            <Link href="/login" className="text-[#722F37] hover:text-[#5a252c]">
              &larr; Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
