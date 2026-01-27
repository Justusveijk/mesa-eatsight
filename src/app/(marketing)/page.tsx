'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Zap, BarChart3, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/components/shared/GlassPanel'

const features = [
  {
    icon: Zap,
    title: 'Smart recommendations that increase high-margin sales',
  },
  {
    icon: BarChart3,
    title: 'Real-time insights on guest preferences',
  },
  {
    icon: Clock,
    title: '15-minute setup, no POS integration needed',
  },
]

const monthlyFeatures = [
  'Unlimited scans',
  'Real-time analytics',
  'Menu optimization tools',
  'Cancel anytime',
]

const annualFeatures = [
  'Everything in Monthly',
  '1 month free',
  'Priority support',
  'Early adopter pricing (locked in)',
]

export default function EatsightLandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-signal flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-text-primary font-semibold text-lg">Eatsight</span>
          </div>
          <Link href="/login">
            <Button variant="signal-outline" size="sm">
              Log in
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6"
          >
            Know what your guests want
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-text-muted max-w-2xl mx-auto"
          >
            Menu intelligence that drives revenue. Set up in 15 minutes.
          </motion.p>
        </div>

        {/* Pricing Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <GlassPanel className="p-8 md:p-12" withNoise>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Monthly Plan */}
              <div className="p-6 rounded-2xl bg-ocean-800/50 border border-line">
                <h3 className="text-lg font-semibold text-text-primary mb-2">Monthly</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-text-primary">€295</span>
                  <span className="text-text-muted">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {monthlyFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-text-muted">
                      <Check className="w-5 h-5 text-signal flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup?plan=monthly" className="block">
                  <Button variant="signal-outline" size="lg" className="w-full">
                    Start free trial
                  </Button>
                </Link>
              </div>

              {/* Annual Plan */}
              <div className="p-6 rounded-2xl bg-ocean-700/50 border-2 border-signal/30 relative">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-signal rounded-full text-white text-xs font-medium">
                  Best value
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Annual</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-bold text-text-primary">€249</span>
                  <span className="text-text-muted">/month</span>
                </div>
                <p className="text-signal text-sm mb-6">Save €552/year (billed annually)</p>
                <ul className="space-y-3 mb-8">
                  {annualFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-text-muted">
                      <Check className="w-5 h-5 text-signal flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup?plan=annual" className="block">
                  <Button variant="signal" size="lg" className="w-full">
                    Start free trial
                  </Button>
                </Link>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <h2 className="text-center text-text-muted text-sm uppercase tracking-wider mb-8">
            What&apos;s included
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="flex flex-col items-center text-center p-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-ocean-700 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-signal" />
                  </div>
                  <p className="text-text-primary">{feature.title}</p>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Trust */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mx-auto mt-16 text-center"
        >
          <p className="text-text-muted text-sm">
            Cancel anytime • GDPR compliant • Your data stays yours
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-line">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm">
            © 2025 Eatsight. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <a href="#" className="hover:text-text-primary">Privacy</a>
            <a href="#" className="hover:text-text-primary">Terms</a>
            <a href="#" className="hover:text-text-primary">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
