'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { AnimatedGradient } from '@/components/AnimatedGradient'
import { VideoPlayer } from '@/components/VideoPlayer'
import { Testimonials } from '@/components/Testimonials'
import {
  QrCode,
  MessageCircle,
  Sparkles,
  TrendingUp,
  BarChart3,
  Target,
  Zap,
  Check,
  ArrowRight,
  Play,
  Users,
  Heart,
  Star,
  UtensilsCrossed,
  ChefHat,
  MapPin,
} from 'lucide-react'

const steps = [
  { num: '01', title: 'Scan', desc: 'Guest scans QR code at the table. No app download needed.', icon: QrCode },
  { num: '02', title: 'Answer', desc: '"What mood are you in?" "Pick your flavors." "How hungry?" Three taps.', icon: MessageCircle },
  { num: '03', title: 'Discover', desc: 'Three personalized recommendations with one-line reasons why.', icon: Sparkles },
]

const operatorFeatures = [
  { title: 'What moods are trending', desc: 'See if guests want comfort food or light bites — by hour, day, or season.', icon: TrendingUp },
  { title: 'Which flavors they crave', desc: 'Spicy up? Umami down? Know before you plan the specials.', icon: Zap },
  { title: "What's missing from your menu", desc: '"12 guests wanted vegan + spicy. You have 0 options."', icon: Target },
  { title: 'Which items actually convert', desc: 'Not just what they click — what they actually order.', icon: BarChart3 },
]

const monthlyFeatures = ['Unlimited scans', 'Real-time analytics', 'Menu management', 'Cancel anytime']
const annualFeatures = ['Everything in Monthly', '14-day free trial', 'Priority support', 'Price locked forever']

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const heroOpacity = Math.max(0, 1 - scrollY / 600)

  return (
    <div className="bg-[#FDFBF7]">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex justify-between items-center bg-[#FDFBF7]/90 backdrop-blur-sm border-b border-[#1a1a1a]/5">
        <Link href="/" className="font-serif text-xl sm:text-2xl text-[#1a1a1a]">Eatsight</Link>
        <div className="flex gap-3 sm:gap-4 md:gap-8 items-center">
          <a href="#how-it-works" className="text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition-colors hidden md:block">How it works</a>
          <a href="#pricing" className="text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition-colors hidden md:block">Pricing</a>
          <Link href="/faq" className="text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition-colors hidden md:block">FAQ</Link>
          <Link href="/login" className="text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition-colors text-sm sm:text-base">Log in</Link>
          <Link href="/signup" className="bg-[#722F37] text-white px-4 sm:px-5 py-2 rounded-full hover:bg-[#5a252c] transition-colors text-sm">
            Start free
          </Link>
        </div>
      </nav>

      {/* Hero - Premium Editorial Style */}
      <section className="relative min-h-screen flex items-center bg-[#FDFBF7] overflow-hidden pt-20">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(196,101,74,0.08) 0%, transparent 70%)',
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(114,47,55,0.06) 0%, transparent 70%)',
            }}
            animate={{
              x: [0, -20, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Subtle grain texture */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#722F37]/5 border border-[#722F37]/10 mb-8"
              >
                <Sparkles className="w-4 h-4 text-[#722F37]" />
                <span className="text-sm font-medium text-[#722F37] tracking-wide">
                  Menu Intelligence Platform
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-serif text-[#1a1a1a] leading-[1.1] tracking-tight"
              >
                Every guest finds
                <br />
                <span className="italic text-[#722F37]">exactly</span> what
                <br />
                they&apos;ll love
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-8 text-lg text-[#1a1a1a]/60 max-w-lg leading-relaxed"
              >
                Three quick questions turn menu overwhelm into perfect
                recommendations. Happier guests, better insights, zero guesswork.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-10 flex flex-col sm:flex-row gap-4"
              >
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#722F37] text-white rounded-xl font-medium hover:bg-[#5a252c] transition-all duration-300 shadow-lg shadow-[#722F37]/20"
                >
                  Start free trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#1a1a1a] rounded-xl font-medium border border-[#1a1a1a]/10 hover:border-[#1a1a1a]/20 transition-all duration-300"
                >
                  <Play className="w-4 h-4" />
                  See how it works
                </Link>
              </motion.div>

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-12 flex items-center gap-4"
              >
                <div className="flex -space-x-3">
                  {['bg-[#C4654A]', 'bg-[#722F37]', 'bg-[#8B6F47]', 'bg-[#D4C5B0]'].map((bg, i) => (
                    <div key={i} className={`w-10 h-10 rounded-full ${bg} border-2 border-[#FDFBF7] flex items-center justify-center`}>
                      <ChefHat className="w-4 h-4 text-white" />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#C4654A] text-[#C4654A]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#1a1a1a]/50 mt-0.5">
                    Trusted by 50+ restaurants
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right: Interactive product preview */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block"
              style={{ opacity: heroOpacity }}
            >
              <div className="relative">
                {/* Phone frame */}
                <div className="relative mx-auto w-[320px] h-[640px] bg-white rounded-[40px] shadow-2xl shadow-[#1a1a1a]/10 border border-[#1a1a1a]/5 overflow-hidden">
                  {/* Status bar */}
                  <div className="h-12 bg-[#FDFBF7] flex items-center justify-center">
                    <div className="w-20 h-5 bg-[#1a1a1a]/10 rounded-full" />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Restaurant header */}
                    <div className="text-center mb-8">
                      <div className="w-12 h-12 bg-[#722F37]/10 rounded-xl mx-auto mb-3 flex items-center justify-center">
                        <UtensilsCrossed className="w-6 h-6 text-[#722F37]" />
                      </div>
                      <h3 className="font-serif text-xl text-[#1a1a1a]">Bella Taverna</h3>
                      <p className="text-sm text-[#1a1a1a]/40 mt-1">What are you in the mood for?</p>
                    </div>

                    {/* Question cards */}
                    <div className="space-y-3">
                      {[
                        { label: 'Something comforting', icon: Heart, active: true },
                        { label: 'Light & fresh', icon: Zap, active: false },
                        { label: 'Feeling adventurous', icon: Sparkles, active: false },
                      ].map((option, i) => (
                        <motion.div
                          key={option.label}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + i * 0.15 }}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                            option.active
                              ? 'border-[#722F37] bg-[#722F37]/5'
                              : 'border-[#1a1a1a]/5 hover:border-[#1a1a1a]/10'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            option.active ? 'bg-[#722F37]/10' : 'bg-[#1a1a1a]/5'
                          }`}>
                            <option.icon className={`w-5 h-5 ${
                              option.active ? 'text-[#722F37]' : 'text-[#1a1a1a]/40'
                            }`} />
                          </div>
                          <span className={`text-sm font-medium ${
                            option.active ? 'text-[#722F37]' : 'text-[#1a1a1a]/60'
                          }`}>
                            {option.label}
                          </span>
                          {option.active && (
                            <Check className="w-5 h-5 text-[#722F37] ml-auto" />
                          )}
                        </motion.div>
                      ))}
                    </div>

                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 mt-8">
                      <div className="w-8 h-2 rounded-full bg-[#722F37]" />
                      <div className="w-2 h-2 rounded-full bg-[#1a1a1a]/10" />
                      <div className="w-2 h-2 rounded-full bg-[#1a1a1a]/10" />
                    </div>
                  </div>
                </div>

                {/* Floating cards */}
                <motion.div
                  className="absolute -right-8 top-24 glass-card p-4 shadow-lg"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-[#1a1a1a]/50">Satisfaction</p>
                      <p className="text-sm font-semibold text-[#1a1a1a]">+34%</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="absolute -left-8 bottom-32 glass-card p-4 shadow-lg"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#722F37]/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#722F37]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#1a1a1a]/50">Today</p>
                      <p className="text-sm font-semibold text-[#1a1a1a]">47 guests</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          style={{ opacity: Math.max(0, 1 - scrollY / 200) }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="w-6 h-10 border-2 border-[#1a1a1a]/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-[#1a1a1a]/40 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              className="text-center md:text-left"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block px-3 py-1 bg-[#C4654A]/10 text-[#C4654A] rounded-full text-sm font-medium mb-4">
                Mesa · For Guests
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif text-[#1a1a1a] mb-4">
                Find what you&apos;ll love
              </h3>
              <p className="text-[#1a1a1a]/60">
                Answer a few quick questions and discover dishes perfectly matched to your mood, cravings, and dietary needs. No more menu paralysis.
              </p>
            </motion.div>

            <motion.div
              className="text-center md:text-left"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="inline-block px-3 py-1 bg-[#722F37]/10 text-[#722F37] rounded-full text-sm font-medium mb-4">
                Eatsight · For Operators
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif text-[#1a1a1a] mb-4">
                See what guests crave
              </h3>
              <p className="text-[#1a1a1a]/60">
                Turn guest preferences into actionable insights. Know what&apos;s trending, what&apos;s missing, and what drives revenue — all in real time.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#1a1a1a] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <blockquote className="text-xl sm:text-2xl md:text-3xl font-serif italic mb-6">
              &ldquo;Eatsight helps venues turn indecision into higher conversion by guiding guests to the right choices.&rdquo;
            </blockquote>
            <p className="text-white/60">
              — The Mesa Team
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-3 gap-8 mt-12 pt-12 border-t border-white/10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div>
              <div className="text-3xl sm:text-4xl font-serif">3</div>
              <div className="text-white/60 text-sm mt-1">Questions</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-serif">10s</div>
              <div className="text-white/60 text-sm mt-1">To discover</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-serif">∞</div>
              <div className="text-white/60 text-sm mt-1">Happy guests</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="min-h-screen flex items-center py-20 md:py-32 px-6 md:px-8 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <motion.p
              className="text-[#8B6F47] uppercase tracking-[0.2em] text-sm mb-4"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              The Challenge
            </motion.p>
            <motion.h2
              className="font-serif text-4xl md:text-5xl text-[#1a1a1a] leading-tight mb-6"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Menus are overwhelming.<br />
              <span className="text-[#1a1a1a]/40">Decisions are hard.</span>
            </motion.h2>
            <motion.p
              className="text-lg text-[#1a1a1a]/70 leading-relaxed"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Your guests stare at the menu for minutes. They ask the server what&apos;s good.
              They order safe choices instead of your best dishes.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-[#1a1a1a]/5 border border-[#1a1a1a]/5">
              <div className="space-y-4 text-[#1a1a1a]/50 font-mono text-sm">
                {[
                  { label: 'Menu items', value: '47' },
                  { label: 'Average decision time', value: '4+ min' },
                  { label: 'Guests who ask server', value: '68%' },
                  { label: 'Orders that match preference', value: '~40%', highlight: true },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex justify-between pb-2 ${i < 3 ? 'border-b border-dashed border-[#1a1a1a]/10' : ''}`}
                  >
                    <span>{item.label}</span>
                    <span className={item.highlight ? 'text-[#722F37] font-medium' : 'text-[#1a1a1a]/70'}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="min-h-screen flex items-center justify-center bg-[#1a1a1a] text-white py-20 md:py-32 px-6 md:px-8 relative overflow-hidden">
        <AnimatedGradient />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.p
            className="text-white/60 uppercase tracking-[0.2em] md:tracking-[0.3em] text-xs md:text-sm mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            The Solution
          </motion.p>
          <motion.h2
            className="font-serif text-4xl md:text-6xl lg:text-7xl leading-tight mb-8 text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Three questions.<br />
            <span className="italic text-[#F5F3EF]">Perfect match.</span>
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Guest scans the QR code. Answers three simple questions about mood, flavor, and hunger.
            Gets three perfect recommendations in under 15 seconds.
          </motion.p>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20 md:py-28 bg-[#FDFBF7]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <motion.p
              className="text-sm uppercase tracking-widest text-[#722F37] mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              See It In Action
            </motion.p>
            <motion.h2
              className="text-3xl sm:text-4xl font-serif text-[#1a1a1a] mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              From scan to smile in seconds
            </motion.h2>
            <motion.p
              className="text-[#1a1a1a]/60 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Watch how Mesa transforms the dining experience for your guests
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <VideoPlayer placeholder={true} />
          </motion.div>

          <motion.p
            className="mt-8 text-center text-sm text-[#1a1a1a]/50"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Full demo video coming soon
          </motion.p>
        </div>
      </section>

      {/* How It Works - Clean with Icons */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <p className="text-sm font-medium text-[#722F37] tracking-widest uppercase mb-4">
              How it works
            </p>
            <h2 className="text-4xl sm:text-5xl font-serif text-[#1a1a1a]">
              Simple for everyone
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="relative inline-flex mb-8">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    i === 0 ? 'bg-[#C4654A]/10 text-[#C4654A]' :
                    i === 1 ? 'bg-[#722F37]/10 text-[#722F37]' :
                    'bg-[#8B6F47]/10 text-[#8B6F47]'
                  }`}>
                    <step.icon className="w-7 h-7" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#1a1a1a] text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-[#1a1a1a] mb-3">
                  {step.title}
                </h3>
                <p className="text-[#1a1a1a]/60 leading-relaxed max-w-xs mx-auto">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* For Operators - With Icons */}
      <section className="py-20 md:py-32 px-6 md:px-8 bg-[#F5F3EF] overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <motion.p
              className="text-[#722F37] uppercase tracking-[0.2em] text-sm mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              For Operators
            </motion.p>
            <motion.h2
              className="font-serif text-4xl md:text-5xl text-[#1a1a1a]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Finally, real answers
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {operatorFeatures.map((item, index) => (
              <motion.div
                key={item.title}
                className="bg-white p-6 md:p-8 rounded-2xl flex gap-5"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#722F37]/8 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-[#722F37]" />
                </div>
                <div>
                  <h3 className="font-serif text-xl md:text-2xl text-[#1a1a1a] mb-3">{item.title}</h3>
                  <p className="text-[#1a1a1a]/70">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Clean SaaS Style */}
      <section id="pricing" className="py-24 lg:py-32 bg-[#FDFBF7]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-medium text-[#722F37] tracking-widest uppercase mb-4">
              Pricing
            </p>
            <h2 className="text-4xl sm:text-5xl font-serif text-[#1a1a1a] mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-[#1a1a1a]/60 max-w-xl mx-auto">
              One plan, everything included. No hidden fees.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Monthly */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-[#1a1a1a]/5 p-8 hover:border-[#1a1a1a]/10 transition-colors"
            >
              <p className="text-sm font-medium text-[#1a1a1a]/50 uppercase tracking-wide">Monthly</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-serif text-[#1a1a1a]">€295</span>
                <span className="text-[#1a1a1a]/40">/month</span>
              </div>
              <p className="mt-3 text-sm text-[#1a1a1a]/50">Billed monthly. Cancel anytime.</p>

              <div className="mt-8 space-y-4">
                {monthlyFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#722F37] flex-shrink-0" />
                    <span className="text-sm text-[#1a1a1a]/70">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/signup?plan=monthly"
                className="mt-8 block w-full py-3.5 text-center rounded-xl border-2 border-[#1a1a1a]/10 text-[#1a1a1a] font-medium hover:border-[#1a1a1a]/20 transition-colors"
              >
                Get started
              </Link>
            </motion.div>

            {/* Annual - recommended */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative bg-[#722F37] rounded-2xl p-8 text-white overflow-visible"
            >
              <div className="absolute -top-3 left-8 px-4 py-1 bg-[#C4654A] text-white text-xs font-bold rounded-full tracking-wide uppercase">
                Save €552/year
              </div>

              <p className="text-sm font-medium text-white/60 uppercase tracking-wide">Annual</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-serif text-white">€249</span>
                <span className="text-white/50">/month</span>
              </div>
              <p className="mt-3 text-sm text-white/50">€2,988 billed annually. 14-day free trial.</p>

              <div className="mt-8 space-y-4">
                {annualFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#C4654A] flex-shrink-0" />
                    <span className="text-sm text-white/80">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/signup?plan=annual"
                className="mt-8 block w-full py-3.5 text-center rounded-xl bg-white text-[#722F37] font-medium hover:bg-white/90 transition-colors"
              >
                Start free trial
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 md:py-32 px-6 md:px-8 bg-[#F5F3EF]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.p
            className="text-[#722F37] uppercase tracking-[0.2em] text-sm mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Our Story
          </motion.p>
          <motion.h2
            className="font-serif text-3xl md:text-4xl text-[#1a1a1a] mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Built by hospitality people
          </motion.h2>
          <motion.p
            className="text-base md:text-lg text-[#1a1a1a]/70 leading-relaxed mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            We&apos;ve worked the floor. We&apos;ve seen guests paralyzed by choice, servers repeating the same recommendations,
            and kitchens guessing what to prep.
          </motion.p>
          <motion.p
            className="text-base md:text-lg text-[#1a1a1a]/70 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Mesa + Eatsight bridges the gap between what guests want and what you serve.
          </motion.p>
          <motion.div
            className="mt-8 flex items-center justify-center gap-2 text-[#1a1a1a]/40"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <MapPin className="w-4 h-4" />
            <span>Amsterdam, Netherlands</span>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2
              className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#1a1a1a] mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              The faces behind Mesa
            </motion.h2>
            <motion.p
              className="text-[#1a1a1a]/60 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              We&apos;re a small team passionate about helping restaurants connect with their guests in a more personal way.
            </motion.p>
          </div>

          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="text-center max-w-xs">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-[#722F37] overflow-hidden flex items-center justify-center">
                <span className="text-3xl font-semibold text-white">JV</span>
              </div>
              <h3 className="font-medium text-[#1a1a1a] text-lg">Justus van Eijk</h3>
              <p className="text-[#722F37] text-sm mb-2">Founder & CEO</p>
              <p className="text-[#1a1a1a]/50 text-sm">
                Artificial intelligence student with an ambition for finding smart solutions.
              </p>
              <a
                href="https://linkedin.com/in/justus-van-eijk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-[#1a1a1a]/40 hover:text-[#722F37] transition-colors"
                aria-label="Justus van Eijk on LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </motion.div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-[#1a1a1a]/40 text-sm mb-4">Want to get in touch?</p>
            <a
              href="mailto:hello@eatsight.com"
              className="text-[#722F37] hover:text-[#5a252c] font-medium"
            >
              hello@eatsight.com
            </a>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 px-6 md:px-8 bg-[#722F37] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            className="font-serif text-4xl md:text-5xl lg:text-6xl mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Ready to understand<br />your guests?
          </motion.h2>
          <motion.p
            className="text-white/80 text-base md:text-lg mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Set up in 15 minutes. See insights from day one.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/signup" className="inline-flex items-center gap-3 bg-white text-[#722F37] px-10 py-4 rounded-xl text-lg font-medium hover:bg-white/90 transition-colors">
              Start your free trial
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
          <motion.p
            className="text-white/60 text-sm mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            14 days free · No credit card
          </motion.p>
        </div>
      </section>

      {/* Footer - Editorial Style */}
      <footer className="bg-[#1a1a1a] text-white py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <p className="text-2xl font-serif">Eatsight</p>
              <p className="mt-4 text-white/40 text-sm leading-relaxed max-w-xs">
                Menu intelligence that helps every guest find exactly what they&apos;ll love.
              </p>
            </div>

            {/* Links */}
            <div>
              <p className="text-xs font-medium text-white/30 uppercase tracking-widest mb-4">Product</p>
              <div className="space-y-3">
                {[
                  { label: 'How it works', href: '#how-it-works' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'FAQ', href: '/faq' },
                  { label: 'Demo', href: '/v/bella-taverna' },
                ].map(link => (
                  <Link key={link.label} href={link.href} className="block text-sm text-white/60 hover:text-white transition">{link.label}</Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-white/30 uppercase tracking-widest mb-4">Company</p>
              <div className="space-y-3">
                {[
                  { label: 'About', href: '/about' },
                  { label: 'Contact', href: '/contact' },
                ].map(link => (
                  <Link key={link.label} href={link.href} className="block text-sm text-white/60 hover:text-white transition">{link.label}</Link>
                ))}
                <a href="mailto:hello@eatsight.com" className="block text-sm text-white/60 hover:text-white transition">hello@eatsight.com</a>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-white/30 uppercase tracking-widest mb-4">Legal</p>
              <div className="space-y-3">
                {[
                  { label: 'Privacy', href: '/privacy' },
                  { label: 'Terms', href: '/terms' },
                  { label: 'Cookies', href: '/cookies' },
                ].map(link => (
                  <Link key={link.label} href={link.href} className="block text-sm text-white/60 hover:text-white transition">{link.label}</Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/30">
              © {new Date().getFullYear()} Numina Labs. All rights reserved.
            </p>
            <p className="text-sm text-white/30">
              Made in Amsterdam
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
