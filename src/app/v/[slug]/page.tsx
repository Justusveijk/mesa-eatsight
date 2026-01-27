'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { QuestionFlow } from '@/components/guest/QuestionFlow'
import { RecommendationCards } from '@/components/guest/RecommendationCards'
import { GuestPreferences, MenuItem } from '@/lib/types/taxonomy'
import { mockVenue, mockMenuItems } from '@/lib/data/mock-menu'
import { getTopRecommendations } from '@/lib/recommendations'

type Screen = 'landing' | 'questions' | 'recommendations'

export default function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams()
  const tableRef = searchParams.get('t')

  const [screen, setScreen] = useState<Screen>('landing')
  const [recommendations, setRecommendations] = useState<Array<MenuItem & { reason: string }>>([])

  const handleStartQuestions = () => {
    setScreen('questions')
  }

  const handleQuestionsComplete = (preferences: GuestPreferences) => {
    const recs = getTopRecommendations(mockMenuItems, preferences, 3)
    setRecommendations(recs)
    setScreen('recommendations')
  }

  const handleStartOver = () => {
    setScreen('landing')
    setRecommendations([])
  }

  // Landing Screen - MESA warm theme
  if (screen === 'landing') {
    return (
      <div className="min-h-screen bg-mesa-ivory relative overflow-hidden">
        {/* Warm gradient blobs */}
        <div className="blob blob-mesa w-[400px] h-[400px] -top-32 -right-32 opacity-20" />
        <div className="blob blob-mesa w-[300px] h-[300px] bottom-0 -left-32 opacity-15" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12"
        >
          <div className="text-center max-w-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}
              className="w-20 h-20 bg-mesa-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8"
            >
              <span className="text-4xl">🍽️</span>
            </motion.div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-mesa-ink mb-2"
            >
              Welcome to {mockVenue.name}
            </motion.h1>
            {tableRef && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-sm text-mesa-graphite/70 mb-6"
              >
                Table {tableRef}
              </motion.p>
            )}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-mesa-graphite mb-8"
            >
              Answer a few quick questions and we&apos;ll recommend the perfect dishes for you.
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button variant="mesa" size="lg" onClick={handleStartQuestions} className="w-full">
                Get recommendations
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Questions Flow
  if (screen === 'questions') {
    return (
      <QuestionFlow
        onComplete={handleQuestionsComplete}
        onBack={handleStartOver}
      />
    )
  }

  // Recommendations Screen
  return (
    <RecommendationCards
      recommendations={recommendations}
      onStartOver={handleStartOver}
    />
  )
}
