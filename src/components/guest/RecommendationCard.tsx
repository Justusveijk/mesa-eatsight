'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Heart, Lightbulb } from 'lucide-react'

interface RecommendationCardProps {
  item: {
    id: string
    name: string
    description?: string | null
    price: number
    category?: string
    type?: string
    tags?: string[]
    reason?: string
  }
  pairing?: {
    name: string
    price: number
  }
  onSelect?: (item: RecommendationCardProps['item']) => void
  onExpand?: (item: RecommendationCardProps['item']) => void
  isSelected?: boolean
}

export function RecommendationCard({
  item,
  pairing,
  onSelect,
  onExpand,
  isSelected = false
}: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [localSelected, setLocalSelected] = useState(isSelected)

  // Format tags for display
  const displayTags = item.tags?.slice(0, 3).map(tag =>
    tag.replace('mood_', '').replace('flavor_', '').replace('portion_', '').replace('_', ' ')
  ) || []

  const handleExpand = () => {
    const newExpanded = !expanded
    setExpanded(newExpanded)
    if (newExpanded && onExpand) {
      onExpand(item)
    }
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation() // Don't trigger expand
    const newSelected = !localSelected
    setLocalSelected(newSelected)
    if (onSelect) {
      onSelect(item)
    }
  }

  return (
    <motion.div
      layout
      className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-colors ${
        localSelected
          ? 'border-[#722F37]'
          : 'border-[#1a1a1a]/5 hover:border-[#1a1a1a]/10'
      }`}
    >
      {/* Main card - clickable for expand */}
      <div className="p-5 flex items-start justify-between gap-4">
        {/* Item info - clickable to expand */}
        <button
          onClick={handleExpand}
          className="flex-1 text-left"
        >
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
        </button>

        {/* Right side - price, heart, expand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[#722F37] font-semibold text-lg">€{item.price}</span>

          {/* Heart/Select button */}
          <button
            onClick={handleSelect}
            aria-label={localSelected ? "Remove from picks" : "Add to picks"}
            className={`p-2 rounded-full transition-all ${
              localSelected
                ? 'bg-[#722F37] text-white scale-110'
                : 'bg-[#F5F3EF] text-[#1a1a1a]/40 hover:text-[#722F37] hover:bg-[#722F37]/10'
            }`}
          >
            <Heart
              size={20}
              fill={localSelected ? 'currentColor' : 'none'}
              className="transition-transform"
            />
          </button>

          {/* Expand button */}
          <button
            onClick={handleExpand}
            aria-label={expanded ? "Show less" : "Show more"}
            className="p-2 rounded-full bg-[#F5F3EF] text-[#1a1a1a]/30 hover:text-[#1a1a1a]/50 transition"
          >
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={20} />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Selected indicator */}
      {localSelected && (
        <div className="px-5 pb-3 -mt-2">
          <span className="text-xs text-[#722F37] font-medium">
            ✓ Added to your picks
          </span>
        </div>
      )}

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
                  <p className="text-xs text-[#722F37] font-medium mb-1 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> Pairs well with
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
