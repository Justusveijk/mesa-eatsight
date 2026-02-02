'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Utensils, Wine, Sparkles, ClipboardList, Heart, MessageCircle, Lightbulb, HelpCircle, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuestionFlow, Intent, RecommendationResults } from '@/components/guest/QuestionFlow'
import { RecommendationCard } from '@/components/guest/RecommendationCard'
import { createClient } from '@/lib/supabase/client'
import { trackEvent, createSession, EVENTS } from '@/lib/analytics'

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
  const [results, setResults] = useState<RecommendationResults | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const sessionCreated = useRef(false)

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

  const handleStartQuestions = async () => {
    let currentSessionId = sessionId

    // Create session if not already created
    if (!sessionCreated.current) {
      console.log('[VenueFlow] Creating session for venue:', venue.id)
      const newSessionId = await createSession(venue.id, navigator.userAgent, tableRef || undefined)
      if (newSessionId) {
        console.log('[VenueFlow] Session created:', newSessionId)
        setSessionId(newSessionId)
        currentSessionId = newSessionId
        sessionCreated.current = true
      } else {
        console.error('[VenueFlow] Failed to create session')
      }
    }

    // Use the local variable, not state (which hasn't updated yet)
    await trackEvent(venue.id, currentSessionId, EVENTS.FLOW_STARTED, {
      table_ref: tableRef,
    })

    setScreen('intent')
  }

  const handleIntentSelect = async (selectedIntent: Intent) => {
    console.log('[VenueFlow] Intent selected:', selectedIntent, 'sessionId:', sessionId)

    // Use INTENT_SELECTED (not QUESTION_ANSWERED) to avoid polluting preference analytics
    await trackEvent(venue.id, sessionId, EVENTS.INTENT_SELECTED, {
      intent: selectedIntent,
    })

    setIntent(selectedIntent)
    setScreen('questions')
  }

  const handleQuestionsComplete = async (newResults: RecommendationResults) => {
    console.log('🎯 VenueFlow handleQuestionsComplete received:')
    console.log('  Intent:', newResults.intent)
    console.log('  Primary Food:', newResults.primaryFood.map(f => f.name))
    console.log('  Primary Drinks:', newResults.primaryDrinks.map(d => d.name))
    console.log('  Pairing Food:', newResults.pairingFood.map(f => f.name))
    console.log('  Pairing Drinks:', newResults.pairingDrinks.map(d => d.name))

    // Track recommendations shown
    const allItems = [
      ...newResults.primaryFood,
      ...newResults.primaryDrinks,
      ...newResults.pairingFood,
      ...newResults.pairingDrinks,
    ]

    await trackEvent(venue.id, sessionId, EVENTS.RECOMMENDATIONS_SHOWN, {
      item_count: allItems.length,
      item_ids: allItems.map(i => i.id),
      item_names: allItems.map(i => i.name),
      intent: newResults.intent,
    })

    await trackEvent(venue.id, sessionId, EVENTS.FLOW_COMPLETED, {
      intent: newResults.intent,
      recommendation_count: allItems.length,
    })

    setResults(newResults)
    setScreen('recommendations')
  }

  const handleStartOver = () => {
    setScreen('landing')
    setResults(null)
    setIntent('both')
  }

  // Only show Back/Demo links for the demo venue
  const isDemo = venue.slug === 'bella-taverna'

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* PERSISTENT HEADER - Always visible */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex justify-between items-center bg-[#FDFBF7]/95 backdrop-blur-sm border-b border-[#1a1a1a]/5">
        {/* Left side - only show Back for demo */}
        <div className="w-20">
          {isDemo ? (
            <Link
              href="/"
              className="text-sm text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition"
            >
              ← Back
            </Link>
          ) : (
            <span />
          )}
        </div>

        {/* Center - Venue name */}
        <span className="text-sm font-medium text-[#1a1a1a]">{venue.name}</span>

        {/* Right side - Demo link for demo venue, "by Mesa" for real venues */}
        <div className="w-20 text-right">
          {isDemo ? (
            <Link
              href="/demo"
              className="text-sm text-[#722F37] hover:text-[#5a252c] transition"
            >
              Demo
            </Link>
          ) : (
            <span className="text-xs text-[#1a1a1a]/30">by Mesa</span>
          )}
        </div>
      </header>

      {/* Main content with padding for header */}
      <main className="pt-20 min-h-screen">
        {/* Loading Screen */}
        {screen === 'loading' && (
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#B2472A]/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Utensils className="w-8 h-8 text-[#B2472A]" />
              </div>
              <p className="text-[#1a1a1a]/50">Loading...</p>
            </div>
          </div>
        )}

        {/* Empty Menu State */}
        {screen === 'empty' && (
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-[#B2472A]/10 flex items-center justify-center mx-auto mb-6">
                <ClipboardList className="w-8 h-8 text-[#B2472A]" />
              </div>
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
                  <Utensils className="w-10 h-10 text-[#B2472A]" />
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
                <Wine className="w-6 h-6 text-[#B2472A]" />
                <span className="text-lg text-[#1a1a1a]">Just drinks</span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => handleIntentSelect('food')}
                className="flex items-center justify-center gap-3 px-6 py-5 bg-white border-2 border-[#1a1a1a]/10 rounded-2xl hover:border-[#1a1a1a]/30 transition-all"
              >
                <Utensils className="w-6 h-6 text-[#B2472A]" />
                <span className="text-lg text-[#1a1a1a]">Just food</span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => handleIntentSelect('both')}
                className="flex items-center justify-center gap-3 px-6 py-5 bg-[#B2472A] text-white rounded-2xl hover:bg-[#8a341f] transition-all"
              >
                <Sparkles className="w-6 h-6" />
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
            existingSessionId={sessionId}
            onComplete={handleQuestionsComplete}
            onBack={() => setScreen('intent')}
          />
        )}

        {/* Recommendations Screen */}
        {screen === 'recommendations' && results && (
          <RecommendationResultsView
            results={results}
            venueName={venue.name}
            venueId={venue.id}
            sessionId={sessionId}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  )
}

// Recommendation Results Component - Uses structured results
interface RecommendationResultsViewProps {
  results: RecommendationResults
  venueName: string
  venueId: string
  sessionId: string | null
  onStartOver: () => void
}

function RecommendationResultsView({
  results,
  venueName,
  venueId,
  sessionId,
  onStartOver
}: RecommendationResultsViewProps) {
  const [showAppSignup, setShowAppSignup] = useState(false)
  const [appEmail, setAppEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // Track item selection (heart button)
  const handleItemSelect = async (item: { id: string; name: string; category?: string; type?: string; price: number }) => {
    const isSelected = selectedItems.includes(item.id)

    if (isSelected) {
      setSelectedItems(prev => prev.filter(id => id !== item.id))
    } else {
      setSelectedItems(prev => [...prev, item.id])
      // Track the selection
      await trackEvent(venueId, sessionId, 'item_selected', {
        item_id: item.id,
        item_name: item.name,
        item_type: item.type,
        item_category: item.category,
        item_price: item.price,
      })
    }
  }

  // Track item expand
  const handleItemExpand = async (item: { id: string; name: string }) => {
    await trackEvent(venueId, sessionId, EVENTS.ITEM_EXPANDED, {
      item_id: item.id,
      item_name: item.name,
    })
  }

  const handleAppSignup = async () => {
    if (!appEmail || !appEmail.includes('@')) return

    // Track the signup
    await trackEvent(venueId, sessionId, 'app_waitlist_signup', {
      email: appEmail,
    })

    setEmailSubmitted(true)
  }

  const {
    primaryFood,
    primaryDrinks,
    pairingFood,
    pairingDrinks,
    intent,
    showFallbackMessage,
    unmetPreferences,
    feedbackMessage
  } = results

  console.log('🎯 RecommendationResultsView rendering:', {
    intent,
    primaryFood: primaryFood.map(f => f.name),
    primaryDrinks: primaryDrinks.map(d => d.name),
    pairingFood: pairingFood.map(f => f.name),
    pairingDrinks: pairingDrinks.map(d => d.name),
  })

  return (
    <div className="px-6 py-8 max-w-lg mx-auto pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2 className="text-2xl font-medium text-[#1a1a1a] mb-2">
          Our picks for you
        </h2>
        <p className="text-[#1a1a1a]/50 flex items-center justify-center gap-1">
          Tap <Heart className="w-4 h-4 text-[#722F37]" /> to save your favorites
        </p>
      </motion.div>

      {/* Selected items counter */}
      {selectedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#722F37]/10 rounded-xl p-4 text-center mb-6"
        >
          <span className="text-[#722F37] font-medium flex items-center gap-1">
            <Heart className="w-4 h-4" fill="#722F37" /> {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} picked
          </span>
        </motion.div>
      )}

      {/* Unmet preferences feedback banner */}
      {feedbackMessage && unmetPreferences.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-[#722F37]/5 border border-[#722F37]/20 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-[#722F37] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-[#1a1a1a]/80">{feedbackMessage}</p>
              <p className="text-xs text-[#722F37] mt-1">
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
          className="bg-[#722F37]/5 border border-[#722F37]/20 rounded-2xl p-5 text-center mb-8"
        >
          <p className="text-[#1a1a1a] font-medium mb-1">
            Limited options match your preferences
          </p>
          <p className="text-[#722F37] text-sm">
            We&apos;ve let {venueName} know so they can improve!
          </p>
        </motion.div>
      )}

      {/* INTENT: FOOD ONLY */}
      {intent === 'food' && (
        <>
          {primaryFood.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-4 flex items-center gap-2">
                <Utensils className="w-4 h-4" /> TO EAT
              </h3>
              <div className="space-y-3">
                {primaryFood.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <RecommendationCard
                      item={item}
                      onSelect={handleItemSelect}
                      onExpand={handleItemExpand}
                      isSelected={selectedItems.includes(item.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Cross-sell drinks */}
          {pairingDrinks.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 pt-6 border-t border-[#1a1a1a]/10"
            >
              <div className="text-center mb-4">
                <p className="text-sm text-[#1a1a1a]/60 flex items-center justify-center gap-1">
                  <Wine className="w-4 h-4" /> Something to drink?
                </p>
                <p className="text-xs text-[#1a1a1a]/40">These pair well with your food</p>
              </div>
              <div className="space-y-3">
                {pairingDrinks.map((item) => (
                  <div key={item.id} className="flex justify-between items-center px-4 py-3 bg-white rounded-xl border border-[#1a1a1a]/5">
                    <span className="text-[#1a1a1a]">{item.name}</span>
                    <span className="text-[#722F37] font-medium">€{item.price}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* INTENT: DRINKS ONLY */}
      {intent === 'drinks' && (
        <>
          {primaryDrinks.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-4 flex items-center gap-2">
                <Wine className="w-4 h-4" /> TO DRINK
              </h3>
              <div className="space-y-3">
                {primaryDrinks.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <RecommendationCard
                      item={item}
                      onSelect={handleItemSelect}
                      onExpand={handleItemExpand}
                      isSelected={selectedItems.includes(item.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Cross-sell food */}
          {pairingFood.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 pt-6 border-t border-[#1a1a1a]/10"
            >
              <div className="text-center mb-4">
                <p className="text-sm text-[#1a1a1a]/60 flex items-center justify-center gap-1">
                  <Utensils className="w-4 h-4" /> Feeling peckish?
                </p>
                <p className="text-xs text-[#1a1a1a]/40">These pair well with your drinks</p>
              </div>
              <div className="space-y-3">
                {pairingFood.map((item) => (
                  <div key={item.id} className="flex justify-between items-center px-4 py-3 bg-white rounded-xl border border-[#1a1a1a]/5">
                    <span className="text-[#1a1a1a]">{item.name}</span>
                    <span className="text-[#722F37] font-medium">€{item.price}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* INTENT: BOTH FOOD AND DRINKS - TWO SEPARATE SECTIONS */}
      {intent === 'both' && (
        <>
          {/* Food section */}
          {primaryFood.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-4 flex items-center gap-2">
                <Utensils className="w-4 h-4" /> TO EAT
              </h3>
              <div className="space-y-3">
                {primaryFood.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <RecommendationCard
                      item={item}
                      onSelect={handleItemSelect}
                      onExpand={handleItemExpand}
                      isSelected={selectedItems.includes(item.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Drinks section - SEPARATE */}
          {primaryDrinks.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-4 flex items-center gap-2">
                <Wine className="w-4 h-4" /> TO DRINK
              </h3>
              <div className="space-y-3">
                {primaryDrinks.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <RecommendationCard
                      item={item}
                      onSelect={handleItemSelect}
                      onExpand={handleItemExpand}
                      isSelected={selectedItems.includes(item.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Pairing suggestion if we have both */}
          {primaryFood.length > 0 && primaryDrinks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 p-4 bg-[#722F37]/5 rounded-xl text-center"
            >
              <p className="text-sm text-[#722F37] flex items-center gap-1">
                <Lightbulb className="w-4 h-4 flex-shrink-0" /> <strong>{primaryDrinks[0].name}</strong> pairs beautifully with <strong>{primaryFood[0].name}</strong>
              </p>
            </motion.div>
          )}
        </>
      )}

      {/* No results state */}
      {primaryFood.length === 0 && primaryDrinks.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#B2472A]/10 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-[#B2472A]" />
          </div>
          <h3 className="text-xl font-medium text-[#1a1a1a] mb-2">
            No perfect matches found
          </h3>
          <p className="text-[#1a1a1a]/50 mb-6 max-w-sm mx-auto">
            Your preferences are important to us. We&apos;ve let {venueName} know!
          </p>
          <button
            onClick={onStartOver}
            className="px-6 py-3 bg-[#B2472A] text-white rounded-full"
          >
            Try again
          </button>
        </motion.div>
      )}

      {/* Mesa App Waitlist CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 pt-6 border-t border-[#1a1a1a]/10 text-center"
      >
        <p className="text-sm text-[#1a1a1a]/50 mb-3">
          Want personalized recommendations at every restaurant?
        </p>
        <button
          onClick={() => setShowAppSignup(true)}
          className="text-[#722F37] font-medium text-sm hover:text-[#5a252c]"
        >
          Get notified when Mesa launches →
        </button>
      </motion.div>

      {/* App Signup Modal */}
      {showAppSignup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
          >
            {emailSubmitted ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <PartyPopper className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">
                  You&apos;re on the list!
                </h3>
                <p className="text-sm text-[#1a1a1a]/60 mb-4">
                  We&apos;ll let you know when Mesa is ready for you.
                </p>
                <button
                  onClick={() => setShowAppSignup(false)}
                  className="text-[#722F37] font-medium text-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">
                  Coming Soon: Mesa App
                </h3>
                <p className="text-sm text-[#1a1a1a]/60 mb-4">
                  Get personalized menu recommendations at any restaurant.
                  Be the first to know when we launch!
                </p>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={appEmail}
                  onChange={(e) => setAppEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#1a1a1a]/10 mb-3 focus:outline-none focus:ring-2 focus:ring-[#722F37]/20 focus:border-[#722F37]"
                />
                <button
                  onClick={handleAppSignup}
                  disabled={!appEmail || !appEmail.includes('@')}
                  className="w-full py-3 bg-[#722F37] text-white rounded-xl hover:bg-[#5a252c] transition disabled:opacity-50"
                >
                  Notify Me
                </button>
                <button
                  onClick={() => setShowAppSignup(false)}
                  className="w-full py-2 text-[#1a1a1a]/50 text-sm mt-2"
                >
                  Maybe later
                </button>
              </>
            )}
          </motion.div>
        </div>
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

