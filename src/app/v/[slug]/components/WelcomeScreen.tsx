'use client'

import { motion } from 'framer-motion'
import { Sparkles, Clock, ChefHat } from 'lucide-react'

interface WelcomeScreenProps {
  venue: {
    name: string
    type?: string
  }
  itemCount: number
  onStart: () => void
}

export function WelcomeScreen({ venue, itemCount, onStart }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col justify-between p-6 relative z-10"
    >
      {/* Top section - Venue branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center pt-8"
      >
        <p className="text-mesa-burgundy/60 text-sm font-medium tracking-wide uppercase">
          Welcome to
        </p>
      </motion.div>

      {/* Center section - Main content */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-16">
        {/* Venue name - Apple-style large typography */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-5xl md:text-7xl font-serif text-mesa-charcoal text-center leading-tight mb-6"
        >
          {venue.name}
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xl md:text-2xl text-mesa-charcoal/60 text-center max-w-md mb-12"
        >
          Let us find you something
          <br />
          <span className="text-mesa-burgundy font-medium">you&apos;ll love</span>
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex items-center justify-center gap-8 mb-12"
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-mesa-burgundy mb-1">
              <ChefHat className="w-4 h-4" />
              <span className="text-2xl font-semibold tabular-nums">{itemCount}</span>
            </div>
            <p className="text-xs text-mesa-charcoal/40 uppercase tracking-wide">Dishes</p>
          </div>
          <div className="w-px h-8 bg-mesa-charcoal/10" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-mesa-burgundy mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-2xl font-semibold">2</span>
            </div>
            <p className="text-xs text-mesa-charcoal/40 uppercase tracking-wide">Minutes</p>
          </div>
        </motion.div>

        {/* CTA Button - Large, inviting */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: 'spring' }}
          onClick={onStart}
          className="mesa-btn px-12 py-5 text-lg flex items-center gap-3 group"
        >
          <span>Discover My Perfect Dish</span>
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </motion.button>
      </div>

      {/* Bottom - Subtle indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-center pb-8"
      >
        <p className="text-xs text-mesa-charcoal/30">
          Powered by Mesa
        </p>
      </motion.div>
    </motion.div>
  )
}
