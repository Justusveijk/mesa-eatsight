'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { trackEvent, createSession, saveRecResults, updateSessionIntents, EVENTS } from '@/lib/analytics'
import {
  getRecommendationsWithFallback,
  getNewDrinkRecommendations,
  trackUnmetDemand,
  type RecommendedItem,
} from '@/lib/recommendations'
import { getUpsellDrink, type DrinkUpsell } from '@/lib/upsells'
import { GuestPreferences, MoodTag, FlavorTag, PortionTag, DietTag } from '@/lib/types/taxonomy'
import { WelcomeScreen } from './components/WelcomeScreen'
import { QuestionFlow, type GuestAnswers } from './components/QuestionFlow'
import { ResultsScreen } from './components/ResultsScreen'
import { MenuBackground } from './components/MenuBackground'
import { ProcessingScreen } from './components/ProcessingScreen'

interface Venue {
  id: string
  name: string
  slug: string
}

interface VenueFlowProps {
  venue: Venue
  tableRef: string | null
}

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  tags?: string[]
  type: 'food' | 'drink'
}

type FlowState = 'loading' | 'empty' | 'welcome' | 'questions' | 'processing' | 'results'

export function VenueFlow({ venue, tableRef }: VenueFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>('loading')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([])
  const [drinkRecommendations, setDrinkRecommendations] = useState<RecommendedItem[]>([])
  const [upsellDrink, setUpsellDrink] = useState<DrinkUpsell | null>(null)
  const [selectionType, setSelectionType] = useState<'food' | 'drink' | 'both'>('food')
  const [hasFallbacks, setHasFallbacks] = useState(false)
  const [filterProgress, setFilterProgress] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const sessionCreated = useRef(false)

  const supabase = createClient()

  // Fetch menu items on load
  useEffect(() => {
    async function fetchData() {
      const { data: menu } = await supabase
        .from('menus')
        .select('id')
        .eq('venue_id', venue.id)
        .eq('status', 'published')
        .single()

      if (!menu) {
        setFlowState('empty')
        return
      }

      const { data: items } = await supabase
        .from('menu_items')
        .select('*')
        .eq('menu_id', menu.id)
        .eq('is_available', true)
        .order('category')

      if (!items || items.length === 0) {
        setFlowState('empty')
        return
      }

      setMenuItems(items)
      setFlowState('welcome')
    }

    fetchData()
  }, [venue.id, supabase])

  // Create session and start flow
  const handleStart = useCallback(async () => {
    let currentSessionId = sessionId

    if (!sessionCreated.current) {
      const newSessionId = await createSession(venue.id, navigator.userAgent, tableRef || undefined)
      if (newSessionId) {
        setSessionId(newSessionId)
        currentSessionId = newSessionId
        sessionCreated.current = true
      }
    }

    await trackEvent(venue.id, currentSessionId, EVENTS.FLOW_STARTED, {
      table_ref: tableRef,
    })

    setFlowState('questions')
  }, [venue.id, tableRef, sessionId])

  // Handle question answer (for analytics)
  const handleAnswer = useCallback(
    (questionId: string, answer: string | string[]) => {
      trackEvent(venue.id, sessionId, EVENTS.QUESTION_ANSWERED, {
        question_id: questionId,
        answer,
      })
    },
    [venue.id, sessionId]
  )

  // Handle progress updates from QuestionFlow
  const handleProgress = useCallback((progress: number) => {
    setFilterProgress(progress)
  }, [])

  // Handle flow completion - generate recommendations
  const handleComplete = useCallback(
    async (answers: GuestAnswers) => {
      setFlowState('processing')
      setSelectionType(answers.type)

      // Update session with intent chips
      if (sessionId) {
        const chips: string[] = []
        if (answers.mood) chips.push(answers.mood)
        if (answers.flavors) chips.push(...answers.flavors)
        if (answers.portion) chips.push(answers.portion)
        if (answers.dietary) chips.push(...answers.dietary)
        if (answers.drinkMood) chips.push(answers.drinkMood)
        if (answers.drinkFlavors) chips.push(...answers.drinkFlavors)
        if (answers.drinkPreferences) chips.push(...answers.drinkPreferences)
        await updateSessionIntents(sessionId, chips)
      }

      // Processing animation duration
      const processingDelay = new Promise(resolve => setTimeout(resolve, 3000))

      let allResults: RecommendedItem[] = []
      let drinkRecs: RecommendedItem[] = []
      let upsell: DrinkUpsell | null = null

      try {
        if (answers.type === 'food' || answers.type === 'both') {
          // Build GuestPreferences for food scoring
          const foodPrefs: GuestPreferences = {
            mood: (answers.mood as MoodTag) || null,
            flavors: (answers.flavors || []) as FlavorTag[],
            portion: (answers.portion as PortionTag) || null,
            dietary: (answers.dietary || []) as DietTag[],
            price: null,
          }

          const foodResult = await getRecommendationsWithFallback(venue.id, foodPrefs, 3)
          allResults.push(...foodResult.recommendations, ...foodResult.fallbackItems)
          if (foodResult.showFallbackMessage) setHasFallbacks(true)

          // For food-only: get drink upsell
          if (answers.type === 'food') {
            upsell = await getUpsellDrink(venue.id, answers.mood)
          }
        }

        if (answers.type === 'drink') {
          // Use new drink recommendation engine
          const drinkResults = await getNewDrinkRecommendations(venue.id, {
            drinkMood: answers.drinkMood,
            drinkFlavors: answers.drinkFlavors,
            drinkPreferences: answers.drinkPreferences,
          }, 3)
          allResults.push(...drinkResults)
        }

        if (answers.type === 'both') {
          // Get dedicated drink recommendations using the user's drink answers
          drinkRecs = await getNewDrinkRecommendations(venue.id, {
            drinkMood: answers.drinkMood,
            drinkFlavors: answers.drinkFlavors,
            drinkPreferences: answers.drinkPreferences,
          }, 3)
        }
      } catch (err) {
        console.error('Failed to get recommendations:', err)
      }

      // Ensure processing animation completes
      await processingDelay

      // Set results
      const finalResults = allResults.length > 0 ? allResults.slice(0, 5) : []
      setRecommendations(finalResults)
      setDrinkRecommendations(drinkRecs)
      setUpsellDrink(upsell)

      // Log unmet demand if no good matches found
      if (finalResults.length === 0 && (answers.type === 'food' || answers.type === 'both')) {
        const foodPrefs: GuestPreferences = {
          mood: (answers.mood as MoodTag) || null,
          flavors: (answers.flavors || []) as FlavorTag[],
          portion: (answers.portion as PortionTag) || null,
          dietary: (answers.dietary || []) as DietTag[],
          price: null,
        }
        await trackUnmetDemand(venue.id, sessionId, foodPrefs)
      }

      // Save rec results to analytics
      if (sessionId && finalResults.length > 0) {
        await saveRecResults(
          sessionId,
          finalResults.map(item => ({
            id: item.id,
            score: item.score,
            reason: item.reason,
          }))
        )
      }

      // Track analytics
      await trackEvent(venue.id, sessionId, EVENTS.RECOMMENDATIONS_SHOWN, {
        item_count: finalResults.length,
        drink_count: drinkRecs.length,
        has_upsell: !!upsell,
        item_ids: finalResults.map(i => i.id),
        item_names: finalResults.map(i => i.name),
        type: answers.type,
      })

      await trackEvent(venue.id, sessionId, EVENTS.FLOW_COMPLETED, {
        recommendation_count: finalResults.length,
        answers,
      })

      setFlowState('results')
    },
    [venue.id, sessionId]
  )

  // Handle item like
  const handleItemLike = useCallback(
    async (item: RecommendedItem) => {
      await trackEvent(venue.id, sessionId, 'item_selected', {
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        item_price: item.price,
      })
    },
    [venue.id, sessionId]
  )

  // Handle restart
  const handleRestart = useCallback(() => {
    setFilterProgress(0)
    setRecommendations([])
    setDrinkRecommendations([])
    setUpsellDrink(null)
    setHasFallbacks(false)
    setSelectionType('food')
    setFlowState('welcome')
  }, [])

  const isDemo = venue.slug === 'bella-taverna'

  return (
    <div className="mesa-bg relative overflow-hidden">
      {/* Animated menu background */}
      <MenuBackground
        items={menuItems}
        filterProgress={filterProgress}
        flowState={flowState}
      />

      {/* Header - minimal, only for demo venue */}
      {isDemo && (
        <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex justify-between items-center">
          <Link
            href="/"
            className="text-sm text-mesa-charcoal/50 hover:text-mesa-charcoal transition"
          >
            ← Back
          </Link>
          <Link
            href="/demo"
            className="text-sm text-mesa-burgundy hover:text-mesa-burgundy/80 transition"
          >
            Demo
          </Link>
        </header>
      )}

      {/* Main content */}
      <AnimatePresence mode="wait">
        {/* Loading Screen */}
        {flowState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 rounded-full border-2 border-mesa-burgundy/20 border-t-mesa-burgundy mx-auto"
              />
              <p className="mt-4 text-mesa-charcoal/50 text-sm">Loading your experience...</p>
            </div>
          </motion.div>
        )}

        {/* Empty Menu State */}
        {flowState === 'empty' && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center px-6"
          >
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-mesa-burgundy/10 flex items-center justify-center mx-auto mb-6">
                <ClipboardList className="w-8 h-8 text-mesa-burgundy" />
              </div>
              <h1 className="text-2xl font-serif text-mesa-charcoal mb-3">
                Menu coming soon
              </h1>
              <p className="text-mesa-charcoal/50 mb-2">
                {venue.name} is still setting up their menu.
              </p>
              <p className="text-mesa-charcoal/40 text-sm mb-8">
                Check back soon for personalized recommendations!
              </p>

              <div className="p-4 bg-mesa-warm rounded-xl mb-6">
                <p className="text-sm text-mesa-charcoal/60 mb-3">
                  Are you the owner?
                </p>
                <Link
                  href="/dashboard/menu"
                  className="inline-block px-5 py-2 mesa-btn text-sm"
                >
                  Add menu items →
                </Link>
              </div>

              <Link
                href="/"
                className="text-sm text-mesa-charcoal/40 hover:text-mesa-charcoal/60"
              >
                ← Back to homepage
              </Link>
            </div>
          </motion.div>
        )}

        {/* Welcome Screen */}
        {flowState === 'welcome' && (
          <WelcomeScreen
            key="welcome"
            venue={venue}
            itemCount={menuItems.length}
            onStart={handleStart}
          />
        )}

        {/* Question Flow */}
        {flowState === 'questions' && (
          <QuestionFlow
            key="questions"
            venue={venue}
            onComplete={handleComplete}
            onProgress={handleProgress}
            onAnswer={handleAnswer}
          />
        )}

        {/* Processing Screen */}
        {flowState === 'processing' && (
          <ProcessingScreen
            key="processing"
            itemCount={menuItems.length}
          />
        )}

        {/* Results Screen */}
        {flowState === 'results' && (
          <ResultsScreen
            key="results"
            venue={venue}
            venueId={venue.id}
            sessionId={sessionId}
            recommendations={recommendations}
            selectionType={selectionType}
            drinkRecommendations={drinkRecommendations}
            upsellDrink={upsellDrink}
            hasFallbacks={hasFallbacks}
            onRestart={handleRestart}
            onItemLike={handleItemLike}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
