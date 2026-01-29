'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md text-center"
      >
        <div className="text-6xl mb-6">🍽️</div>
        <h1 className="font-serif text-4xl text-[#1a1a1a] mb-4">
          Try the Mesa Experience
        </h1>
        <p className="text-[#1a1a1a]/60 mb-8">
          See how guests discover their perfect dish in under 15 seconds.
          This demo uses our sample restaurant &quot;Bella Taverna&quot;.
        </p>
        <Link
          href="/v/bella-taverna"
          className="inline-block bg-[#B2472A] text-white px-8 py-4 rounded-full text-lg hover:bg-[#8a341f] transition"
        >
          Start the demo →
        </Link>
        <p className="text-[#1a1a1a]/40 text-sm mt-6">
          Want this for your restaurant? <Link href="/signup" className="underline hover:text-[#1a1a1a]">Sign up free</Link>
        </p>
      </motion.div>
    </div>
  )
}
