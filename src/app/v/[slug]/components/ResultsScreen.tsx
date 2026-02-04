'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Heart,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Star,
  Utensils,
  Wine,
  Check,
  Mail,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { trackEvent } from '@/lib/analytics'
import { ShareButton } from './ShareButton'
import type { RecommendedItem } from '@/lib/recommendations'
import type { DrinkUpsell } from '@/lib/upsells'

interface ResultsScreenProps {
  venue: { name: string; slug?: string }
  venueId?: string
  sessionId?: string | null
  recommendations: RecommendedItem[]
  selectionType?: 'food' | 'drink' | 'both'
  drinkRecommendations?: RecommendedItem[]
  upsellDrink?: DrinkUpsell | null
  hasFallbacks?: boolean
  onRestart: () => void
  onItemLike?: (item: RecommendedItem) => void
}

export function ResultsScreen({
  venue,
  venueId,
  sessionId,
  recommendations,
  selectionType = 'food',
  drinkRecommendations = [],
  upsellDrink,
  hasFallbacks = false,
  onRestart,
  onItemLike,
}: ResultsScreenProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [upsellExpanded, setUpsellExpanded] = useState(false)
  const [upsellLiked, setUpsellLiked] = useState(false)

  const toggleLike = (item: RecommendedItem) => {
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

  const handleUpsellLike = async () => {
    setUpsellLiked(!upsellLiked)
    if (!upsellLiked && venueId && sessionId && upsellDrink) {
      await trackEvent(venueId, sessionId, 'upsell_liked', {
        item_id: upsellDrink.id,
        item_name: upsellDrink.name,
      })
    }
  }

  const handleUpsellClick = async () => {
    if (venueId && sessionId && upsellDrink) {
      await trackEvent(venueId, sessionId, 'upsell_clicked', {
        item_id: upsellDrink.id,
        item_name: upsellDrink.name,
        price: upsellDrink.price,
      })
    }
    setUpsellExpanded(true)
  }

  // For "both" mode, filter food-only recommendations (exclude cross-sells)
  const foodRecs = selectionType === 'both'
    ? recommendations.filter(r => !r.isCrossSell)
    : recommendations
  const topPick = foodRecs[0]
  const otherPicks = foodRecs.slice(1)

  // Infer type from tags
  const getItemType = (item: RecommendedItem): 'food' | 'drink' => {
    const tags = item.tags || []
    if (tags.some(t => (t as string).startsWith('drink_'))) return 'drink'
    return 'food'
  }

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

      {/* Fallback message when no exact matches */}
      {hasFallbacks && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mx-6 mb-6 p-4 bg-amber-50 border border-amber-200/60 rounded-xl"
        >
          <p className="text-sm text-amber-800">
            We couldn&apos;t find an exact match for all your preferences, but here are some close alternatives we think you&apos;ll enjoy.
          </p>
        </motion.div>
      )}

      {/* Food section label for "both" mode */}
      {selectionType === 'both' && foodRecs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="px-6 mb-3"
        >
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-mesa-charcoal/40 uppercase tracking-wide">
              Your food picks
            </p>
          </div>
        </motion.div>
      )}

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
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center ${
                      getItemType(topPick) === 'food'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {getItemType(topPick) === 'food'
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

                <div className="text-right ml-4 flex-shrink-0">
                  <p className="text-2xl font-semibold text-mesa-burgundy tabular-nums">
                    &euro;{topPick.price.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Reason badge */}
              {topPick.reason && (
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-mesa-burgundy/10 text-mesa-burgundy rounded-full">
                    {topPick.reason}
                  </span>
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

      {/* Other Food Picks */}
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
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        getItemType(item) === 'food'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {getItemType(item) === 'food'
                          ? <Utensils className="w-4 h-4" />
                          : <Wine className="w-4 h-4" />
                        }
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-medium text-mesa-charcoal truncate">{item.name}</h4>
                        <p className="text-sm text-mesa-charcoal/40 truncate">
                          {item.reason || item.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className="font-semibold text-mesa-burgundy tabular-nums">
                        &euro;{item.price.toFixed(2)}
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

                          {item.isCrossSell && (
                            <span className="inline-block px-2 py-0.5 text-xs bg-purple-50 text-purple-600 rounded-full mb-3">
                              Drink pairing
                            </span>
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

      {/* Drink Recommendations - "Both" mode */}
      {selectionType === 'both' && drinkRecommendations.length > 0 && (
        <div className="mt-8">
          <div className="px-6 flex items-center gap-2 mb-4">
            <Wine className="w-4 h-4 text-purple-500" />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-sm text-mesa-charcoal/40 uppercase tracking-wide"
            >
              And to drink
            </motion.p>
          </div>
          <div className="px-6 space-y-3">
            {drinkRecommendations.map((drink, i) => (
              <motion.div
                key={drink.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                className="mesa-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Wine className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-mesa-charcoal truncate">{drink.name}</h4>
                    <p className="text-sm text-mesa-charcoal/50 truncate">{drink.reason || drink.category}</p>
                  </div>
                  <p className="font-semibold text-purple-600 tabular-nums flex-shrink-0">&euro;{drink.price.toFixed(2)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Drink Pairing Upsell - food-only mode (Interactive) */}
      {selectionType === 'food' && upsellDrink && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="px-6 mt-8"
        >
          <p className="text-sm text-mesa-charcoal/40 uppercase tracking-wide mb-3">
            Perfect pairing
          </p>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="mesa-card p-4 border-2 border-purple-200/50 relative overflow-hidden cursor-pointer"
            onClick={() => setUpsellExpanded(!upsellExpanded)}
          >
            {/* Suggested badge */}
            <div className="absolute top-0 right-0">
              <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-medium rounded-bl-lg">
                SUGGESTED
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                <Wine className="w-7 h-7 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-mesa-charcoal text-lg">{upsellDrink.name}</h4>
                <p className="text-sm text-mesa-charcoal/50">{upsellDrink.reason}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xl font-semibold text-purple-600 tabular-nums">
                  &euro;{upsellDrink.price.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Expanded details */}
            <AnimatePresence>
              {upsellExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-purple-100">
                    {upsellDrink.description && (
                      <p className="text-sm text-mesa-charcoal/70 mb-4">
                        {upsellDrink.description}
                      </p>
                    )}

                    {upsellDrink.tags && upsellDrink.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {upsellDrink.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full"
                          >
                            {tag.replace(/_/g, ' ').replace('drink ', '')}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpsellLike()
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                          upsellLiked
                            ? 'bg-pink-500 text-white'
                            : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${upsellLiked ? 'fill-current' : ''}`} />
                        <span className="text-sm font-medium">
                          {upsellLiked ? 'Saved!' : 'Save for later'}
                        </span>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUpsellClick()
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                      >
                        <span className="text-sm font-medium">Add to order</span>
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expand indicator */}
            <div className="flex justify-center mt-2">
              <motion.div
                animate={{ rotate: upsellExpanded ? 180 : 0 }}
                className="text-purple-400"
              >
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Liked items summary */}
      {(likedIds.size > 0 || upsellLiked) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-6 p-4 bg-red-50 rounded-2xl text-center"
        >
          <p className="text-red-600 font-medium flex items-center justify-center gap-2">
            <Heart className="w-4 h-4 fill-current" />
            {likedIds.size + (upsellLiked ? 1 : 0)} item{(likedIds.size + (upsellLiked ? 1 : 0)) !== 1 ? 's' : ''} saved
          </p>
        </motion.div>
      )}

      {/* Mesa App Waitlist */}
      <MesaWaitlist />

      {/* Bottom Actions - Fixed */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent safe-area-inset-bottom"
      >
        <div className="max-w-md mx-auto flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-full bg-white border border-mesa-charcoal/10 text-mesa-charcoal font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Start Over
          </button>
          <ShareButton
            venueName={venue.name}
            venueSlug={venue.slug || ''}
            recommendations={recommendations}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}

function MesaWaitlist() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || submitting) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      await supabase.from('app_waitlist').insert({ email })
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1 }}
      className="mx-6 mt-8 mb-4"
    >
      <div className="mesa-card p-5 text-center">
        <div className="w-10 h-10 rounded-full bg-mesa-burgundy/10 flex items-center justify-center mx-auto mb-3">
          <Mail className="w-5 h-5 text-mesa-burgundy" />
        </div>
        <h3 className="font-serif text-lg text-mesa-charcoal mb-1">
          Love this experience?
        </h3>
        <p className="text-sm text-mesa-charcoal/50 mb-4">
          Get the Mesa app when it launches &mdash; personalised picks at every restaurant.
        </p>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 py-3 bg-green-50 rounded-xl"
          >
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">You&apos;re on the list!</span>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-4 py-3 text-sm bg-white border border-mesa-charcoal/10 rounded-xl text-mesa-charcoal placeholder:text-mesa-charcoal/30 focus:outline-none focus:border-mesa-burgundy/30 transition"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-3 text-sm font-medium bg-mesa-burgundy text-white rounded-xl hover:bg-mesa-burgundy/90 transition disabled:opacity-50 whitespace-nowrap"
            >
              {submitting ? '...' : 'Notify me'}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  )
}
