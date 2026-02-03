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
  // Create floating card positions (deterministic from item index)
  const cards = useMemo(() => {
    return items.slice(0, 20).map((item, i) => {
      // Use seeded pseudo-random based on index for deterministic layout
      const seed = (i * 2654435761) % 1000
      return {
        ...item,
        x: (seed % 100),
        y: ((seed * 3) % 100),
        rotation: ((seed % 60) - 30),
        scale: 0.6 + (seed % 40) / 100,
        delay: i * 0.1,
      }
    })
  }, [items])

  // Calculate how many cards to show based on filter progress
  const visibleCount = Math.max(
    3,
    Math.floor(cards.length * (1 - filterProgress / 100))
  )

  const isProcessing = flowState === 'processing'

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
              y: isProcessing
                ? [`${card.y}vh`, `${card.y - 5}vh`, `${card.y + 3}vh`]
                : `${card.y}vh`,
              rotate: isProcessing
                ? [card.rotation, card.rotation + 5, card.rotation - 3, card.rotation]
                : card.rotation,
              scale: isVisible
                ? isProcessing
                  ? [card.scale, card.scale * 1.05, card.scale * 0.95, card.scale]
                  : card.scale
                : 0,
            }}
            transition={{
              opacity: { duration: 0.5 },
              y: isProcessing
                ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.5 },
              rotate: isProcessing
                ? { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }
                : { duration: 0.3 },
              scale: isProcessing
                ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }
                : { duration: 0.3, type: 'spring' },
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
      {isProcessing && (
        <>
          {[...Array(20)].map((_, i) => {
            const angle = (i / 20) * Math.PI * 2
            const radius = 15 + (i % 3) * 8
            return (
              <motion.div
                key={`particle-${i}`}
                initial={{
                  x: '50vw',
                  y: '50vh',
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  x: `${50 + Math.cos(angle) * radius}vw`,
                  y: `${50 + Math.sin(angle) * radius}vh`,
                  scale: [0, 1, 0.5, 0],
                  opacity: [0, 0.6, 0.3, 0],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.15,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className="absolute w-2 h-2 rounded-full bg-mesa-burgundy/40"
              />
            )
          })}
        </>
      )}
    </div>
  )
}
