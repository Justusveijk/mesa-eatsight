'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Lightbulb } from 'lucide-react'

// Demo data
const demoMetrics = {
  scansToday: 47,
  scansWeek: 312,
  clickRate: 68,
  avgTime: '12s',
  topMoods: [
    { name: 'Comfort', percent: 38 },
    { name: 'Light', percent: 28 },
    { name: 'Treat', percent: 18 },
    { name: 'Protein', percent: 16 },
  ],
  topItems: [
    { name: 'Smoked Old Fashioned', clicks: 24 },
    { name: 'Truffle Fries', clicks: 19 },
    { name: 'Espresso Martini', clicks: 17 },
    { name: 'Bitterballen', clicks: 15 },
  ],
  unmetDemand: [
    { need: 'Vegan + Spicy', requests: 12 },
    { need: 'Gluten-free dessert', requests: 8 },
  ],
  recentActivity: [
    { time: '2 min ago', event: 'Table 7 scanned', mood: 'Comfort' },
    { time: '5 min ago', event: 'Clicked: Truffle Fries', table: '3' },
    { time: '8 min ago', event: 'Table 12 scanned', mood: 'Light' },
    { time: '12 min ago', event: 'Clicked: Espresso Martini', table: '7' },
  ]
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] as const }
  }
}

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Navigation */}
      <nav className="px-6 md:px-8 py-5 flex justify-between items-center border-b border-[#1a1a1a]/10">
        <Link href="/" className="font-serif text-2xl text-[#1a1a1a]">Eatsight</Link>
        <div className="flex gap-4 md:gap-8 items-center">
          <Link href="/v/bella-taverna" className="text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition">
            Guest Demo
          </Link>
          <Link href="/#pricing" className="text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition hidden md:block">
            Pricing
          </Link>
          <Link href="/signup" className="bg-[#722F37] text-white px-5 py-2 rounded-full hover:bg-[#5a252c] transition">
            Start free
          </Link>
        </div>
      </nav>

      {/* Demo Header */}
      <div className="px-6 md:px-8 py-12 border-b border-[#1a1a1a]/10">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-[#1a1a1a]/60 hover:text-[#1a1a1a] transition mb-6">
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <p className="text-[#722F37] uppercase tracking-[0.2em] text-sm mb-3">Demo Dashboard</p>
            <h1 className="font-serif text-4xl md:text-5xl text-[#1a1a1a] mb-4">
              See what you&apos;ll discover
            </h1>
            <p className="text-lg text-[#1a1a1a]/60 max-w-2xl">
              This is what your Eatsight dashboard would look like. Real-time insights into what your guests want.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Demo Dashboard Content */}
      <div className="px-6 md:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Metrics Grid */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeIn} className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5">
              <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-2">Scans Today</p>
              <p className="font-serif text-4xl text-[#1a1a1a]">{demoMetrics.scansToday}</p>
              <p className="text-sm text-[#7D8471] mt-1">↑ 12% vs yesterday</p>
            </motion.div>
            <motion.div variants={fadeIn} className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5">
              <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-2">This Week</p>
              <p className="font-serif text-4xl text-[#1a1a1a]">{demoMetrics.scansWeek}</p>
              <p className="text-sm text-[#1a1a1a]/50 mt-1">Total scans</p>
            </motion.div>
            <motion.div variants={fadeIn} className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5">
              <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-2">Click Rate</p>
              <p className="font-serif text-4xl text-[#1a1a1a]">{demoMetrics.clickRate}%</p>
              <p className="text-sm text-[#7D8471] mt-1">Great engagement</p>
            </motion.div>
            <motion.div variants={fadeIn} className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5">
              <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-2">Avg. Time to Rec</p>
              <p className="font-serif text-4xl text-[#1a1a1a]">{demoMetrics.avgTime}</p>
              <p className="text-sm text-[#1a1a1a]/50 mt-1">Fast & easy</p>
            </motion.div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Top Moods */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
            >
              <h3 className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-6">Top Moods Today</h3>
              <div className="space-y-4">
                {demoMetrics.topMoods.map((mood) => (
                  <div key={mood.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#1a1a1a]">{mood.name}</span>
                      <span className="text-[#1a1a1a]/50">{mood.percent}%</span>
                    </div>
                    <div className="h-2 bg-[#1a1a1a]/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#722F37] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${mood.percent}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Most Clicked */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
            >
              <h3 className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-6">Most Clicked Items</h3>
              <div className="space-y-4">
                {demoMetrics.topItems.map((item, i) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-[#1a1a1a]/30 font-mono text-sm">{i + 1}</span>
                      <span className="text-[#1a1a1a]">{item.name}</span>
                    </div>
                    <span className="text-[#722F37] font-medium">{item.clicks}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Unmet Demand */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
            >
              <h3 className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-2">Unmet Demand</h3>
              <p className="text-xs text-[#1a1a1a]/40 mb-6">What guests wanted but couldn&apos;t find</p>
              <div className="space-y-4">
                {demoMetrics.unmetDemand.map((item) => (
                  <div key={item.need} className="flex justify-between items-center p-3 bg-[#722F37]/5 rounded-xl">
                    <span className="text-[#1a1a1a]/80">{item.need}</span>
                    <span className="text-[#722F37] font-medium">{item.requests} requests</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#1a1a1a]/40 mt-4 italic flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> Add these to capture more orders
              </p>
            </motion.div>
          </div>

          {/* Live Activity */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="mt-8 bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs uppercase tracking-wider text-[#1a1a1a]/40">Live Activity</h3>
              <span className="flex items-center gap-2 text-xs text-[#1a1a1a]/40">
                <span className="w-2 h-2 bg-[#722F37] rounded-full animate-pulse" />
                Live (demo)
              </span>
            </div>
            <div className="space-y-3">
              {demoMetrics.recentActivity.map((activity, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 p-3 bg-[#FDFBF7] rounded-xl"
                >
                  <span className="text-xs text-[#1a1a1a]/40 w-20">{activity.time}</span>
                  <span className="text-[#1a1a1a]">{activity.event}</span>
                  {activity.mood && (
                    <span className="text-xs bg-[#722F37]/10 text-[#722F37] px-2 py-1 rounded-full">
                      {activity.mood}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="mt-12 text-center"
          >
            <p className="text-[#1a1a1a]/60 mb-6">
              Ready to see this data for your restaurant?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-[#1a1a1a] text-white px-8 py-4 rounded-full text-lg hover:bg-[#333] transition">
                Start your free trial
                <ArrowRight size={20} />
              </Link>
              <Link href="/v/bella-taverna" className="inline-flex items-center justify-center gap-2 border-2 border-[#1a1a1a] text-[#1a1a1a] px-8 py-4 rounded-full text-lg hover:bg-[#1a1a1a] hover:text-white transition">
                Try guest experience
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
