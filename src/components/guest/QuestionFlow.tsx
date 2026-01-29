'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GuestPreferences, MoodTag, FlavorTag, PortionTag, DietTag, PriceTag } from '@/lib/types/taxonomy'
import { Button } from '@/components/ui/button'
import { createRecSession, trackEvent, getRecommendationsWithFallback, saveRecResults, RecommendedItem, trackUnmetDemand, RecommendationsResult } from '@/lib/recommendations'

interface QuestionFlowProps {
  venueId: string
  tableRef: string | null
  onComplete: (recommendations: RecommendedItem[], showFallbackMessage?: boolean) => void
  onBack: () => void
}

type Step = 1 | 2 | 3 | 4 | 5

const moodOptions: { id: MoodTag; label: string; icon: string }[] = [
  { id: 'mood_comfort', label: 'Comfort / Indulgent', icon: '🍔' },
  { id: 'mood_light', label: 'Fresh / Light', icon: '🥗' },
  { id: 'mood_protein', label: 'High-protein / Filling', icon: '💪' },
  { id: 'mood_warm', label: 'Warm / Cozy', icon: '🍜' },
  { id: 'mood_treat', label: 'Sweet Treat', icon: '🍰' },
]

const flavorOptions: { id: FlavorTag; label: string; icon: string }[] = [
  { id: 'flavor_umami', label: 'Savoury / Umami', icon: '🧀' },
  { id: 'flavor_spicy', label: 'Spicy', icon: '🌶️' },
  { id: 'flavor_sweet', label: 'Sweet', icon: '🍯' },
  { id: 'flavor_tangy', label: 'Tangy / Sour', icon: '🍋' },
  { id: 'flavor_smoky', label: 'Smoky', icon: '🔥' },
]

const portionOptions: { id: PortionTag; label: string; icon: string }[] = [
  { id: 'portion_bite', label: 'Just a bite', icon: '🥄' },
  { id: 'portion_standard', label: 'Normal hungry', icon: '🍽️' },
  { id: 'portion_hearty', label: 'Very hungry', icon: '🍖' },
]

const dietOptions: { id: DietTag; label: string }[] = [
  { id: 'diet_vegetarian', label: 'Vegetarian' },
  { id: 'diet_vegan', label: 'Vegan' },
  { id: 'diet_gluten_free', label: 'Gluten-free' },
  { id: 'diet_dairy_free', label: 'Dairy-free' },
  { id: 'diet_halal', label: 'Halal' },
  { id: 'diet_no_pork', label: 'No pork' },
  { id: 'allergy_nut_free', label: 'Nut allergy' },
]

const priceOptions: { id: PriceTag; label: string; icon: string }[] = [
  { id: 'price_1', label: '€ Best value', icon: '💚' },
  { id: 'price_2', label: '€€ Mid-range', icon: '⭐' },
  { id: 'price_3', label: '€€€ Treat yourself', icon: '✨' },
]

const slideVariants = {
  enter: (direction: number) => ({
    y: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    y: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    y: direction < 0 ? 50 : -50,
    opacity: 0,
  }),
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
}

const chipVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.4, 0.25, 1] as const,
    },
  },
}

const titleVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
}

export function QuestionFlow({ venueId, tableRef, onComplete, onBack }: QuestionFlowProps) {
  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState(1)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [preferences, setPreferences] = useState<GuestPreferences>({
    mood: null,
    flavors: [],
    portion: null,
    dietary: [],
    price: null,
  })

  // Create session when flow starts
  useEffect(() => {
    async function initSession() {
      const id = await createRecSession(venueId, tableRef)
      setSessionId(id)
      if (id) {
        trackEvent(venueId, id, 'flow_started', { tableRef })
      }
    }
    initSession()
  }, [venueId, tableRef])

  const handleComplete = useCallback(async () => {
    setIsLoading(true)

    if (sessionId) {
      trackEvent(venueId, sessionId, 'flow_completed', { preferences })
    }

    // Start fetching recommendations
    const fetchStart = Date.now()
    const result = await getRecommendationsWithFallback(venueId, preferences, 3)
    const allRecommendations = [...result.recommendations, ...result.fallbackItems.map(item => ({ ...item, isFallback: true }))]

    // Ensure loading screen shows for at least 2 seconds for effect
    const elapsed = Date.now() - fetchStart
    if (elapsed < 2000) {
      await new Promise(resolve => setTimeout(resolve, 2000 - elapsed))
    }

    // Track unmet demand if we had to show fallback items
    if (result.showFallbackMessage && sessionId) {
      await trackUnmetDemand(venueId, sessionId, preferences)
    }

    if (sessionId) {
      // Save results with actual scores
      const resultsToSave = allRecommendations.map(r => ({
        id: r.id,
        score: r.score,
        reason: r.reason,
      }))
      await saveRecResults(sessionId, resultsToSave)
      trackEvent(venueId, sessionId, 'recommendations_shown', {
        count: allRecommendations.length,
        items: allRecommendations.map(r => r.id),
        hasFallback: result.showFallbackMessage,
      })
    }

    setIsLoading(false)
    onComplete(allRecommendations, result.showFallbackMessage)
  }, [venueId, preferences, sessionId, onComplete])

  const goNext = () => {
    if (step < 5) {
      if (sessionId) {
        trackEvent(venueId, sessionId, 'step_completed', { step, preferences })
      }
      setDirection(1)
      setStep((s) => (s + 1) as Step)
    } else {
      handleComplete()
    }
  }

  const goBack = () => {
    if (step > 1) {
      if (sessionId) {
        trackEvent(venueId, sessionId, 'step_back', { step })
      }
      setDirection(-1)
      setStep((s) => (s - 1) as Step)
    } else {
      if (sessionId) {
        trackEvent(venueId, sessionId, 'flow_abandoned', { step })
      }
      onBack()
    }
  }

  const selectMood = (mood: MoodTag) => {
    setPreferences((p) => ({ ...p, mood }))
    if (sessionId) {
      trackEvent(venueId, sessionId, 'mood_selected', { mood })
    }
  }

  const toggleFlavor = (flavor: FlavorTag) => {
    setPreferences((p) => {
      if (p.flavors.includes(flavor)) {
        return { ...p, flavors: p.flavors.filter((f) => f !== flavor) }
      }
      if (p.flavors.length >= 2) return p
      return { ...p, flavors: [...p.flavors, flavor] }
    })
  }

  const selectPortion = (portion: PortionTag) => {
    setPreferences((p) => ({ ...p, portion }))
  }

  const toggleDiet = (diet: DietTag) => {
    setPreferences((p) => {
      if (p.dietary.includes(diet)) {
        return { ...p, dietary: p.dietary.filter((d) => d !== diet) }
      }
      return { ...p, dietary: [...p.dietary, diet] }
    })
  }

  const selectPrice = (price: PriceTag | null) => {
    setPreferences((p) => ({ ...p, price }))
  }

  const canContinue = () => {
    switch (step) {
      case 1:
        return preferences.mood !== null
      case 2:
        return true
      case 3:
        return preferences.portion !== null
      case 4:
        return true
      case 5:
        return true
      default:
        return false
    }
  }

  const renderChip = (
    selected: boolean,
    label: string,
    icon?: string,
    onClick?: () => void
  ) => (
    <motion.div
      key={label}
      variants={chipVariants}
    >
      <button
        onClick={onClick}
        className={`
          flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-colors duration-200
          ${
            selected
              ? 'border-2 border-[#B2472A] text-[#B2472A] bg-[#B2472A]/5'
              : 'border-2 border-[#1a1a1a]/20 text-[#1a1a1a]/70 hover:border-[#1a1a1a]/40'
          }
        `}
      >
        {icon && <span className="text-lg">{icon}</span>}
        <span>{label}</span>
      </button>
    </motion.div>
  )

  // Loading screen
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-[#FDFBF7] flex items-center justify-center z-50"
      >
        <div className="text-center">
          {/* Animated logo/icon */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-6xl mb-8"
          >
            🍽️
          </motion.div>

          {/* Brand name with animation */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-serif text-4xl text-[#1a1a1a] mb-4"
          >
            MESA
          </motion.h2>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-[#1a1a1a]/60 text-lg italic"
          >
            Menus made manageable
          </motion.p>

          {/* Loading dots */}
          <motion.div className="flex justify-center gap-2 mt-8">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-[#B2472A] rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>

          {/* Subtle message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-[#1a1a1a]/40 text-sm mt-6"
          >
            Finding your perfect match...
          </motion.p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-mesa-ivory relative overflow-hidden">
      {/* Fixed top progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-mesa-sand z-50">
        <motion.div
          className="h-full bg-mesa-500"
          initial={{ width: 0 }}
          animate={{ width: `${(step / 5) * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
      </div>

      {/* Warm gradient blobs */}
      <div className="blob blob-mesa w-[300px] h-[300px] top-1/4 -right-32 opacity-15" />
      <div className="blob blob-mesa w-[200px] h-[200px] bottom-1/4 -left-16 opacity-10" />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Progress indicator */}
        <div className="px-6 pt-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-mesa-graphite/60">Step {step} of 5</span>
          </div>
          <div className="h-1 bg-mesa-sand rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-mesa-500"
              initial={false}
              animate={{ width: `${(step / 5) * 100}%` }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
            />
          </div>
        </div>

        {/* Back button */}
        <div className="px-6 pt-4">
          <button
            onClick={goBack}
            className="text-mesa-graphite/70 hover:text-mesa-ink text-sm flex items-center gap-1"
          >
            <span>←</span> Back
          </button>
        </div>

        {/* Questions */}
        <div className="flex-1 px-6 py-8 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                className="max-w-sm mx-auto"
              >
                <motion.h1
                  variants={titleVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl font-bold text-mesa-ink mb-2"
                >
                  What are you in the mood for?
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-mesa-graphite mb-8"
                >
                  Select one option
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {moodOptions.map((option) =>
                    renderChip(
                      preferences.mood === option.id,
                      option.label,
                      option.icon,
                      () => selectMood(option.id)
                    )
                  )}
                </motion.div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                className="max-w-sm mx-auto"
              >
                <motion.h1
                  variants={titleVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl font-bold text-mesa-ink mb-2"
                >
                  Pick your flavour direction
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-mesa-graphite mb-8"
                >
                  Select up to 2 (optional)
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {flavorOptions.map((option) =>
                    renderChip(
                      preferences.flavors.includes(option.id),
                      option.label,
                      option.icon,
                      () => toggleFlavor(option.id)
                    )
                  )}
                </motion.div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                className="max-w-sm mx-auto"
              >
                <motion.h1
                  variants={titleVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl font-bold text-mesa-ink mb-2"
                >
                  How hungry are you?
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-mesa-graphite mb-8"
                >
                  Select one option
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {portionOptions.map((option) =>
                    renderChip(
                      preferences.portion === option.id,
                      option.label,
                      option.icon,
                      () => selectPortion(option.id)
                    )
                  )}
                </motion.div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                className="max-w-sm mx-auto"
              >
                <motion.h1
                  variants={titleVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl font-bold text-mesa-ink mb-2"
                >
                  Any dietary needs?
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-mesa-graphite mb-8"
                >
                  Select all that apply (optional)
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {dietOptions.map((option) =>
                    renderChip(
                      preferences.dietary.includes(option.id),
                      option.label,
                      undefined,
                      () => toggleDiet(option.id)
                    )
                  )}
                </motion.div>
                {preferences.dietary.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setPreferences((p) => ({ ...p, dietary: [] }))}
                    className="mt-4 text-sm text-mesa-graphite/70 hover:text-mesa-ink"
                  >
                    Clear selection
                  </motion.button>
                )}
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                className="max-w-sm mx-auto"
              >
                <motion.h1
                  variants={titleVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl font-bold text-mesa-ink mb-2"
                >
                  Budget?
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-mesa-graphite mb-8"
                >
                  Optional - skip if no preference
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {priceOptions.map((option) =>
                    renderChip(
                      preferences.price === option.id,
                      option.label,
                      option.icon,
                      () => selectPrice(preferences.price === option.id ? null : option.id)
                    )
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Continue button */}
        <div className="px-6 pb-8">
          <div className="max-w-sm mx-auto">
            <Button
              variant="mesa"
              size="lg"
              className="w-full"
              onClick={goNext}
              disabled={!canContinue() || isLoading}
            >
              {isLoading ? 'Finding recommendations...' : step === 5 ? 'Show recommendations' : 'Continue'}
            </Button>
            {(step === 4 || step === 5) && (
              <Button
                variant="mesa-outline"
                size="lg"
                className="w-full mt-2"
                onClick={goNext}
                disabled={isLoading}
              >
                {step === 4 ? 'None of these' : 'Skip'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
