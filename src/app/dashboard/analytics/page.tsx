'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Clock, AlertTriangle, BarChart3, Heart, Utensils, Lightbulb, PartyPopper } from 'lucide-react'

interface UnmetDemandItem {
  preference: string
  category: string
  requests: number
  matchedItems: number
  gap: 'critical' | 'moderate' | 'minor'
}

interface Analytics {
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
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const }
  }
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
  // Dietary
  'diet_vegan': 'Vegan',
  'diet_vegetarian': 'Vegetarian',
  'diet_gluten_free': 'Gluten-free',
  'diet_dairy_free': 'Dairy-free',
  'diet_nut_free': 'Nut-free',
  'diet_halal': 'Halal',
  'diet_kosher': 'Kosher',
  // Mood
  'mood_comfort': 'Comfort Food',
  'mood_light': 'Light & Healthy',
  'mood_treat': 'Treat Yourself',
  'mood_adventurous': 'Adventurous',
  'mood_quick': 'Quick Bite',
  // Flavor
  'flavor_spicy': 'Spicy',
  'flavor_sweet': 'Sweet',
  'flavor_savory': 'Savory',
  'flavor_umami': 'Umami / Rich',
  'flavor_fresh': 'Fresh / Light',
  'flavor_tangy': 'Tangy / Sour',
  // Portion
  'portion_light': 'Light Portion',
  'portion_standard': 'Standard Portion',
  'portion_hearty': 'Hearty Portion',
  // Alcohol
  'abv_zero': 'Non-Alcoholic',
  'abv_light': 'Light Alcohol',
  'abv_regular': 'Regular Alcohol',
  'abv_strong': 'Strong Alcohol',
  'strength_none': 'Non-Alcoholic',
  'strength_light': 'Light Alcohol',
  'strength_regular': 'Regular Alcohol',
  'strength_strong': 'Strong Alcohol',
  // Temperature
  'temp_hot': 'Hot',
  'temp_chilled': 'Cold / Chilled',
  'temp_frozen': 'Frozen',
  // Drink Style
  'format_crisp': 'Crisp & Refreshing',
  'format_smooth': 'Smooth & Easy',
  'format_bold': 'Bold & Complex',
  // Taste
  'taste_bitter': 'Bitter',
  'taste_sweet': 'Sweet',
  'taste_sour': 'Sour',
  'taste_herbal': 'Herbal',
  'taste_fruity': 'Fruity',
}

export default function AnalyticsPage() {
  const [venueId, setVenueId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('7')
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<Analytics>({
    scansByHour: [],
    conversionFunnel: {
      scans: 0,
      completedFlow: 0,
      guestPicks: 0
    },
    unmetDemand: [],
    peakHours: [],
    topCravings: [],
    guestPicks: []
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

        // Get the active menu for this venue
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
    sessions?.forEach(s => {
      const hour = new Date(s.started_at).getHours()
      hourMap[hour] = (hourMap[hour] || 0) + 1
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

    // Calculate unmet demand - compare requested preferences to menu item tags
    const unmetDemand: UnmetDemandItem[] = []

    // Intent values to filter out (these are NOT preferences)
    const intentValues = ['food', 'drinks', 'both', 'intent']

    // Helper to check if a value is a valid preference tag
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

    // Get question_answered events to see what guests requested
    const { data: answerEvents } = await supabase
      .from('events')
      .select('props')
      .eq('venue_id', venueId)
      .eq('name', 'question_answered')
      .gte('ts', startDate.toISOString())

    // Count preference requests from answers (filter out intent values!)
    const preferenceCounts: Record<string, number> = {}
    answerEvents?.forEach(event => {
      const props = event.props as { answer?: string; question?: string } | null
      const answer = props?.answer
      // Only count actual preference tags, NOT intent selections
      if (answer && isPreferenceTag(answer)) {
        preferenceCounts[answer] = (preferenceCounts[answer] || 0) + 1
      }
    })

    // Also count from session intent_chips (primary source of preference data)
    sessions?.forEach(session => {
      const chips = session.intent_chips as string[] | null
      chips?.forEach((chip: string) => {
        // Count all valid preference tags, not just dietary
        if (isPreferenceTag(chip)) {
          preferenceCounts[chip] = (preferenceCounts[chip] || 0) + 1
        }
      })
    })

    // Get menu item tags to see what we can actually serve
    let tagCounts: Record<string, number> = {}
    if (menuId) {
      const { data: items } = await supabase
        .from('menu_items')
        .select('id, item_tags(tag)')
        .eq('menu_id', menuId)

      items?.forEach(item => {
        const itemTags = item.item_tags as { tag: string }[] | null
        itemTags?.forEach((t) => {
          tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1
        })
      })
    }

    // Find gaps: preferences requested but few/no items match
    Object.entries(preferenceCounts).forEach(([pref, requests]) => {
      const matchedItems = tagCounts[pref] || 0

      // Flag as unmet if requested at least 2 times but few items match
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

    // Sort by requests descending
    unmetDemand.sort((a, b) => b.requests - a.requests)

    // Peak hours - top 3
    const peakHours = Object.entries(hourMap)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3)
      .map(([hour, scans]) => ({
        hour: `${hour.padStart(2, '0')}:00 - ${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`,
        scans: scans as number
      }))

    setAnalytics({
      scansByHour: Object.entries(hourMap)
        .map(([hour, count]) => ({
          hour: parseInt(hour),
          count: count as number
        }))
        .sort((a, b) => a.hour - b.hour),
      conversionFunnel: {
        scans: sessions?.length || 0,
        completedFlow,
        guestPicks
      },
      unmetDemand: unmetDemand.slice(0, 5),
      peakHours,
      topCravings: Object.entries(cravingCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count })),
      guestPicks: Object.entries(pickCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, picks]) => ({ name, picks }))
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1a1a1a] mb-1">Analytics</h1>
          <p className="text-[#1a1a1a]/50">Deep dive into guest behavior and preferences</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 rounded-lg bg-[#1a1a1a] text-white border-0 text-sm"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#722F37]"></div>
        </div>
      ) : (
        <>
          {/* Conversion Funnel */}
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#722F37]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#722F37]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1a1a1a]">Conversion Funnel</h2>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="text-4xl font-bold text-[#1a1a1a]">{analytics.conversionFunnel.scans}</div>
                <div className="text-sm text-[#1a1a1a]/50 mt-1">Scans</div>
              </div>
              <div className="text-2xl text-[#1a1a1a]/30">→</div>
              <div className="text-center flex-1">
                <div className="text-4xl font-bold text-[#1a1a1a]">{analytics.conversionFunnel.completedFlow}</div>
                <div className="text-sm text-[#1a1a1a]/50 mt-1">Completed Flow</div>
                <div className="text-xs text-[#722F37] font-medium mt-1">
                  {analytics.conversionFunnel.scans > 0
                    ? Math.round(analytics.conversionFunnel.completedFlow / analytics.conversionFunnel.scans * 100)
                    : 0}%
                </div>
              </div>
              <div className="text-2xl text-[#1a1a1a]/30">→</div>
              <div className="text-center flex-1">
                <div className="text-4xl font-bold text-[#1a1a1a]">{analytics.conversionFunnel.guestPicks}</div>
                <div className="text-sm text-[#1a1a1a]/50 mt-1">Guest Picks</div>
                <div className="text-xs text-[#722F37] font-medium mt-1">
                  {analytics.conversionFunnel.completedFlow > 0
                    ? Math.round(analytics.conversionFunnel.guestPicks / analytics.conversionFunnel.completedFlow * 100)
                    : 0}%
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours */}
            <motion.div
              variants={fadeIn}
              initial="initial"
              animate="animate"
              className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#722F37]/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#722F37]" />
                </div>
                <h2 className="text-lg font-semibold text-[#1a1a1a]">Peak Hours</h2>
              </div>
              {analytics.peakHours.length > 0 ? (
                <div className="space-y-3">
                  {analytics.peakHours.map((peak, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-[#FDFBF7]">
                      <span className="text-[#1a1a1a]">{peak.hour}</span>
                      <span className="text-[#722F37] font-medium">{peak.scans} scans</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#1a1a1a]/40">No data yet</p>
              )}
            </motion.div>

            {/* Unmet Demand - Improved */}
            <motion.div
              variants={fadeIn}
              initial="initial"
              animate="animate"
              className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#1a1a1a]">Unmet Demand</h2>
                  <p className="text-xs text-[#1a1a1a]/40">Preferences guests wanted but your menu couldn&apos;t fully satisfy</p>
                </div>
              </div>

              {analytics.unmetDemand.length > 0 ? (
                <div className="space-y-3">
                  {analytics.unmetDemand.map((item) => (
                    <div
                      key={item.preference}
                      className="flex items-center justify-between p-3 bg-[#FEF3F2] rounded-xl"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#1a1a1a]">{item.preference}</span>
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-sm text-[#1a1a1a]/50 mt-1">
                          {item.matchedItems === 0
                            ? 'No items on your menu match this preference'
                            : `Only ${item.matchedItems} item${item.matchedItems !== 1 ? 's' : ''} match${item.matchedItems === 1 ? 'es' : ''}`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-semibold text-red-600">{item.requests}</span>
                        <span className="text-sm text-[#1a1a1a]/50 block">requests</span>
                      </div>
                    </div>
                  ))}

                  {analytics.unmetDemand[0] && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800">
                        <strong>Tip:</strong> Consider adding {analytics.unmetDemand[0].preference.toLowerCase()} options to capture more orders.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[#1a1a1a]/40">Great news! Your menu is meeting guest preferences well.</p>
                  <div className="flex justify-center mt-2">
                    <PartyPopper className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Top Cravings + Guest Picks Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Cravings */}
            <motion.div
              variants={fadeIn}
              initial="initial"
              animate="animate"
              className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#722F37]/10 flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-[#722F37]" />
                </div>
                <h2 className="text-lg font-semibold text-[#1a1a1a]">Top Cravings</h2>
              </div>

              {analytics.topCravings.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topCravings.map((craving, i) => (
                    <div key={craving.tag} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-[#722F37]/10 text-[#722F37] rounded-full flex items-center justify-center text-sm font-medium">
                          {i + 1}
                        </span>
                        <span className="text-[#1a1a1a]">{formatTagLabel(craving.tag)}</span>
                      </div>
                      <span className="text-[#1a1a1a]/50 text-sm">{craving.count} guests</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-[#1a1a1a]/50">
                  <p>Craving data will appear once guests complete recommendations.</p>
                </div>
              )}
            </motion.div>

            {/* Guest Picks */}
            <motion.div
              variants={fadeIn}
              initial="initial"
              animate="animate"
              className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#722F37]/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[#722F37]" />
                </div>
                <h2 className="text-lg font-semibold text-[#1a1a1a]">Most Liked</h2>
              </div>

              {analytics.guestPicks.length > 0 ? (
                <div className="space-y-3">
                  {analytics.guestPicks.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-[#722F37]" fill="#722F37" />
                        <span className="text-[#1a1a1a]">{item.name}</span>
                      </div>
                      <span className="text-[#1a1a1a]/50 text-sm">
                        {item.picks} like{item.picks !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-xl bg-[#722F37]/10 flex items-center justify-center mx-auto mb-2">
                    <Heart className="w-6 h-6 text-[#722F37]" />
                  </div>
                  <p className="text-[#1a1a1a]/50 text-sm">
                    When guests tap the heart on recommendations,<br />you&apos;ll see their favorites here.
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Scans by Hour Chart */}
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#722F37]/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#722F37]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1a1a1a]">Scans by Hour</h2>
            </div>
            <div className="flex items-end h-48 gap-1">
              {Array.from({ length: 24 }, (_, hour) => {
                const data = analytics.scansByHour.find(h => h.hour === hour)
                const count = data?.count || 0
                const maxCount = Math.max(...analytics.scansByHour.map(h => h.count), 1)
                const height = (count / maxCount) * 100

                return (
                  <div key={hour} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full">
                      {count > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a1a1a] text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                          {count}
                        </div>
                      )}
                      <div
                        className="w-full bg-[#722F37]/80 rounded-t transition-all hover:bg-[#722F37]"
                        style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                      />
                    </div>
                    {hour % 4 === 0 && (
                      <span className="text-xs text-[#1a1a1a]/40 mt-2">{hour}h</span>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
