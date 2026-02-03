'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Sparkles, Check } from 'lucide-react'

// ChefHat icon (lucide-react may not have it; inline SVG fallback)
function ChefHatIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.646-7.544 6 6 0 0 0-11.142 0A4 4 0 0 0 2.32 14.61c.411.197.68.584.68 1.04V20a1 1 0 0 0 1 1z" />
      <path d="M6 17h12" />
    </svg>
  )
}

interface ProcessingScreenProps {
  itemCount: number
}

const stages = [
  { icon: Search, label: 'Scanning the menu...' },
  { icon: ChefHatIcon, label: 'Analyzing your preferences...' },
  { icon: Sparkles, label: 'Finding perfect matches...' },
  { icon: Check, label: 'Preparing your picks!' },
]

export function ProcessingScreen({ itemCount }: ProcessingScreenProps) {
  const [stage, setStage] = useState(0)
  const [progress, setProgress] = useState(0)

  // Advance stages
  useEffect(() => {
    const timer = setInterval(() => {
      setStage(prev => (prev < stages.length - 1 ? prev + 1 : prev))
    }, 750)
    return () => clearInterval(timer)
  }, [])

  // Smooth progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100
        // Accelerate progress per stage
        const target = ((stage + 1) / stages.length) * 100
        const step = (target - prev) * 0.15 + 0.5
        return Math.min(prev + step, 100)
      })
    }, 30)
    return () => clearInterval(interval)
  }, [stage])

  const CurrentIcon = stages[stage].icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-6 relative z-10"
    >
      {/* Scanning line effect */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-mesa-burgundy/40 to-transparent"
        animate={{ y: ['-50vh', '50vh'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />

      <div className="text-center w-full max-w-xs">
        {/* Icon with spinning ring */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Spinning ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-mesa-burgundy/20 border-t-mesa-burgundy"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />

          {/* Inner glow */}
          <motion.div
            className="absolute inset-2 rounded-full bg-gradient-to-br from-mesa-burgundy/10 to-mesa-terracotta/10"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              key={stage}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <CurrentIcon className="w-8 h-8 text-mesa-burgundy" />
            </motion.div>
          </div>
        </div>

        {/* Stage text */}
        <motion.p
          key={stage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg text-mesa-charcoal font-medium mb-2"
        >
          {stages[stage].label}
        </motion.p>

        <p className="text-sm text-mesa-charcoal/40 mb-6">
          Searching through {itemCount} items
        </p>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-mesa-charcoal/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-mesa-burgundy to-mesa-terracotta rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Stage dots */}
        <div className="flex items-center justify-center gap-3 mt-6">
          {stages.map((_, i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                i <= stage ? 'bg-mesa-burgundy' : 'bg-mesa-charcoal/10'
              }`}
              animate={{ scale: i === stage ? 1.3 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
