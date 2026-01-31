'use client'

import { useRef } from 'react'
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

// Luxury animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.4, 0.25, 1] as const
    }
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
}

const fadeInItem = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1] as const
    }
  }
}

export default function LandingPage() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Parallax transforms
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -100])
  const menuCardsY = useTransform(scrollYProgress, [0, 0.2], [0, 50])
  const solutionGlowScale = useTransform(scrollYProgress, [0.2, 0.4], [0.8, 1.2])
  const solutionGlowOpacity = useTransform(scrollYProgress, [0.2, 0.35, 0.5], [0, 0.5, 0])

  return (
    <div ref={containerRef} className="bg-[#FDFBF7]">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex justify-between items-center bg-[#FDFBF7]/90 backdrop-blur-sm border-b border-[#1a1a1a]/5">
        <Link href="/" className="font-serif text-xl sm:text-2xl text-[#1a1a1a]">Eatsight</Link>
        <div className="flex gap-3 sm:gap-4 md:gap-8 items-center">
          <a href="#how-it-works" className="text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition hidden md:block">How it works</a>
          <a href="#pricing" className="text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition hidden md:block">Pricing</a>
          <Link href="/faq" className="text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition hidden md:block">FAQ</Link>
          <Link href="/login" className="text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition text-sm sm:text-base">Log in</Link>
          <Link href="/signup" className="bg-[#722F37] text-white px-4 sm:px-5 py-2 rounded-full hover:bg-[#5a252c] transition text-sm">
            Start free
          </Link>
        </div>
      </nav>

      {/* Hero with parallax */}
      <motion.section
        style={{ opacity: heroOpacity, y: heroY }}
        className="h-screen flex items-center justify-center relative overflow-hidden pt-16"
      >
        {/* Background menu cards with parallax */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ y: menuCardsY }}
        >
          <motion.div
            initial={{ opacity: 0, rotate: -15, x: -50 }}
            animate={{ opacity: 0.25, rotate: -12, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="absolute top-[15%] left-[8%] bg-white p-4 rounded-lg shadow-lg w-48 text-xs text-gray-400 font-mono"
          >
            <div className="font-bold mb-2 text-[#722F37]/50">Today&apos;s Specials</div>
            <div>Grilled Salmon............€24</div>
            <div>Pasta Carbonara..........€18</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, rotate: 12, x: 50 }}
            animate={{ opacity: 0.25, rotate: 8, x: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="absolute top-[20%] right-[10%] bg-white p-4 rounded-lg shadow-lg w-52 text-xs text-gray-400 font-mono"
          >
            <div className="font-bold mb-2 text-[#722F37]/50">DRINKS</div>
            <div>House Red.................€7</div>
            <div>Craft Beer................€6</div>
            <div>Espresso Martini.........€12</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, rotate: 8, y: 50 }}
            animate={{ opacity: 0.25, rotate: 5, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="absolute bottom-[25%] left-[12%] bg-white p-4 rounded-lg shadow-lg w-44 text-xs text-gray-400 font-mono"
          >
            <div className="font-bold mb-2 text-[#722F37]/50">MAINS</div>
            <div>Ribeye Steak.............€32</div>
            <div>Fish & Chips.............€19</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, rotate: -12, y: 50 }}
            animate={{ opacity: 0.25, rotate: -8, y: 0 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="absolute bottom-[20%] right-[15%] bg-white p-4 rounded-lg shadow-lg w-40 text-xs text-gray-400 font-mono"
          >
            <div className="font-bold mb-2 text-[#722F37]/50">DESSERTS</div>
            <div>Tiramisu..................€8</div>
            <div>Chocolate Lava...........€9</div>
          </motion.div>
        </motion.div>

        {/* Hero content */}
        <div className="text-center px-4 sm:px-6 md:px-8 max-w-4xl relative z-20">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#1a1a1a] leading-tight mb-6"
          >
            Your menu,<br />
            <span className="italic">personally served</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-lg sm:text-xl md:text-2xl text-[#1a1a1a]/70 max-w-3xl mx-auto font-light"
          >
            Menus are bigger than ever. Attention is lower than ever.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
            className="mt-2 text-base sm:text-lg text-[#1a1a1a]/60 max-w-2xl mx-auto mb-8 sm:mb-10"
          >
            Eatsight turns menus into decisions, and decisions into revenue.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4"
          >
            <Link href="/v/bella-taverna" className="inline-block bg-[#B2472A] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-medium hover:bg-[#8a341f] transition">
              Try the demo
            </Link>
            <Link href="#pricing" className="inline-block border-2 border-[#1a1a1a]/20 text-[#1a1a1a] px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg hover:border-[#1a1a1a]/40 transition">
              View pricing
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
      </motion.section>

      {/* Value Proposition Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
          >
            {/* Left side - for guests */}
            <motion.div variants={fadeInItem} className="text-center md:text-left">
              <div className="inline-block px-3 py-1 bg-[#B2472A]/10 text-[#B2472A] rounded-full text-sm font-medium mb-4">
                Mesa · For Guests
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif text-[#1a1a1a] mb-4">
                Find what you&apos;ll love
              </h3>
              <p className="text-[#1a1a1a]/60">
                Answer a few quick questions and discover dishes perfectly matched to your mood, cravings, and dietary needs. No more menu paralysis.
              </p>
            </motion.div>

            {/* Right side - for operators */}
            <motion.div variants={fadeInItem} className="text-center md:text-left">
              <div className="inline-block px-3 py-1 bg-[#1e3a5f]/10 text-[#1e3a5f] rounded-full text-sm font-medium mb-4">
                Eatsight · For Operators
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif text-[#1a1a1a] mb-4">
                See what guests crave
              </h3>
              <p className="text-[#1a1a1a]/60">
                Turn guest preferences into actionable insights. Know what&apos;s trending, what&apos;s missing, and what drives revenue — all in real time.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Social Proof Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#1a1a1a] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <blockquote className="text-xl sm:text-2xl md:text-3xl font-serif italic mb-6">
              &ldquo;Eatsight helps venues turn indecision into higher conversion by guiding guests to the right choices.&rdquo;
            </blockquote>
            <p className="text-white/60">
              — The Mesa Team
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-3 gap-8 mt-12 pt-12 border-t border-white/10"
          >
            <motion.div variants={fadeInItem}>
              <div className="text-3xl sm:text-4xl font-serif">3</div>
              <div className="text-white/60 text-sm mt-1">Questions</div>
            </motion.div>
            <motion.div variants={fadeInItem}>
              <div className="text-3xl sm:text-4xl font-serif">10s</div>
              <div className="text-white/60 text-sm mt-1">To discover</div>
            </motion.div>
            <motion.div variants={fadeInItem}>
              <div className="text-3xl sm:text-4xl font-serif">∞</div>
              <div className="text-white/60 text-sm mt-1">Happy guests</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section - Animates in on scroll */}
      <section className="min-h-screen flex items-center py-20 md:py-32 px-6 md:px-8 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
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
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-[#1a1a1a]/5 border border-[#1a1a1a]/5">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-4 text-[#1a1a1a]/50 font-mono text-sm"
              >
                {[
                  { label: 'Menu items', value: '47' },
                  { label: 'Average decision time', value: '4+ min' },
                  { label: 'Guests who ask server', value: '68%' },
                  { label: 'Orders that match preference', value: '~40%', highlight: true },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInItem}
                    className={`flex justify-between pb-2 ${i < 3 ? 'border-b border-dashed border-[#1a1a1a]/10' : ''}`}
                  >
                    <span>{item.label}</span>
                    <span className={item.highlight ? 'text-[#722F37] font-medium' : 'text-[#1a1a1a]/70'}>{item.value}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="min-h-screen flex items-center justify-center bg-[#1a1a1a] text-white py-20 md:py-32 px-6 md:px-8 relative overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#722F37]/20 rounded-full blur-3xl"
          style={{
            scale: solutionGlowScale,
            opacity: solutionGlowOpacity
          }}
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.p variants={fadeInUp} className="text-white/60 uppercase tracking-[0.2em] md:tracking-[0.3em] text-xs md:text-sm mb-8">
            The Solution
          </motion.p>
          <motion.h2 variants={fadeInUp} className="font-serif text-4xl md:text-6xl lg:text-7xl leading-tight mb-8 text-white">
            Three questions.<br />
            <span className="italic text-[#F5F3EF]">Perfect match.</span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
            Guest scans the QR code. Answers three simple questions about mood, flavor, and hunger.
            Gets three perfect recommendations in under 15 seconds.
          </motion.p>
        </motion.div>
      </section>

      {/* How It Works - Staggered animation */}
      <section id="how-it-works" className="py-20 md:py-32 px-6 md:px-8 bg-[#FDFBF7]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16 md:mb-20"
          >
            <p className="text-[#7D8471] uppercase tracking-[0.2em] text-sm mb-4">How It Works</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#1a1a1a]">The Experience</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="space-y-6 md:space-y-8"
          >
            {steps.map((step) => (
              <motion.div
                key={step.num}
                variants={fadeInItem}
                className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 p-6 md:p-8 border-b border-[#1a1a1a]/10 group hover:bg-[#1a1a1a]/[0.02] transition-colors rounded-xl"
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
          </motion.div>
        </div>
      </section>

      {/* For Operators */}
      <section className="py-20 md:py-32 px-6 md:px-8 bg-[#F5F3EF]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16 md:mb-20"
          >
            <p className="text-[#722F37] uppercase tracking-[0.2em] text-sm mb-4">For Operators</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#1a1a1a]">Finally, real answers</h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-2 gap-6 md:gap-8"
          >
            {operatorFeatures.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeInItem}
                className="bg-white p-6 md:p-8 rounded-2xl"
              >
                <h3 className="font-serif text-xl md:text-2xl text-[#1a1a1a] mb-3">{item.title}</h3>
                <p className="text-[#1a1a1a]/70">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-32 px-6 md:px-8 bg-[#FDFBF7]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <p className="text-[#7D8471] uppercase tracking-[0.2em] text-sm mb-4">Pricing</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[#1a1a1a] mb-4">Simple & fair</h2>
            <p className="text-[#1a1a1a]/60">Start free. No credit card required.</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto"
          >
            {/* Monthly Card */}
            <motion.div
              variants={fadeInItem}
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

            {/* Annual Card */}
            <motion.div
              variants={fadeInItem}
              className="bg-[#722F37] text-white rounded-2xl p-8 relative"
            >
              <div className="absolute -top-3 right-8 bg-white text-[#722F37] text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                Save €552
              </div>
              <p className="text-white/70 uppercase tracking-wider text-sm mb-4">Annual</p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="font-serif text-5xl text-white">€249</span>
                <span className="text-white/60">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-white/90">
                {annualFeatures.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="text-white">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup?plan=annual" className="block text-center py-3 bg-white text-[#722F37] rounded-full hover:bg-white/90 transition font-medium">
                Start free trial
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 md:py-32 px-6 md:px-8 bg-[#F5F3EF]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
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

      {/* Team Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#1a1a1a] mb-4">
              The faces behind Mesa
            </h2>
            <p className="text-[#1a1a1a]/60 max-w-2xl mx-auto">
              We&apos;re a small team passionate about helping restaurants connect with their guests in a more personal way.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex justify-center"
          >
            {/* Founder */}
            <motion.div variants={fadeInItem} className="text-center max-w-xs">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-[#F5F3EF] overflow-hidden flex items-center justify-center text-4xl">
                👨‍💼
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
                className="inline-block mt-3 text-[#1a1a1a]/40 hover:text-[#722F37] transition"
                aria-label="Justus van Eijk on LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </motion.div>
          </motion.div>

          <div className="text-center mt-12">
            <p className="text-[#1a1a1a]/40 text-sm mb-4">Want to get in touch?</p>
            <a
              href="mailto:hello@eatsight.com"
              className="text-[#722F37] hover:text-[#5a252c] font-medium"
            >
              hello@eatsight.com
            </a>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-32 px-6 md:px-8 bg-[#722F37] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
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
      <footer className="bg-[#1a1a1a] text-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="font-serif text-2xl mb-4">Mesa</div>
              <p className="text-white/60 text-sm">
                Personalized menus for every guest.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/v/bella-taverna" className="hover:text-white transition">Try Demo</Link></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><Link href="/demo" className="hover:text-white transition">Dashboard Preview</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/about" className="hover:text-white transition">About</Link></li>
                <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><a href="mailto:hello@eatsight.com" className="hover:text-white transition">hello@eatsight.com</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">
              © 2026 Mesa & Eatsight. Made with ❤️ in Amsterdam.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com/eatsight.io" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition">
                @eatsight.io
              </a>
              <a href="https://instagram.com/mesa.menu" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition">
                @mesa.menu
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
