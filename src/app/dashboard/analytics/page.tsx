'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  Users, Sparkles, TrendingUp, Clock, Download,
} from 'lucide-react'

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'

export default function AnalyticsPage() {
  const [venueId, setVenueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d')

  // Real metrics from database
  const [metrics, setMetrics] = useState({
    totalGuests: 0,
    guestsTrend: 0,
    totalRecommendations: 0,
    recsTrend: 0,
    avgDecisionTime: 0,
    decisionTrend: 0,
  })

  const [trafficData, setTrafficData] = useState<{ day: string; guests: number; recs: number }[]>([])
  const [dietaryData, setDietaryData] = useState<{ name: string; value: number; color: string }[]>([])
  const [moodData, setMoodData] = useState<{ name: string; count: number }[]>([])
  const [topItems, setTopItems] = useState<{ name: string; count: number }[]>([])

  const supabase = createClient()

  // Get venue on mount
  useEffect(() => {
    async function getVenue() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: operator } = await supabase
        .from('operator_users')
        .select('venue_id')
        .eq('auth_user_id', user.id)
        .single()

      if (operator?.venue_id) {
        setVenueId(operator.venue_id)
      }
    }
    getVenue()
  }, [supabase])

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    if (!venueId) return
    setLoading(true)

    const now = new Date()
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000)

    // ============ TOTAL GUESTS (sessions) ============
    const { count: totalGuests } = await supabase
      .from('rec_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .gte('started_at', startDate.toISOString())

    const { count: prevGuests } = await supabase
      .from('rec_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .gte('started_at', prevStartDate.toISOString())
      .lt('started_at', startDate.toISOString())

    const guestsTrend = prevGuests && prevGuests > 0
      ? Math.round(((totalGuests || 0) - prevGuests) / prevGuests * 100)
      : 0

    // ============ TOTAL RECOMMENDATIONS ============
    const { count: totalRecs } = await supabase
      .from('rec_results')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    const { count: prevRecs } = await supabase
      .from('rec_results')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', prevStartDate.toISOString())
      .lt('created_at', startDate.toISOString())

    const recsTrend = prevRecs && prevRecs > 0
      ? Math.round(((totalRecs || 0) - prevRecs) / prevRecs * 100)
      : 0

    // ============ TRAFFIC BY DAY ============
    const { data: sessions } = await supabase
      .from('rec_sessions')
      .select('started_at, intent_chips')
      .eq('venue_id', venueId)
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: true })

    // Group by day
    const dayMap: Record<string, { guests: number; recs: number }> = {}
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // Initialize last 7 days
    for (let i = 0; i < Math.min(days, 7); i++) {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
      const dayName = dayNames[d.getDay()]
      dayMap[dayName] = { guests: 0, recs: 0 }
    }

    sessions?.forEach(s => {
      const d = new Date(s.started_at)
      const dayName = dayNames[d.getDay()]
      if (dayMap[dayName]) {
        dayMap[dayName].guests++
      }
    })

    // Get rec counts per day
    const { data: recsByDay } = await supabase
      .from('rec_results')
      .select('created_at')
      .gte('created_at', startDate.toISOString())

    recsByDay?.forEach(r => {
      const d = new Date(r.created_at)
      const dayName = dayNames[d.getDay()]
      if (dayMap[dayName]) {
        dayMap[dayName].recs++
      }
    })

    const traffic = Object.entries(dayMap).map(([day, data]) => ({
      day,
      guests: data.guests,
      recs: data.recs,
    }))

    // ============ DIETARY PREFERENCES ============
    const dietaryCounts: Record<string, number> = {
      'No Restrictions': 0,
      'Vegetarian': 0,
      'Vegan': 0,
      'Gluten-free': 0,
      'Other': 0,
    }

    sessions?.forEach(s => {
      const chips = (s.intent_chips as string[] | null) || []
      let hasDietary = false

      if (chips.includes('diet_vegetarian')) { dietaryCounts['Vegetarian']++; hasDietary = true }
      if (chips.includes('diet_vegan')) { dietaryCounts['Vegan']++; hasDietary = true }
      if (chips.includes('diet_gluten_free')) { dietaryCounts['Gluten-free']++; hasDietary = true }
      if (chips.some((c: string) => c.startsWith('diet_') && !['diet_vegetarian', 'diet_vegan', 'diet_gluten_free'].includes(c))) {
        dietaryCounts['Other']++
        hasDietary = true
      }

      if (!hasDietary) dietaryCounts['No Restrictions']++
    })

    const totalDietary = Object.values(dietaryCounts).reduce((a, b) => a + b, 0) || 1
    const dietary = [
      { name: 'No Restrictions', value: Math.round(dietaryCounts['No Restrictions'] / totalDietary * 100), color: '#1f2937' },
      { name: 'Vegetarian', value: Math.round(dietaryCounts['Vegetarian'] / totalDietary * 100), color: '#22c55e' },
      { name: 'Vegan', value: Math.round(dietaryCounts['Vegan'] / totalDietary * 100), color: '#16a34a' },
      { name: 'Gluten-free', value: Math.round(dietaryCounts['Gluten-free'] / totalDietary * 100), color: '#f59e0b' },
      { name: 'Other', value: Math.round(dietaryCounts['Other'] / totalDietary * 100), color: '#9ca3af' },
    ].filter(d => d.value > 0)

    // ============ GUEST MOODS ============
    const moodCounts: Record<string, number> = {}
    const moodLabels: Record<string, string> = {
      'mood_comfort': 'Comfort Food',
      'mood_light': 'Light & Healthy',
      'mood_protein': 'High Protein',
      'mood_warm': 'Warm & Cozy',
      'mood_treat': 'Sweet Treat',
    }

    sessions?.forEach(s => {
      ((s.intent_chips as string[] | null) || []).forEach((chip: string) => {
        if (chip.startsWith('mood_')) {
          const label = moodLabels[chip] || chip.replace('mood_', '')
          moodCounts[label] = (moodCounts[label] || 0) + 1
        }
      })
    })

    const moods = Object.entries(moodCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // ============ TOP RECOMMENDED ITEMS ============
    const { data: topRecsData } = await supabase
      .from('rec_results')
      .select('item_id, menu_items(name)')
      .gte('created_at', startDate.toISOString())

    const itemCounts: Record<string, number> = {}
    topRecsData?.forEach(r => {
      const name = (r.menu_items as any)?.name
      if (name) {
        itemCounts[name] = (itemCounts[name] || 0) + 1
      }
    })

    const topItemsList = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // ============ SET STATE ============
    setMetrics({
      totalGuests: totalGuests || 0,
      guestsTrend,
      totalRecommendations: totalRecs || 0,
      recsTrend,
      avgDecisionTime: 0,
      decisionTrend: 0,
    })

    setTrafficData(traffic)
    setDietaryData(dietary)
    setMoodData(moods)
    setTopItems(topItemsList)
    setLoading(false)
  }, [venueId, dateRange, supabase])

  useEffect(() => {
    if (venueId) loadAnalytics()
  }, [venueId, dateRange, loadAnalytics])

  const maxMoodCount = moodData.length > 0 ? Math.max(...moodData.map(m => m.count)) : 1

  if (loading && !venueId) {
    return <div className="p-6 text-neutral-400">Loading...</div>
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Guest insights and menu performance</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  dateRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Guests */}
        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Guests</span>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalGuests.toLocaleString()}</p>
          {metrics.guestsTrend !== 0 && (
            <p className={`text-sm mt-1 ${metrics.guestsTrend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {metrics.guestsTrend > 0 ? '+' : ''}{metrics.guestsTrend}%
            </p>
          )}
        </div>

        {/* Recommendations */}
        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recommendations</span>
            <Sparkles className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalRecommendations.toLocaleString()}</p>
          {metrics.recsTrend !== 0 && (
            <p className={`text-sm mt-1 ${metrics.recsTrend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {metrics.recsTrend > 0 ? '+' : ''}{metrics.recsTrend}%
            </p>
          )}
        </div>

        {/* Click-through Rate */}
        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Click-through Rate</span>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {metrics.totalGuests > 0
              ? Math.round(metrics.totalRecommendations / metrics.totalGuests * 100)
              : 0}%
          </p>
        </div>

        {/* Avg Decision Time */}
        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg. Decision Time</span>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {metrics.totalGuests > 0 ? '~2m' : '-'}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Traffic Chart */}
        <div className="lg:col-span-2 p-5 bg-white rounded-xl border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-1">Guest Traffic</h3>
          <p className="text-sm text-gray-500 mb-4">Daily guests and recommendations</p>

          {trafficData.length > 0 && trafficData.some(d => d.guests > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trafficData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="guests" stroke="#1f2937" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No traffic data yet
            </div>
          )}
        </div>

        {/* Dietary Preferences */}
        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-1">Dietary Preferences</h3>
          <p className="text-sm text-gray-500 mb-4">Guest requirements breakdown</p>

          {dietaryData.length > 0 ? (
            <>
              <div className="h-40 flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dietaryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      dataKey="value"
                    >
                      {dietaryData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {dietaryData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{d.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400">
              No dietary data yet
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Guest Moods */}
        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-1">Guest Moods</h3>
          <p className="text-sm text-gray-500 mb-4">What guests are looking for</p>

          {moodData.length > 0 ? (
            <div className="space-y-3">
              {moodData.map(mood => (
                <div key={mood.name} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-gray-600 text-right">{mood.name}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-gray-900 rounded"
                      style={{ width: `${(mood.count / maxMoodCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400">
              No mood data yet
            </div>
          )}
        </div>

        {/* Top Recommended */}
        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-gray-900">Top Recommended</h3>
              <p className="text-sm text-gray-500">Most recommended dishes</p>
            </div>
          </div>

          {topItems.length > 0 ? (
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-gray-900">{item.name}</span>
                  <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(item.count / topItems[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400">
              No recommendations yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
