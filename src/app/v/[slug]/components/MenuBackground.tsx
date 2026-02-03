'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface MenuItem {
  id: string
  name: string
  price: number
}

interface MenuBackgroundProps {
  items: MenuItem[]
  filterProgress: number
  flowState: string
}

export function MenuBackground({ items, filterProgress, flowState }: MenuBackgroundProps) {
  // Create floating card positions
  const cards = useMemo(() => {
    return items.slice(0, 20).map((item, i) => ({
      ...item,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: (Math.random() - 0.5) * 30,
      scale: 0.6 + Math.random() * 0.4,
      delay: i * 0.1,
    }))
  }, [items])

  // Calculate how many cards to "fade out" based on progress
  const visibleCount = Math.max(
    3,
    Math.floor(cards.length * (1 - filterProgress / 100))
  )

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FDFBF7]/80 via-[#FDFBF7]/60 to-[#FDFBF7] z-10" />

      {/* Floating cards */}
      {cards.map((card, i) => {
        const isVisible = i < visibleCount || flowState === 'welcome'

        return (
          <motion.div
            key={card.id}
            initial={{
              x: `${card.x}vw`,
              y: `${card.y}vh`,
              rotate: card.rotation,
              scale: card.scale,
              opacity: 0,
            }}
            animate={{
              opacity: isVisible ? 0.15 : 0,
              y: flowState === 'processing'
                ? ['0vh', '-100vh']
                : `${card.y}vh`,
              scale: isVisible ? card.scale : 0,
            }}
            transition={{
              opacity: { duration: 0.5 },
              y: flowState === 'processing'
                ? { duration: 2, delay: i * 0.1 }
                : { duration: 0 },
              scale: { duration: 0.3 },
            }}
            className="absolute w-40 h-24 rounded-xl bg-white shadow-lg flex flex-col justify-center px-4"
          >
            <div className="text-xs font-medium text-mesa-charcoal truncate">
              {card.name}
            </div>
            <div className="text-xs text-mesa-charcoal/40 mt-1">
              €{card.price.toFixed(2)}
            </div>
          </motion.div>
        )
      })}

      {/* Particles during processing */}
      {flowState === 'processing' && (
        <>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              initial={{
                x: '50%',
                y: '50%',
                scale: 0,
              }}
              animate={{
                x: `${30 + Math.random() * 40}%`,
                y: `${30 + Math.random() * 40}%`,
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                repeat: Infinity,
              }}
              className="absolute w-2 h-2 rounded-full bg-mesa-burgundy/30"
            />
          ))}
        </>
      )}
    </div>
  )
}
