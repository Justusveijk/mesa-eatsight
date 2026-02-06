'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Play, ChevronRight, Check, Star, TrendingUp,
  Users, Euro, Zap, BarChart3, Sparkles, QrCode, Clock,
  Utensils, Wine, Leaf, Sun, CloudRain, Calendar, MapPin,
  Quote, ArrowUpRight, ChevronDown, MousePointer, Heart,
  AlertCircle, Lightbulb, X
} from 'lucide-react'

// ============================================================================
// COMPONENTS
// ============================================================================

// Animated counter that counts up
function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 2000,
}: {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (!isInView) return

    let start = 0
    const end = value
    const stepTime = duration / end

    const timer = setInterval(() => {
      start += Math.ceil(end / 50)
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [isInView, value, duration])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

// ROI Calculator Component
function ROICalculator() {
  const [covers, setCovers] = useState(80)
  const [avgOrder, setAvgOrder] = useState(45)

  // Calculate projected gains
  const monthlyRevenue = covers * avgOrder * 30
  const upsellIncrease = 0.08 // 8% increase from smart recommendations
  const decisionTimeValue = 0.05 // 5% more table turns
  const projectedGain = Math.round(monthlyRevenue * (upsellIncrease + decisionTimeValue))
  const roi = Math.round((projectedGain / 250) * 100) // vs €250/month

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-slate-200/50"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Euro className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">ROI Calculator</h3>
          <p className="text-sm text-slate-500">See your potential return</p>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-6 mb-8">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm text-slate-600">Daily covers</label>
            <span className="text-sm font-semibold text-slate-900">{covers}</span>
          </div>
          <input
            type="range"
            min="20"
            max="300"
            value={covers}
            onChange={(e) => setCovers(Number(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>20</span>
            <span>300</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm text-slate-600">Average order value</label>
            <span className="text-sm font-semibold text-slate-900">€{avgOrder}</span>
          </div>
          <input
            type="range"
            min="15"
            max="150"
            value={avgOrder}
            onChange={(e) => setAvgOrder(Number(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>€15</span>
            <span>€150</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <p className="text-sm text-slate-400 mb-1">Projected monthly gain</p>
        <p className="text-4xl font-bold mb-4">
          €<AnimatedCounter value={projectedGain} duration={500} />
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div>
            <p className="text-sm text-slate-400">ROI</p>
            <p className="text-xl font-semibold text-emerald-400">{roi}%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">vs €250/month</p>
            <p className="text-sm text-emerald-400">Pays for itself {Math.round(projectedGain / 250)}x over</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">
        Based on industry average improvements from personalized recommendations
      </p>
    </motion.div>
  )
}

// Interactive Demo Component
function InteractiveDemo() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [showResults, setShowResults] = useState(false)

  const questions = [
    {
      question: "What are you in the mood for?",
      options: ["Something comforting", "Light & fresh", "Adventurous", "Quick bite"]
    },
    {
      question: "Any dietary preferences?",
      options: ["Vegetarian", "Vegan", "Gluten-free", "No restrictions"]
    },
    {
      question: "How hungry are you?",
      options: ["Just a snack", "Normal appetite", "Very hungry", "Starving!"]
    }
  ]

  const recommendations = [
    { name: "Truffle Mushroom Risotto", match: 98, price: "€18.50", tag: "Chef's Pick" },
    { name: "Wild Mushroom Tagliatelle", match: 94, price: "€16.00", tag: "Popular" },
    { name: "Creamy Polenta with Porcini", match: 89, price: "€14.50", tag: null },
  ]

  const handleAnswer = (answer: string) => {
    setAnswers([...answers, answer])
    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 300)
    } else {
      setTimeout(() => setShowResults(true), 300)
    }
  }

  const reset = () => {
    setStep(0)
    setAnswers([])
    setShowResults(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="relative"
    >
      {/* Phone Frame */}
      <div className="w-[320px] h-[640px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl mx-auto">
        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
          {/* Status Bar */}
          <div className="h-12 bg-slate-50 flex items-center justify-center">
            <div className="w-20 h-5 bg-slate-900 rounded-full" />
          </div>

          {/* Content */}
          <div className="p-6 h-[calc(100%-3rem)]">
            <AnimatePresence mode="wait">
              {!showResults ? (
                <motion.div
                  key={`question-${step}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col"
                >
                  {/* Progress */}
                  <div className="flex gap-1 mb-8">
                    {questions.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= step ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Question */}
                  <h3 className="text-xl font-semibold text-slate-900 mb-6">
                    {questions[step].question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-3 flex-1">
                    {questions[step].options.map((option, i) => (
                      <motion.button
                        key={option}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => handleAnswer(option)}
                        className="w-full p-4 text-left bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-slate-700"
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col"
                >
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                      className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3"
                    >
                      <Sparkles className="w-6 h-6 text-emerald-600" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-slate-900">Perfect matches!</h3>
                    <p className="text-sm text-slate-500">Based on your preferences</p>
                  </div>

                  {/* Results */}
                  <div className="space-y-3 flex-1">
                    {recommendations.map((item, i) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="p-4 bg-slate-50 rounded-xl"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                            <p className="text-emerald-600 font-semibold">{item.price}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Match</p>
                            <p className="font-bold text-emerald-600">{item.match}%</p>
                          </div>
                        </div>
                        {item.tag && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            {item.tag}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <button
                    onClick={reset}
                    className="mt-4 w-full py-3 bg-slate-900 text-white rounded-xl font-medium text-sm"
                  >
                    Try again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Labels */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="absolute -left-4 top-32 bg-white rounded-xl shadow-lg p-3 border border-slate-100"
      >
        <p className="text-xs text-slate-500">No app download</p>
        <p className="text-sm font-medium text-slate-900">Works instantly</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7 }}
        className="absolute -right-4 top-64 bg-white rounded-xl shadow-lg p-3 border border-slate-100"
      >
        <p className="text-xs text-slate-500">Average time</p>
        <p className="text-sm font-medium text-slate-900">30 seconds</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.9 }}
        className="absolute -right-8 bottom-32 bg-emerald-500 text-white rounded-xl shadow-lg p-3"
      >
        <p className="text-xs opacity-80">Conversion rate</p>
        <p className="text-lg font-bold">+23%</p>
      </motion.div>
    </motion.div>
  )
}

// Live Stats Bar
function LiveStatsBar() {
  const [stats, setStats] = useState({
    recommendations: 847293,
    restaurants: 342,
    satisfaction: 94,
  })

  // Simulate live updates
  useEffect(() => {
    const timer = setInterval(() => {
      setStats(prev => ({
        ...prev,
        recommendations: prev.recommendations + Math.floor(Math.random() * 3),
      }))
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-slate-900 text-white py-4 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center gap-12 text-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-400">Live:</span>
            <span className="font-mono font-medium">{stats.recommendations.toLocaleString()}</span>
            <span className="text-slate-400">recommendations made</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-slate-400">•</span>
            <span className="font-medium">{stats.restaurants}+</span>
            <span className="text-slate-400">restaurants</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-slate-400">•</span>
            <span className="font-medium">{stats.satisfaction}%</span>
            <span className="text-slate-400">guest satisfaction</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Feature Card with Icon
function FeatureCard({
  icon: Icon,
  title,
  description,
  metric,
  metricLabel,
}: {
  icon: React.ElementType
  title: string
  description: string
  metric?: string
  metricLabel?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all group"
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center mb-4 transition-colors">
        <Icon className="w-6 h-6 text-slate-600 group-hover:text-emerald-600 transition-colors" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm mb-4">{description}</p>
      {metric && (
        <div className="pt-4 border-t border-slate-100">
          <p className="text-2xl font-bold text-emerald-600">{metric}</p>
          <p className="text-xs text-slate-400">{metricLabel}</p>
        </div>
      )}
    </motion.div>
  )
}

// Testimonial Card
function TestimonialCard({
  quote,
  author,
  role,
  restaurant,
  metric,
  metricLabel,
}: {
  quote: string
  author: string
  role: string
  restaurant: string
  image?: string
  metric: string
  metricLabel: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl border border-slate-200 p-8"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600">
          {author[0]}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{author}</p>
          <p className="text-sm text-slate-500">{role}, {restaurant}</p>
        </div>
      </div>

      <blockquote className="text-slate-700 mb-6">
        &ldquo;{quote}&rdquo;
      </blockquote>

      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
        <div>
          <p className="text-3xl font-bold text-emerald-600">{metric}</p>
          <p className="text-sm text-slate-500">{metricLabel}</p>
        </div>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Comparison Table
function ComparisonTable() {
  const features = [
    { name: 'QR Code Menu', basic: true, eatsight: true },
    { name: 'Personalized Recommendations', basic: false, eatsight: true },
    { name: 'Real-time Analytics', basic: false, eatsight: true },
    { name: 'Dietary Filtering', basic: 'Manual', eatsight: 'Automatic' },
    { name: 'Upsell Suggestions', basic: false, eatsight: true },
    { name: 'Guest Mood Tracking', basic: false, eatsight: true },
    { name: 'Unmet Demand Alerts', basic: false, eatsight: true },
    { name: 'Revenue Attribution', basic: false, eatsight: true },
    { name: 'Setup Time', basic: '2-4 hours', eatsight: '5 minutes' },
    { name: 'Staff Training', basic: 'Required', eatsight: 'Zero' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
    >
      <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
        <div className="p-4" />
        <div className="p-4 text-center border-l border-slate-200">
          <p className="text-sm text-slate-500">Basic QR Menu</p>
        </div>
        <div className="p-4 text-center border-l border-slate-200 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-700">Eatsight</p>
        </div>
      </div>

      {features.map((feature, i) => (
        <div key={feature.name} className={`grid grid-cols-3 ${i !== features.length - 1 ? 'border-b border-slate-100' : ''}`}>
          <div className="p-4">
            <p className="text-sm text-slate-700">{feature.name}</p>
          </div>
          <div className="p-4 flex items-center justify-center border-l border-slate-100">
            {typeof feature.basic === 'boolean' ? (
              feature.basic ? (
                <Check className="w-5 h-5 text-slate-400" />
              ) : (
                <X className="w-5 h-5 text-slate-300" />
              )
            ) : (
              <span className="text-sm text-slate-500">{feature.basic}</span>
            )}
          </div>
          <div className="p-4 flex items-center justify-center border-l border-slate-100 bg-emerald-50/50">
            {typeof feature.eatsight === 'boolean' ? (
              feature.eatsight ? (
                <Check className="w-5 h-5 text-emerald-600" />
              ) : (
                <X className="w-5 h-5 text-slate-300" />
              )
            ) : (
              <span className="text-sm font-medium text-emerald-700">{feature.eatsight}</span>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  )
}

// AI Insights Preview
function AIInsightsPreview() {
  const insights = [
    {
      icon: TrendingUp,
      type: 'trend',
      title: 'Poke bowls trending',
      description: '+340% searches in Amsterdam this month',
      action: 'Consider adding to menu',
    },
    {
      icon: CloudRain,
      type: 'weather',
      title: 'Rain forecast tomorrow',
      description: 'Expect +40% comfort food demand',
      action: 'Stock up on soups & stews',
    },
    {
      icon: AlertCircle,
      type: 'demand',
      title: 'Unmet demand detected',
      description: '34% of guests wanted vegan options',
      action: 'Add vegan main course',
    },
    {
      icon: Calendar,
      type: 'event',
      title: 'Ajax match tonight',
      description: 'Expect 2x traffic from 17:00',
      action: 'Extra staff recommended',
    },
  ]

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {insights.map((insight, i) => (
        <motion.div
          key={insight.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              insight.type === 'trend' ? 'bg-blue-100' :
              insight.type === 'weather' ? 'bg-sky-100' :
              insight.type === 'demand' ? 'bg-amber-100' :
              'bg-purple-100'
            }`}>
              <insight.icon className={`w-5 h-5 ${
                insight.type === 'trend' ? 'text-blue-600' :
                insight.type === 'weather' ? 'text-sky-600' :
                insight.type === 'demand' ? 'text-amber-600' :
                'text-purple-600'
              }`} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 mb-1">{insight.title}</p>
              <p className="text-sm text-slate-500 mb-2">{insight.description}</p>
              <p className="text-sm text-emerald-600 font-medium">{insight.action} →</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Pricing Card
function PricingCard({
  featured = false,
  name,
  price,
  period,
  description,
  features,
  cta,
  ctaLink,
}: {
  featured?: boolean
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  ctaLink: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`rounded-2xl p-8 ${
        featured
          ? 'bg-slate-900 text-white border-2 border-emerald-500 relative'
          : 'bg-white border border-slate-200'
      }`}
    >
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-emerald-500 text-white text-sm font-medium px-4 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <h3 className={`text-xl font-semibold mb-2 ${featured ? 'text-white' : 'text-slate-900'}`}>
        {name}
      </h3>
      <p className={`text-sm mb-6 ${featured ? 'text-slate-400' : 'text-slate-500'}`}>
        {description}
      </p>

      <div className="mb-6">
        <span className={`text-4xl font-bold ${featured ? 'text-white' : 'text-slate-900'}`}>
          {price}
        </span>
        <span className={`text-sm ${featured ? 'text-slate-400' : 'text-slate-500'}`}>
          {period}
        </span>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check className={`w-5 h-5 mt-0.5 ${featured ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className={`text-sm ${featured ? 'text-slate-300' : 'text-slate-600'}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaLink}
        className={`block w-full py-3 text-center rounded-xl font-medium transition-all ${
          featured
            ? 'bg-emerald-500 text-white hover:bg-emerald-400'
            : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
        }`}
      >
        {cta}
      </Link>
    </motion.div>
  )
}

// FAQ Item
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="font-medium text-slate-900">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-slate-600">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function HomePage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Live Stats Bar */}
      <LiveStatsBar />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Eatsight</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#demo" className="text-slate-600 hover:text-slate-900 transition-colors">Demo</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
              <a href="#faq" className="text-slate-600 hover:text-slate-900 transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login" className="text-slate-600 hover:text-slate-900 transition-colors">
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden">
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="max-w-7xl mx-auto px-6 pt-20 pb-32"
        >
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-sm font-medium mb-6"
              >
                <Zap className="w-4 h-4" />
                Now with AI-powered insights
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6"
              >
                Turn menu browsers into{' '}
                <span className="text-emerald-600">bigger orders</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-slate-600 mb-8 max-w-lg"
              >
                Smart QR menus that understand what each guest wants.
                Personalized recommendations that increase orders by 15-25%.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-start gap-4 mb-8"
              >
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold text-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  Start free trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="#demo"
                  className="px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold text-lg border border-slate-200 hover:border-slate-300 transition-colors flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  See it in action
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-6 text-sm text-slate-500"
              >
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  14-day free trial
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  5-minute setup
                </span>
              </motion.div>
            </div>

            {/* Right: ROI Calculator */}
            <div>
              <ROICalculator />
            </div>
          </div>
        </motion.div>

        {/* Gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      {/* Logo Cloud */}
      <section className="py-12 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-slate-500 mb-8">
            Trusted by restaurants across Europe
          </p>
          <div className="flex items-center justify-center gap-12 opacity-40">
            {['Bella Taverna', 'The Golden Fork', 'Cafe Central', 'Bistro 42', 'Marina Bay'].map((name) => (
              <span key={name} className="text-xl font-semibold text-slate-400">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-slate-900 mb-4"
            >
              Stop losing money to menu confusion
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-slate-600"
            >
              70% of guests feel overwhelmed by menus. They order safe choices,
              skip dessert, or leave. Eatsight fixes that.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Sparkles}
              title="Personalized Recommendations"
              description="Each guest gets dish suggestions based on their mood, dietary needs, and preferences."
              metric="+23%"
              metricLabel="Average order value increase"
            />
            <FeatureCard
              icon={BarChart3}
              title="Real-time Analytics"
              description="See what guests want, what's trending, and what's missing from your menu."
              metric="94%"
              metricLabel="Guest satisfaction rate"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Revenue Attribution"
              description="Know exactly how much revenue Eatsight influenced this month."
              metric="€2,400+"
              metricLabel="Average monthly gain"
            />
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-emerald-600 font-medium mb-4 block"
              >
                Try it yourself
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl font-bold text-slate-900 mb-4"
              >
                30 seconds to the perfect dish
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-xl text-slate-600 mb-8"
              >
                Guests scan your QR code, answer 3 quick questions,
                and get personalized recommendations. No app download, no signup.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                {[
                  { icon: QrCode, text: 'Guest scans QR code at table' },
                  { icon: MousePointer, text: 'Answers 3 fun questions about their mood' },
                  { icon: Sparkles, text: 'Gets personalized dish recommendations' },
                  { icon: Heart, text: 'Orders with confidence, adds upsells' },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <span className="text-slate-700">{step.text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            <InteractiveDemo />
          </div>
        </div>
      </section>

      {/* AI Insights Section */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-emerald-400 font-medium mb-4 block"
            >
              AI-Powered Intelligence
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-4"
            >
              Know what guests want before they do
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-slate-400"
            >
              Eatsight analyzes trends, weather, local events, and your data
              to give you actionable insights.
            </motion.p>
          </div>

          <AIInsightsPreview />
        </div>
      </section>

      {/* Comparison Section */}
      <section id="features" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-slate-900 mb-4"
            >
              More than a QR menu
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-slate-600"
            >
              See how Eatsight compares to basic QR menu solutions
            </motion.p>
          </div>

          <ComparisonTable />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-slate-900 mb-4"
            >
              Loved by restaurant owners
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="Our guests love the personalized suggestions. It's like having a sommelier for every table, but for the whole menu."
              author="Sarah Chen"
              role="Owner"
              restaurant="The Golden Fork"
              metric="+31%"
              metricLabel="Order value increase"
            />
            <TestimonialCard
              quote="The analytics showed us exactly what was missing. We added two vegan dishes and they're now our bestsellers."
              author="Marco Rossi"
              role="Head Chef"
              restaurant="Trattoria Milano"
              metric="€3,200"
              metricLabel="Monthly revenue increase"
            />
            <TestimonialCard
              quote="Setup took 5 minutes. No staff training needed. The QR codes just work and guests actually use them."
              author="Emma de Vries"
              role="Manager"
              restaurant="Cafe Central"
              metric="94%"
              metricLabel="Guest satisfaction"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-slate-900 mb-4"
            >
              Simple, transparent pricing
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-slate-600"
            >
              Start free, upgrade when you&apos;re ready
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard
              name="Starter"
              price="€0"
              period="/month"
              description="Perfect for trying out Eatsight"
              features={[
                'Up to 100 recommendations/month',
                'Basic analytics',
                '1 QR code',
                'Email support',
              ]}
              cta="Start free"
              ctaLink="/signup"
            />
            <PricingCard
              featured
              name="Pro"
              price="€249"
              period="/month"
              description="For restaurants serious about growth"
              features={[
                'Unlimited recommendations',
                'Advanced analytics & AI insights',
                'Unlimited QR codes',
                'Revenue attribution',
                'Unmet demand alerts',
                'Weather & event predictions',
                'Priority support',
                'Custom branding',
              ]}
              cta="Start 14-day trial"
              ctaLink="/signup?plan=pro"
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-slate-500 mt-8"
          >
            All plans include a 14-day free trial. No credit card required.
          </motion.p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold text-slate-900 mb-4"
            >
              Frequently asked questions
            </motion.h2>
          </div>

          <div>
            <FAQItem
              question="How long does setup take?"
              answer="Most restaurants are up and running in under 10 minutes. Just paste your menu (or upload a PDF), customize your QR codes, and you're ready to go. No technical skills required."
            />
            <FAQItem
              question="Do guests need to download an app?"
              answer="No! Guests simply scan your QR code with their phone camera and it opens directly in their browser. No app download, no signup, no friction."
            />
            <FAQItem
              question="How does the AI know what to recommend?"
              answer="Our algorithm considers the guest's mood, dietary preferences, hunger level, and your menu items' tags and descriptions. It learns from patterns across all restaurants to improve recommendations."
            />
            <FAQItem
              question="Can I see what guests are searching for?"
              answer="Yes! The analytics dashboard shows you exactly what moods are trending, what dietary requirements are common, and crucially - what guests wanted but couldn't find (unmet demand)."
            />
            <FAQItem
              question="What if I want to cancel?"
              answer="You can cancel anytime from your dashboard. No contracts, no cancellation fees. We'll even export your data for you."
            />
            <FAQItem
              question="Is my data secure?"
              answer="Absolutely. We use enterprise-grade encryption, never sell your data, and are fully GDPR compliant. Your menu and analytics are yours alone."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-slate-900 rounded-3xl p-12 text-center text-white"
          >
            <h2 className="text-4xl font-bold mb-4">
              Ready to grow your revenue?
            </h2>
            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              Join 300+ restaurants using Eatsight to understand their guests
              and increase orders. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-4 bg-emerald-500 text-white rounded-xl font-semibold text-lg hover:bg-emerald-400 transition-colors flex items-center gap-2"
              >
                Start free trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/v/bella-taverna"
                className="px-8 py-4 bg-white/10 text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition-colors"
              >
                Try the demo
              </Link>
            </div>
            <p className="text-sm text-slate-500 mt-6">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <Utensils className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">Eatsight</span>
            </div>

            <div className="flex items-center gap-8 text-sm text-slate-500">
              <Link href="/about" className="hover:text-slate-900 transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
              <a href="mailto:hello@eatsight.io" className="hover:text-slate-900 transition-colors">Contact</a>
            </div>

            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Eatsight. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
