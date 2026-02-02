'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Play,
  Sparkles,
  QrCode,
  MessageCircle,
  Heart,
  TrendingUp,
  Users,
  Star,
  Check,
  Zap,
  ChefHat,
  UtensilsCrossed,
  BarChart3,
} from 'lucide-react'
import { ScrollReveal } from '@/components/ScrollReveal'
import { Marquee } from '@/components/Marquee'

// Animated gradient background with noise
function GlassBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient orbs */}
      <motion.div
        className="absolute -top-[300px] -right-[300px] w-[800px] h-[800px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(196,101,74,0.12) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-[200px] -left-[200px] w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(114,47,55,0.1) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, -30, 0],
          y: [0, 40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Noise overlay */}
      <div className="absolute inset-0 noise" />
    </div>
  )
}

// Glass phone mockup
function GlassPhoneMockup() {
  return (
    <div className="relative">
      {/* Glow behind phone */}
      <div className="absolute inset-0 bg-gradient-to-br from-mesa-burgundy/20 to-mesa-terracotta/20 blur-[100px] scale-75" />

      {/* Phone frame with glass effect */}
      <div className="relative mx-auto w-[300px] glass rounded-[44px] p-3 shadow-2xl">
        <div className="bg-white rounded-[36px] overflow-hidden">
          {/* Notch */}
          <div className="h-8 bg-mesa-cream flex items-center justify-center">
            <div className="w-24 h-5 bg-black/80 rounded-full" />
          </div>

          {/* Content */}
          <div className="p-5 bg-mesa-cream min-h-[500px]">
            {/* Restaurant header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 glass-warm rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-mesa-burgundy" />
              </div>
              <h3 className="font-serif text-xl text-mesa-charcoal">Bella Taverna</h3>
              <p className="text-sm text-mesa-charcoal/40 mt-1">What brings you in today?</p>
            </div>

            {/* Mood options with glass effect */}
            <div className="space-y-3">
              {[
                { label: 'Something comforting', icon: Heart, active: true },
                { label: 'Light & refreshing', icon: Zap, active: false },
                { label: 'Feeling adventurous', icon: Sparkles, active: false },
              ].map((option, i) => (
                <motion.div
                  key={option.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.15 }}
                  className={`p-4 rounded-2xl transition-all cursor-pointer flex items-center gap-3 ${
                    option.active
                      ? 'glass-warm border-2 border-mesa-burgundy/30'
                      : 'bg-white/60 border-2 border-transparent hover:border-mesa-burgundy/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    option.active ? 'bg-mesa-burgundy/10' : 'bg-mesa-charcoal/5'
                  }`}>
                    <option.icon className={`w-5 h-5 ${
                      option.active ? 'text-mesa-burgundy' : 'text-mesa-charcoal/40'
                    }`} />
                  </div>
                  <span className={`text-sm font-medium ${
                    option.active ? 'text-mesa-burgundy' : 'text-mesa-charcoal/60'
                  }`}>
                    {option.label}
                  </span>
                  {option.active && (
                    <Check className="w-5 h-5 text-mesa-burgundy ml-auto" />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Progress */}
            <div className="flex justify-center gap-2 mt-8">
              <div className="w-8 h-2 rounded-full bg-mesa-burgundy" />
              <div className="w-2 h-2 rounded-full bg-mesa-charcoal/10" />
              <div className="w-2 h-2 rounded-full bg-mesa-charcoal/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating stat cards */}
      <motion.div
        className="absolute -right-16 top-24 glass p-4 rounded-2xl shadow-xl"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-mesa-charcoal/50">Satisfaction</p>
            <p className="text-lg font-semibold text-mesa-charcoal">+34%</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute -left-12 bottom-40 glass p-4 rounded-2xl shadow-xl"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mesa-burgundy/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-mesa-burgundy" />
          </div>
          <div>
            <p className="text-xs text-mesa-charcoal/50">Today</p>
            <p className="text-lg font-semibold text-mesa-charcoal">127 guests</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Liquid glass hero section
function HeroSection() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center overflow-hidden bg-mesa-cream pt-20">
      <GlassBackground />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 lg:py-32"
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            {/* Glass badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-warm mb-8"
            >
              <Sparkles className="w-4 h-4 text-mesa-burgundy" />
              <span className="text-sm font-medium text-mesa-burgundy">
                Menu Intelligence Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-serif text-mesa-charcoal leading-[1.05] tracking-tight"
            >
              Every guest finds
              <br />
              <span className="text-gradient italic">exactly</span> what
              <br />
              they&apos;ll love
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-8 text-lg text-mesa-charcoal/60 max-w-lg leading-relaxed"
            >
              Three quick questions turn menu overwhelm into perfect
              recommendations. Happier guests, better insights, zero guesswork.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-mesa-burgundy text-white rounded-2xl font-medium hover:bg-mesa-burgundy/90 transition-all duration-300 shadow-lg shadow-mesa-burgundy/25 hover:shadow-xl hover:shadow-mesa-burgundy/30 hover:-translate-y-0.5"
              >
                Start free trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/v/bella-taverna"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 glass rounded-2xl font-medium text-mesa-charcoal hover:bg-white/90 transition-all duration-300"
              >
                <Play className="w-4 h-4" />
                Try demo
              </Link>
            </motion.div>

            {/* Social proof with glass cards */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-14 flex flex-wrap items-center gap-6"
            >
              <div className="flex -space-x-3">
                {['bg-mesa-terracotta', 'bg-mesa-burgundy', 'bg-mesa-brown', 'bg-[#8B7355]'].map((bg, i) => (
                  <div
                    key={i}
                    className={`w-11 h-11 rounded-full ${bg} border-[3px] border-mesa-cream flex items-center justify-center shadow-md`}
                  >
                    <ChefHat className="w-4 h-4 text-white" />
                  </div>
                ))}
              </div>
              <div className="glass-warm px-4 py-2 rounded-xl">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-mesa-terracotta text-mesa-terracotta" />
                  ))}
                  <span className="ml-2 text-sm font-medium text-mesa-charcoal">4.9</span>
                </div>
                <p className="text-xs text-mesa-charcoal/50 mt-0.5">
                  Trusted by 50+ restaurants
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right: Liquid glass phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="hidden lg:block"
          >
            <GlassPhoneMockup />
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

// Marquee section
function MarqueeSection() {
  const items = [
    'Menu Intelligence',
    'Guest Insights',
    'Smart Recommendations',
    'Real-time Analytics',
    'Happy Customers',
    'Data-Driven Menus',
    'Seamless Experience',
    'Zero Guesswork',
  ]

  return (
    <section className="py-6 bg-mesa-burgundy overflow-hidden">
      <Marquee
        items={items}
        speed={40}
        className="text-white/90 text-sm font-medium tracking-wide uppercase"
        separator={<span className="mx-6 text-white/30">&#9670;</span>}
      />
    </section>
  )
}

// Stats section with glass cards
function StatsSection() {
  const stats = [
    { value: '94%', label: 'Guest satisfaction', icon: Heart },
    { value: '3x', label: 'Faster decisions', icon: Zap },
    { value: '45%', label: 'More discoveries', icon: Sparkles },
    { value: '2min', label: 'Average setup', icon: QrCode },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.1}>
              <div className="glass-warm rounded-2xl p-6 text-center hover-lift">
                <div className="w-12 h-12 rounded-xl bg-mesa-burgundy/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-mesa-burgundy" />
                </div>
                <p className="text-4xl font-serif text-mesa-charcoal mb-1">{stat.value}</p>
                <p className="text-sm text-mesa-charcoal/50">{stat.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// How it works with scroll animations
function HowItWorksSection() {
  const steps = [
    {
      icon: QrCode,
      title: 'Scan',
      description: 'Guest scans QR code at the table. No app needed.',
    },
    {
      icon: MessageCircle,
      title: 'Answer',
      description: 'Three quick questions about mood, diet, and flavor.',
    },
    {
      icon: Sparkles,
      title: 'Discover',
      description: 'Personalized recommendations from your menu.',
    },
  ]

  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-mesa-cream relative overflow-hidden">
      <GlassBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <ScrollReveal className="text-center mb-20">
          <p className="text-sm font-medium text-mesa-burgundy tracking-widest uppercase mb-4">
            How it works
          </p>
          <h2 className="text-4xl sm:text-5xl font-serif text-mesa-charcoal">
            Simple for everyone
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 0.15}>
              <div className="glass rounded-3xl p-8 text-center hover-lift h-full">
                <div className="relative inline-flex mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-mesa-burgundy/10 flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-mesa-burgundy" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-mesa-burgundy text-white text-xs font-bold flex items-center justify-center shadow-lg">
                    {i + 1}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-mesa-charcoal mb-3">
                  {step.title}
                </h3>
                <p className="text-mesa-charcoal/60 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Features section with image hover effect
function FeaturesSection() {
  const features = [
    {
      title: 'For Guests',
      subtitle: 'Mesa',
      description: 'No more menu anxiety. Get personalized recommendations that match your mood, dietary needs, and flavor preferences.',
      color: 'from-mesa-terracotta/80',
    },
    {
      title: 'For Restaurants',
      subtitle: 'Eatsight',
      description: 'Understand what your guests really want. Turn preferences into actionable menu insights.',
      color: 'from-mesa-burgundy/80',
    },
  ]

  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal className="text-center mb-16">
          <p className="text-sm font-medium text-mesa-burgundy tracking-widest uppercase mb-4">
            Two sides, one platform
          </p>
          <h2 className="text-4xl sm:text-5xl font-serif text-mesa-charcoal">
            Built for everyone
          </h2>
        </ScrollReveal>

        <div className="grid lg:grid-cols-2 gap-8">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 0.15} direction={i === 0 ? 'left' : 'right'}>
              <div className="group glass rounded-3xl overflow-hidden hover-lift">
                {/* Image with zoom effect */}
                <div className="relative h-64 img-zoom">
                  <div className={`absolute inset-0 bg-gradient-to-t ${feature.color} to-transparent z-10`} />
                  <div className="absolute inset-0 bg-mesa-charcoal/20" />
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    i === 0 ? 'from-mesa-terracotta to-mesa-burgundy' : 'from-mesa-burgundy to-mesa-charcoal'
                  }`} />
                  <div className="absolute bottom-4 left-6 z-20">
                    <p className="text-white/70 text-sm font-medium">{feature.subtitle}</p>
                    <h3 className="text-2xl font-serif text-white">{feature.title}</h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-mesa-charcoal/70 leading-relaxed">
                    {feature.description}
                  </p>
                  <Link
                    href={i === 0 ? '/v/bella-taverna' : '/signup'}
                    className="inline-flex items-center gap-2 mt-4 text-mesa-burgundy font-medium group-hover:gap-3 transition-all"
                  >
                    {i === 0 ? 'Try the guest experience' : 'Start your free trial'}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Testimonials with glass cards
function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Our guests spend less time deciding and more time enjoying. The recommendations feel genuinely personal.",
      author: "Maria van den Berg",
      role: "Owner",
      venue: "Cafe De Kade, Amsterdam",
      initials: "MV",
    },
    {
      quote: "The analytics revealed 40% of guests wanted vegan options. We added three dishes and saw immediate results.",
      author: "Thomas Bakker",
      role: "Head Chef",
      venue: "Bistro Willem, Rotterdam",
      initials: "TB",
    },
    {
      quote: "Setup took ten minutes. Within a week we had actionable data about what our guests actually want.",
      author: "Sophie de Groot",
      role: "Manager",
      venue: "The Green Table, Utrecht",
      initials: "SG",
    },
  ]

  return (
    <section className="py-24 lg:py-32 bg-mesa-cream relative overflow-hidden">
      <GlassBackground />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <ScrollReveal className="text-center mb-16">
          <p className="text-sm font-medium text-mesa-burgundy tracking-widest uppercase mb-4">
            Testimonials
          </p>
          <h2 className="text-4xl sm:text-5xl font-serif text-mesa-charcoal">
            Loved by restaurants
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.author} delay={i * 0.1}>
              <div className="glass rounded-3xl p-8 h-full hover-lift">
                {/* Quote mark */}
                <svg className="w-10 h-10 text-mesa-burgundy/20 mb-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>

                <p className="text-mesa-charcoal/80 leading-relaxed mb-8">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mesa-burgundy to-mesa-terracotta flex items-center justify-center shadow-lg">
                    <span className="text-sm font-semibold text-white">{t.initials}</span>
                  </div>
                  <div>
                    <p className="font-medium text-mesa-charcoal">{t.author}</p>
                    <p className="text-xs text-mesa-charcoal/50">{t.role} - {t.venue}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Pricing with glass cards
function PricingSection() {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <ScrollReveal className="text-center mb-16">
          <p className="text-sm font-medium text-mesa-burgundy tracking-widest uppercase mb-4">
            Pricing
          </p>
          <h2 className="text-4xl sm:text-5xl font-serif text-mesa-charcoal mb-4">
            Simple, transparent
          </h2>
          <p className="text-lg text-mesa-charcoal/60 max-w-xl mx-auto">
            One plan, everything included. No hidden fees.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Monthly */}
          <ScrollReveal direction="left" delay={0.1}>
            <div className="glass rounded-3xl p-8 hover-lift h-full">
              <p className="text-sm font-medium text-mesa-charcoal/50 uppercase tracking-wide">Monthly</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-serif text-mesa-charcoal">&euro;295</span>
                <span className="text-mesa-charcoal/40">/month</span>
              </div>
              <p className="mt-2 text-sm text-mesa-charcoal/50">Billed monthly. Cancel anytime.</p>

              <div className="mt-8 space-y-4">
                {[
                  'Unlimited recommendations',
                  'Full analytics dashboard',
                  'Menu management',
                  'QR code generator',
                  'Email support',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-mesa-burgundy/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-mesa-burgundy" />
                    </div>
                    <span className="text-sm text-mesa-charcoal/70">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/signup?plan=monthly"
                className="mt-8 block w-full py-4 text-center rounded-2xl border-2 border-mesa-charcoal/10 text-mesa-charcoal font-medium hover:border-mesa-burgundy/30 hover:bg-mesa-burgundy/5 transition-all"
              >
                Get started
              </Link>
            </div>
          </ScrollReveal>

          {/* Annual */}
          <ScrollReveal direction="right" delay={0.2}>
            <div className="relative glass-dark rounded-3xl p-8 text-white hover-lift h-full overflow-visible">
              {/* Badge */}
              <div className="absolute -top-3 left-8 px-4 py-1.5 bg-mesa-terracotta text-white text-xs font-bold rounded-full shadow-lg">
                Save &euro;552/year
              </div>

              <p className="text-sm font-medium text-white/50 uppercase tracking-wide">Annual</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-serif text-white">&euro;249</span>
                <span className="text-white/40">/month</span>
              </div>
              <p className="mt-2 text-sm text-white/50">&euro;2,988 billed annually. 14-day free trial.</p>

              <div className="mt-8 space-y-4">
                {[
                  'Everything in monthly',
                  'Priority support',
                  'Advanced insights',
                  'Custom QR branding',
                  'Early access features',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-mesa-terracotta/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-mesa-terracotta" />
                    </div>
                    <span className="text-sm text-white/80">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/signup?plan=annual"
                className="mt-8 block w-full py-4 text-center rounded-2xl bg-white text-mesa-burgundy font-medium hover:bg-white/90 transition-all shadow-lg"
              >
                Start free trial
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

// CTA section
function CTASection() {
  return (
    <section className="py-24 lg:py-32 bg-mesa-charcoal relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-mesa-burgundy/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <ScrollReveal>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white mb-6">
            Ready to delight
            <br />
            <span className="italic text-mesa-terracotta">every</span> guest?
          </h2>
          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
            Join 50+ restaurants already using Eatsight to create personalized dining experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-mesa-burgundy rounded-2xl font-medium hover:bg-white/90 transition-all shadow-xl"
            >
              Start your free trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 glass-dark rounded-2xl font-medium text-white hover:bg-white/10 transition-all"
            >
              Contact sales
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// Footer
function Footer() {
  return (
    <footer className="bg-mesa-charcoal border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <Link href="/" className="font-serif text-2xl text-white">Eatsight</Link>
            <p className="mt-4 text-white/50 max-w-sm">
              Menu intelligence for modern restaurants. Personalized recommendations for every guest.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-white mb-4">Product</h4>
            <div className="space-y-3">
              <Link href="#how-it-works" className="block text-white/50 hover:text-white transition">How it works</Link>
              <Link href="#pricing" className="block text-white/50 hover:text-white transition">Pricing</Link>
              <Link href="/demo" className="block text-white/50 hover:text-white transition">Demo</Link>
              <Link href="/faq" className="block text-white/50 hover:text-white transition">FAQ</Link>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-white mb-4">Company</h4>
            <div className="space-y-3">
              <Link href="/about" className="block text-white/50 hover:text-white transition">About</Link>
              <Link href="/contact" className="block text-white/50 hover:text-white transition">Contact</Link>
              <Link href="/privacy" className="block text-white/50 hover:text-white transition">Privacy</Link>
              <Link href="/terms" className="block text-white/50 hover:text-white transition">Terms</Link>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/30">&copy; {new Date().getFullYear()} Eatsight. All rights reserved.</p>
          <p className="text-sm text-white/30">Made with care in Amsterdam</p>
        </div>
      </div>
    </footer>
  )
}

// Navigation
function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 md:px-8 py-4 sm:py-5 glass">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="font-serif text-xl sm:text-2xl text-mesa-charcoal">Eatsight</Link>
        <div className="flex gap-3 sm:gap-4 md:gap-8 items-center">
          <a href="#how-it-works" className="text-mesa-charcoal/70 hover:text-mesa-charcoal transition-colors hidden md:block">How it works</a>
          <a href="#pricing" className="text-mesa-charcoal/70 hover:text-mesa-charcoal transition-colors hidden md:block">Pricing</a>
          <Link href="/faq" className="text-mesa-charcoal/70 hover:text-mesa-charcoal transition-colors hidden md:block">FAQ</Link>
          <Link href="/login" className="text-mesa-charcoal/70 hover:text-mesa-charcoal transition-colors text-sm sm:text-base">Log in</Link>
          <Link href="/signup" className="bg-mesa-burgundy text-white px-4 sm:px-5 py-2 rounded-full hover:bg-mesa-burgundy/90 transition-colors text-sm shadow-lg shadow-mesa-burgundy/25">
            Start free
          </Link>
        </div>
      </div>
    </nav>
  )
}

// Main page component
export default function LandingPage() {
  return (
    <main>
      <Navigation />
      <HeroSection />
      <MarqueeSection />
      <StatsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </main>
  )
}
