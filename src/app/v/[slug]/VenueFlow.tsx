'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { QuestionFlow, Intent } from '@/components/guest/QuestionFlow'
import { RecommendationCard } from '@/components/guest/RecommendationCard'
import { RecommendedItem } from '@/lib/recommendations'
import { createClient } from '@/lib/supabase/client'

interface Venue {
  id: string
  name: string
  slug: string
}

interface VenueFlowProps {
  venue: Venue
  tableRef: string | null
}

type Screen = 'loading' | 'empty' | 'landing' | 'intent' | 'questions' | 'recommendations'

export function VenueFlow({ venue, tableRef }: VenueFlowProps) {
  const [screen, setScreen] = useState<Screen>('loading')
  const [intent, setIntent] = useState<Intent>('both')
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([])
  const [showFallbackMessage, setShowFallbackMessage] = useState(false)
  const [unmetPreferences, setUnmetPreferences] = useState<string[]>([])
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  // Check if venue has menu items on load
  useEffect(() => {
    const checkMenu = async () => {
      const supabase = createClient()

      // Get the published menu for this venue
      const { data: menu } = await supabase
        .from('menus')
        .select('id')
        .eq('venue_id', venue.id)
        .eq('status', 'published')
        .single()

      if (!menu) {
        setScreen('empty')
        return
      }

      // Check if menu has available items
      const { count } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true })
        .eq('menu_id', menu.id)
        .eq('is_available', true)

      if (!count || count === 0) {
        setScreen('empty')
        return
      }

      setScreen('landing')
    }

    checkMenu()
  }, [venue.id])

  const handleStartQuestions = () => {
    setScreen('intent')
  }

  const handleIntentSelect = (selectedIntent: Intent) => {
    setIntent(selectedIntent)
    setScreen('questions')
  }

  const handleQuestionsComplete = (
    recs: RecommendedItem[],
    hasFallback?: boolean,
    unmet?: string[],
    feedback?: string | null
  ) => {
    console.log('🎯 VenueFlow handleQuestionsComplete received:')
    console.log('  Total recommendations:', recs.length)
    console.log('  Items:', recs.map(r => ({
      name: r.name,
      category: r.category,
      isCrossSell: r.isCrossSell,
      score: r.score
    })))

    setRecommendations(recs)
    setShowFallbackMessage(hasFallback || false)
    setUnmetPreferences(unmet || [])
    setFeedbackMessage(feedback || null)
    setScreen('recommendations')
  }

  const handleStartOver = () => {
    setScreen('landing')
    setRecommendations([])
    setShowFallbackMessage(false)
    setUnmetPreferences([])
    setFeedbackMessage(null)
    setIntent('both')
  }

  // Helper to check if item is a drink
  const isDrinkItem = (item: RecommendedItem) => {
    const category = (item.category || '').toLowerCase().trim()
    const drinkCategories = [
      'drinks', 'beverages', 'cocktails', 'beer', 'wine', 'mocktails',
      'soft drinks', 'coffee', 'tea', 'spirits', 'hot drinks', 'juices',
      'smoothies', 'wines', 'beers'
    ]
    const isDrinkCategory = drinkCategories.some(dc => category.includes(dc) || dc.includes(category))
    const hasDrinkTag = item.tags?.some(t =>
      t.startsWith('drink') ||
      t.startsWith('abv_') ||
      t.includes('cocktail') ||
      t.includes('wine') ||
      t.includes('beer') ||
      t === 'temp_hot'
    )
    const isDrink = isDrinkCategory || hasDrinkTag
    console.log(`isDrinkItem: "${item.name}" category="${category}" → ${isDrink}`)
    return isDrink
  }

  // Separate main recommendations from cross-sell items
  const mainRecommendations = recommendations.filter(item => !item.isCrossSell)
  const crossSellRecommendations = recommendations.filter(item => item.isCrossSell)

  // Main food and drink items (what user asked for)
  const foodItems = mainRecommendations.filter(item => !isDrinkItem(item))
  const drinkItems = mainRecommendations.filter(item => isDrinkItem(item))

  // Cross-sell items (opposite of what user asked for)
  const crossSellFoodItems = crossSellRecommendations.filter(item => !isDrinkItem(item))
  const crossSellDrinkItems = crossSellRecommendations.filter(item => isDrinkItem(item))

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* PERSISTENT HEADER - Always visible */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex justify-between items-center bg-[#FDFBF7]/95 backdrop-blur-sm border-b border-[#1a1a1a]/5">
        <Link
          href="/"
          className="text-sm text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition"
        >
          ← Back
        </Link>
        <span className="text-sm font-medium text-[#1a1a1a]">{venue.name}</span>
        <Link
          href="/demo"
          className="text-sm text-[#722F37] hover:text-[#5a252c] transition"
        >
          Dashboard
        </Link>
      </header>

      {/* Main content with padding for header */}
      <main className="pt-20 min-h-screen">
        {/* Loading Screen */}
        {screen === 'loading' && (
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-pulse">🍽️</div>
              <p className="text-[#1a1a1a]/50">Loading...</p>
            </div>
          </div>
        )}

        {/* Empty Menu State */}
        {screen === 'empty' && (
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6">
            <div className="text-center max-w-md">
              <div className="text-5xl mb-6">📋</div>
              <h1 className="text-2xl font-medium text-[#1a1a1a] mb-3">
                Menu coming soon
              </h1>
              <p className="text-[#1a1a1a]/50 mb-2">
                {venue.name} is still setting up their menu.
              </p>
              <p className="text-[#1a1a1a]/40 text-sm mb-8">
                Check back soon for personalized recommendations!
              </p>

              {/* For operators viewing their own empty venue */}
              <div className="p-4 bg-[#F5F3EF] rounded-xl mb-6">
                <p className="text-sm text-[#1a1a1a]/60 mb-3">
                  Are you the owner?
                </p>
                <Link
                  href="/dashboard/menu"
                  className="inline-block px-5 py-2 bg-[#722F37] text-white rounded-lg text-sm hover:bg-[#5a252c] transition"
                >
                  Add menu items →
                </Link>
              </div>

              <Link
                href="/"
                className="text-sm text-[#1a1a1a]/40 hover:text-[#1a1a1a]/60"
              >
                ← Back to homepage
              </Link>
            </div>
          </div>
        )}

        {/* Landing Screen */}
        {screen === 'landing' && (
          <div className="relative overflow-hidden min-h-[calc(100vh-56px)]">
            {/* Warm gradient blobs */}
            <div className="absolute w-[400px] h-[400px] -top-32 -right-32 bg-[#B2472A]/10 rounded-full blur-3xl" />
            <div className="absolute w-[300px] h-[300px] bottom-0 -left-32 bg-[#B2472A]/10 rounded-full blur-3xl" />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative z-10 flex flex-col items-center justify-center px-6 py-12 min-h-[calc(100vh-56px)]"
            >
              <div className="text-center max-w-sm">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-20 h-20 bg-[#B2472A]/10 rounded-2xl flex items-center justify-center mx-auto mb-8"
                >
                  <span className="text-4xl">🍽️</span>
                </motion.div>
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-bold text-[#1a1a1a] mb-2"
                >
                  Welcome to {venue.name}
                </motion.h1>
                {tableRef && (
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-sm text-[#1a1a1a]/50 mb-6"
                  >
                    Table {tableRef}
                  </motion.p>
                )}
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-[#1a1a1a]/60 mb-8"
                >
                  Answer a few quick questions and we&apos;ll recommend the perfect dishes for you.
                </motion.p>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button
                    onClick={handleStartQuestions}
                    className="w-full bg-[#B2472A] hover:bg-[#8a341f] text-white py-3 rounded-full"
                  >
                    Get recommendations
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Intent Selection Screen */}
        {screen === 'intent' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-6"
          >
            <h2 className="text-2xl font-medium text-[#1a1a1a] mb-3 text-center">
              What are you looking for?
            </h2>
            <p className="text-[#1a1a1a]/50 mb-8 text-center">
              We&apos;ll tailor our recommendations
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => handleIntentSelect('drinks')}
                className="flex items-center justify-center gap-3 px-6 py-5 bg-white border-2 border-[#1a1a1a]/10 rounded-2xl hover:border-[#1a1a1a]/30 transition-all"
              >
                <span className="text-2xl">🍸</span>
                <span className="text-lg text-[#1a1a1a]">Just drinks</span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => handleIntentSelect('food')}
                className="flex items-center justify-center gap-3 px-6 py-5 bg-white border-2 border-[#1a1a1a]/10 rounded-2xl hover:border-[#1a1a1a]/30 transition-all"
              >
                <span className="text-2xl">🍽️</span>
                <span className="text-lg text-[#1a1a1a]">Just food</span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => handleIntentSelect('both')}
                className="flex items-center justify-center gap-3 px-6 py-5 bg-[#B2472A] text-white rounded-2xl hover:bg-[#8a341f] transition-all"
              >
                <span className="text-2xl">✨</span>
                <span className="text-lg">Food & drinks</span>
              </motion.button>
            </div>

            <button
              onClick={() => setScreen('landing')}
              className="mt-8 text-sm text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition"
            >
              ← Go back
            </button>
          </motion.div>
        )}

        {/* Questions Flow */}
        {screen === 'questions' && (
          <QuestionFlow
            venueId={venue.id}
            tableRef={tableRef}
            intent={intent}
            onComplete={handleQuestionsComplete}
            onBack={() => setScreen('intent')}
          />
        )}

        {/* Recommendations Screen */}
        {screen === 'recommendations' && (
          <RecommendationResults
            foodItems={foodItems}
            drinkItems={drinkItems}
            crossSellFoodItems={crossSellFoodItems}
            crossSellDrinkItems={crossSellDrinkItems}
            intent={intent}
            venueName={venue.name}
            showFallbackMessage={showFallbackMessage}
            unmetPreferences={unmetPreferences}
            feedbackMessage={feedbackMessage}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  )
}

// Recommendation Results Component
interface RecommendationResultsProps {
  foodItems: RecommendedItem[]
  drinkItems: RecommendedItem[]
  crossSellFoodItems: RecommendedItem[]
  crossSellDrinkItems: RecommendedItem[]
  intent: Intent
  venueName: string
  showFallbackMessage: boolean
  unmetPreferences: string[]
  feedbackMessage: string | null
  onStartOver: () => void
}

function RecommendationResults({
  foodItems,
  drinkItems,
  crossSellFoodItems,
  crossSellDrinkItems,
  intent,
  venueName,
  showFallbackMessage,
  unmetPreferences,
  feedbackMessage,
  onStartOver
}: RecommendationResultsProps) {
  // Generate pairing message only when we have both food and drinks
  const pairingMessage = (() => {
    if (intent !== 'both') return null
    if (foodItems.length === 0 || drinkItems.length === 0) return null

    const topFood = foodItems[0]
    const topDrink = drinkItems[0]

    if (!topFood?.name || !topDrink?.name) return null

    return `${topDrink.name} pairs perfectly with ${topFood.name}`
  })()

  return (
    <div className="px-6 py-8 max-w-lg mx-auto pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-medium text-[#1a1a1a] mb-2">
          Our picks for you
        </h2>
        <p className="text-[#1a1a1a]/50">
          Based on your preferences
        </p>
      </motion.div>

      {/* Unmet preferences feedback banner */}
      {feedbackMessage && unmetPreferences.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <span className="text-lg">💬</span>
            <div>
              <p className="text-sm text-amber-800">{feedbackMessage}</p>
              <p className="text-xs text-amber-600 mt-1">
                Here are some alternatives you might enjoy:
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Fallback message (general) */}
      {showFallbackMessage && !feedbackMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center mb-8"
        >
          <p className="text-amber-800 font-medium mb-1">
            Limited options match your preferences
          </p>
          <p className="text-amber-700 text-sm">
            We&apos;ve let {venueName} know so they can improve!
          </p>
        </motion.div>
      )}

      {/* Pairing suggestion banner - only show when we have a valid pairing */}
      {pairingMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#722F37]/10 rounded-2xl p-4 mb-8 text-center"
        >
          <p className="text-sm text-[#722F37] font-medium">
            💡 Perfect pairing
          </p>
          <p className="text-[#1a1a1a] mt-1">
            {pairingMessage}
          </p>
        </motion.div>
      )}

      {/* Food Section */}
      {(intent === 'food' || intent === 'both') && foodItems.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-4 flex items-center gap-2">
            <span>🍽️</span> To Eat
          </h3>
          <div className="space-y-3">
            {foodItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <RecommendationCard
                  item={item}
                  pairing={intent === 'both' && drinkItems[0] ? {
                    name: drinkItems[0].name,
                    price: drinkItems[0].price
                  } : undefined}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Drinks Section */}
      {(intent === 'drinks' || intent === 'both') && drinkItems.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-4 flex items-center gap-2">
            <span>🍸</span> To Drink
          </h3>
          <div className="space-y-3">
            {drinkItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <RecommendationCard
                  item={item}
                  pairing={intent === 'both' && foodItems[0] ? {
                    name: foodItems[0].name,
                    price: foodItems[0].price
                  } : undefined}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Cross-sell suggestion for drinks-only */}
      {intent === 'drinks' && crossSellFoodItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 bg-[#FDFBF7] border border-[#1a1a1a]/10 rounded-xl mb-8"
        >
          <p className="text-sm text-[#1a1a1a]/60 mb-3">
            🍽️ Feeling peckish? These pair well:
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {crossSellFoodItems.slice(0, 2).map((item) => (
              <div key={item.id} className="flex-shrink-0 px-3 py-2 bg-white rounded-lg text-sm border border-[#1a1a1a]/5">
                {item.name} · <span className="text-[#722F37]">€{item.price}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cross-sell suggestion for food-only */}
      {intent === 'food' && crossSellDrinkItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 bg-[#FDFBF7] border border-[#1a1a1a]/10 rounded-xl mb-8"
        >
          <p className="text-sm text-[#1a1a1a]/60 mb-3">
            🍸 Something to drink with that?
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {crossSellDrinkItems.slice(0, 2).map((item) => (
              <div key={item.id} className="flex-shrink-0 px-3 py-2 bg-white rounded-lg text-sm border border-[#1a1a1a]/5">
                {item.name} · <span className="text-[#722F37]">€{item.price}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No results */}
      {foodItems.length === 0 && drinkItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-5xl mb-4">🤔</div>
          <h3 className="text-xl font-medium text-[#1a1a1a] mb-2">
            We couldn&apos;t find a match
          </h3>
          <p className="text-[#1a1a1a]/50 mb-6 max-w-sm mx-auto">
            Your dietary requirements are important to us.
            We&apos;ve let {venueName} know so they can improve their options.
          </p>
        </motion.div>
      )}

      {/* Start over button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7] to-transparent">
        <div className="max-w-lg mx-auto">
          <button
            onClick={onStartOver}
            className="w-full px-6 py-3 border-2 border-[#1a1a1a]/20 text-[#1a1a1a]/60 rounded-full hover:border-[#1a1a1a]/40 transition"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  )
}

