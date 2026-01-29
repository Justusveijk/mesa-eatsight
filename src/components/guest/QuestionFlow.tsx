'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GuestPreferences, MoodTag, FlavorTag, PortionTag, DietTag, PriceTag } from '@/lib/types/taxonomy'
import { Button } from '@/components/ui/button'
import { createRecSession, trackEvent, getRecommendationsWithFallback, getDrinkRecommendations, saveRecResults, RecommendedItem, trackUnmetDemand } from '@/lib/recommendations'
import {
  foodMoodOptions,
  foodFlavorOptions,
  foodPortionOptions,
  foodDietOptions,
  foodPriceOptions,
  drinkMoodOptions,
  drinkStyleOptions,
  drinkStrengthOptions,
  DrinkMood,
  DrinkStyle,
  DrinkStrength,
  DrinkPreferences,
  defaultDrinkPreferences,
} from '@/lib/questions'

export type Intent = 'drinks' | 'food' | 'both'

interface QuestionFlowProps {
  venueId: string
  tableRef: string | null
  intent: Intent
  onComplete: (recommendations: RecommendedItem[], showFallbackMessage?: boolean) => void
  onBack: () => void
}

type FoodStep = 1 | 2 | 3 | 4 | 5
type DrinkStep = 1 | 2 | 3

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

export function QuestionFlow({ venueId, tableRef, intent, onComplete, onBack }: QuestionFlowProps) {
  // Food flow state
  const [foodStep, setFoodStep] = useState<FoodStep>(1)
  const [foodDirection, setFoodDirection] = useState(1)
  const [foodPreferences, setFoodPreferences] = useState<GuestPreferences>({
    mood: null,
    flavors: [],
    portion: null,
    dietary: [],
    price: null,
  })

  // Drink flow state
  const [drinkStep, setDrinkStep] = useState<DrinkStep>(1)
  const [drinkDirection, setDrinkDirection] = useState(1)
  const [drinkPreferences, setDrinkPreferences] = useState<DrinkPreferences>(defaultDrinkPreferences)

  // Which flow are we in (for 'both' intent)
  const [currentFlow, setCurrentFlow] = useState<'food' | 'drinks'>(intent === 'drinks' ? 'drinks' : 'food')

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const totalFoodSteps = 5
  const totalDrinkSteps = 3

  // Calculate overall progress
  const getProgress = () => {
    if (intent === 'food') {
      return foodStep / totalFoodSteps
    } else if (intent === 'drinks') {
      return drinkStep / totalDrinkSteps
    } else {
      // Both: food first, then drinks
      if (currentFlow === 'food') {
        return (foodStep / totalFoodSteps) * 0.6 // Food is 60% of journey
      } else {
        return 0.6 + (drinkStep / totalDrinkSteps) * 0.4 // Drinks is 40%
      }
    }
  }

  // Create session when flow starts
  useEffect(() => {
    async function initSession() {
      const id = await createRecSession(venueId, tableRef)
      setSessionId(id)
      if (id) {
        trackEvent(venueId, id, 'flow_started', { tableRef, intent })
      }
    }
    initSession()
  }, [venueId, tableRef, intent])

  const handleComplete = useCallback(async () => {
    setIsLoading(true)

    if (sessionId) {
      trackEvent(venueId, sessionId, 'flow_completed', { foodPreferences, drinkPreferences, intent })
    }

    // Start fetching recommendations
    const fetchStart = Date.now()
    let allRecommendations: RecommendedItem[] = []
    let showFallbackMessage = false

    if (intent === 'food' || intent === 'both') {
      const result = await getRecommendationsWithFallback(venueId, foodPreferences, intent === 'both' ? 2 : 3)
      allRecommendations = [...result.recommendations, ...result.fallbackItems.map(item => ({ ...item, isFallback: true }))]
      showFallbackMessage = result.showFallbackMessage

      // Track unmet demand if we had to show fallback items
      if (result.showFallbackMessage && sessionId) {
        await trackUnmetDemand(venueId, sessionId, foodPreferences)
      }
    }

    if (intent === 'drinks' || intent === 'both') {
      const drinkRecs = await getDrinkRecommendations(venueId, drinkPreferences, intent === 'both' ? 2 : 3)
      allRecommendations = [...allRecommendations, ...drinkRecs]
    }

    // Ensure loading screen shows for at least 2 seconds for effect
    const elapsed = Date.now() - fetchStart
    if (elapsed < 2000) {
      await new Promise(resolve => setTimeout(resolve, 2000 - elapsed))
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
        hasFallback: showFallbackMessage,
      })
    }

    setIsLoading(false)
    onComplete(allRecommendations, showFallbackMessage)
  }, [venueId, foodPreferences, drinkPreferences, sessionId, onComplete, intent])

  // Food flow navigation
  const goNextFood = () => {
    if (foodStep < 5) {
      if (sessionId) {
        trackEvent(venueId, sessionId, 'food_step_completed', { step: foodStep, foodPreferences })
      }
      setFoodDirection(1)
      setFoodStep((s) => (s + 1) as FoodStep)
    } else {
      // Food flow done
      if (intent === 'both') {
        // Move to drinks
        setCurrentFlow('drinks')
      } else {
        handleComplete()
      }
    }
  }

  const goBackFood = () => {
    if (foodStep > 1) {
      if (sessionId) {
        trackEvent(venueId, sessionId, 'food_step_back', { step: foodStep })
      }
      setFoodDirection(-1)
      setFoodStep((s) => (s - 1) as FoodStep)
    } else {
      if (sessionId) {
        trackEvent(venueId, sessionId, 'flow_abandoned', { step: foodStep })
      }
      onBack()
    }
  }

  // Drink flow navigation
  const goNextDrink = () => {
    if (drinkStep < 3) {
      if (sessionId) {
        trackEvent(venueId, sessionId, 'drink_step_completed', { step: drinkStep, drinkPreferences })
      }
      setDrinkDirection(1)
      setDrinkStep((s) => (s + 1) as DrinkStep)
    } else {
      handleComplete()
    }
  }

  const goBackDrink = () => {
    if (drinkStep > 1) {
      if (sessionId) {
        trackEvent(venueId, sessionId, 'drink_step_back', { step: drinkStep })
      }
      setDrinkDirection(-1)
      setDrinkStep((s) => (s - 1) as DrinkStep)
    } else {
      if (intent === 'both') {
        // Go back to food flow
        setCurrentFlow('food')
      } else {
        if (sessionId) {
          trackEvent(venueId, sessionId, 'flow_abandoned', { step: drinkStep })
        }
        onBack()
      }
    }
  }

  // Food selections
  const selectMood = (mood: MoodTag) => {
    setFoodPreferences((p) => ({ ...p, mood }))
  }

  const toggleFlavor = (flavor: FlavorTag) => {
    setFoodPreferences((p) => {
      if (p.flavors.includes(flavor)) {
        return { ...p, flavors: p.flavors.filter((f) => f !== flavor) }
      }
      if (p.flavors.length >= 2) return p
      return { ...p, flavors: [...p.flavors, flavor] }
    })
  }

  const selectPortion = (portion: PortionTag) => {
    setFoodPreferences((p) => ({ ...p, portion }))
  }

  const toggleDiet = (diet: DietTag) => {
    setFoodPreferences((p) => {
      if (p.dietary.includes(diet)) {
        return { ...p, dietary: p.dietary.filter((d) => d !== diet) }
      }
      return { ...p, dietary: [...p.dietary, diet] }
    })
  }

  const selectPrice = (price: PriceTag | null) => {
    setFoodPreferences((p) => ({ ...p, price }))
  }

  // Drink selections
  const selectDrinkMood = (mood: DrinkMood) => {
    setDrinkPreferences((p) => ({ ...p, drinkMood: mood }))
  }

  const selectDrinkStyle = (style: DrinkStyle) => {
    setDrinkPreferences((p) => ({ ...p, drinkStyle: style }))
  }

  const selectDrinkStrength = (strength: DrinkStrength) => {
    setDrinkPreferences((p) => ({ ...p, drinkStrength: strength }))
  }

  // Can continue checks
  const canContinueFood = () => {
    switch (foodStep) {
      case 1: return foodPreferences.mood !== null
      case 2: return true
      case 3: return foodPreferences.portion !== null
      case 4: return true
      case 5: return true
      default: return false
    }
  }

  const canContinueDrink = () => {
    switch (drinkStep) {
      case 1: return drinkPreferences.drinkMood !== null
      case 2: return drinkPreferences.drinkStyle !== null
      case 3: return drinkPreferences.drinkStrength !== null
      default: return false
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
          flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all duration-200
          ${
            selected
              ? 'border-2 border-[#B2472A] bg-[#B2472A] text-white shadow-md'
              : 'border-2 border-[#1a1a1a]/20 bg-white text-[#1a1a1a]/70 hover:border-[#1a1a1a]/40'
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
            {intent === 'drinks' ? '🍸' : '🍽️'}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-serif text-4xl text-[#1a1a1a] mb-4"
          >
            MESA
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-[#1a1a1a]/60 text-lg italic"
          >
            Menus made manageable
          </motion.p>
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

  // Render food flow
  const renderFoodFlow = () => {
    const goNext = goNextFood
    const goBack = goBackFood
    const step = foodStep
    const direction = foodDirection
    const canContinue = canContinueFood

    return (
      <div className="min-h-[calc(100vh-56px)] flex flex-col">
        {/* Progress indicator */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-[#1a1a1a]/60">
              {intent === 'both' ? `Food: Step ${step} of ${totalFoodSteps}` : `Step ${step} of ${totalFoodSteps}`}
            </span>
          </div>
          <div className="h-1 bg-[#1a1a1a]/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#B2472A]"
              initial={false}
              animate={{ width: `${getProgress() * 100}%` }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
            />
          </div>
        </div>

        {/* Back button */}
        <div className="px-6">
          <button
            onClick={goBack}
            className="text-[#1a1a1a]/70 hover:text-[#1a1a1a] text-sm flex items-center gap-1"
          >
            <span>←</span> Back
          </button>
        </div>

        {/* Questions - centered vertically */}
        <div className="flex-1 flex items-center justify-center px-6 py-4">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="food-step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                className="w-full max-w-sm text-center"
              >
                <motion.h1
                  variants={titleVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl font-bold text-[#1a1a1a] mb-2"
                >
                  What are you in the mood for?
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-[#1a1a1a]/60 mb-8"
                >
                  Select one option
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3 justify-center"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {foodMoodOptions.map((option) =>
                    renderChip(
                      foodPreferences.mood === option.id,
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
                key="food-step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                className="w-full max-w-sm text-center"
              >
                <motion.h1
                  variants={titleVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl font-bold text-[#1a1a1a] mb-2"
                >
                  Pick your flavour direction
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-[#1a1a1a]/60 mb-8"
                >
                  Select up to 2 (optional)
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3 justify-center"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {foodFlavorOptions.map((option) =>
                    renderChip(
                      foodPreferences.flavors.includes(option.id),
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
                key="food-step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                className="w-full max-w-sm text-center"
              >
                <motion.h1
                  variants={titleVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl font-bold text-[#1a1a1a] mb-2"
                >
                  How hungry are you?
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-[#1a1a1a]/60 mb-8"
                >
                  Select one option
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3 justify-center"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {foodPortionOptions.map((option) =>
                    renderChip(
                      foodPreferences.portion === option.id,
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
                key="food-step4"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                className="w-full max-w-sm text-center"
              >
                <motion.h1
                  variants={titleVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl font-bold text-[#1a1a1a] mb-2"
                >
                  Any dietary needs?
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-[#1a1a1a]/60 mb-8"
                >
                  Select all that apply (optional)
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3 justify-center"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {foodDietOptions.map((option) =>
                    renderChip(
                      foodPreferences.dietary.includes(option.id),
                      option.label,
                      undefined,
                      () => toggleDiet(option.id)
                    )
                  )}
                </motion.div>
                {foodPreferences.dietary.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setFoodPreferences((p) => ({ ...p, dietary: [] }))}
                    className="mt-4 text-sm text-[#1a1a1a]/70 hover:text-[#1a1a1a]"
                  >
                    Clear selection
                  </motion.button>
                )}
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="food-step5"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                className="w-full max-w-sm text-center"
              >
                <motion.h1
                  variants={titleVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl font-bold text-[#1a1a1a] mb-2"
                >
                  Budget?
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-[#1a1a1a]/60 mb-8"
                >
                  Optional - skip if no preference
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3 justify-center"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {foodPriceOptions.map((option) =>
                    renderChip(
                      foodPreferences.price === option.id,
                      option.label,
                      option.icon,
                      () => selectPrice(foodPreferences.price === option.id ? null : option.id)
                    )
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Continue button - always visible at bottom */}
        <div className="px-6 pb-6 pt-2">
          <div className="max-w-sm mx-auto">
            <Button
              variant="mesa"
              size="lg"
              className="w-full"
              onClick={goNext}
              disabled={!canContinue() || isLoading}
            >
              {step === 5 ? (intent === 'both' ? 'Next: Drinks' : 'Show recommendations') : 'Continue'}
            </Button>
            {(step === 4 || step === 5) && (
              <button
                onClick={goNext}
                disabled={isLoading}
                className="w-full py-3 text-[#B2472A] text-sm font-medium mt-2"
              >
                {step === 4 ? 'None of these' : 'Skip'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render drink flow
  const renderDrinkFlow = () => {
    const goNext = goNextDrink
    const goBack = goBackDrink
    const step = drinkStep
    const direction = drinkDirection
    const canContinue = canContinueDrink

    return (
      <div className="min-h-[calc(100vh-56px)] flex flex-col">
        {/* Progress indicator */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-[#1a1a1a]/60">
              {intent === 'both' ? `Drinks: Step ${step} of ${totalDrinkSteps}` : `Step ${step} of ${totalDrinkSteps}`}
            </span>
          </div>
          <div className="h-1 bg-[#1a1a1a]/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#B2472A]"
              initial={false}
              animate={{ width: `${getProgress() * 100}%` }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
            />
          </div>
        </div>

        {/* Back button */}
        <div className="px-6">
          <button
            onClick={goBack}
            className="text-[#1a1a1a]/70 hover:text-[#1a1a1a] text-sm flex items-center gap-1"
          >
            <span>←</span> Back
          </button>
        </div>

        {/* Questions - centered vertically */}
        <div className="flex-1 flex items-center justify-center px-6 py-4">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="drink-step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                className="w-full max-w-sm text-center"
              >
                <motion.h1
                  variants={titleVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl font-bold text-[#1a1a1a] mb-2"
                >
                  What kind of drink are you after?
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-[#1a1a1a]/60 mb-8"
                >
                  Select one option
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3 justify-center"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {drinkMoodOptions.map((option) =>
                    renderChip(
                      drinkPreferences.drinkMood === option.id,
                      option.label,
                      option.icon,
                      () => selectDrinkMood(option.id)
                    )
                  )}
                </motion.div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="drink-step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                className="w-full max-w-sm text-center"
              >
                <motion.h1
                  variants={titleVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl font-bold text-[#1a1a1a] mb-2"
                >
                  How do you like it?
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-[#1a1a1a]/60 mb-8"
                >
                  Select one option
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3 justify-center"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {drinkStyleOptions.map((option) =>
                    renderChip(
                      drinkPreferences.drinkStyle === option.id,
                      option.label,
                      option.icon,
                      () => selectDrinkStyle(option.id)
                    )
                  )}
                </motion.div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="drink-step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
                className="w-full max-w-sm text-center"
              >
                <motion.h1
                  variants={titleVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl font-bold text-[#1a1a1a] mb-2"
                >
                  Alcohol preference?
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-[#1a1a1a]/60 mb-8"
                >
                  Select one option
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3 justify-center"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {drinkStrengthOptions.map((option) =>
                    renderChip(
                      drinkPreferences.drinkStrength === option.id,
                      option.label,
                      option.icon,
                      () => selectDrinkStrength(option.id)
                    )
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Continue button - always visible at bottom */}
        <div className="px-6 pb-6 pt-2">
          <div className="max-w-sm mx-auto">
            <Button
              variant="mesa"
              size="lg"
              className="w-full"
              onClick={goNext}
              disabled={!canContinue() || isLoading}
            >
              {step === 3 ? 'Show recommendations' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#FDFBF7] relative overflow-hidden">
      {/* Fixed top progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#1a1a1a]/10 z-50">
        <motion.div
          className="h-full bg-[#B2472A]"
          initial={{ width: 0 }}
          animate={{ width: `${getProgress() * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
      </div>

      {/* Warm gradient blobs */}
      <div className="absolute w-[300px] h-[300px] top-1/4 -right-32 bg-[#B2472A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute w-[200px] h-[200px] bottom-1/4 -left-16 bg-[#B2472A]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex-1 pt-14 overflow-hidden">
        {/* Render appropriate flow */}
        {intent === 'drinks' && renderDrinkFlow()}
        {intent === 'food' && renderFoodFlow()}
        {intent === 'both' && (currentFlow === 'food' ? renderFoodFlow() : renderDrinkFlow())}
      </div>
    </div>
  )
}
