'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Users, Sparkles, TrendingUp, Clock, Download, ChevronLeft,
  Wifi, ArrowUpRight, ArrowDownRight, Eye, EyeOff, AlertTriangle,
  Lightbulb, ChevronRight, Utensils
} from 'lucide-react'

// Smooth number animation
function AnimatedNumber({
  value,
  suffix = '',
  prefix = '',
  duration = 800
}: {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === display) return

    const steps = 30
    const increment = (value - display) / steps
    let current = display
    let step = 0

    const timer = setInterval(() => {
      step++
      current += increment
      if (step >= steps) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.round(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value, duration, display])

  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.5, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="tabular-nums font-mono"
    >
      {prefix}{display.toLocaleString()}{suffix}
    </motion.span>
  )
}

// Minimal metric card
function MetricCard({
  label,
  value,
  trend,
  suffix = '',
  loading = false,
}: {
  label: string
  value: number
  trend?: number
  suffix?: string
  loading?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 p-6"
    >
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
        {label}
      </p>

      {loading ? (
        <div className="h-10 w-24 bg-slate-100 rounded animate-pulse" />
      ) : (
        <>
          <p className="text-4xl font-semibold text-slate-900 tracking-tight">
            <AnimatedNumber value={value} suffix={suffix} />
          </p>

          {trend !== undefined && trend !== 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`flex items-center gap-1 mt-2 text-sm ${
                trend > 0 ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              {trend > 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span>{trend > 0 ? '+' : ''}{trend}%</span>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}

// Clean bar for moods/items
function ProgressBar({
  value,
  max,
  delay = 0
}: {
  value: number
  max: number
  delay?: number
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0

  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ delay, duration: 0.6, ease: 'easeOut' }}
        className="h-full bg-slate-800 rounded-full"
      />
    </div>
  )
}

// Preview Future Component
function PreviewFuture({
  menuItems,
  onClose,
}: {
  menuItems: MenuItem[]
  onClose: () => void
}) {
  // Generate realistic sample data from actual menu
  const sampleData = useMemo(() => {
    const foodItems = menuItems.filter(i => i.type === 'food')
    const drinkItems = menuItems.filter(i => i.type === 'drink')

    // Pick top items randomly weighted by price (higher = more popular usually)
    const sortedByPrice = [...foodItems].sort((a, b) => (b.price || 0) - (a.price || 0))
    const topItems = sortedByPrice.slice(0, 5).map((item, i) => ({
      name: item.name,
      score: 95 - i * 8 + Math.floor(Math.random() * 10),
    }))

    // Generate moods from tags
    const moodMap: Record<string, number> = {}
    menuItems.forEach(item => {
      // This would use actual tags - simplified here
      if (item.name.toLowerCase().includes('salad') || item.name.toLowerCase().includes('light')) {
        moodMap['Light & Fresh'] = (moodMap['Light & Fresh'] || 0) + 15
      }
      if (item.name.toLowerCase().includes('burger') || item.name.toLowerCase().includes('steak')) {
        moodMap['Comfort Food'] = (moodMap['Comfort Food'] || 0) + 20
      }
      if (item.name.toLowerCase().includes('pasta') || item.name.toLowerCase().includes('pizza')) {
        moodMap['Italian Craving'] = (moodMap['Italian Craving'] || 0) + 18
      }
    })

    // Default moods if none detected
    if (Object.keys(moodMap).length < 3) {
      moodMap['Comfort Food'] = 45
      moodMap['Light & Fresh'] = 28
      moodMap['Quick Bite'] = 18
      moodMap['Adventurous'] = 12
    }

    const moods = Object.entries(moodMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    // Traffic pattern (typical restaurant week)
    const traffic = [
      { day: 'Mon', guests: 42 },
      { day: 'Tue', guests: 38 },
      { day: 'Wed', guests: 55 },
      { day: 'Thu', guests: 67 },
      { day: 'Fri', guests: 124 },
      { day: 'Sat', guests: 156 },
      { day: 'Sun', guests: 89 },
    ]

    return {
      totalGuests: 571,
      recommendations: 1847,
      satisfactionRate: 94,
      avgDecision: 2.1,
      traffic,
      dietary: [
        { name: 'No Restrictions', value: 52, color: '#1e293b' },
        { name: 'Vegetarian', value: 24, color: '#64748b' },
        { name: 'Vegan', value: 12, color: '#94a3b8' },
        { name: 'Gluten-free', value: 8, color: '#cbd5e1' },
        { name: 'Other', value: 4, color: '#e2e8f0' },
      ],
      moods,
      topItems,
    }
  }, [menuItems])

  const maxTraffic = Math.max(...sampleData.traffic.map(t => t.guests))
  const maxMood = sampleData.moods[0]?.value || 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25 }}
        className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-medium text-emerald-600 mb-1"
              >
                ✨ Preview Mode
              </motion.p>
              <h2 className="text-2xl font-semibold text-slate-900">
                Your analytics in a few weeks
              </h2>
              <p className="text-slate-500 mt-1">
                Based on your {menuItems.length} menu items • This is simulated data
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <EyeOff className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-50 rounded-2xl p-6"
            >
              <p className="text-xs font-medium text-slate-400 uppercase mb-2">Total Guests</p>
              <p className="text-3xl font-semibold text-slate-900">{sampleData.totalGuests}</p>
              <p className="text-sm text-emerald-600 mt-1">+12% vs industry avg</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-50 rounded-2xl p-6"
            >
              <p className="text-xs font-medium text-slate-400 uppercase mb-2">Recommendations</p>
              <p className="text-3xl font-semibold text-slate-900">{sampleData.recommendations.toLocaleString()}</p>
              <p className="text-sm text-emerald-600 mt-1">+18% engagement</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-50 rounded-2xl p-6"
            >
              <p className="text-xs font-medium text-slate-400 uppercase mb-2">Satisfaction</p>
              <p className="text-3xl font-semibold text-slate-900">{sampleData.satisfactionRate}%</p>
              <p className="text-sm text-emerald-600 mt-1">+3% vs last month</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-50 rounded-2xl p-6"
            >
              <p className="text-xs font-medium text-slate-400 uppercase mb-2">Avg. Decision</p>
              <p className="text-3xl font-semibold text-slate-900">{sampleData.avgDecision}m</p>
              <p className="text-sm text-emerald-600 mt-1">-8% faster</p>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Traffic */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="col-span-2 bg-slate-50 rounded-2xl p-6"
            >
              <h3 className="text-sm font-medium text-slate-900 mb-4">Weekly Traffic Pattern</h3>
              <div className="flex items-end gap-2 h-32">
                {sampleData.traffic.map((day, i) => (
                  <div key={day.day} className="flex-1 flex flex-col items-center">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.guests / maxTraffic) * 100}%` }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className="w-full bg-slate-300 rounded-t"
                    />
                    <span className="text-xs text-slate-400 mt-2">{day.day}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Dietary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-slate-50 rounded-2xl p-6"
            >
              <h3 className="text-sm font-medium text-slate-900 mb-4">Dietary Split</h3>
              <div className="space-y-2">
                {sampleData.dietary.map((d, i) => (
                  <motion.div
                    key={d.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.05 }}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="text-slate-900 font-medium">{d.value}%</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Moods */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-slate-50 rounded-2xl p-6"
            >
              <h3 className="text-sm font-medium text-slate-900 mb-4">Predicted Guest Moods</h3>
              <div className="space-y-3">
                {sampleData.moods.map((mood, i) => (
                  <div key={mood.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{mood.name}</span>
                      <span className="text-slate-400">{mood.value}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(mood.value / maxMood) * 100}%` }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className="h-full bg-slate-600 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-slate-50 rounded-2xl p-6"
            >
              <h3 className="text-sm font-medium text-slate-900 mb-4">Predicted Top Performers</h3>
              <div className="space-y-3">
                {sampleData.topItems.map((item, i) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-slate-700 truncate">{item.name}</span>
                    <span className="text-sm font-medium text-slate-900">{item.score}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Start collecting real data by sharing your QR code with guests
            </p>
            <Link
              href="/dashboard/settings/qr-codes"
              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              Get your QR code
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Menu Analysis Warnings
function MenuAnalysis({ menuItems }: { menuItems: MenuItem[] }) {
  const warnings = useMemo(() => {
    const issues: { type: 'warning' | 'tip'; message: string }[] = []

    const foodItems = menuItems.filter(i => i.type === 'food')
    const drinkItems = menuItems.filter(i => i.type === 'drink')

    // Check for missing item types
    if (foodItems.length === 0) {
      issues.push({ type: 'warning', message: 'No food items found. Add food to your menu to enable recommendations.' })
    }

    if (drinkItems.length === 0) {
      issues.push({ type: 'tip', message: 'Adding drinks enables upsell recommendations after food orders.' })
    }

    // Check for vegetarian options
    const vegOptions = menuItems.filter(i =>
      i.name?.toLowerCase().includes('vegetarian') ||
      i.name?.toLowerCase().includes('vegan') ||
      i.description?.toLowerCase().includes('vegetarian')
    )
    if (vegOptions.length < 2 && foodItems.length > 5) {
      issues.push({ type: 'tip', message: '~30% of guests have plant-based preferences. Consider adding more vegetarian options.' })
    }

    // Check for gluten-free options
    const gfOptions = menuItems.filter(i =>
      i.name?.toLowerCase().includes('gluten') ||
      i.description?.toLowerCase().includes('gluten-free')
    )
    if (gfOptions.length === 0 && foodItems.length > 5) {
      issues.push({ type: 'tip', message: 'Gluten-free options are increasingly requested. Consider marking suitable items.' })
    }

    // Check for light options
    const lightOptions = menuItems.filter(i =>
      i.name?.toLowerCase().includes('salad') ||
      i.name?.toLowerCase().includes('light') ||
      i.name?.toLowerCase().includes('fresh')
    )
    if (lightOptions.length < 2 && foodItems.length > 8) {
      issues.push({ type: 'tip', message: '"Light & Fresh" is a popular mood. Ensure you have lighter options for health-conscious guests.' })
    }

    // Check for desserts
    const desserts = menuItems.filter(i =>
      i.category?.toLowerCase().includes('dessert') ||
      i.name?.toLowerCase().includes('cake') ||
      i.name?.toLowerCase().includes('ice cream')
    )
    if (desserts.length === 0 && foodItems.length > 10) {
      issues.push({ type: 'tip', message: 'Desserts drive upsells. Consider adding sweet options.' })
    }

    return issues
  }, [menuItems])

  if (warnings.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <h3 className="text-sm font-medium text-slate-900 mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        Menu Insights
      </h3>
      <div className="space-y-2">
        {warnings.map((w, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-start gap-3 p-4 rounded-xl ${
              w.type === 'warning'
                ? 'bg-amber-50 border border-amber-100'
                : 'bg-slate-50 border border-slate-100'
            }`}
          >
            {w.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            ) : (
              <Lightbulb className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            )}
            <p className={`text-sm ${w.type === 'warning' ? 'text-amber-800' : 'text-slate-600'}`}>
              {w.message}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// Empty state when no data
function EmptyState({
  hasMenu,
  menuItems,
  onPreview
}: {
  hasMenu: boolean
  menuItems: MenuItem[]
  onPreview: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
        className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6"
      >
        <Users className="w-10 h-10 text-slate-300" />
      </motion.div>

      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        No guest data yet
      </h3>
      <p className="text-slate-500 max-w-md mb-8">
        {hasMenu
          ? "Share your QR code with guests to start collecting insights. Data will appear here in real-time."
          : "Add menu items first, then share your QR code with guests to start collecting data."
        }
      </p>

      <div className="flex items-center gap-4">
        {hasMenu ? (
          <>
            <Link
              href="/dashboard/settings/qr-codes"
              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
            >
              Get QR Code
            </Link>
            <button
              onClick={onPreview}
              className="px-6 py-3 bg-white text-slate-700 rounded-xl font-medium border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview Your Future
            </button>
          </>
        ) : (
          <Link
            href="/dashboard/menu"
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Utensils className="w-4 h-4" />
            Add Menu Items
          </Link>
        )}
      </div>
    </motion.div>
  )
}

interface MenuItem {
  id: string
  name: string
  description?: string
  price: number
  category?: string
  type: 'food' | 'drink'
}

// Main Analytics Page
export default function AnalyticsPage() {
  const [venueId, setVenueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d')
  const [isLive, setIsLive] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Real data only - no fake numbers
  const [metrics, setMetrics] = useState({
    totalGuests: 0,
    guestsTrend: 0,
    recommendations: 0,
    recsTrend: 0,
    satisfactionRate: 0,
    satTrend: 0,
    avgDecisionTime: 0,
  })

  const [trafficData, setTrafficData] = useState<{ day: string; guests: number }[]>([])
  const [dietaryData, setDietaryData] = useState<{ name: string; value: number }[]>([])
  const [moodData, setMoodData] = useState<{ name: string; value: number }[]>([])
  const [topItems, setTopItems] = useState<{ name: string; score: number }[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  const supabase = createClient()

  // Get venue and menu
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get venue
      let op = await supabase.from('operator_users').select('venue_id').eq('auth_user_id', user.id).single()
      if (!op.data?.venue_id) {
        op = await supabase.from('operator_users').select('venue_id').eq('email', user.email).single()
      }

      if (op.data?.venue_id) {
        setVenueId(op.data.venue_id)

        // Get menu items for preview feature
        const { data: menus } = await supabase
          .from('menus')
          .select('id')
          .eq('venue_id', op.data.venue_id)
          .single()

        if (menus?.id) {
          const { data: items } = await supabase
            .from('menu_items')
            .select('*')
            .eq('menu_id', menus.id)

          setMenuItems(items || [])
        }
      }
    }
    init()
  }, [supabase])

  // Load ALL real data
  const loadData = useCallback(async () => {
    if (!venueId) return
    setLoading(true)

    const now = new Date()
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const prevStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000)
    const startISO = startDate.toISOString()
    const prevISO = prevStart.toISOString()

    // Fetch all data
    const [
      { count: guests },
      { count: prevGuests },
      { count: recs },
      { count: prevRecs },
      { count: likes },
      { count: clicks },
      { count: prevLikes },
      { count: prevClicks },
      { data: sessions },
      { data: recResults },
    ] = await Promise.all([
      supabase.from('rec_sessions').select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId).gte('started_at', startISO),
      supabase.from('rec_sessions').select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId).gte('started_at', prevISO).lt('started_at', startISO),
      supabase.from('rec_results').select('*', { count: 'exact', head: true })
        .gte('created_at', startISO),
      supabase.from('rec_results').select('*', { count: 'exact', head: true })
        .gte('created_at', prevISO).lt('created_at', startISO),
      supabase.from('events').select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId).eq('name', 'recommendation_liked').gte('ts', startISO),
      supabase.from('events').select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId).eq('name', 'recommendation_clicked').gte('ts', startISO),
      supabase.from('events').select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId).eq('name', 'recommendation_liked').gte('ts', prevISO).lt('ts', startISO),
      supabase.from('events').select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId).eq('name', 'recommendation_clicked').gte('ts', prevISO).lt('ts', startISO),
      supabase.from('rec_sessions').select('started_at, intent_chips')
        .eq('venue_id', venueId).gte('started_at', startISO),
      supabase.from('rec_results').select('item_id, score, menu_items(name)')
        .gte('created_at', startISO),
    ])

    // Calculate trends
    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0
      return Math.round(((curr - prev) / prev) * 100)
    }

    const totalGuests = guests || 0
    const totalRecs = recs || 0
    const totalLikes = likes || 0
    const totalClicks = clicks || 0
    const satisfactionRate = totalClicks > 0 ? Math.round((totalLikes / totalClicks) * 100) : 0
    const prevSat = (prevClicks || 0) > 0 ? Math.round(((prevLikes || 0) / (prevClicks || 0)) * 100) : 0

    // Calculate average decision time from sessions (if we have timestamps)
    const avgTime = 0
    // Would need end timestamps - skip for now

    setMetrics({
      totalGuests,
      guestsTrend: calcTrend(totalGuests, prevGuests || 0),
      recommendations: totalRecs,
      recsTrend: calcTrend(totalRecs, prevRecs || 0),
      satisfactionRate,
      satTrend: satisfactionRate - prevSat,
      avgDecisionTime: avgTime,
    })

    // Traffic data (Mon-Sun)
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const trafficMap: Record<string, number> = {}
    dayNames.forEach(d => trafficMap[d] = 0)

    sessions?.forEach(s => {
      const d = new Date(s.started_at)
      const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1
      trafficMap[dayNames[dayIndex]]++
    })

    setTrafficData(dayNames.map(day => ({ day, guests: trafficMap[day] })))

    // Dietary preferences
    const dietaryCounts: Record<string, number> = {
      'No Restrictions': 0,
      'Vegetarian': 0,
      'Vegan': 0,
      'Gluten-free': 0,
      'Other': 0,
    }

    sessions?.forEach(s => {
      const chips = s.intent_chips || []
      let found = false

      if (chips.includes('diet_vegetarian')) { dietaryCounts['Vegetarian']++; found = true }
      if (chips.includes('diet_vegan')) { dietaryCounts['Vegan']++; found = true }
      if (chips.includes('diet_gluten_free') || chips.includes('allergy_gluten')) {
        dietaryCounts['Gluten-free']++; found = true
      }
      if (chips.some((c: string) => (c.startsWith('diet_') || c.startsWith('allergy_')) &&
          !['diet_vegetarian', 'diet_vegan', 'diet_gluten_free'].includes(c))) {
        dietaryCounts['Other']++; found = true
      }
      if (!found) dietaryCounts['No Restrictions']++
    })

    const totalDietary = Object.values(dietaryCounts).reduce((a, b) => a + b, 0) || 1
    setDietaryData(
      Object.entries(dietaryCounts)
        .map(([name, count]) => ({
          name,
          value: Math.round((count / totalDietary) * 100),
        }))
        .filter(d => d.value > 0)
    )

    // Mood data
    const moodCounts: Record<string, number> = {}
    sessions?.forEach(s => {
      s.intent_chips?.forEach((chip: string) => {
        if (chip.startsWith('mood_')) {
          const name = chip.replace('mood_', '').replace(/_/g, ' ')
          const cap = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          moodCounts[cap] = (moodCounts[cap] || 0) + 1
        }
      })
    })

    setMoodData(
      Object.entries(moodCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    )

    // Top items
    const itemScores: Record<string, { total: number; count: number }> = {}
    recResults?.forEach(r => {
      const name = (r.menu_items as unknown as { name: string })?.name
      if (name) {
        if (!itemScores[name]) itemScores[name] = { total: 0, count: 0 }
        itemScores[name].total += r.score || 50
        itemScores[name].count++
      }
    })

    setTopItems(
      Object.entries(itemScores)
        .map(([name, data]) => ({
          name,
          score: Math.round(data.total / data.count),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
    )

    setLoading(false)
  }, [venueId, dateRange, supabase])

  useEffect(() => {
    if (venueId) loadData()
  }, [venueId, dateRange, loadData])

  // Realtime subscriptions
  useEffect(() => {
    if (!venueId) return

    const channel = supabase
      .channel(`analytics-${venueId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rec_sessions',
        filter: `venue_id=eq.${venueId}`,
      }, () => {
        setMetrics(prev => ({ ...prev, totalGuests: prev.totalGuests + 1 }))
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
        filter: `venue_id=eq.${venueId}`,
      }, (payload) => {
        const e = payload.new as { name: string }
        if (e.name === 'recommendation_clicked') {
          setMetrics(prev => ({ ...prev, recommendations: prev.recommendations + 1 }))
        }
      })
      .subscribe(status => setIsLive(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [venueId, supabase])

  const hasData = metrics.totalGuests > 0
  const hasMenu = menuItems.length > 0
  const maxTraffic = Math.max(...trafficData.map(t => t.guests), 1)
  const maxMood = moodData.length > 0 ? moodData[0].value : 1
  const maxItem = topItems.length > 0 ? topItems[0].score : 100

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
              {isLive && (
                <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
                  <Wifi className="w-3 h-3" />
                  Live
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-0.5">Real-time guest insights</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Date range */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  dateRange === range
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
      </div>

      {/* Menu Analysis Warnings */}
      {hasMenu && !hasData && <MenuAnalysis menuItems={menuItems} />}

      {/* Main Content */}
      {!hasData ? (
        <EmptyState
          hasMenu={hasMenu}
          menuItems={menuItems}
          onPreview={() => setShowPreview(true)}
        />
      ) : (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <MetricCard
              label="Total Guests"
              value={metrics.totalGuests}
              trend={metrics.guestsTrend}
              loading={loading}
            />
            <MetricCard
              label="Recommendations"
              value={metrics.recommendations}
              trend={metrics.recsTrend}
              loading={loading}
            />
            <MetricCard
              label="Satisfaction Rate"
              value={metrics.satisfactionRate}
              trend={metrics.satTrend}
              suffix="%"
              loading={loading}
            />
            <MetricCard
              label="Avg. Decision"
              value={metrics.avgDecisionTime}
              suffix={metrics.avgDecisionTime > 0 ? 'm' : ''}
              loading={loading}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Traffic */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="col-span-2 bg-white rounded-2xl border border-slate-200 p-6"
            >
              <h3 className="text-sm font-medium text-slate-900 mb-1">Guest Traffic</h3>
              <p className="text-xs text-slate-400 mb-6">Daily visitors this week</p>

              <div className="flex items-end gap-3 h-40">
                {trafficData.map((day, i) => (
                  <div key={day.day} className="flex-1 flex flex-col items-center">
                    <span className="text-xs text-slate-400 mb-2">{day.guests}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.guests / maxTraffic) * 100}%` }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="w-full bg-slate-200 rounded-t"
                      style={{ minHeight: day.guests > 0 ? '8px' : '2px' }}
                    />
                    <span className="text-xs text-slate-500 mt-3">{day.day}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Dietary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <h3 className="text-sm font-medium text-slate-900 mb-1">Dietary Preferences</h3>
              <p className="text-xs text-slate-400 mb-6">Guest requirements</p>

              <div className="space-y-3">
                {dietaryData.map((d, i) => (
                  <motion.div
                    key={d.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-600">{d.name}</span>
                    <span className="text-slate-900 font-medium tabular-nums">{d.value}%</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Moods */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <h3 className="text-sm font-medium text-slate-900 mb-1">Guest Moods</h3>
              <p className="text-xs text-slate-400 mb-6">What guests are looking for</p>

              {moodData.length > 0 ? (
                <div className="space-y-4">
                  {moodData.map((mood, i) => (
                    <div key={mood.name}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">{mood.name}</span>
                        <span className="text-slate-400 tabular-nums">{mood.value}</span>
                      </div>
                      <ProgressBar value={mood.value} max={maxMood} delay={0.4 + i * 0.1} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No mood data yet</p>
              )}
            </motion.div>

            {/* Top Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-1">Top Recommended</h3>
                  <p className="text-xs text-slate-400">Highest scoring dishes</p>
                </div>
                <Link href="/dashboard/menu" className="text-xs text-slate-400 hover:text-slate-600">
                  View all →
                </Link>
              </div>

              {topItems.length > 0 ? (
                <div className="space-y-4">
                  {topItems.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 truncate mb-1">{item.name}</p>
                        <ProgressBar value={item.score} max={maxItem} delay={0.6 + i * 0.1} />
                      </div>
                      <span className="text-sm font-medium text-slate-900 tabular-nums">{item.score}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No recommendations yet</p>
              )}
            </motion.div>
          </div>
        </>
      )}

      {/* Preview Future Modal */}
      <AnimatePresence>
        {showPreview && hasMenu && (
          <PreviewFuture
            menuItems={menuItems}
            onClose={() => setShowPreview(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
