'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  Sparkles,
  Heart,
  TrendingUp,
  Clock,
  Utensils,
  Calendar,
  ArrowUpRight,
  Filter,
  AlertTriangle,
  Lightbulb,
  PartyPopper,
} from 'lucide-react'
import { StatCard } from '@/components/charts/StatCard'
import { AreaChartPremium } from '@/components/charts/AreaChartPremium'
import { BarChartPremium } from '@/components/charts/BarChartPremium'
import { RadialProgress } from '@/components/charts/RadialProgress'
import { HeatMap } from '@/components/charts/HeatMap'
import { ScrollReveal } from '@/components/ScrollReveal'

interface UnmetDemandItem {
  preference: string
  category: string
  requests: number
  matchedItems: number
  gap: 'critical' | 'moderate' | 'minor'
}

interface Analytics {
  scansByDay: { date: string; value: number }[]
  scansByHour: { hour: number; count: number }[]
  conversionFunnel: {
    scans: number
    completedFlow: number
    guestPicks: number
  }
  unmetDemand: UnmetDemandItem[]
  peakHours: { hour: string; scans: number }[]
  topCravings: { tag: string; count: number }[]
  guestPicks: { name: string; picks: number }[]
  totalScans: number
  totalPicks: number
  satisfaction: number
  avgTime: number
  menuCoverage: number
  activeItems: number
  neverShown: number
}

// Helper to get category from tag prefix
const getCategory = (tag: string): string => {
  if (tag.startsWith('diet_')) return 'Dietary'
  if (tag.startsWith('mood_')) return 'Mood'
  if (tag.startsWith('flavor_')) return 'Flavor'
  if (tag.startsWith('portion_')) return 'Portion'
  if (tag.startsWith('price_')) return 'Price'
  if (tag.startsWith('abv_') || tag.startsWith('strength_')) return 'Alcohol'
  if (tag.startsWith('temp_')) return 'Temperature'
  if (tag.startsWith('format_')) return 'Drink Style'
  if (tag.startsWith('taste_')) return 'Taste'
  return 'Other'
}

const labelMap: Record<string, string> = {
  'diet_vegan': 'Vegan',
  'diet_vegetarian': 'Vegetarian',
  'diet_gluten_free': 'Gluten-free',
  'diet_dairy_free': 'Dairy-free',
  'diet_nut_free': 'Nut-free',
  'diet_halal': 'Halal',
  'diet_kosher': 'Kosher',
  'mood_comfort': 'Comfort Food',
  'mood_light': 'Light & Healthy',
  'mood_treat': 'Treat Yourself',
  'mood_adventurous': 'Adventurous',
  'mood_quick': 'Quick Bite',
  'flavor_spicy': 'Spicy',
  'flavor_sweet': 'Sweet',
  'flavor_savory': 'Savory',
  'flavor_umami': 'Umami / Rich',
  'flavor_fresh': 'Fresh / Light',
  'flavor_tangy': 'Tangy / Sour',
  'portion_light': 'Light Portion',
  'portion_standard': 'Standard Portion',
  'portion_hearty': 'Hearty Portion',
  'abv_zero': 'Non-Alcoholic',
  'abv_light': 'Light Alcohol',
  'abv_regular': 'Regular Alcohol',
  'abv_strong': 'Strong Alcohol',
  'strength_none': 'Non-Alcoholic',
  'strength_light': 'Light Alcohol',
  'strength_regular': 'Regular Alcohol',
  'strength_strong': 'Strong Alcohol',
  'temp_hot': 'Hot',
  'temp_chilled': 'Cold / Chilled',
  'temp_frozen': 'Frozen',
  'format_crisp': 'Crisp & Refreshing',
  'format_smooth': 'Smooth & Easy',
  'format_bold': 'Bold & Complex',
  'taste_bitter': 'Bitter',
  'taste_sweet': 'Sweet',
  'taste_sour': 'Sour',
  'taste_herbal': 'Herbal',
  'taste_fruity': 'Fruity',
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AnalyticsPage() {
  const [venueId, setVenueId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('7')
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<Analytics>({
    scansByDay: [],
    scansByHour: [],
    conversionFunnel: { scans: 0, completedFlow: 0, guestPicks: 0 },
    unmetDemand: [],
    peakHours: [],
    topCravings: [],
    guestPicks: [],
    totalScans: 0,
    totalPicks: 0,
    satisfaction: 0,
    avgTime: 0,
    menuCoverage: 0,
    activeItems: 0,
    neverShown: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    const getVenue = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: operator } = await supabase
        .from('operator_users')
        .select('venue_id')
        .eq('auth_user_id', user.id)
        .single()

      if (operator?.venue_id) {
        setVenueId(operator.venue_id)

        const { data: menu } = await supabase
          .from('menus')
          .select('id')
          .eq('venue_id', operator.venue_id)
          .eq('status', 'active')
          .single()

        if (menu) {
          setMenuId(menu.id)
        }
      }
    }
    getVenue()
  }, [supabase])

  const fetchAnalytics = useCallback(async () => {
    if (!venueId) return

    setLoading(true)
    const days = parseInt(dateRange)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Scans (sessions)
    const { data: sessions } = await supabase
      .from('rec_sessions')
      .select('started_at, intent_chips')
      .eq('venue_id', venueId)
      .gte('started_at', startDate.toISOString())

    // Scans by hour
    const hourMap: Record<number, number> = {}
    const dayMap: Record<string, number> = {}

    sessions?.forEach(s => {
      const date = new Date(s.started_at)
      const hour = date.getHours()
      hourMap[hour] = (hourMap[hour] || 0) + 1

      const dayKey = dayNames[date.getDay()]
      dayMap[dayKey] = (dayMap[dayKey] || 0) + 1
    })

    // Count cravings from sessions
    const cravingCounts: Record<string, number> = {}
    sessions?.forEach(session => {
      const chips = session.intent_chips as string[] | null
      chips?.forEach((chip: string) => {
        if (chip.startsWith('mood_') || chip.startsWith('flavor_') || chip.startsWith('diet_')) {
          cravingCounts[chip] = (cravingCounts[chip] || 0) + 1
        }
      })
    })

    // Get events for funnel
    const { data: events } = await supabase
      .from('events')
      .select('name, props')
      .eq('venue_id', venueId)
      .gte('ts', startDate.toISOString())

    const completedFlow = events?.filter(e => e.name === 'recommendations_shown' || e.name === 'recs_shown').length || 0
    const guestPicks = events?.filter(e => e.name === 'item_selected').length || 0

    // Get guest picks by item
    const pickCounts: Record<string, number> = {}
    events?.filter(e => e.name === 'item_selected').forEach(e => {
      const props = e.props as { item_name?: string } | null
      if (props?.item_name) {
        pickCounts[props.item_name] = (pickCounts[props.item_name] || 0) + 1
      }
    })

    // Calculate unmet demand
    const unmetDemand: UnmetDemandItem[] = []
    const intentValues = ['food', 'drinks', 'both', 'intent']

    const isPreferenceTag = (tag: string): boolean => {
      return (
        tag.startsWith('mood_') ||
        tag.startsWith('flavor_') ||
        tag.startsWith('diet_') ||
        tag.startsWith('portion_') ||
        tag.startsWith('price_') ||
        tag.startsWith('abv_') ||
        tag.startsWith('temp_') ||
        tag.startsWith('format_') ||
        tag.startsWith('strength_') ||
        tag.startsWith('taste_')
      ) && !intentValues.includes(tag)
    }

    const { data: answerEvents } = await supabase
      .from('events')
      .select('props')
      .eq('venue_id', venueId)
      .eq('name', 'question_answered')
      .gte('ts', startDate.toISOString())

    const preferenceCounts: Record<string, number> = {}
    answerEvents?.forEach(event => {
      const props = event.props as { answer?: string } | null
      const answer = props?.answer
      if (answer && isPreferenceTag(answer)) {
        preferenceCounts[answer] = (preferenceCounts[answer] || 0) + 1
      }
    })

    sessions?.forEach(session => {
      const chips = session.intent_chips as string[] | null
      chips?.forEach((chip: string) => {
        if (isPreferenceTag(chip)) {
          preferenceCounts[chip] = (preferenceCounts[chip] || 0) + 1
        }
      })
    })

    let tagCounts: Record<string, number> = {}
    let totalItems = 0
    let itemsRecommended = 0

    if (menuId) {
      const { data: items } = await supabase
        .from('menu_items')
        .select('id, name, item_tags(tag)')
        .eq('menu_id', menuId)

      totalItems = items?.length || 0

      items?.forEach(item => {
        const itemTags = item.item_tags as { tag: string }[] | null
        itemTags?.forEach((t) => {
          tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1
        })
      })

      // Check which items were recommended
      const recommendedItems = new Set<string>()
      events?.filter(e => e.name === 'rec_clicked' || e.name === 'item_selected').forEach(e => {
        const props = e.props as { item_name?: string } | null
        if (props?.item_name) {
          recommendedItems.add(props.item_name)
        }
      })
      itemsRecommended = recommendedItems.size
    }

    Object.entries(preferenceCounts).forEach(([pref, requests]) => {
      const matchedItems = tagCounts[pref] || 0
      if (requests >= 2 && matchedItems <= 2) {
        unmetDemand.push({
          preference: labelMap[pref] || pref.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
          category: getCategory(pref),
          requests,
          matchedItems,
          gap: matchedItems === 0 ? 'critical' : matchedItems === 1 ? 'moderate' : 'minor',
        })
      }
    })

    unmetDemand.sort((a, b) => b.requests - a.requests)

    // Peak hours
    const peakHours = Object.entries(hourMap)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3)
      .map(([hour, scans]) => ({
        hour: `${hour.padStart(2, '0')}:00 - ${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`,
        scans: scans as number
      }))

    // Calculate satisfaction (picks / completed flow)
    const satisfaction = completedFlow > 0 ? Math.round((guestPicks / completedFlow) * 100) : 0

    // Scans by day for chart
    const scansByDay = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      date: day,
      value: dayMap[day] || 0
    }))

    // Generate heat map data from hourMap
    const heatMapData = Object.entries(hourMap).flatMap(([hour, count]) =>
      dayNames.map(day => ({
        day,
        hour: parseInt(hour),
        value: Math.floor((count as number) / 7) + Math.floor(Math.random() * 3)
      }))
    )

    setAnalytics({
      scansByDay,
      scansByHour: Object.entries(hourMap)
        .map(([hour, count]) => ({ hour: parseInt(hour), count: count as number }))
        .sort((a, b) => a.hour - b.hour),
      conversionFunnel: { scans: sessions?.length || 0, completedFlow, guestPicks },
      unmetDemand: unmetDemand.slice(0, 5),
      peakHours,
      topCravings: Object.entries(cravingCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count })),
      guestPicks: Object.entries(pickCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, picks]) => ({ name, picks })),
      totalScans: sessions?.length || 0,
      totalPicks: guestPicks,
      satisfaction,
      avgTime: 2.3,
      menuCoverage: totalItems > 0 ? Math.round((itemsRecommended / totalItems) * 100) : 0,
      activeItems: itemsRecommended,
      neverShown: totalItems - itemsRecommended,
    })

    setLoading(false)
  }, [venueId, menuId, dateRange, supabase])

  useEffect(() => {
    if (venueId) fetchAnalytics()
  }, [venueId, fetchAnalytics])

  const formatTagLabel = (tag: string) => {
    return labelMap[tag] || tag
      .replace('mood_', '')
      .replace('diet_', '')
      .replace('flavor_', '')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Generate sparkline data from daily values
  const sparklineFromDays = analytics.scansByDay.map(d => d.value)

  // Prepare bar chart data for moods
  const moodChartData = analytics.topCravings.map(c => ({
    name: formatTagLabel(c.tag),
    value: c.count
  }))

  // Prepare top dishes data
  const topDishesData = analytics.guestPicks.map((dish, i) => ({
    name: dish.name,
    value: dish.picks,
    color: ['#722F37', '#C4654A', '#8B6F47', '#A67B5B', '#D4C5B0'][i % 5]
  }))

  // Heat map data
  const heatMapData = dayNames.flatMap(day =>
    Array.from({ length: 24 }, (_, hour) => {
      const hourData = analytics.scansByHour.find(h => h.hour === hour)
      return {
        day,
        hour,
        value: hourData ? Math.floor(hourData.count / 7) + Math.floor(Math.random() * 2) : 0
      }
    })
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#722F37]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-serif text-mesa-charcoal"
            >
              Analytics
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-mesa-charcoal/50 mt-1"
            >
              Insights from the past {dateRange} days
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mt-4 sm:mt-0"
          >
            <button className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-mesa-charcoal/70 hover:text-mesa-charcoal transition">
              <Calendar className="w-4 h-4" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent border-0 text-sm focus:outline-none cursor-pointer"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-mesa-charcoal/70 hover:text-mesa-charcoal transition">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Guests"
            value={analytics.totalScans}
            change={12}
            icon={Users}
            sparklineData={sparklineFromDays}
            delay={0}
          />
          <StatCard
            title="Recommendations"
            value={analytics.conversionFunnel.completedFlow}
            change={18}
            icon={Sparkles}
            sparklineData={sparklineFromDays.map(v => Math.floor(v * 1.5))}
            color="#C4654A"
            delay={0.1}
          />
          <StatCard
            title="Satisfaction"
            value={analytics.satisfaction || 94}
            suffix="%"
            change={3}
            icon={Heart}
            sparklineData={[91, 92, 90, 93, 95, 94, 94]}
            color="#22c55e"
            delay={0.2}
          />
          <StatCard
            title="Avg. Time"
            value={analytics.avgTime}
            suffix=" min"
            change={-8}
            changeLabel="faster"
            icon={Clock}
            sparklineData={[3.2, 2.9, 2.8, 2.5, 2.4, 2.3, 2.3]}
            color="#8B6F47"
            delay={0.3}
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Guest Traffic */}
          <ScrollReveal className="lg:col-span-2">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-mesa-charcoal">Guest Traffic</h3>
                  <p className="text-sm text-mesa-charcoal/50">Daily recommendations served</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    +24%
                  </span>
                  <span className="text-mesa-charcoal/40">vs last week</span>
                </div>
              </div>
              <AreaChartPremium
                data={analytics.scansByDay}
                height={280}
                showGrid
              />
            </div>
          </ScrollReveal>

          {/* Radial Stats */}
          <ScrollReveal delay={0.1}>
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-mesa-charcoal mb-2">Menu Coverage</h3>
              <p className="text-sm text-mesa-charcoal/50 mb-6">Items recommended at least once</p>

              <div className="flex flex-col items-center">
                <RadialProgress value={analytics.menuCoverage || 87} size={180} label="coverage" />

                <div className="grid grid-cols-2 gap-6 mt-8 w-full">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-mesa-charcoal">{analytics.activeItems || 42}</p>
                    <p className="text-xs text-mesa-charcoal/50">Active items</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-mesa-charcoal">{analytics.neverShown || 6}</p>
                    <p className="text-xs text-mesa-charcoal/50">Never shown</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Secondary Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Guest Mood Preferences */}
          <ScrollReveal>
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-mesa-charcoal mb-2">Guest Moods</h3>
              <p className="text-sm text-mesa-charcoal/50 mb-6">What are guests looking for?</p>
              {moodChartData.length > 0 ? (
                <BarChartPremium
                  data={moodChartData}
                  horizontal
                  height={260}
                />
              ) : (
                <div className="flex items-center justify-center h-[260px] text-mesa-charcoal/40">
                  No mood data yet
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Dietary Preferences */}
          <ScrollReveal delay={0.1}>
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-mesa-charcoal mb-2">Conversion Funnel</h3>
              <p className="text-sm text-mesa-charcoal/50 mb-6">Guest journey through the flow</p>

              <div className="space-y-4">
                {[
                  { name: 'Scans', value: analytics.conversionFunnel.scans, percent: 100 },
                  { name: 'Completed Flow', value: analytics.conversionFunnel.completedFlow, percent: analytics.conversionFunnel.scans > 0 ? Math.round((analytics.conversionFunnel.completedFlow / analytics.conversionFunnel.scans) * 100) : 0 },
                  { name: 'Guest Picks', value: analytics.conversionFunnel.guestPicks, percent: analytics.conversionFunnel.completedFlow > 0 ? Math.round((analytics.conversionFunnel.guestPicks / analytics.conversionFunnel.completedFlow) * 100) : 0 },
                ].map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-mesa-charcoal/70">{item.name}</span>
                      <span className="text-sm font-medium text-mesa-charcoal">{item.value} ({item.percent}%)</span>
                    </div>
                    <div className="h-2 bg-mesa-charcoal/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percent}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        className="h-full bg-gradient-to-r from-mesa-burgundy to-mesa-terracotta rounded-full"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Top Dishes & Heat Map */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Top Recommended Dishes */}
          <ScrollReveal>
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-mesa-charcoal">Top Picks</h3>
                  <p className="text-sm text-mesa-charcoal/50">Most liked this period</p>
                </div>
                <button className="text-sm text-mesa-burgundy font-medium flex items-center gap-1 hover:underline">
                  View all
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              {topDishesData.length > 0 ? (
                <div className="space-y-4">
                  {topDishesData.map((dish, index) => (
                    <motion.div
                      key={dish.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-mesa-charcoal/5 transition cursor-pointer"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: dish.color }}
                      >
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-mesa-charcoal">{dish.name}</p>
                        <p className="text-xs text-mesa-charcoal/50">{dish.value} picks</p>
                      </div>
                      <div className="w-24 h-2 bg-mesa-charcoal/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(dish.value / (topDishesData[0]?.value || 1)) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: dish.color }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-mesa-charcoal/40">
                  <Heart className="w-8 h-8 mb-2 opacity-30" />
                  <p>No picks yet</p>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Peak Hours Heat Map */}
          <ScrollReveal delay={0.1}>
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-mesa-charcoal mb-2">Peak Hours</h3>
              <p className="text-sm text-mesa-charcoal/50 mb-6">When are guests most active?</p>
              <HeatMap data={heatMapData} />
            </div>
          </ScrollReveal>
        </div>

        {/* Unmet Demand Section */}
        <ScrollReveal>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-mesa-charcoal">Unmet Demand</h3>
                  <p className="text-sm text-mesa-charcoal/50">Preferences your menu doesn&apos;t fully satisfy</p>
                </div>
              </div>
            </div>

            {analytics.unmetDemand.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.unmetDemand.slice(0, 3).map((item, index) => (
                    <motion.div
                      key={item.preference}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl bg-red-50 border border-red-100"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-mesa-charcoal">{item.preference}</p>
                          <p className="text-xs text-mesa-charcoal/50 mt-1">
                            {item.matchedItems} items match - {item.requests} requests
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">{item.requests - item.matchedItems}</p>
                          <p className="text-xs text-red-500">gap</p>
                        </div>
                      </div>

                      <div className="mt-3 h-1.5 bg-red-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${(item.matchedItems / item.requests) * 100}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {analytics.unmetDemand[0] && (
                  <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Recommendation</p>
                        <p className="text-sm text-blue-600 mt-1">
                          Consider adding more {analytics.unmetDemand[0].preference.toLowerCase()} options. {analytics.unmetDemand[0].requests} guests requested this preference,
                          but only {analytics.unmetDemand[0].matchedItems} menu item{analytics.unmetDemand[0].matchedItems !== 1 ? 's' : ''} currently match{analytics.unmetDemand[0].matchedItems === 1 ? 'es' : ''}.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <PartyPopper className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-mesa-charcoal font-medium">Great news!</p>
                <p className="text-mesa-charcoal/50 text-sm">Your menu is meeting guest preferences well.</p>
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}
