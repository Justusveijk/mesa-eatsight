'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface RecommendationCardProps {
  item: {
    id: string
    name: string
    description?: string | null
    price: number
    tags?: string[]
    reason?: string
  }
  pairing?: {
    name: string
    price: number
  }
}

export function RecommendationCard({ item, pairing }: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false)

  // Format tags for display
  const displayTags = item.tags?.slice(0, 3).map(tag =>
    tag.replace('mood_', '').replace('flavor_', '').replace('portion_', '').replace('_', ' ')
  ) || []

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl border border-[#1a1a1a]/5 overflow-hidden shadow-sm"
    >
      {/* Main card - clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left flex items-start justify-between gap-4"
      >
        <div className="flex-1">
          <h3 className="font-medium text-[#1a1a1a] text-lg">{item.name}</h3>
          {item.reason && (
            <p className="text-sm text-[#1a1a1a]/50 mt-1">{item.reason}</p>
          )}
          {displayTags.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {displayTags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-[#FDFBF7] text-[#1a1a1a]/60 rounded-full capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[#722F37] font-semibold text-lg">€{item.price}</span>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={20} className="text-[#1a1a1a]/30" />
          </motion.div>
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 border-t border-[#1a1a1a]/5">
              {/* Description */}
              {item.description && (
                <p className="text-[#1a1a1a]/60 text-sm mt-4">
                  {item.description}
                </p>
              )}

              {/* Pairing suggestion */}
              {pairing && (
                <div className="mt-4 p-3 bg-[#722F37]/5 rounded-xl">
                  <p className="text-xs text-[#722F37] font-medium mb-1">
                    💡 Pairs well with
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-[#1a1a1a]">{pairing.name}</span>
                    <span className="text-[#722F37] font-medium">€{pairing.price}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
