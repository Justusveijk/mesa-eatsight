'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Check, Lock } from 'lucide-react'

interface SubscriptionGateProps {
  children: React.ReactNode
  venueId: string | null
}

export function SubscriptionGate({ children, venueId }: SubscriptionGateProps) {
  const [status, setStatus] = useState<'loading' | 'active' | 'trial' | 'expired' | 'none'>('loading')
  const [daysRemaining, setDaysRemaining] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const checkSubscription = async () => {
      if (!venueId) {
        setStatus('none')
        return
      }

      // First check subscriptions table
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('venue_id', venueId)
        .single()

      if (sub && ['active', 'trialing'].includes(sub.status)) {
        setStatus(sub.status === 'trialing' ? 'trial' : 'active')

        const endDate = sub.status === 'trialing'
          ? new Date(sub.trial_ends_at)
          : new Date(sub.current_period_end)
        const days = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        setDaysRemaining(days)
        return
      }

      // Check if within 14-day trial from venue creation
      const { data: venue } = await supabase
        .from('venues')
        .select('created_at')
        .eq('id', venueId)
        .single()

      if (venue) {
        const created = new Date(venue.created_at)
        const trialEnd = new Date(created)
        trialEnd.setDate(trialEnd.getDate() + 14)
        const days = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

        if (days > 0) {
          setStatus('trial')
          setDaysRemaining(days)
          return
        }
      }

      setStatus('expired')
    }

    checkSubscription()
  }, [venueId, supabase])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#722F37] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (status === 'expired' || status === 'none') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#722F37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-[#722F37]" size={32} />
          </div>

          <h1 className="text-2xl font-serif text-[#1a1a1a] mb-2">
            {status === 'expired' ? 'Your trial has ended' : 'Subscription required'}
          </h1>
          <p className="text-[#1a1a1a]/60 mb-8">
            {status === 'expired'
              ? 'Upgrade to continue using Eatsight and keep delighting your guests.'
              : 'Start your 14-day free trial to access your dashboard.'
            }
          </p>

          {/* Pricing options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-[#1a1a1a]/10 p-4 text-left">
              <div className="text-lg font-semibold text-[#1a1a1a]">Monthly</div>
              <div className="text-2xl font-serif text-[#1a1a1a] mt-1">€29<span className="text-sm text-[#1a1a1a]/50">/mo</span></div>
              <ul className="mt-3 space-y-1 text-sm text-[#1a1a1a]/60">
                <li className="flex items-center gap-2"><Check size={14} className="text-green-600" /> 14-day free trial</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-green-600" /> Cancel anytime</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border-2 border-[#722F37] p-4 text-left relative">
              <div className="absolute -top-2 right-4 bg-[#722F37] text-white text-xs px-2 py-0.5 rounded-full">
                Save 17%
              </div>
              <div className="text-lg font-semibold text-[#1a1a1a]">Annual</div>
              <div className="text-2xl font-serif text-[#1a1a1a] mt-1">€24<span className="text-sm text-[#1a1a1a]/50">/mo</span></div>
              <ul className="mt-3 space-y-1 text-sm text-[#1a1a1a]/60">
                <li className="flex items-center gap-2"><Check size={14} className="text-green-600" /> €288 billed yearly</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-green-600" /> 2 months free</li>
              </ul>
            </div>
          </div>

          <Link
            href="/dashboard/billing"
            className="block w-full py-3 bg-[#722F37] text-white rounded-xl hover:bg-[#5a252c] transition font-medium"
          >
            Start Free Trial
          </Link>

          <p className="mt-4 text-sm text-[#1a1a1a]/40">
            No credit card required for trial
          </p>
        </div>
      </div>
    )
  }

  // Active or trial - show content with optional trial banner
  return (
    <>
      {status === 'trial' && daysRemaining <= 7 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <p className="text-amber-800 text-sm">
              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in your trial
            </p>
            <Link
              href="/dashboard/billing"
              className="text-sm bg-amber-600 text-white px-3 py-1 rounded-lg hover:bg-amber-700"
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}
      {children}
    </>
  )
}
