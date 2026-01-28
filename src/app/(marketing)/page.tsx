'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Zap, BarChart3, Clock, QrCode, Smartphone, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const monthlyFeatures = [
  'Unlimited scans',
  'Real-time analytics',
  'Menu management',
  'QR code generator',
]

const annualFeatures = [
  'Everything in Monthly',
  '1 month free',
  'Priority support',
  'Early adopter pricing locked in',
]

const operatorFeatures = [
  {
    title: 'Real-time Demand Signals',
    description: 'See trending moods, flavors, and dietary requests as they happen.',
  },
  {
    title: 'Menu Gap Analysis',
    description: "Know exactly what guests wanted but couldn't find.",
  },
  {
    title: 'Push High-Margin Items',
    description: 'Promote specific dishes when they match guest preferences.',
  },
  {
    title: 'No POS Integration',
    description: 'Works alongside your existing systems. Set up in 15 minutes.',
  },
]

export default function EatsightLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-950 via-ocean-900 to-ocean-950">
      {/* Header */}
      <header className="px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-signal flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-text-primary font-semibold text-lg">Eatsight</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#how-it-works" className="text-text-muted hover:text-text-primary text-sm hidden md:block">
              How it works
            </Link>
            <Link href="#pricing" className="text-text-muted hover:text-text-primary text-sm hidden md:block">
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="signal-outline" size="sm">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6"
          >
            Know what your guests want.
            <br />
            <span className="text-signal">Before they order.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-text-muted max-w-2xl mx-auto mb-8"
          >
            Mesa helps guests find their perfect dish in seconds.
            Eatsight shows you exactly what they&apos;re craving — so you can serve smarter.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/signup">
              <Button size="lg" variant="signal" className="px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="signal-outline">
                See How It Works
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-ocean-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16 text-center">
            <div>
              <div className="text-3xl font-bold text-text-primary">15 sec</div>
              <div className="text-text-muted text-sm">Average time to recommendation</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-text-primary">3 questions</div>
              <div className="text-text-muted text-sm">To understand preferences</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-text-primary">Real-time</div>
              <div className="text-text-muted text-sm">Analytics dashboard</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-text-primary mb-4">How It Works</h2>
            <p className="text-text-muted max-w-2xl mx-auto">
              Set up in 15 minutes. No POS integration needed. Start understanding your guests today.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-ocean-800/50 rounded-2xl p-6 border border-ocean-700"
            >
              <div className="w-12 h-12 bg-signal/20 rounded-full flex items-center justify-center text-signal font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Upload Your Menu</h3>
              <p className="text-text-muted">
                Upload a CSV of your menu items. Our smart tagger automatically categorizes dishes by mood, flavor, and dietary needs.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-ocean-800/50 rounded-2xl p-6 border border-ocean-700"
            >
              <div className="w-12 h-12 bg-signal/20 rounded-full flex items-center justify-center text-signal font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">Print QR Codes</h3>
              <p className="text-text-muted">
                Download QR codes for each table. Guests scan to get personalized recommendations — no app download required.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-ocean-800/50 rounded-2xl p-6 border border-ocean-700"
            >
              <div className="w-12 h-12 bg-signal/20 rounded-full flex items-center justify-center text-signal font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">See What They Want</h3>
              <p className="text-text-muted">
                Watch real-time analytics: what moods are trending, which items get clicked, and what&apos;s missing from your menu.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Guest Experience */}
      <section className="py-20 px-6 bg-ocean-800/30">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-text-primary mb-4">The Guest Experience</h2>
            <p className="text-text-muted">3 quick taps. Perfect recommendations. Happy guests.</p>
          </motion.div>

          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 bg-ocean-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-8 h-8 text-signal" />
              </div>
              <div className="text-sm text-text-primary">Scan QR</div>
            </motion.div>
            <div className="text-2xl text-text-muted hidden md:block">→</div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 bg-ocean-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Smartphone className="w-8 h-8 text-signal" />
              </div>
              <div className="text-sm text-text-primary">&quot;What mood?&quot;</div>
            </motion.div>
            <div className="text-2xl text-text-muted hidden md:block">→</div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 bg-ocean-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-8 h-8 text-signal" />
              </div>
              <div className="text-sm text-text-primary">3 Perfect Picks</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* For Operators */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-text-primary mb-4">Built for Operators</h2>
            <p className="text-text-muted">Finally understand what your guests really want — without asking.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              {operatorFeatures.map((feature, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="text-signal mt-1">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-text-primary font-medium">{feature.title}</div>
                    <div className="text-text-muted text-sm">{feature.description}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-ocean-800 rounded-2xl p-6 border border-ocean-700"
            >
              <div className="text-sm text-text-muted mb-4">Live Dashboard Preview</div>
              <div className="space-y-4">
                <div className="flex justify-between p-3 rounded-lg bg-ocean-700/50">
                  <span className="text-text-muted">Scans today</span>
                  <span className="text-text-primary font-medium">47</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-ocean-700/50">
                  <span className="text-text-muted">Click-through rate</span>
                  <span className="text-signal font-medium">68%</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-ocean-700/50">
                  <span className="text-text-muted">Top mood</span>
                  <span className="text-text-primary font-medium">Comfort</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-ocean-700/50">
                  <span className="text-text-muted">Top request</span>
                  <span className="text-text-primary font-medium">Vegan options</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-ocean-800/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-text-primary mb-4">Simple Pricing</h2>
            <p className="text-text-muted">Start free. No credit card required.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Monthly */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-ocean-800 rounded-2xl p-6 border border-ocean-700"
            >
              <div className="text-lg font-medium text-text-primary mb-2">Monthly</div>
              <div className="text-4xl font-bold text-text-primary mb-1">
                €295<span className="text-lg text-text-muted">/mo</span>
              </div>
              <div className="text-text-muted text-sm mb-6">Cancel anytime</div>
              <ul className="space-y-2 mb-6">
                {monthlyFeatures.map((feature) => (
                  <li key={feature} className="text-text-muted text-sm flex gap-2">
                    <span className="text-signal">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=monthly" className="block">
                <Button variant="signal-outline" className="w-full">
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>

            {/* Annual */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-ocean-800 to-ocean-900 rounded-2xl p-6 border border-signal/50 relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-signal text-white text-xs px-3 py-1 rounded-full">
                Save €552/year
              </div>
              <div className="text-lg font-medium text-text-primary mb-2">Annual</div>
              <div className="text-4xl font-bold text-text-primary mb-1">
                €249<span className="text-lg text-text-muted">/mo</span>
              </div>
              <div className="text-text-muted text-sm mb-6">Billed yearly (€2,988)</div>
              <ul className="space-y-2 mb-6">
                {annualFeatures.map((feature) => (
                  <li key={feature} className="text-text-muted text-sm flex gap-2">
                    <span className="text-signal">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=annual" className="block">
                <Button variant="signal" className="w-full">
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About / Team */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-text-primary mb-6">Built by Hospitality People</h2>
            <p className="text-text-muted mb-6">
              We&apos;ve worked in restaurants. We&apos;ve seen the chaos of a busy service, the guesswork of menu planning,
              and the disconnect between what operators think guests want and what they actually order.
            </p>
            <p className="text-text-muted mb-8">
              Mesa + Eatsight bridges that gap — giving guests a faster way to decide, and operators
              the data they need to serve smarter.
            </p>
            <p className="text-text-muted/70 text-sm">
              Based in Amsterdam 🇳🇱 • Built for hospitality
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-t from-signal/10 to-transparent">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-text-primary mb-4">Ready to understand your guests?</h2>
            <p className="text-text-muted mb-8">Set up in 15 minutes. See your first insights today.</p>
            <Link href="/signup">
              <Button size="lg" variant="signal" className="px-12">
                Start Your Free Trial
              </Button>
            </Link>
            <p className="text-text-muted/70 text-sm mt-4">14-day free trial • No credit card required</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-ocean-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm">© 2026 Eatsight. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-text-muted hover:text-text-primary">Privacy</a>
            <a href="#" className="text-text-muted hover:text-text-primary">Terms</a>
            <a href="mailto:hello@eatsight.io" className="text-text-muted hover:text-text-primary">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
