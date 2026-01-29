'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-6">✅</div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-4">
            Password updated!
          </h1>
          <p className="text-[#1a1a1a]/60">
            Redirecting you to login...
          </p>
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
            Set new password
          </h1>
          <p className="text-[#1a1a1a]/50 text-center mb-8">
            Enter your new password below
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-[#1a1a1a]/60 mb-2">New password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
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

            <div>
              <label className="block text-sm text-[#1a1a1a]/60 mb-2">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#722F37] text-white rounded-xl hover:bg-[#5a252c] transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
