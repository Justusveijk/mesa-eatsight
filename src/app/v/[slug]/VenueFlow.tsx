'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { QuestionFlow, Intent } from '@/components/guest/QuestionFlow'
import { RecommendationCard } from '@/components/guest/RecommendationCard'
import { RecommendedItem } from '@/lib/recommendations'

interface Venue {
  id: string
  name: string
  slug: string
}

interface VenueFlowProps {
  venue: Venue
  tableRef: string | null
}

type Screen = 'landing' | 'intent' | 'questions' | 'recommendations'

export function VenueFlow({ venue, tableRef }: VenueFlowProps) {
  const [screen, setScreen] = useState<Screen>('landing')
  const [intent, setIntent] = useState<Intent>('both')
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([])
  const [showFallbackMessage, setShowFallbackMessage] = useState(false)

  const handleStartQuestions = () => {
    setScreen('intent')
  }

  const handleIntentSelect = (selectedIntent: Intent) => {
    setIntent(selectedIntent)
    setScreen('questions')
  }

  const handleQuestionsComplete = (recs: RecommendedItem[], hasFallback?: boolean) => {
    setRecommendations(recs)
    setShowFallbackMessage(hasFallback || false)
    setScreen('recommendations')
  }

  const handleStartOver = () => {
    setScreen('landing')
    setRecommendations([])
    setShowFallbackMessage(false)
    setIntent('both')
  }

  // Separate food and drink recommendations
  const foodItems = recommendations.filter(item => {
    const isDrink = item.tags?.some(t =>
      t.startsWith('drink') ||
      t.includes('cocktail') ||
      t.includes('wine') ||
      t.includes('beer')
    ) || ['drinks', 'beverages', 'cocktails', 'beer', 'wine'].includes(item.category?.toLowerCase() || '')
    return !isDrink
  })

  const drinkItems = recommendations.filter(item => {
    const isDrink = item.tags?.some(t =>
      t.startsWith('drink') ||
      t.includes('cocktail') ||
      t.includes('wine') ||
      t.includes('beer')
    ) || ['drinks', 'beverages', 'cocktails', 'beer', 'wine'].includes(item.category?.toLowerCase() || '')
    return isDrink
  })

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
            intent={intent}
            venueName={venue.name}
            showFallbackMessage={showFallbackMessage}
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
  intent: Intent
  venueName: string
  showFallbackMessage: boolean
  onStartOver: () => void
}

function RecommendationResults({
  foodItems,
  drinkItems,
  intent,
  venueName,
  showFallbackMessage,
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

      {/* Fallback message */}
      {showFallbackMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center mb-8"
        >
          <p className="text-amber-800 font-medium mb-1">
            Limited options match your dietary needs
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
      {intent === 'drinks' && foodItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 bg-[#FDFBF7] border border-[#1a1a1a]/10 rounded-xl mb-8"
        >
          <p className="text-sm text-[#1a1a1a]/60 mb-3">
            Feeling peckish? These pair well:
          </p>
          <div className="flex gap-2 overflow-x-auto">
            {foodItems.slice(0, 2).map((item) => (
              <div key={item.id} className="flex-shrink-0 px-3 py-2 bg-white rounded-lg text-sm border border-[#1a1a1a]/5">
                {item.name} · <span className="text-[#722F37]">€{item.price}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cross-sell suggestion for food-only */}
      {intent === 'food' && drinkItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="p-4 bg-[#FDFBF7] border border-[#1a1a1a]/10 rounded-xl mb-8"
        >
          <p className="text-sm text-[#1a1a1a]/60 mb-3">
            Something to drink with that?
          </p>
          <div className="flex gap-2 overflow-x-auto">
            {drinkItems.slice(0, 2).map((item) => (
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

