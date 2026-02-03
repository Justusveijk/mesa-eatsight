'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Heart,
  RefreshCw,
  Share2,
  ChevronDown,
  Star,
  Utensils,
  Wine,
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  tags?: string[]
  type: 'food' | 'drink'
}

interface ResultsScreenProps {
  venue: { name: string }
  recommendations: MenuItem[]
  onRestart: () => void
  onItemLike?: (item: MenuItem) => void
}

export function ResultsScreen({ venue, recommendations, onRestart, onItemLike }: ResultsScreenProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())

  const toggleLike = (item: MenuItem) => {
    setLikedIds(prev => {
      const next = new Set(prev)
      if (next.has(item.id)) {
        next.delete(item.id)
      } else {
        next.add(item.id)
        onItemLike?.(item)
      }
      return next
    })
  }

  const topPick = recommendations[0]
  const otherPicks = recommendations.slice(1)

  if (recommendations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center p-6"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-mesa-burgundy/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-mesa-burgundy" />
          </div>
          <h2 className="text-2xl font-serif text-mesa-charcoal mb-2">No matches found</h2>
          <p className="text-mesa-charcoal/50 mb-6">Try adjusting your preferences</p>
          <button onClick={onRestart} className="mesa-btn px-8 py-3">
            Start Over
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pb-24 relative z-10"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center pt-12 pb-8 px-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-mesa-burgundy to-mesa-terracotta flex items-center justify-center mx-auto mb-4"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-serif text-mesa-charcoal mb-2">
          Your Perfect Picks
        </h1>
        <p className="text-mesa-charcoal/50">
          Curated just for you at {venue.name}
        </p>
      </motion.div>

      {/* Top Pick - Featured */}
      {topPick && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-6 mb-6"
        >
          <div className="relative">
            {/* Featured badge */}
            <div className="absolute -top-3 left-6 z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className="flex items-center gap-1 px-3 py-1 bg-mesa-burgundy text-white text-xs font-medium rounded-full shadow-lg"
              >
                <Star className="w-3 h-3 fill-current" />
                Top Pick
              </motion.div>
            </div>

            {/* Card */}
            <div className="mesa-card p-6 pt-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center ${
                      topPick.type === 'food'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {topPick.type === 'food'
                        ? <Utensils className="w-3 h-3" />
                        : <Wine className="w-3 h-3" />
                      }
                    </span>
                    <span className="text-xs text-mesa-charcoal/40 uppercase tracking-wide">
                      {topPick.category}
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif text-mesa-charcoal mb-2">
                    {topPick.name}
                  </h3>
                  <p className="text-mesa-charcoal/60 leading-relaxed">
                    {topPick.description}
                  </p>
                </div>

                <div className="text-right ml-4">
                  <p className="text-2xl font-semibold text-mesa-burgundy tabular-nums">
                    €{topPick.price.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {topPick.tags && topPick.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {topPick.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs font-medium bg-mesa-cream text-mesa-charcoal/60 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-mesa-charcoal/5">
                <button
                  onClick={() => toggleLike(topPick)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
                    likedIds.has(topPick.id)
                      ? 'bg-red-50 text-red-600'
                      : 'bg-mesa-charcoal/5 text-mesa-charcoal/60 hover:bg-mesa-charcoal/10'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${likedIds.has(topPick.id) ? 'fill-current' : ''}`} />
                  {likedIds.has(topPick.id) ? 'Loved!' : 'Love this'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Other Picks */}
      {otherPicks.length > 0 && (
        <div className="px-6">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-mesa-charcoal/40 uppercase tracking-wide mb-4"
          >
            Also great for you
          </motion.p>

          <div className="space-y-3">
            {otherPicks.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
              >
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="w-full mesa-card p-4 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        item.type === 'food'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {item.type === 'food'
                          ? <Utensils className="w-4 h-4" />
                          : <Wine className="w-4 h-4" />
                        }
                      </span>
                      <div>
                        <h4 className="font-medium text-mesa-charcoal">{item.name}</h4>
                        <p className="text-sm text-mesa-charcoal/40">{item.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-mesa-burgundy tabular-nums">
                        €{item.price.toFixed(2)}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-mesa-charcoal/30 transition-transform ${
                        expandedId === item.id ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-mesa-charcoal/5">
                          <p className="text-mesa-charcoal/60 text-sm mb-3">
                            {item.description}
                          </p>

                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {item.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 text-xs bg-mesa-cream text-mesa-charcoal/60 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleLike(item)
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                              likedIds.has(item.id)
                                ? 'bg-red-50 text-red-600'
                                : 'bg-mesa-charcoal/5 text-mesa-charcoal/60'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${likedIds.has(item.id) ? 'fill-current' : ''}`} />
                            {likedIds.has(item.id) ? 'Loved!' : 'Love this'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Liked items summary */}
      {likedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-6 p-4 bg-red-50 rounded-2xl text-center"
        >
          <p className="text-red-600 font-medium flex items-center justify-center gap-2">
            <Heart className="w-4 h-4 fill-current" />
            {likedIds.size} item{likedIds.size !== 1 ? 's' : ''} saved
          </p>
        </motion.div>
      )}

      {/* Bottom Actions - Fixed */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent"
      >
        <div className="max-w-md mx-auto flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full bg-white border border-mesa-charcoal/10 text-mesa-charcoal font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Start Over
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full mesa-btn"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
