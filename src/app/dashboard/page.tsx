'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Scan, MousePointerClick, Percent, Wine, RefreshCw } from 'lucide-react'
import { GlassPanel } from '@/components/shared/GlassPanel'
import { createClient } from '@/lib/supabase/client'
import { TAG_LABELS } from '@/lib/types/taxonomy'

interface Metrics {
  scansToday: number
  scansWeek: number
  clicksToday: number
  clicksWeek: number
  ctr: number
  topMoods: { tag: string; count: number }[]
  topFlavors: { tag: string; count: number }[]
  topItems: { name: string; clicks: number }[]
  dietaryDemand: { tag: string; count: number }[]
}

interface ActivityEvent {
  id: string
  name: string
  ts: string
  props: Record<string, unknown> | null
}

interface StatCardProps {
  title: string
  value: string | number
  trend?: number
  icon: React.ElementType
  loading?: boolean
}

function StatCard({ title, value, trend, icon: Icon, loading }: StatCardProps) {
  const isPositive = trend && trend > 0
  const isNegative = trend && trend < 0

  return (
    <GlassPanel className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-ocean-700 flex items-center justify-center">
          <Icon className="w-5 h-5 text-signal" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${
            isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-text-muted'
          }`}>
            {isPositive && <TrendingUp className="w-4 h-4" />}
            {isNegative && <TrendingDown className="w-4 h-4" />}
            {isPositive && '+'}
            {trend}%
          </div>
        )}
      </div>
      <p className="text-text-muted text-sm mb-1">{title}</p>
      {loading ? (
        <div className="h-8 w-16 bg-ocean-700 animate-pulse rounded" />
      ) : (
        <p className="text-2xl font-bold text-text-primary">{value}</p>
      )}
    </GlassPanel>
  )
}

export default function DashboardPage() {
  const [venueId, setVenueId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('7')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [metrics, setMetrics] = useState<Metrics>({
    scansToday: 0,
    scansWeek: 0,
    clicksToday: 0,
    clicksWeek: 0,
    ctr: 0,
    topMoods: [],
    topFlavors: [],
    topItems: [],
    dietaryDemand: [],
  })
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([])

  const supabase = createClient()

  // Get venue ID on mount
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
      }
    }
    getVenue()
  }, [supabase])

  const fetchMetrics = useCallback(async () => {
    if (!venueId) return

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const periodStart = new Date(todayStart)
    periodStart.setDate(periodStart.getDate() - parseInt(dateRange))

    try {
      // Scans today
      const { count: scansToday } = await supabase
        .from('rec_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId)
        .gte('started_at', todayStart.toISOString())

      // Scans this period
      const { count: scansWeek } = await supabase
        .from('rec_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId)
        .gte('started_at', periodStart.toISOString())

      // Clicks today
      const { count: clicksToday } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId)
        .eq('name', 'rec_clicked')
        .gte('ts', todayStart.toISOString())

      // Clicks this period
      const { count: clicksWeek } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId)
        .eq('name', 'rec_clicked')
        .gte('ts', periodStart.toISOString())

      // Get sessions with intent chips for mood/flavor analysis
      const { data: sessions } = await supabase
        .from('rec_sessions')
        .select('intent_chips')
        .eq('venue_id', venueId)
        .gte('started_at', periodStart.toISOString())

      // Count mood tags
      const moodCounts: Record<string, number> = {}
      const flavorCounts: Record<string, number> = {}
      const dietaryCounts: Record<string, number> = {}

      sessions?.forEach(session => {
        const chips = session.intent_chips as string[] | null
        chips?.forEach((chip: string) => {
          if (chip.startsWith('mood_')) {
            moodCounts[chip] = (moodCounts[chip] || 0) + 1
          } else if (chip.startsWith('flavor_')) {
            flavorCounts[chip] = (flavorCounts[chip] || 0) + 1
          } else if (chip.startsWith('diet_') || chip.startsWith('allergy_')) {
            dietaryCounts[chip] = (dietaryCounts[chip] || 0) + 1
          }
        })
      })

      // Get top clicked items
      const { data: clickEvents } = await supabase
        .from('events')
        .select('props')
        .eq('venue_id', venueId)
        .eq('name', 'rec_clicked')
        .gte('ts', periodStart.toISOString())

      const itemClicks: Record<string, number> = {}
      clickEvents?.forEach(event => {
        const props = event.props as Record<string, unknown> | null
        const itemId = props?.item_id as string | undefined
        if (itemId) {
          itemClicks[itemId] = (itemClicks[itemId] || 0) + 1
        }
      })

      // Get item names for top clicked
      const topItemIds = Object.entries(itemClicks)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id)

      let topItems: { name: string; clicks: number }[] = []
      if (topItemIds.length > 0) {
        const { data: items } = await supabase
          .from('menu_items')
          .select('id, name')
          .in('id', topItemIds)

        topItems = topItemIds.map(id => ({
          name: items?.find(i => i.id === id)?.name || 'Unknown',
          clicks: itemClicks[id]
        }))
      }

      // Calculate CTR
      const ctr = scansWeek && scansWeek > 0 ? ((clicksWeek || 0) / scansWeek * 100) : 0

      // Helper to format tag label
      const formatTag = (tag: string) => {
        return TAG_LABELS[tag as keyof typeof TAG_LABELS] ||
          tag.replace('mood_', '').replace('flavor_', '').replace('diet_', '').replace('allergy_', '')
      }

      setMetrics({
        scansToday: scansToday || 0,
        scansWeek: scansWeek || 0,
        clicksToday: clicksToday || 0,
        clicksWeek: clicksWeek || 0,
        ctr: Math.round(ctr * 10) / 10,
        topMoods: Object.entries(moodCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag, count]) => ({ tag: formatTag(tag), count })),
        topFlavors: Object.entries(flavorCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag, count]) => ({ tag: formatTag(tag), count })),
        topItems,
        dietaryDemand: Object.entries(dietaryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag, count]) => ({ tag: formatTag(tag), count })),
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }, [venueId, dateRange, supabase])

  const fetchRecentActivity = useCallback(async () => {
    if (!venueId) return

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('venue_id', venueId)
      .order('ts', { ascending: false })
      .limit(20)

    setRecentActivity(events || [])
  }, [venueId, supabase])

  // Initial load and polling
  useEffect(() => {
    if (!venueId) return

    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchMetrics(), fetchRecentActivity()])
      setLoading(false)
    }

    loadData()

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchMetrics()
      fetchRecentActivity()
    }, 30000)

    return () => clearInterval(interval)
  }, [venueId, fetchMetrics, fetchRecentActivity])

  // Refetch when date range changes
  useEffect(() => {
    if (venueId) {
      fetchMetrics()
    }
  }, [dateRange, venueId, fetchMetrics])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchMetrics(), fetchRecentActivity()])
    setRefreshing(false)
  }

  // Format time ago
  const timeAgo = (ts: string) => {
    const seconds = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  // Get event display info
  const getEventInfo = (event: ActivityEvent) => {
    const props = event.props as Record<string, unknown> | null
    switch (event.name) {
      case 'session_start':
        return { type: 'scan', message: `New session${props?.table_ref ? ` (Table ${props.table_ref})` : ''}` }
      case 'rec_clicked':
        return { type: 'click', message: `Clicked: ${props?.item_name || 'Item'}` }
      case 'chips_selected':
        return { type: 'scan', message: 'Preferences selected' }
      default:
        return { type: 'scan', message: event.name.replace(/_/g, ' ') }
    }
  }

  // Calculate max for bar charts
  const maxMoodCount = Math.max(...metrics.topMoods.map(m => m.count), 1)
  const maxFlavorCount = Math.max(...metrics.topFlavors.map(m => m.count), 1)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-muted">Overview of your menu performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-ocean-700 border border-line text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="px-4 py-2 rounded-lg bg-ocean-700 border border-line text-text-primary text-sm focus:outline-none focus:border-signal"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Empty state */}
      {!loading && metrics.scansWeek === 0 && metrics.clicksWeek === 0 && (
        <GlassPanel className="p-8 text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-signal/20 flex items-center justify-center mx-auto mb-4">
            <Scan className="w-8 h-8 text-signal" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No activity yet</h3>
          <p className="text-text-muted max-w-md mx-auto">
            Share your QR code with guests to start receiving recommendations data.
            Go to Settings to download your QR codes.
          </p>
        </GlassPanel>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Scans today"
              value={metrics.scansToday}
              icon={Scan}
              loading={loading}
            />
            <StatCard
              title={`Scans (${dateRange}d)`}
              value={metrics.scansWeek}
              icon={Scan}
              loading={loading}
            />
            <StatCard
              title="Clicks today"
              value={metrics.clicksToday}
              icon={MousePointerClick}
              loading={loading}
            />
            <StatCard
              title="CTR"
              value={`${metrics.ctr}%`}
              icon={Percent}
              loading={loading}
            />
          </div>

          {/* Top Cravings (Moods) */}
          <GlassPanel className="p-6">
            <h3 className="font-semibold text-text-primary mb-4">Top cravings</h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 bg-ocean-700 animate-pulse rounded" />
                ))}
              </div>
            ) : metrics.topMoods.length > 0 ? (
              <div className="space-y-3">
                {metrics.topMoods.map((item) => (
                  <div key={item.tag} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted capitalize">{item.tag}</span>
                      <span className="text-text-primary">{item.count}</span>
                    </div>
                    <div className="h-2 bg-ocean-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-signal rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.count / maxMoodCount) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm">No mood data yet</p>
            )}
          </GlassPanel>

          {/* Top Flavors */}
          {metrics.topFlavors.length > 0 && (
            <GlassPanel className="p-6">
              <h3 className="font-semibold text-text-primary mb-4">Top flavors</h3>
              <div className="space-y-3">
                {metrics.topFlavors.map((item) => (
                  <div key={item.tag} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted capitalize">{item.tag}</span>
                      <span className="text-text-primary">{item.count}</span>
                    </div>
                    <div className="h-2 bg-ocean-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-signal/70 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.count / maxFlavorCount) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}

          {/* Top Clicked Items */}
          <GlassPanel className="p-6">
            <h3 className="font-semibold text-text-primary mb-4">Most clicked items</h3>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 bg-ocean-700 animate-pulse rounded" />
                ))}
              </div>
            ) : metrics.topItems.length > 0 ? (
              <div className="space-y-3">
                {metrics.topItems.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-signal/20 text-signal text-xs font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-text-primary">{item.name}</span>
                    </div>
                    <span className="text-text-muted">{item.clicks} clicks</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-sm">No click data yet</p>
            )}
          </GlassPanel>
        </div>

        {/* Live Activity Feed */}
        <div className="lg:col-span-1">
          <GlassPanel className="p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text-primary">Live activity</h3>
              <span className="flex items-center gap-2 text-xs text-text-muted">
                <span className="w-2 h-2 bg-signal rounded-full animate-pulse" />
                Live
              </span>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-ocean-700 animate-pulse rounded" />
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-auto dark-scrollbar">
                {recentActivity.map((event) => {
                  const eventInfo = getEventInfo(event)
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 py-2 border-b border-line/50 last:border-0"
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          eventInfo.type === 'click' ? 'bg-signal' : 'bg-ocean-600'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{eventInfo.message}</p>
                        <p className="text-xs text-text-muted">{timeAgo(event.ts)}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <p className="text-text-muted text-sm">No recent activity</p>
            )}
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
