'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Sparkles,
  Utensils,
  Wine,
  Heart,
  Leaf,
  Flame,
  Zap,
  Coffee,
  Sun,
  CakeSlice,
  Beef,
  Salad,
  Dumbbell,
  PartyPopper,
  GlassWater,
  Grape,
  CircleDot,
  Check,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────

export interface GuestAnswers {
  type: 'food' | 'drink' | 'both'
  // Food
  mood?: string
  flavors?: string[]
  portion?: string
  dietary?: string[]
  // Drink
  drinkMood?: string
  drinkFlavors?: string[]
  drinkPreferences?: string[]
}

interface QuestionOption {
  value: string
  label: string
  icon: React.ElementType
  color: string
  subtitle?: string
}

interface Question {
  id: string
  title: string
  subtitle: string
  multiSelect: boolean
  maxSelections?: number
  canSkip: boolean
  options: QuestionOption[]
}

interface QuestionFlowProps {
  venue: { name: string }
  onComplete: (answers: GuestAnswers) => void
  onProgress: (progress: number) => void
  onAnswer?: (questionId: string, answer: string | string[]) => void
}

// ── Question Definitions ───────────────────────────────────────────────

const TYPE_QUESTION: Question = {
  id: 'type',
  title: 'What are you looking for?',
  subtitle: "Let's find your perfect match",
  multiSelect: false,
  canSkip: false,
  options: [
    { value: 'food', label: 'Something to eat', icon: Utensils, color: '#C4654A' },
    { value: 'drink', label: 'Something to drink', icon: Wine, color: '#722F37' },
    { value: 'both', label: 'Both, please', icon: Sparkles, color: '#8B6F47' },
  ],
}

const FOOD_QUESTIONS: Question[] = [
  {
    id: 'mood',
    title: 'What are you in the mood for?',
    subtitle: "We'll match dishes to your vibe",
    multiSelect: false,
    canSkip: false,
    options: [
      { value: 'mood_comfort', label: 'Comfort & indulgent', icon: Heart, color: '#722F37', subtitle: 'Rich, satisfying, soul food' },
      { value: 'mood_light', label: 'Fresh & light', icon: Salad, color: '#22c55e', subtitle: 'Clean, healthy, refreshing' },
      { value: 'mood_protein', label: 'High-protein', icon: Dumbbell, color: '#C4654A', subtitle: 'Filling, nutritious, power meal' },
      { value: 'mood_warm', label: 'Warm & cozy', icon: Coffee, color: '#f59e0b', subtitle: 'Soups, stews, hot dishes' },
      { value: 'mood_treat', label: 'Sweet treat', icon: CakeSlice, color: '#8b5cf6', subtitle: 'Desserts, indulgences' },
    ],
  },
  {
    id: 'flavors',
    title: 'Pick your flavor direction',
    subtitle: 'Select up to 2',
    multiSelect: true,
    maxSelections: 2,
    canSkip: false,
    options: [
      { value: 'flavor_umami', label: 'Savoury / umami', icon: Beef, color: '#8B6F47' },
      { value: 'flavor_spicy', label: 'Spicy', icon: Flame, color: '#ef4444' },
      { value: 'flavor_sweet', label: 'Sweet', icon: CakeSlice, color: '#8b5cf6' },
      { value: 'flavor_tangy', label: 'Tangy / sour', icon: Grape, color: '#f59e0b' },
      { value: 'flavor_smoky', label: 'Smoky', icon: Zap, color: '#C4654A' },
    ],
  },
  {
    id: 'portion',
    title: 'How hungry are you?',
    subtitle: "We'll size up your picks",
    multiSelect: false,
    canSkip: false,
    options: [
      { value: 'portion_bite', label: 'Just a bite', icon: Coffee, color: '#8B6F47' },
      { value: 'portion_standard', label: 'Normal appetite', icon: Sun, color: '#C4654A' },
      { value: 'portion_hearty', label: 'Very hungry', icon: Flame, color: '#722F37' },
    ],
  },
  {
    id: 'dietary',
    title: 'Any dietary needs?',
    subtitle: 'Select all that apply, or skip',
    multiSelect: true,
    canSkip: true,
    options: [
      { value: 'diet_vegetarian', label: 'Vegetarian', icon: Leaf, color: '#22c55e' },
      { value: 'diet_vegan', label: 'Vegan', icon: Leaf, color: '#16a34a' },
      { value: 'diet_gluten_free', label: 'Gluten-free', icon: Sparkles, color: '#f59e0b' },
      { value: 'diet_dairy_free', label: 'Dairy-free', icon: GlassWater, color: '#3b82f6' },
      { value: 'diet_halal', label: 'Halal', icon: Check, color: '#8B6F47' },
      { value: 'diet_no_pork', label: 'No pork', icon: CircleDot, color: '#C4654A' },
      { value: 'allergy_nut_free', label: 'Nut allergy', icon: CircleDot, color: '#ef4444' },
    ],
  },
]

const DRINK_QUESTIONS: Question[] = [
  {
    id: 'drinkMood',
    title: "What's your vibe?",
    subtitle: "We'll find the right drink for the moment",
    multiSelect: false,
    canSkip: false,
    options: [
      { value: 'drink_mood_celebrate', label: 'Celebrate', icon: PartyPopper, color: '#8b5cf6', subtitle: 'Cocktails, champagne' },
      { value: 'drink_mood_unwind', label: 'Unwind', icon: Wine, color: '#722F37', subtitle: 'Wine, whiskey' },
      { value: 'drink_mood_refresh', label: 'Refresh', icon: GlassWater, color: '#3b82f6', subtitle: 'Light, hydrating' },
      { value: 'drink_mood_energize', label: 'Energize', icon: Zap, color: '#f59e0b', subtitle: 'Coffee, tea' },
      { value: 'drink_mood_treat', label: 'Treat myself', icon: Sparkles, color: '#C4654A', subtitle: 'Premium, indulgent' },
    ],
  },
  {
    id: 'drinkFlavors',
    title: 'Flavor profile?',
    subtitle: 'Select up to 2',
    multiSelect: true,
    maxSelections: 2,
    canSkip: false,
    options: [
      { value: 'drink_flavor_fruity', label: 'Fruity / citrus', icon: Grape, color: '#f59e0b' },
      { value: 'drink_flavor_bitter', label: 'Bitter / herbal', icon: Leaf, color: '#22c55e' },
      { value: 'drink_flavor_sweet', label: 'Sweet / creamy', icon: CakeSlice, color: '#8b5cf6' },
      { value: 'drink_flavor_dry', label: 'Dry / crisp', icon: GlassWater, color: '#3b82f6' },
      { value: 'drink_flavor_smoky', label: 'Smoky / bold', icon: Flame, color: '#C4654A' },
    ],
  },
  {
    id: 'drinkPreferences',
    title: 'Any preferences?',
    subtitle: 'Select all that apply, or skip',
    multiSelect: true,
    canSkip: true,
    options: [
      { value: 'drink_non_alcoholic', label: 'Non-alcoholic', icon: GlassWater, color: '#3b82f6' },
      { value: 'drink_low_sugar', label: 'Low sugar', icon: Leaf, color: '#22c55e' },
      { value: 'diet_vegan', label: 'Vegan', icon: Leaf, color: '#16a34a' },
      { value: 'drink_no_caffeine', label: 'Caffeine-free', icon: Coffee, color: '#8B6F47' },
    ],
  },
]

// ── Component ──────────────────────────────────────────────────────────

export function QuestionFlow({
  venue,
  onComplete,
  onProgress,
  onAnswer,
}: QuestionFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [selectedType, setSelectedType] = useState<'food' | 'drink' | 'both' | null>(null)
  const [singleAnswers, setSingleAnswers] = useState<Record<string, string>>({})
  const [multiAnswers, setMultiAnswers] = useState<Record<string, string[]>>({})

  // Build question sequence based on selected type
  const questions = useMemo(() => {
    if (!selectedType) return [TYPE_QUESTION]
    if (selectedType === 'food') {
      return [TYPE_QUESTION, ...FOOD_QUESTIONS]
    }
    if (selectedType === 'drink') {
      return [TYPE_QUESTION, ...DRINK_QUESTIONS]
    }
    if (selectedType === 'both') {
      return [TYPE_QUESTION, ...FOOD_QUESTIONS, ...DRINK_QUESTIONS]
    }
    return [TYPE_QUESTION]
  }, [selectedType])

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const canGoBack = currentIndex > 0
  const totalQuestions = questions.length

  // Report progress whenever index changes
  const reportProgress = useCallback(
    (index: number) => {
      const progress = totalQuestions > 1 ? (index / (totalQuestions - 1)) * 100 : 0
      onProgress(Math.min(progress, 100))
    },
    [totalQuestions, onProgress]
  )

  // Build final answers object
  const buildAnswers = useCallback((): GuestAnswers => {
    const type = (selectedType || 'food') as 'food' | 'drink' | 'both'
    const answers: GuestAnswers = { type }

    if (type === 'food' || type === 'both') {
      answers.mood = singleAnswers.mood
      answers.flavors = multiAnswers.flavors || []
      answers.portion = singleAnswers.portion
      answers.dietary = multiAnswers.dietary || []
    }
    if (type === 'drink' || type === 'both') {
      answers.drinkMood = singleAnswers.drinkMood
      answers.drinkFlavors = multiAnswers.drinkFlavors || []
      answers.drinkPreferences = multiAnswers.drinkPreferences || []
    }

    return answers
  }, [selectedType, singleAnswers, multiAnswers])

  // Handle single-select
  const handleSingleSelect = useCallback(
    (value: string) => {
      const qId = currentQuestion.id

      // Special handling for type question
      if (qId === 'type') {
        const newType = value as 'food' | 'drink' | 'both'
        // If type changed, reset subsequent answers
        if (newType !== selectedType) {
          setSingleAnswers({})
          setMultiAnswers({})
        }
        setSelectedType(newType)
        onAnswer?.(qId, value)

        // Advance after short delay
        setDirection(1)
        setTimeout(() => {
          setCurrentIndex(1)
          reportProgress(1)
        }, 250)
        return
      }

      setSingleAnswers(prev => ({ ...prev, [qId]: value }))
      onAnswer?.(qId, value)

      if (isLastQuestion) {
        // Build and submit answers
        setTimeout(() => {
          const finalAnswers = {
            ...buildAnswers(),
            ...(currentQuestion.id === 'mood' ? { mood: value } : {}),
            ...(currentQuestion.id === 'portion' ? { portion: value } : {}),
            ...(currentQuestion.id === 'drinkMood' ? { drinkMood: value } : {}),
          }
          // Ensure the latest single answer is included
          const type = (selectedType || 'food') as 'food' | 'drink' | 'both'
          const result: GuestAnswers = { type }
          const allSingle = { ...singleAnswers, [qId]: value }
          const allMulti = { ...multiAnswers }

          if (type === 'food' || type === 'both') {
            result.mood = allSingle.mood
            result.flavors = allMulti.flavors || []
            result.portion = allSingle.portion
            result.dietary = allMulti.dietary || []
          }
          if (type === 'drink' || type === 'both') {
            result.drinkMood = allSingle.drinkMood
            result.drinkFlavors = allMulti.drinkFlavors || []
            result.drinkPreferences = allMulti.drinkPreferences || []
          }
          onComplete(result)
        }, 300)
      } else {
        setDirection(1)
        setTimeout(() => {
          const next = currentIndex + 1
          setCurrentIndex(next)
          reportProgress(next)
        }, 250)
      }
    },
    [
      currentQuestion,
      currentIndex,
      isLastQuestion,
      selectedType,
      singleAnswers,
      multiAnswers,
      onAnswer,
      onComplete,
      buildAnswers,
      reportProgress,
    ]
  )

  // Handle multi-select toggle
  const handleMultiToggle = useCallback(
    (value: string) => {
      const qId = currentQuestion.id
      const max = currentQuestion.maxSelections

      setMultiAnswers(prev => {
        const current = prev[qId] || []
        if (current.includes(value)) {
          return { ...prev, [qId]: current.filter(v => v !== value) }
        }
        // Enforce max selections
        if (max && current.length >= max) {
          return { ...prev, [qId]: [...current.slice(1), value] }
        }
        return { ...prev, [qId]: [...current, value] }
      })
    },
    [currentQuestion]
  )

  // Confirm multi-select and advance
  const handleMultiConfirm = useCallback(() => {
    const qId = currentQuestion.id
    const selected = multiAnswers[qId] || []
    onAnswer?.(qId, selected)

    if (isLastQuestion) {
      setTimeout(() => {
        const type = (selectedType || 'food') as 'food' | 'drink' | 'both'
        const result: GuestAnswers = { type }
        if (type === 'food' || type === 'both') {
          result.mood = singleAnswers.mood
          result.flavors = multiAnswers.flavors || []
          result.portion = singleAnswers.portion
          result.dietary = multiAnswers.dietary || []
        }
        if (type === 'drink' || type === 'both') {
          result.drinkMood = singleAnswers.drinkMood
          result.drinkFlavors = multiAnswers.drinkFlavors || []
          result.drinkPreferences = multiAnswers.drinkPreferences || []
        }
        onComplete(result)
      }, 200)
    } else {
      setDirection(1)
      setTimeout(() => {
        const next = currentIndex + 1
        setCurrentIndex(next)
        reportProgress(next)
      }, 200)
    }
  }, [
    currentQuestion,
    currentIndex,
    isLastQuestion,
    multiAnswers,
    singleAnswers,
    selectedType,
    onAnswer,
    onComplete,
    reportProgress,
  ])

  const handleBack = useCallback(() => {
    setDirection(-1)
    const prev = currentIndex - 1
    setCurrentIndex(prev)
    reportProgress(prev)
  }, [currentIndex, reportProgress])

  // Current multi-select state
  const currentMultiSelected = multiAnswers[currentQuestion.id] || []
  const currentSingleSelected = singleAnswers[currentQuestion.id]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col relative z-10"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={!canGoBack}
          className={`p-2 rounded-full transition ${
            canGoBack
              ? 'text-mesa-charcoal hover:bg-mesa-charcoal/5'
              : 'text-transparent pointer-events-none'
          }`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {questions.map((_, i) => (
            <motion.div
              key={i}
              layout
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= currentIndex ? 'bg-mesa-burgundy' : 'bg-mesa-charcoal/10'
              }`}
              animate={{
                width: i === currentIndex ? 24 : i < currentIndex ? 16 : 6,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          ))}
        </div>

        <div className="w-10" />
      </div>

      {/* Filter progress bar */}
      <div className="px-6 mb-4">
        <div className="flex items-center justify-between text-xs text-mesa-charcoal/40 mb-1">
          <span>Narrowing down</span>
          <span className="tabular-nums">
            {Math.round(totalQuestions > 1 ? (currentIndex / (totalQuestions - 1)) * 100 : 0)}%
          </span>
        </div>
        <div className="h-1 bg-mesa-charcoal/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-mesa-burgundy to-mesa-terracotta rounded-full"
            animate={{
              width: `${totalQuestions > 1 ? (currentIndex / (totalQuestions - 1)) * 100 : 0}%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestion.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Question header */}
            <div className="text-center mb-8">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl font-serif text-mesa-charcoal mb-3"
              >
                {currentQuestion.title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-mesa-charcoal/50"
              >
                {currentQuestion.subtitle}
              </motion.p>
            </div>

            {/* Options */}
            <div className="space-y-3 max-w-md mx-auto">
              {currentQuestion.options.map((option, i) => {
                const isMulti = currentQuestion.multiSelect
                const isSelected = isMulti
                  ? currentMultiSelected.includes(option.value)
                  : currentQuestion.id === 'type'
                    ? selectedType === option.value
                    : currentSingleSelected === option.value
                const Icon = option.icon

                return (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      isMulti
                        ? handleMultiToggle(option.value)
                        : handleSingleSelect(option.value)
                    }
                    className={`w-full p-4 rounded-2xl text-left transition-all duration-200 flex items-center gap-4 relative overflow-hidden ${
                      isSelected
                        ? 'bg-mesa-burgundy text-white shadow-lg shadow-mesa-burgundy/20'
                        : 'mesa-card hover:shadow-md'
                    }`}
                  >
                    <motion.div
                      animate={{ scale: isSelected ? 1.1 : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-white/20' : ''
                      }`}
                      style={{
                        backgroundColor: !isSelected ? `${option.color}15` : undefined,
                      }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: isSelected ? 'white' : option.color }}
                      />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-base font-medium block ${
                          isSelected ? 'text-white' : 'text-mesa-charcoal'
                        }`}
                      >
                        {option.label}
                      </span>
                      {option.subtitle && (
                        <span
                          className={`text-xs block mt-0.5 ${
                            isSelected ? 'text-white/70' : 'text-mesa-charcoal/40'
                          }`}
                        >
                          {option.subtitle}
                        </span>
                      )}
                    </div>

                    {/* Selection indicator */}
                    <div className="ml-auto shrink-0">
                      {isMulti ? (
                        <motion.div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-white/30 border-white/50'
                              : 'border-mesa-charcoal/15'
                          }`}
                        >
                          <motion.div
                            initial={false}
                            animate={{ scale: isSelected ? 1 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={false}
                          animate={{ scale: isSelected ? 1 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                          className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </motion.div>
                      )}
                    </div>

                    {/* Shimmer effect on selection */}
                    {isSelected && (
                      <motion.div
                        initial={{ x: '-100%', opacity: 0.5 }}
                        animate={{ x: '200%', opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl pointer-events-none"
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Multi-select action buttons */}
            {currentQuestion.multiSelect && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 max-w-md mx-auto flex gap-3"
              >
                {currentQuestion.canSkip && (
                  <button
                    onClick={handleMultiConfirm}
                    className="flex-1 py-3 rounded-full text-mesa-charcoal/50 font-medium border border-mesa-charcoal/10 hover:bg-mesa-charcoal/5 transition"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={handleMultiConfirm}
                  disabled={!currentQuestion.canSkip && currentMultiSelected.length === 0}
                  className={`flex-1 py-3 rounded-full font-medium transition ${
                    currentMultiSelected.length > 0
                      ? 'mesa-btn'
                      : currentQuestion.canSkip
                        ? 'mesa-btn'
                        : 'bg-mesa-charcoal/10 text-mesa-charcoal/30 cursor-not-allowed'
                  }`}
                >
                  {currentMultiSelected.length > 0
                    ? `Continue (${currentMultiSelected.length})`
                    : 'Continue'}
                </button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom hint */}
      <div className="p-6 text-center">
        <p className="text-sm text-mesa-charcoal/30">
          {currentIndex + 1} of {totalQuestions}
        </p>
      </div>
    </motion.div>
  )
}
