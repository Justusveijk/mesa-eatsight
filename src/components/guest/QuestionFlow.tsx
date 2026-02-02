'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wine, Utensils, Beef, Salad, Dumbbell, Soup, CakeSlice,
  Flame, Heart, Star, Sparkles, Leaf, Coffee, Snowflake,
  Milk, PartyPopper, Moon, Zap, Dice5, Beer, Candy,
  UtensilsCrossed, Drumstick, Citrus, type LucideIcon
} from 'lucide-react'
import { GuestPreferences, MoodTag, FlavorTag, PortionTag, DietTag, PriceTag } from '@/lib/types/taxonomy'
import { Button } from '@/components/ui/button'
import type { IconName } from '@/lib/questions'

// Icon mapping from string names to Lucide components
const iconMap: Record<IconName, LucideIcon> = {
  'beef': Beef,
  'salad': Salad,
  'dumbbell': Dumbbell,
  'soup': Soup,
  'cake-slice': CakeSlice,
  'cheese': Beef, // Using Beef as fallback for cheese
  'flame': Flame,
  'honey': Candy, // Using Candy as fallback for honey
  'citrus': Citrus,
  'campfire': Flame, // Using Flame as fallback for campfire
  'utensils-crossed': UtensilsCrossed,
  'drumstick': Drumstick,
  'heart': Heart,
  'star': Star,
  'sparkles': Sparkles,
  'bubbles': Sparkles, // Using Sparkles as fallback for bubbles
  'leaf': Leaf,
  'wine': Wine,
  'coffee': Coffee,
  'snowflake': Snowflake,
  'glass-water': Wine, // Using Wine as fallback
  'milk': Milk,
  'candy': Candy,
  'olive': Leaf, // Using Leaf as fallback for olive
  'wood': Flame, // Using Flame as fallback for wood
  'party-popper': PartyPopper,
  'moon': Moon,
  'zap': Zap,
  'dice-5': Dice5,
  'beer': Beer,
}
import { createRecSession, trackEvent, getRecommendationsWithFallback, getDrinkRecommendations, saveRecResults, RecommendedItem, trackUnmetDemand } from '@/lib/recommendations'
import { updateSessionIntents } from '@/lib/analytics'
import {
  foodMoodOptions,
  foodFlavorOptions,
  foodPortionOptions,
  foodDietOptions,
  foodPriceOptions,
  // New drink options
  drinkStrengthOptions,
  drinkFeelOptions,
  drinkTasteOptions,
  DrinkStrengthValue,
  DrinkFeelValue,
  DrinkTasteValue,
  DrinkPreferences,
  defaultDrinkPreferences,
} from '@/lib/questions'

export type Intent = 'drinks' | 'food' | 'both'

// Structured results with food and drinks separated
export interface RecommendationResults {
  primaryFood: RecommendedItem[]
  primaryDrinks: RecommendedItem[]
  pairingFood: RecommendedItem[]
  pairingDrinks: RecommendedItem[]
  intent: Intent
  showFallbackMessage: boolean
  unmetPreferences: string[]
  feedbackMessage: string | null
}

interface QuestionFlowProps {
  venueId: string
  tableRef: string | null
  intent: Intent
  existingSessionId?: string | null  // Session already created by VenueFlow
  onComplete: (results: RecommendationResults) => void
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

export function QuestionFlow({ venueId, tableRef, intent, existingSessionId, onComplete, onBack }: QuestionFlowProps) {
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

  // Use existing session from VenueFlow, or create a new one
  const [sessionId, setSessionId] = useState<string | null>(existingSessionId || null)
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

  // Create session when flow starts (only if not passed from VenueFlow)
  useEffect(() => {
    async function initSession() {
      // If we already have a session from VenueFlow, don't create a new one
      if (existingSessionId) {
        console.log('[QuestionFlow] Using existing session:', existingSessionId)
        setSessionId(existingSessionId)
        return
      }

      // Otherwise create a new session
      console.log('[QuestionFlow] Creating new session...')
      const id = await createRecSession(venueId, tableRef)
      setSessionId(id)
      if (id) {
        trackEvent(venueId, id, 'flow_started', { tableRef, intent })
      }
    }
    initSession()
  }, [venueId, tableRef, intent, existingSessionId])

  const handleComplete = useCallback(async () => {
    setIsLoading(true)

    console.log('🔥 QuestionFlow handleComplete CALLED')
    console.log('  Intent:', intent)
    console.log('  Food Preferences:', foodPreferences)
    console.log('  Drink Preferences:', drinkPreferences)

    // Collect all preference tags for analytics
    const intentChips: string[] = []

    // Food preferences
    if (foodPreferences.mood) intentChips.push(foodPreferences.mood)
    foodPreferences.flavors.forEach(f => intentChips.push(f))
    if (foodPreferences.portion) intentChips.push(foodPreferences.portion)
    foodPreferences.dietary.forEach(d => intentChips.push(d))
    if (foodPreferences.price) intentChips.push(foodPreferences.price)

    // Drink preferences
    if (drinkPreferences.drinkStrength) intentChips.push(drinkPreferences.drinkStrength)
    if (drinkPreferences.drinkFeel) intentChips.push(drinkPreferences.drinkFeel)
    drinkPreferences.drinkTaste.forEach(t => intentChips.push(t))

    // Save intent chips to session for analytics
    if (sessionId && intentChips.length > 0) {
      await updateSessionIntents(sessionId, intentChips)
    }

    if (sessionId) {
      trackEvent(venueId, sessionId, 'flow_completed', { foodPreferences, drinkPreferences, intent })
    }

    // Start fetching recommendations
    const fetchStart = Date.now()
    let showFallbackMessage = false
    const unmetPreferences: string[] = []

    // Keep food and drinks SEPARATE from the start
    let primaryFood: RecommendedItem[] = []
    let primaryDrinks: RecommendedItem[] = []
    let pairingFood: RecommendedItem[] = []
    let pairingDrinks: RecommendedItem[] = []

    // Main food recommendations
    if (intent === 'food' || intent === 'both') {
      console.log('🍔 Fetching food recommendations...')
      const result = await getRecommendationsWithFallback(venueId, foodPreferences, intent === 'both' ? 2 : 3)
      primaryFood = [...result.recommendations, ...result.fallbackItems.map(item => ({ ...item, isFallback: true }))]
      showFallbackMessage = result.showFallbackMessage
      console.log('🍔 Food recommendations received:', primaryFood.length, primaryFood.map(f => f.name))

      // Track unmet demand if we had to show fallback items
      if (result.showFallbackMessage && sessionId) {
        await trackUnmetDemand(venueId, sessionId, foodPreferences)
        if (foodPreferences.dietary.includes('diet_vegan')) {
          unmetPreferences.push('vegan options')
        }
        if (foodPreferences.dietary.includes('diet_vegetarian')) {
          unmetPreferences.push('vegetarian options')
        }
        if (foodPreferences.dietary.includes('diet_gluten_free')) {
          unmetPreferences.push('gluten-free options')
        }
      }
    }

    // Main drink recommendations
    if (intent === 'drinks' || intent === 'both') {
      console.log('🍹 Fetching drink recommendations...')
      console.log('  Drink preferences:', drinkPreferences)
      const drinkRecs = await getDrinkRecommendations(venueId, drinkPreferences, intent === 'both' ? 2 : 3)
      primaryDrinks = drinkRecs
      console.log('🍹 Drink recommendations received:', primaryDrinks.length, primaryDrinks.map(d => d.name))

      // Check for unmet drink preferences
      const isNonAlcoholic = drinkPreferences.drinkStrength === 'abv_zero' || drinkPreferences.drinkStrength === 'strength_none'
      if (isNonAlcoholic && primaryDrinks.length === 0) {
        unmetPreferences.push('non-alcoholic drinks')
      }
    }

    // Cross-sell: If drinks only, suggest food
    if (intent === 'drinks') {
      const defaultFoodPrefs = {
        mood: 'mood_comfort' as MoodTag,
        flavors: [],
        portion: 'portion_standard' as PortionTag,
        dietary: [],
        price: null,
      }
      const crossSellFood = await getRecommendationsWithFallback(venueId, defaultFoodPrefs, 2)
      pairingFood = crossSellFood.recommendations.map(item => ({ ...item, isCrossSell: true }))
      console.log('🍔 Pairing food:', pairingFood.map(f => f.name))
    }

    // Cross-sell: If food only, suggest drinks
    if (intent === 'food') {
      const defaultDrinkPrefs: DrinkPreferences = {
        drinkStrength: 'abv_light',
        drinkFeel: 'format_crisp',
        drinkTaste: [],
      }
      const crossSellDrinks = await getDrinkRecommendations(venueId, defaultDrinkPrefs, 2)
      pairingDrinks = crossSellDrinks.map(item => ({ ...item, isCrossSell: true }))
      console.log('🍹 Pairing drinks:', pairingDrinks.map(d => d.name))
    }

    // Generate feedback message if we have unmet preferences
    let feedbackMessage: string | null = null
    if (unmetPreferences.length > 0) {
      feedbackMessage = `We'll share your interest in ${unmetPreferences.join(' and ')} with the restaurant.`
      if (sessionId) {
        trackEvent(venueId, sessionId, 'unmet_demand', { preferences: unmetPreferences })
      }
    }

    // Ensure loading screen shows for at least 2 seconds for effect
    const elapsed = Date.now() - fetchStart
    if (elapsed < 2000) {
      await new Promise(resolve => setTimeout(resolve, 2000 - elapsed))
    }

    // Save results to analytics
    const allItems = [...primaryFood, ...primaryDrinks, ...pairingFood, ...pairingDrinks]
    if (sessionId) {
      const resultsToSave = allItems.map(r => ({
        id: r.id,
        score: r.score,
        reason: r.reason,
      }))
      await saveRecResults(sessionId, resultsToSave)
      trackEvent(venueId, sessionId, 'recommendations_shown', {
        count: allItems.length,
        items: allItems.map(r => r.id),
        hasFallback: showFallbackMessage,
        unmetPreferences,
      })
    }

    // Build structured result
    const results: RecommendationResults = {
      primaryFood,
      primaryDrinks,
      pairingFood,
      pairingDrinks,
      intent,
      showFallbackMessage,
      unmetPreferences,
      feedbackMessage,
    }

    console.log('📤 QuestionFlow calling onComplete with structured results:')
    console.log('  Intent:', results.intent)
    console.log('  Primary Food:', results.primaryFood.map(f => f.name))
    console.log('  Primary Drinks:', results.primaryDrinks.map(d => d.name))
    console.log('  Pairing Food:', results.pairingFood.map(f => f.name))
    console.log('  Pairing Drinks:', results.pairingDrinks.map(d => d.name))

    setIsLoading(false)
    onComplete(results)
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

  // Drink selections - NEW order: strength, feel, taste
  const selectDrinkStrength = (strength: DrinkStrengthValue) => {
    setDrinkPreferences((p) => ({ ...p, drinkStrength: strength }))
  }

  const selectDrinkFeel = (feel: DrinkFeelValue) => {
    setDrinkPreferences((p) => ({ ...p, drinkFeel: feel }))
  }

  const toggleDrinkTaste = (taste: DrinkTasteValue) => {
    setDrinkPreferences((p) => {
      if (p.drinkTaste.includes(taste)) {
        return { ...p, drinkTaste: p.drinkTaste.filter((t) => t !== taste) }
      }
      if (p.drinkTaste.length >= 2) return p // Max 2 selections
      return { ...p, drinkTaste: [...p.drinkTaste, taste] }
    })
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
      case 1: return drinkPreferences.drinkStrength !== null  // Step 1: Alcohol strength (required)
      case 2: return drinkPreferences.drinkFeel !== null      // Step 2: Temperature/feel (required)
      case 3: return true                                      // Step 3: Taste (optional)
      default: return false
    }
  }

  const renderChip = (
    selected: boolean,
    label: string,
    icon?: IconName,
    onClick?: () => void
  ) => {
    const IconComponent = icon ? iconMap[icon] : null
    return (
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
          {IconComponent && <IconComponent className="w-5 h-5" />}
          <span>{label}</span>
        </button>
      </motion.div>
    )
  }

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
            className="w-20 h-20 rounded-2xl bg-[#B2472A]/10 flex items-center justify-center mb-8"
          >
            {intent === 'drinks' ? <Wine className="w-10 h-10 text-[#B2472A]" /> : <Utensils className="w-10 h-10 text-[#B2472A]" />}
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
      <div className="fixed inset-0 z-50 flex flex-col bg-[#FDFBF7]">
        {/* Fixed header with back + progress */}
        <header className="flex-shrink-0 bg-[#FDFBF7] border-b border-[#1a1a1a]/5">
          {/* Top bar with back button */}
          <div className="px-4 py-3 flex items-center">
            <button
              onClick={goBack}
              className="text-[#1a1a1a]/50 hover:text-[#1a1a1a] text-sm"
            >
              ← Back
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              {Array.from({ length: totalFoodSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < step ? 'bg-[#B2472A]' : 'bg-[#1a1a1a]/10'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-[#1a1a1a]/40 text-center">
              {intent === 'both' ? `Food: ` : ''}Step {step} of {totalFoodSteps}
            </p>
          </div>
        </header>

        {/* Scrollable questions area - centered */}
        <main className="flex-1 overflow-y-auto flex items-center justify-center px-6 py-6">
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
        </main>

        {/* Fixed bottom button */}
        <footer className="flex-shrink-0 px-6 pb-6 pt-4 bg-[#FDFBF7] border-t border-[#1a1a1a]/5">
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
        </footer>
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
      <div className="fixed inset-0 z-50 flex flex-col bg-[#FDFBF7]">
        {/* Fixed header with back + progress */}
        <header className="flex-shrink-0 bg-[#FDFBF7] border-b border-[#1a1a1a]/5">
          {/* Top bar with back button */}
          <div className="px-4 py-3 flex items-center">
            <button
              onClick={goBack}
              className="text-[#1a1a1a]/50 hover:text-[#1a1a1a] text-sm"
            >
              ← Back
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              {Array.from({ length: totalDrinkSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < step ? 'bg-[#B2472A]' : 'bg-[#1a1a1a]/10'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-[#1a1a1a]/40 text-center">
              {intent === 'both' ? `Drinks: ` : ''}Step {step} of {totalDrinkSteps}
            </p>
          </div>
        </header>

        {/* Scrollable questions area - centered */}
        <main className="flex-1 overflow-y-auto flex items-center justify-center px-6 py-6">
          <AnimatePresence mode="wait" custom={direction}>
            {/* STEP 1: Alcohol Strength (FIRST - most important filter) */}
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
                  How strong do you want it?
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-[#1a1a1a]/60 mb-8"
                >
                  Select one
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

            {/* STEP 2: Temperature/Feel (SECOND - narrows down further) */}
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
                  What kind of drink?
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-[#1a1a1a]/60 mb-8"
                >
                  Select one
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3 justify-center"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {drinkFeelOptions.map((option) =>
                    renderChip(
                      drinkPreferences.drinkFeel === option.id,
                      option.label,
                      option.icon,
                      () => selectDrinkFeel(option.id)
                    )
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* STEP 3: Taste (LAST - fine-tunes the selection) */}
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
                  Pick your taste direction
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-[#1a1a1a]/60 mb-8"
                >
                  Select up to 2
                </motion.p>
                <motion.div
                  className="flex flex-wrap gap-3 justify-center"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {drinkTasteOptions.map((option) =>
                    renderChip(
                      drinkPreferences.drinkTaste.includes(option.id),
                      option.label,
                      option.icon,
                      () => toggleDrinkTaste(option.id)
                    )
                  )}
                </motion.div>
                {drinkPreferences.drinkTaste.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setDrinkPreferences((p) => ({ ...p, drinkTaste: [] }))}
                    className="mt-4 text-sm text-[#1a1a1a]/70 hover:text-[#1a1a1a]"
                  >
                    Clear selection
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Fixed bottom button */}
        <footer className="flex-shrink-0 px-6 pb-6 pt-4 bg-[#FDFBF7] border-t border-[#1a1a1a]/5">
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
            {step === 3 && (
              <button
                onClick={goNext}
                disabled={isLoading}
                className="w-full py-3 text-[#B2472A] text-sm font-medium mt-2"
              >
                Skip
              </button>
            )}
          </div>
        </footer>
      </div>
    )
  }

  return (
    <>
      {/* Render appropriate flow */}
      {intent === 'drinks' && renderDrinkFlow()}
      {intent === 'food' && renderFoodFlow()}
      {intent === 'both' && (currentFlow === 'food' ? renderFoodFlow() : renderDrinkFlow())}
    </>
  )
}
