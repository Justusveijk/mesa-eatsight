'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Utensils, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { trackEvent, createSession, EVENTS } from '@/lib/analytics'
import { WelcomeScreen } from './components/WelcomeScreen'
import { QuestionFlow } from './components/QuestionFlow'
import { ResultsScreen } from './components/ResultsScreen'
import { MenuBackground } from './components/MenuBackground'

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
  is_vegetarian?: boolean
  is_vegan?: boolean
  is_gluten_free?: boolean
}

type FlowState = 'loading' | 'empty' | 'welcome' | 'questions' | 'processing' | 'results'

export function VenueFlow({ venue, tableRef }: VenueFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>('loading')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [recommendations, setRecommendations] = useState<MenuItem[]>([])
  const [filterProgress, setFilterProgress] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const sessionCreated = useRef(false)

  const supabase = createClient()

  // Fetch menu items on load
  useEffect(() => {
    async function fetchData() {
      // Get the published menu for this venue
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

      // Get available menu items
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

    // Create session if not already created
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

  // Handle answer submission
  const handleAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))

    // Track the answer
    trackEvent(venue.id, sessionId, EVENTS.QUESTION_ANSWERED, {
      question_id: questionId,
      answer,
    })

    // Calculate filter progress
    const totalQuestions = 4
    const answeredCount = Object.keys({ ...answers, [questionId]: answer }).length
    setFilterProgress((answeredCount / totalQuestions) * 100)
  }, [answers, venue.id, sessionId])

  // Handle flow completion - generate recommendations
  const handleComplete = useCallback(async () => {
    setFlowState('processing')

    // Simulate processing animation
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Filter and score recommendations based on answers
    let filtered = [...menuItems]

    // Filter by type (food/drink/both)
    if (answers.type === 'food') {
      filtered = filtered.filter(item => item.type === 'food')
    } else if (answers.type === 'drink') {
      filtered = filtered.filter(item => item.type === 'drink')
    }

    // Filter by dietary preferences
    if (answers.dietary === 'vegetarian') {
      filtered = filtered.filter(item => item.is_vegetarian)
    } else if (answers.dietary === 'vegan') {
      filtered = filtered.filter(item => item.is_vegan)
    } else if (answers.dietary === 'gluten-free') {
      filtered = filtered.filter(item => item.is_gluten_free)
    }

    // Score items based on mood and hunger
    const scored = filtered.map(item => {
      let score = Math.random() * 20 // Base random score for variety

      // Mood-based scoring
      if (answers.mood === 'comfort') {
        if (item.tags?.some(t => ['hearty', 'warm', 'rich', 'comfort'].includes(t.toLowerCase()))) {
          score += 30
        }
      } else if (answers.mood === 'light') {
        if (item.tags?.some(t => ['light', 'fresh', 'salad', 'healthy'].includes(t.toLowerCase()))) {
          score += 30
        }
      } else if (answers.mood === 'adventurous') {
        if (item.tags?.some(t => ['special', 'unique', 'signature', 'exotic'].includes(t.toLowerCase()))) {
          score += 30
        }
      } else if (answers.mood === 'indulgent') {
        if (item.tags?.some(t => ['indulgent', 'premium', 'luxury', 'decadent'].includes(t.toLowerCase()))) {
          score += 30
        }
      }

      // Hunger-based scoring
      if (answers.hunger === 'snack') {
        if (item.category?.toLowerCase().includes('appetizer') || item.category?.toLowerCase().includes('starter')) {
          score += 20
        }
      } else if (answers.hunger === 'starving') {
        if (item.category?.toLowerCase().includes('main') || item.category?.toLowerCase().includes('entree')) {
          score += 20
        }
      }

      return { ...item, score }
    }).sort((a, b) => b.score - a.score)

    // Take top 5 recommendations
    const topRecommendations = scored.slice(0, 5)
    setRecommendations(topRecommendations)

    // Track recommendations shown
    await trackEvent(venue.id, sessionId, EVENTS.RECOMMENDATIONS_SHOWN, {
      item_count: topRecommendations.length,
      item_ids: topRecommendations.map(i => i.id),
      item_names: topRecommendations.map(i => i.name),
    })

    await trackEvent(venue.id, sessionId, EVENTS.FLOW_COMPLETED, {
      recommendation_count: topRecommendations.length,
      answers,
    })

    setFlowState('results')
  }, [menuItems, answers, venue.id, sessionId])

  // Handle item like/favorite
  const handleItemLike = useCallback(async (item: MenuItem) => {
    await trackEvent(venue.id, sessionId, 'item_selected', {
      item_id: item.id,
      item_name: item.name,
      item_type: item.type,
      item_category: item.category,
      item_price: item.price,
    })
  }, [venue.id, sessionId])

  // Handle restart
  const handleRestart = useCallback(() => {
    setAnswers({})
    setFilterProgress(0)
    setRecommendations([])
    setFlowState('welcome')
  }, [])

  // Only show Back/Demo links for the demo venue
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

              {/* For operators viewing their own empty venue */}
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
            onAnswer={handleAnswer}
            onComplete={handleComplete}
            answers={answers}
            filterProgress={filterProgress}
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
            recommendations={recommendations}
            onRestart={handleRestart}
            onItemLike={handleItemLike}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Processing Screen - The "digging" animation
function ProcessingScreen({ itemCount }: { itemCount: number }) {
  const [stage, setStage] = useState(0)
  const stages = [
    'Scanning the menu...',
    'Analyzing your preferences...',
    'Finding perfect matches...',
    'Almost there...'
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setStage(prev => (prev < stages.length - 1 ? prev + 1 : prev))
    }, 500)
    return () => clearInterval(timer)
  }, [stages.length])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-6 relative z-10"
    >
      <div className="text-center">
        {/* Animated stack of cards */}
        <div className="relative w-48 h-32 mx-auto mb-8">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: 0, rotate: (i - 2) * 3, scale: 1 - i * 0.05 }}
              animate={{
                y: [0, -20, 0],
                rotate: [(i - 2) * 3, (i - 2) * 5, (i - 2) * 3],
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                repeat: Infinity,
                repeatDelay: 0.5
              }}
              className="absolute inset-0 mesa-card flex items-center justify-center"
              style={{
                zIndex: 5 - i,
                transformOrigin: 'bottom center'
              }}
            >
              <div className="w-3/4 h-2 bg-mesa-burgundy/10 rounded-full" />
            </motion.div>
          ))}
        </div>

        {/* Scanning line */}
        <motion.div
          animate={{ y: [0, 60, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-48 h-0.5 bg-gradient-to-r from-transparent via-mesa-burgundy to-transparent mx-auto mb-8"
        />

        {/* Stage text */}
        <motion.p
          key={stage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg text-mesa-charcoal font-medium"
        >
          {stages[stage]}
        </motion.p>

        <p className="text-sm text-mesa-charcoal/50 mt-2">
          Searching through {itemCount} items
        </p>
      </div>
    </motion.div>
  )
}
