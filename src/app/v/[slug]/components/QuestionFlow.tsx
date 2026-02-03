'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Sparkles,
  Utensils,
  Wine,
  Leaf,
  Flame,
  Heart,
  Zap,
  Coffee,
  Sun,
} from 'lucide-react'

interface QuestionFlowProps {
  venue: { name: string }
  onAnswer: (questionId: string, answer: string) => void
  onComplete: () => void
  answers: Record<string, string>
  filterProgress: number
}

const questions = [
  {
    id: 'type',
    title: 'What are you in the mood for?',
    subtitle: 'Let\'s start with the basics',
    type: 'single',
    options: [
      { value: 'food', label: 'Something to eat', icon: Utensils, color: '#C4654A' },
      { value: 'drink', label: 'Something to drink', icon: Wine, color: '#722F37' },
      { value: 'both', label: 'Both, please', icon: Sparkles, color: '#8B6F47' },
    ]
  },
  {
    id: 'mood',
    title: 'What\'s your vibe right now?',
    subtitle: 'We\'ll match dishes to your mood',
    type: 'single',
    options: [
      { value: 'comfort', label: 'Comfort & Cozy', icon: Heart, color: '#722F37' },
      { value: 'light', label: 'Light & Fresh', icon: Leaf, color: '#22c55e' },
      { value: 'adventurous', label: 'Adventurous', icon: Zap, color: '#f59e0b' },
      { value: 'indulgent', label: 'Treat Myself', icon: Sparkles, color: '#8b5cf6' },
    ]
  },
  {
    id: 'dietary',
    title: 'Any dietary preferences?',
    subtitle: 'So we show you the right options',
    type: 'single',
    options: [
      { value: 'none', label: 'No restrictions', icon: Utensils, color: '#8B6F47' },
      { value: 'vegetarian', label: 'Vegetarian', icon: Leaf, color: '#22c55e' },
      { value: 'vegan', label: 'Vegan', icon: Leaf, color: '#16a34a' },
      { value: 'gluten-free', label: 'Gluten-free', icon: Sparkles, color: '#f59e0b' },
    ]
  },
  {
    id: 'hunger',
    title: 'How hungry are you?',
    subtitle: 'We\'ll size up your recommendations',
    type: 'single',
    options: [
      { value: 'snack', label: 'Just a bite', icon: Coffee, color: '#8B6F47' },
      { value: 'moderate', label: 'Nicely hungry', icon: Sun, color: '#C4654A' },
      { value: 'starving', label: 'I could eat everything', icon: Flame, color: '#722F37' },
    ]
  },
]

export function QuestionFlow({
  venue,
  onAnswer,
  onComplete,
  answers,
  filterProgress
}: QuestionFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const canGoBack = currentIndex > 0

  const handleSelect = (value: string) => {
    onAnswer(currentQuestion.id, value)

    if (isLastQuestion) {
      // Small delay for visual feedback before completing
      setTimeout(() => onComplete(), 300)
    } else {
      setDirection(1)
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200)
    }
  }

  const handleBack = () => {
    setDirection(-1)
    setCurrentIndex(prev => prev - 1)
  }

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

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          {questions.map((_, i) => (
            <motion.div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= currentIndex ? 'bg-mesa-burgundy w-6' : 'bg-mesa-charcoal/10 w-1.5'
              }`}
            />
          ))}
        </div>

        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Filter progress indicator */}
      <div className="px-6 mb-4">
        <div className="flex items-center justify-between text-xs text-mesa-charcoal/40 mb-1">
          <span>Narrowing down</span>
          <span className="tabular-nums">{Math.round(filterProgress)}%</span>
        </div>
        <div className="h-1 bg-mesa-charcoal/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-mesa-burgundy to-mesa-terracotta rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${filterProgress}%` }}
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
            <div className="text-center mb-10">
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
                const isSelected = answers[currentQuestion.id] === option.value
                const Icon = option.icon

                return (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full p-5 rounded-2xl text-left transition-all duration-300 flex items-center gap-4 ${
                      isSelected
                        ? 'bg-mesa-burgundy text-white shadow-lg shadow-mesa-burgundy/20 scale-[1.02]'
                        : 'mesa-card hover:scale-[1.01]'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-white/20'
                          : ''
                      }`}
                      style={{
                        backgroundColor: !isSelected && option.color
                          ? `${option.color}15`
                          : undefined
                      }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{
                          color: isSelected ? 'white' : option.color || '#722F37'
                        }}
                      />
                    </div>
                    <span className={`text-lg font-medium ${
                      isSelected ? 'text-white' : 'text-mesa-charcoal'
                    }`}>
                      {option.label}
                    </span>

                    {/* Selection indicator */}
                    <div className="ml-auto">
                      <motion.div
                        initial={false}
                        animate={{ scale: isSelected ? 1 : 0 }}
                        className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center"
                      >
                        <motion.div
                          initial={false}
                          animate={{ scale: isSelected ? 1 : 0 }}
                          className="w-2 h-2 rounded-full bg-white"
                        />
                      </motion.div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom hint */}
      <div className="p-6 text-center">
        <p className="text-sm text-mesa-charcoal/30">
          {currentIndex + 1} of {questions.length}
        </p>
      </div>
    </motion.div>
  )
}
