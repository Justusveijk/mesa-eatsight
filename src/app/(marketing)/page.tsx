'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'

const steps = [
  { num: '01', title: 'Scan', desc: 'Guest scans QR code at the table. No app download needed.', icon: '📱' },
  { num: '02', title: 'Answer', desc: '"What mood are you in?" "Pick your flavors." "How hungry?" Three taps.', icon: '💭' },
  { num: '03', title: 'Discover', desc: 'Three personalized recommendations with one-line reasons why.', icon: '✨' },
]

const operatorFeatures = [
  { title: 'What moods are trending', desc: 'See if guests want comfort food or light bites — by hour, day, or season.' },
  { title: 'Which flavors they crave', desc: 'Spicy up? Umami down? Know before you plan the specials.' },
  { title: "What's missing from your menu", desc: '"12 guests wanted vegan + spicy. You have 0 options."' },
  { title: 'Which items actually convert', desc: 'Not just what they click — what they actually order.' },
]

const monthlyFeatures = ['Unlimited scans', 'Real-time analytics', 'Menu management', 'Cancel anytime']
const annualFeatures = ['Everything in Monthly', '1 month free', 'Priority support', 'Price locked forever']

export default function LandingPage() {
  const containerRef = useRef(null)
  const heroRef = useRef<HTMLElement>(null)
  const [isInHero, setIsInHero] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Mouse tracking for reveal effect - only in hero
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        const isInside = (
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom &&
          e.clientX >= rect.left &&
          e.clientX <= rect.right
        )
        setIsInHero(isInside)

        if (isInside) {
          setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          })
        }
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Parallax transforms
  const solutionBlobY = useTransform(scrollYProgress, [0.2, 0.5], [100, -100])

  return (
    <div ref={containerRef} className="bg-[#FDFBF7]">
      {/* Navigation - Fixed, minimal */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-8 py-5 flex justify-between items-center bg-[#FDFBF7]/90 backdrop-blur-sm border-b border-[#1a1a1a]/5">
        <div className="font-serif text-2xl text-[#1a1a1a]">Eatsight</div>
        <div className="flex gap-4 md:gap-8 items-center">
          <a href="#how-it-works" className="text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition hidden md:block">How it works</a>
          <a href="#pricing" className="text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition hidden md:block">Pricing</a>
          <Link href="/login" className="text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition">Log in</Link>
          <Link href="/signup" className="bg-[#722F37] text-white px-5 py-2 rounded-full hover:bg-[#5a252c] transition text-sm md:text-base">
            Start free
          </Link>
        </div>
      </nav>

      {/* Section 1: Hero - Full viewport with mouse reveal effect */}
      <section
        ref={heroRef}
        className="h-screen flex items-center justify-center relative overflow-hidden pt-16 bg-[#FDFBF7]"
      >
        {/* Background menu items - always visible but faded */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] left-[8%] rotate-[-12deg] bg-white p-4 rounded-lg shadow-lg w-48 text-xs text-gray-400 font-mono opacity-30">
            <div className="font-bold mb-2 text-[#722F37]/50">Today&apos;s Specials</div>
            <div>Grilled Salmon............€24</div>
            <div>Pasta Carbonara..........€18</div>
            <div>Chef&apos;s Burger.............€16</div>
          </div>
          <div className="absolute top-[20%] right-[10%] rotate-[8deg] bg-white p-4 rounded-lg shadow-lg w-52 text-xs text-gray-400 font-mono opacity-30">
            <div className="font-bold mb-2 text-[#722F37]/50">DRINKS</div>
            <div>House Red.................€7</div>
            <div>Craft Beer................€6</div>
            <div>Espresso Martini.........€12</div>
          </div>
          <div className="absolute bottom-[25%] left-[12%] rotate-[5deg] bg-white p-4 rounded-lg shadow-lg w-44 text-xs text-gray-400 font-mono opacity-30">
            <div className="font-bold mb-2 text-[#722F37]/50">MAINS</div>
            <div>Ribeye Steak.............€32</div>
            <div>Fish & Chips.............€19</div>
          </div>
          <div className="absolute bottom-[20%] right-[15%] rotate-[-8deg] bg-white p-4 rounded-lg shadow-lg w-40 text-xs text-gray-400 font-mono opacity-30">
            <div className="font-bold mb-2 text-[#722F37]/50">DESSERTS</div>
            <div>Tiramisu..................€8</div>
            <div>Chocolate Lava...........€9</div>
          </div>
          <div className="absolute top-[45%] left-[30%] rotate-[3deg] bg-white p-4 rounded-lg shadow-lg w-44 text-xs text-gray-400 font-mono opacity-20 hidden md:block">
            <div className="font-bold mb-2 text-[#722F37]/50">APPETIZERS</div>
            <div>Bruschetta................€9</div>
            <div>Calamari.................€12</div>
          </div>
        </div>

        {/* Mouse reveal spotlight - only shows in hero */}
        {isInHero && (
          <div
            className="absolute pointer-events-none z-10 transition-opacity duration-200 hidden md:block"
            style={{
              left: mousePos.x,
              top: mousePos.y,
              transform: 'translate(-50%, -50%)',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, transparent 0%, transparent 30%, rgba(253,251,247,0.95) 60%, rgba(253,251,247,1) 100%)',
              borderRadius: '50%',
            }}
          />
        )}

        {/* Main hero content - always on top */}
        <div className="text-center px-6 md:px-8 max-w-4xl relative z-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[#722F37] uppercase tracking-[0.2em] md:tracking-[0.3em] text-xs md:text-sm mb-6"
          >
            Menu Intelligence
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl text-[#1a1a1a] leading-[0.95] mb-8"
          >
            Know what<br />your guests<br />
            <span className="italic text-[#722F37]">crave</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-[#1a1a1a]/60 max-w-xl mx-auto mb-10"
          >
            Help guests find their perfect dish in seconds. See exactly what they want in real-time.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/signup" className="inline-block bg-[#1a1a1a] text-white px-8 py-4 rounded-full text-lg hover:bg-[#333] transition">
              Start your free trial
            </Link>
            <Link href="/v/bella-taverna" className="inline-block border-2 border-[#1a1a1a] text-[#1a1a1a] px-8 py-4 rounded-full text-lg hover:bg-[#1a1a1a] hover:text-white transition">
              Try the demo →
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-[#1a1a1a]/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-[#1a1a1a]/40 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Section 2: The Problem - Editorial style */}
      <section className="min-h-screen flex items-center py-20 md:py-32 px-6 md:px-8 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-[#7D8471] uppercase tracking-[0.2em] text-sm mb-4">The Challenge</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#1a1a1a] leading-tight mb-6">
              Menus are overwhelming.<br />
              <span className="text-[#1a1a1a]/40">Decisions are hard.</span>
            </h2>
            <p className="text-lg text-[#1a1a1a]/70 leading-relaxed">
              Your guests stare at the menu for minutes. They ask the server what&apos;s good.
              They order safe choices instead of your best dishes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-[#1a1a1a]/5 border border-[#1a1a1a]/5">
              <div className="space-y-4 text-[#1a1a1a]/50 font-mono text-sm">
                <div className="flex justify-between border-b border-dashed border-[#1a1a1a]/10 pb-2">
                  <span>Menu items</span>
                  <span className="text-[#1a1a1a]/70">47</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-[#1a1a1a]/10 pb-2">
                  <span>Average decision time</span>
                  <span className="text-[#1a1a1a]/70">4+ min</span>
                </div>
                <div className="flex justify-between border-b border-dashed border-[#1a1a1a]/10 pb-2">
                  <span>Guests who ask server</span>
                  <span className="text-[#1a1a1a]/70">68%</span>
                </div>
                <div className="flex justify-between">
                  <span>Orders that match preference</span>
                  <span className="text-[#722F37] font-medium">~40%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 3: The Solution - Big statement */}
      <section className="min-h-screen flex items-center justify-center bg-[#1a1a1a] text-white py-20 md:py-32 px-6 md:px-8 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#722F37]/20 rounded-full blur-3xl" />
        <motion.div
          className="absolute top-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full bg-[#722F37]/10 blur-3xl"
          style={{ y: solutionBlobY }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[#C9A227] uppercase tracking-[0.2em] md:tracking-[0.3em] text-xs md:text-sm mb-8"
          >
            The Solution
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-serif text-4xl md:text-6xl lg:text-7xl leading-tight mb-8 text-white"
          >
            Three questions.<br />
            <span className="italic text-[#C9A227]">Perfect match.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto"
          >
            Guest scans the QR code. Answers three simple questions about mood, flavor, and hunger.
            Gets three perfect recommendations in under 15 seconds.
          </motion.p>
        </div>
      </section>

      {/* Section 4: How it works - Menu style cards */}
      <section id="how-it-works" className="py-20 md:py-32 px-6 md:px-8 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16 md:mb-20"
          >
            <p className="text-[#7D8471] uppercase tracking-[0.2em] text-sm mb-4">How It Works</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#1a1a1a]">The Experience</h2>
          </motion.div>

          {/* Step cards - styled like menu items */}
          <div className="space-y-6 md:space-y-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 p-6 md:p-8 border-b border-[#1a1a1a]/10 group hover:bg-[#1a1a1a]/[0.02] transition-colors"
              >
                <span className="text-[#1a1a1a]/20 font-serif text-4xl md:text-6xl md:w-24">{step.num}</span>
                <span className="text-3xl md:text-4xl md:w-16">{step.icon}</span>
                <div className="flex-1">
                  <h3 className="font-serif text-2xl md:text-3xl text-[#1a1a1a] mb-2">{step.title}</h3>
                  <p className="text-[#1a1a1a]/70">{step.desc}</p>
                </div>
                <div className="text-[#722F37] opacity-0 group-hover:opacity-100 transition-opacity hidden md:block text-2xl">
                  →
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: For Operators - Split */}
      <section className="py-20 md:py-32 px-6 md:px-8 bg-[#F5F3EF]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16 md:mb-20"
          >
            <p className="text-[#722F37] uppercase tracking-[0.2em] text-sm mb-4">For Operators</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#1a1a1a]">Finally, real answers</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {operatorFeatures.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-white p-6 md:p-8 rounded-2xl"
              >
                <h3 className="font-serif text-xl md:text-2xl text-[#1a1a1a] mb-3">{item.title}</h3>
                <p className="text-[#1a1a1a]/70">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Pricing - Clean, minimal */}
      <section id="pricing" className="py-20 md:py-32 px-6 md:px-8 bg-[#FDFBF7]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-[#7D8471] uppercase tracking-[0.2em] text-sm mb-4">Pricing</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#1a1a1a] mb-4">Simple & fair</h2>
            <p className="text-[#1a1a1a]/60">Start free. No credit card required.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Monthly Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border-2 border-[#1a1a1a]/10 rounded-2xl p-8 bg-white hover:border-[#1a1a1a]/20 transition-colors"
            >
              <p className="text-[#1a1a1a]/50 uppercase tracking-wider text-sm mb-4">Monthly</p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="font-serif text-5xl text-[#1a1a1a]">€295</span>
                <span className="text-[#1a1a1a]/40">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-[#1a1a1a]/70">
                {monthlyFeatures.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="text-[#7D8471]">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=monthly" className="block text-center py-3 border-2 border-[#1a1a1a] rounded-full text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition font-medium">
                Start free trial
              </Link>
            </motion.div>

            {/* Annual Card - HIGHLIGHTED */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-[#1a1a1a] text-white rounded-2xl p-8 relative"
            >
              <div className="absolute -top-3 right-8 bg-[#C9A227] text-[#1a1a1a] text-xs font-bold px-3 py-1 rounded-full">
                Save €552
              </div>
              <p className="text-white/50 uppercase tracking-wider text-sm mb-4">Annual</p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="font-serif text-5xl text-white">€249</span>
                <span className="text-white/40">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-white/70">
                {annualFeatures.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="text-[#C9A227]">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=annual" className="block text-center py-3 bg-white text-[#1a1a1a] rounded-full hover:bg-white/90 transition font-medium">
                Start free trial
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 7: About - Short */}
      <section className="py-20 md:py-32 px-6 md:px-8 bg-[#F5F3EF]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[#722F37] uppercase tracking-[0.2em] text-sm mb-4">Our Story</p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#1a1a1a] mb-6">Built by hospitality people</h2>
            <p className="text-base md:text-lg text-[#1a1a1a]/70 leading-relaxed mb-4">
              We&apos;ve worked the floor. We&apos;ve seen guests paralyzed by choice, servers repeating the same recommendations,
              and kitchens guessing what to prep.
            </p>
            <p className="text-base md:text-lg text-[#1a1a1a]/70 leading-relaxed">
              Mesa + Eatsight bridges the gap between what guests want and what you serve.
            </p>
            <p className="text-[#1a1a1a]/40 mt-8">Amsterdam 🇳🇱</p>
          </motion.div>
        </div>
      </section>

      {/* Section 8: Final CTA - Full bleed */}
      <section className="py-20 md:py-32 px-6 md:px-8 bg-[#722F37] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-6">
              Ready to understand<br />your guests?
            </h2>
            <p className="text-white/80 text-base md:text-lg mb-10">
              Set up in 15 minutes. See insights from day one.
            </p>
            <Link href="/signup" className="inline-block bg-white text-[#722F37] px-10 py-4 rounded-full text-lg font-medium hover:bg-white/90 transition">
              Start your free trial
            </Link>
            <p className="text-white/60 text-sm mt-6">14 days free • No credit card</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 md:py-12 px-6 md:px-8 bg-[#1a1a1a] text-white/60">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-serif text-xl text-white">Eatsight</div>
          <div className="flex gap-6 md:gap-8 text-sm">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="mailto:hello@eatsight.io" className="hover:text-white transition">Contact</a>
          </div>
          <div className="text-sm">© 2026 Eatsight</div>
        </div>
      </footer>
    </div>
  )
}
