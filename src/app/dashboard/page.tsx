'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  QrCode, MousePointer, TrendingUp, AlertCircle,
  ExternalLink, BarChart3, Utensils, Settings,
  Wifi, RefreshCw, Activity, Heart, Sparkles,
  ChevronRight, Users, Eye
} from 'lucide-react'

// Smooth number animation
function AnimatedNumber({
  value,
  suffix = '',
  duration = 600
}: {
  value: number
  suffix?: string
  duration?: number
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === display) return

    const steps = 25
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
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      className="tabular-nums"
    >
      {display.toLocaleString()}{suffix}
    </motion.span>
  )
}

// Activity item - minimal
function ActivityItem({ event }: { event: LiveEvent }) {
  const iconMap = {
    scan: QrCode,
    click: MousePointer,
    like: Heart,
    upsell: Sparkles,
    unmet: AlertCircle,
  }

  const Icon = iconMap[event.type] || QrCode

  const timeAgo = (date: Date) => {
    const s = Math.floor((Date.now() - date.getTime()) / 1000)
    if (s < 5) return 'now'
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}m`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0"
    >
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <p className="flex-1 text-sm text-slate-600 truncate">{event.message}</p>
      <span className="text-xs text-slate-400 tabular-nums">{timeAgo(event.time)}</span>
    </motion.div>
  )
}

// Empty state
function EmptyState({
  hasMenu,
  venueName,
  venueSlug,
}: {
  hasMenu: boolean
  venueName: string
  venueSlug: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
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
        Welcome to {venueName}
      </h3>
      <p className="text-slate-500 max-w-md mb-8">
        {hasMenu
          ? "Your menu is ready. Share your QR code with guests to start collecting insights."
          : "Start by adding your menu items, then share your QR code with guests."
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
            <Link
              href={`/v/${venueSlug}`}
              target="_blank"
              className="px-6 py-3 bg-white text-slate-700 rounded-xl font-medium border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview Guest Flow
            </Link>
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

interface LiveEvent {
  id: string
  type: 'scan' | 'click' | 'like' | 'upsell' | 'unmet'
  message: string
  time: Date
}

export default function DashboardPage() {
  const [venue, setVenue] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [venueId, setVenueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('7d')
  const [hasMenu, setHasMenu] = useState(false)

  // Metrics - real data only
  const [metrics, setMetrics] = useState({
    totalScans: 0,
    totalClicks: 0,
    clickRate: 0,
    unmetRequests: 0,
  })

  const [topMoods, setTopMoods] = useState<{ name: string; count: number }[]>([])
  const [topItems, setTopItems] = useState<{ name: string; clicks: number }[]>([])
  const [liveActivity, setLiveActivity] = useState<LiveEvent[]>([])
  const [weeklyTrend, setWeeklyTrend] = useState<number[]>([])

  const supabase = createClient()

  // Get venue and check for menu
  useEffect(() => {
    async function getVenue() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let op = await supabase.from('operator_users').select('venue_id').eq('auth_user_id', user.id).single()
      if (!op.data?.venue_id) {
        op = await supabase.from('operator_users').select('venue_id').eq('email', user.email).single()
      }

      if (op.data?.venue_id) {
        setVenueId(op.data.venue_id)
        const { data: v } = await supabase.from('venues').select('*').eq('id', op.data.venue_id).single()
        setVenue(v)

        // Check if has menu items
        const { data: menus } = await supabase
          .from('menus')
          .select('id')
          .eq('venue_id', op.data.venue_id)
          .single()

        if (menus?.id) {
          const { count } = await supabase
            .from('menu_items')
            .select('*', { count: 'exact', head: true })
            .eq('menu_id', menus.id)

          setHasMenu((count || 0) > 0)
        }
      }
      setLoading(false)
    }
    getVenue()
  }, [supabase])

  // Load data
  const loadData = useCallback(async () => {
    if (!venueId) return

    const now = new Date()
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 365
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

    const [
      { count: scans },
      { count: clicks },
      { count: unmet },
      { data: sessions },
      { data: clickEvents },
    ] = await Promise.all([
      supabase.from('rec_sessions').select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId).gte('started_at', startDate),
      supabase.from('events').select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId).eq('name', 'recommendation_clicked').gte('ts', startDate),
      supabase.from('events').select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId).eq('name', 'no_match_found').gte('ts', startDate),
      supabase.from('rec_sessions').select('started_at, intent_chips')
        .eq('venue_id', venueId).gte('started_at', startDate),
      supabase.from('events').select('props')
        .eq('venue_id', venueId).eq('name', 'recommendation_clicked').gte('ts', startDate),
    ])

    setMetrics({
      totalScans: scans || 0,
      totalClicks: clicks || 0,
      clickRate: scans && scans > 0 ? Math.round((clicks || 0) / scans * 100) : 0,
      unmetRequests: unmet || 0,
    })

    // Weekly trend (last 7 days)
    const trend: number[] = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const count = sessions?.filter(s => {
        const d = new Date(s.started_at)
        return d >= dayStart && d < dayEnd
      }).length || 0

      trend.push(count)
    }
    setWeeklyTrend(trend)

    // Top moods
    const moodCounts: Record<string, number> = {}
    sessions?.forEach(s => {
      s.intent_chips?.forEach((c: string) => {
        if (c.startsWith('mood_')) {
          const name = c.replace('mood_', '').replace(/_/g, ' ')
          const cap = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          moodCounts[cap] = (moodCounts[cap] || 0) + 1
        }
      })
    })
    setTopMoods(
      Object.entries(moodCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
    )

    // Top clicked
    const itemClicks: Record<string, number> = {}
    clickEvents?.forEach(e => {
      const name = (e.props as { item_name?: string })?.item_name
      if (name) itemClicks[name] = (itemClicks[name] || 0) + 1
    })
    setTopItems(
      Object.entries(itemClicks)
        .map(([name, clicks]) => ({ name, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 4)
    )

    setLastUpdate(new Date())
  }, [venueId, dateRange, supabase])

  useEffect(() => {
    if (venueId) loadData()
  }, [venueId, dateRange, loadData])

  // Realtime subscriptions
  useEffect(() => {
    if (!venueId) return

    const sessionsChannel = supabase
      .channel(`dashboard-sessions-${venueId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rec_sessions',
        filter: `venue_id=eq.${venueId}`,
      }, (payload) => {
        const s = payload.new as { id: string; table_ref?: string }

        setMetrics(prev => {
          const newScans = prev.totalScans + 1
          return {
            ...prev,
            totalScans: newScans,
            clickRate: newScans > 0 ? Math.round(prev.totalClicks / newScans * 100) : 0,
          }
        })

        setWeeklyTrend(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = (updated[updated.length - 1] || 0) + 1
          return updated
        })

        setLiveActivity(prev => [{
          id: s.id,
          type: 'scan' as const,
          message: s.table_ref ? `Table ${s.table_ref} scanned` : 'New guest scan',
          time: new Date(),
        }, ...prev].slice(0, 15))

        setLastUpdate(new Date())
      })
      .subscribe(status => setIsLive(status === 'SUBSCRIBED'))

    const eventsChannel = supabase
      .channel(`dashboard-events-${venueId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
        filter: `venue_id=eq.${venueId}`,
      }, (payload) => {
        const e = payload.new as { id: string; name: string; props?: { item_name?: string } }
        const itemName = e.props?.item_name

        if (e.name === 'recommendation_clicked') {
          setMetrics(prev => ({
            ...prev,
            totalClicks: prev.totalClicks + 1,
            clickRate: prev.totalScans > 0 ? Math.round((prev.totalClicks + 1) / prev.totalScans * 100) : 0,
          }))

          setLiveActivity(prev => [{
            id: e.id,
            type: 'click' as const,
            message: `Clicked: ${itemName || 'item'}`,
            time: new Date(),
          }, ...prev].slice(0, 15))

          if (itemName) {
            setTopItems(prev => {
              const exists = prev.find(i => i.name === itemName)
              if (exists) {
                return prev.map(i => i.name === itemName ? { ...i, clicks: i.clicks + 1 } : i)
                  .sort((a, b) => b.clicks - a.clicks)
              }
              return prev
            })
          }
        }

        if (e.name === 'recommendation_liked') {
          setLiveActivity(prev => [{
            id: e.id,
            type: 'like' as const,
            message: `Saved: ${itemName || 'item'}`,
            time: new Date(),
          }, ...prev].slice(0, 15))
        }

        if (e.name === 'no_match_found') {
          setMetrics(prev => ({ ...prev, unmetRequests: prev.unmetRequests + 1 }))
          setLiveActivity(prev => [{
            id: e.id,
            type: 'unmet' as const,
            message: 'Unmet demand logged',
            time: new Date(),
          }, ...prev].slice(0, 15))
        }

        setLastUpdate(new Date())
      })
      .subscribe()

    return () => {
      supabase.removeChannel(sessionsChannel)
      supabase.removeChannel(eventsChannel)
    }
  }, [venueId, supabase])

  const timeAgo = (date: Date) => {
    const s = Math.floor((Date.now() - date.getTime()) / 1000)
    if (s < 5) return 'just now'
    if (s < 60) return `${s}s ago`
    return `${Math.floor(s / 60)}m ago`
  }

  const hasData = metrics.totalScans > 0
  const maxTrend = Math.max(...weeklyTrend, 1)
  const maxMood = topMoods.length > 0 ? topMoods[0].count : 1

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{venue?.name || 'Dashboard'}</h1>
            {isLive && (
              <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full">
                <Wifi className="w-3 h-3" />
                Live
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Updated {timeAgo(lastUpdate)}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            {(['7d', '30d', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  dateRange === range
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {range === '7d' ? '7 days' : range === '30d' ? '30 days' : 'All'}
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      {!hasData ? (
        <EmptyState
          hasMenu={hasMenu}
          venueName={venue?.name || 'your venue'}
          venueSlug={venue?.slug || ''}
        />
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-slate-500" />
                </div>
              </div>
              <p className="text-3xl font-semibold text-slate-900">
                <AnimatedNumber value={metrics.totalScans} />
              </p>
              <p className="text-sm text-slate-500 mt-1">Total scans</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <MousePointer className="w-5 h-5 text-slate-500" />
                </div>
              </div>
              <p className="text-3xl font-semibold text-slate-900">
                <AnimatedNumber value={metrics.totalClicks} />
              </p>
              <p className="text-sm text-slate-500 mt-1">Clicks</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-slate-500" />
                </div>
              </div>
              <p className="text-3xl font-semibold text-slate-900">
                <AnimatedNumber value={metrics.clickRate} suffix="%" />
              </p>
              <p className="text-sm text-slate-500 mt-1">Click-through</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={`rounded-2xl border p-6 ${
                metrics.unmetRequests > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  metrics.unmetRequests > 0 ? 'bg-amber-100' : 'bg-slate-100'
                }`}>
                  <AlertCircle className={`w-5 h-5 ${metrics.unmetRequests > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                </div>
              </div>
              <p className="text-3xl font-semibold text-slate-900">
                <AnimatedNumber value={metrics.unmetRequests} />
              </p>
              <p className="text-sm text-slate-500 mt-1">Unmet requests</p>
            </motion.div>
          </div>

          {/* Weekly Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-slate-900">This Week</h3>
                <p className="text-xs text-slate-400">Daily scan activity</p>
              </div>
              <Link
                href="/dashboard/analytics"
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                View details <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-end gap-2 h-20">
              {weeklyTrend.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <span className="text-xs text-slate-400 mb-1">{val}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((val / maxTrend) * 100, 8)}%` }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="w-full bg-slate-200 rounded-t"
                    style={{ minHeight: val > 0 ? '8px' : '2px' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                <span key={i} className="flex-1 text-center">{d}</span>
              ))}
            </div>
          </motion.div>

          {/* Middle Row */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Top Moods */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <h3 className="text-sm font-medium text-slate-900 mb-1">Guest Moods</h3>
              <p className="text-xs text-slate-400 mb-4">What guests are looking for</p>

              {topMoods.length === 0 ? (
                <p className="text-slate-400 text-sm">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {topMoods.map((mood, i) => (
                    <div key={mood.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600">{mood.name}</span>
                        <span className="text-xs text-slate-400 tabular-nums">{mood.count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(mood.count / maxMood) * 100}%` }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className="h-full bg-slate-700 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Most Clicked */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <h3 className="text-sm font-medium text-slate-900 mb-1">Most Clicked</h3>
              <p className="text-xs text-slate-400 mb-4">Top performing items</p>

              {topItems.length === 0 ? (
                <p className="text-slate-400 text-sm">No clicks yet</p>
              ) : (
                <div className="space-y-3">
                  {topItems.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
                          {i + 1}
                        </span>
                        <span className="text-sm text-slate-600 truncate max-w-[140px]">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900 tabular-nums">{item.clicks}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Live Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-0.5">Live Activity</h3>
                  <p className="text-xs text-slate-400">Real-time guest interactions</p>
                </div>
                {isLive && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
              </div>

              {liveActivity.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Waiting for activity...</p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  <AnimatePresence mode="popLayout">
                    {liveActivity.map(event => (
                      <ActivityItem key={event.id} event={event} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href: `/v/${venue?.slug}`, icon: ExternalLink, label: 'Preview Guest Flow', ext: true },
              { href: '/dashboard/analytics', icon: BarChart3, label: 'Full Analytics' },
              { href: '/dashboard/menu', icon: Utensils, label: 'Manage Menu' },
              { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
            ].map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                <Link
                  href={action.href}
                  target={action.ext ? '_blank' : undefined}
                  className="group flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <span className="text-sm font-medium text-slate-700">{action.label}</span>
                  <action.icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
