'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  QrCode, MousePointer, TrendingUp, Heart, AlertCircle,
  ExternalLink, BarChart3, Utensils, Settings,
  Wifi, RefreshCw, Activity, Sparkles,
  ChevronRight
} from 'lucide-react'

// Animated number
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let current = display
    const steps = 20
    const increment = (value - current) / steps
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
    }, 25)

    return () => clearInterval(timer)
  }, [value])

  return <span className="tabular-nums">{display.toLocaleString()}</span>
}

// Live pulse
function LivePulse() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  )
}

// Activity item
function ActivityItem({ event }: { event: any }) {
  const icons: Record<string, any> = {
    scan: QrCode,
    click: MousePointer,
    like: Heart,
    upsell: Sparkles,
    unmet: AlertCircle,
  }
  const colors: Record<string, string> = {
    scan: 'bg-emerald-500',
    click: 'bg-blue-500',
    like: 'bg-rose-500',
    upsell: 'bg-purple-500',
    unmet: 'bg-amber-500',
  }

  const Icon = icons[event.type] || QrCode
  const color = colors[event.type] || 'bg-gray-500'

  const timeAgo = (date: Date) => {
    const s = Math.floor((Date.now() - date.getTime()) / 1000)
    if (s < 5) return 'now'
    if (s < 60) return `${s}s`
    return `${Math.floor(s / 60)}m`
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0"
    >
      <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="flex-1 text-sm text-gray-700 truncate">{event.message}</p>
      <span className="text-xs text-gray-400 tabular-nums">{timeAgo(event.time)}</span>
    </motion.div>
  )
}

export default function DashboardPage() {
  const [venue, setVenue] = useState<any>(null)
  const [venueId, setVenueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('7d')

  // Metrics
  const [metrics, setMetrics] = useState({
    totalScans: 0,
    totalClicks: 0,
    clickRate: 0,
    unmetRequests: 0,
  })

  // Additional data
  const [topMoods, setTopMoods] = useState<{ name: string; count: number }[]>([])
  const [topItems, setTopItems] = useState<{ name: string; clicks: number }[]>([])
  const [liveActivity, setLiveActivity] = useState<any[]>([])
  const [weeklyTrend, setWeeklyTrend] = useState<number[]>([])

  const supabase = createClient()

  // Get venue
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
      }
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
          const cap = name.charAt(0).toUpperCase() + name.slice(1)
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
      const name = (e.props as any)?.item_name
      if (name) itemClicks[name] = (itemClicks[name] || 0) + 1
    })
    setTopItems(
      Object.entries(itemClicks)
        .map(([name, clicks]) => ({ name, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 4)
    )

    setLastUpdate(new Date())
    setLoading(false)
  }, [venueId, dateRange, supabase])

  useEffect(() => {
    if (venueId) loadData()
  }, [venueId, dateRange, loadData])

  // Realtime
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
        const s = payload.new as any

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
          type: 'scan',
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
        const e = payload.new as any
        const itemName = (e.props as any)?.item_name

        if (e.name === 'recommendation_clicked') {
          setMetrics(prev => ({
            ...prev,
            totalClicks: prev.totalClicks + 1,
            clickRate: prev.totalScans > 0 ? Math.round((prev.totalClicks + 1) / prev.totalScans * 100) : 0,
          }))

          setLiveActivity(prev => [{
            id: e.id,
            type: 'click',
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
            type: 'like',
            message: `Saved: ${itemName || 'item'}`,
            time: new Date(),
          }, ...prev].slice(0, 15))
        }

        if (e.name === 'no_match_found') {
          setMetrics(prev => ({ ...prev, unmetRequests: prev.unmetRequests + 1 }))
          setLiveActivity(prev => [{
            id: e.id,
            type: 'unmet',
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

  const maxTrend = Math.max(...weeklyTrend, 1)
  const maxMood = topMoods.length > 0 ? topMoods[0].count : 1

  if (loading && !venue) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{venue?.name || 'Dashboard'}</h1>
            {isLive && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                <Wifi className="w-3 h-3" />
                Live
                <LivePulse />
              </div>
            )}
          </div>
          <p className="text-gray-500 mt-1">Updated {timeAgo(lastUpdate)}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {(['7d', '30d', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  dateRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range === '7d' ? '7 days' : range === '30d' ? '30 days' : 'All'}
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Scans */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            <AnimatedNumber value={metrics.totalScans} />
          </p>
          <p className="text-sm text-gray-500 mt-1">Total scans</p>
        </div>

        {/* Clicks */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            <AnimatedNumber value={metrics.totalClicks} />
          </p>
          <p className="text-sm text-gray-500 mt-1">Clicks</p>
        </div>

        {/* Click Rate */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            <AnimatedNumber value={metrics.clickRate} />%
          </p>
          <p className="text-sm text-gray-500 mt-1">Click-through</p>
        </div>

        {/* Unmet Requests */}
        <div className={`rounded-xl border p-5 ${
          metrics.unmetRequests > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              metrics.unmetRequests > 0 ? 'bg-amber-100' : 'bg-gray-50'
            }`}>
              <AlertCircle className={`w-5 h-5 ${metrics.unmetRequests > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            <AnimatedNumber value={metrics.unmetRequests} />
          </p>
          <p className="text-sm text-gray-500 mt-1">Unmet requests</p>
        </div>
      </div>

      {/* Weekly Sparkline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">This Week</h3>
            <p className="text-xs text-gray-500">Daily scan activity</p>
          </div>
          <Link href="/dashboard/analytics" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
            View details <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex items-end gap-1.5 h-16">
          {weeklyTrend.map((val, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((val / maxTrend) * 100, 8)}%` }}
              className="flex-1 bg-emerald-500 rounded-t transition-all"
              style={{ minHeight: '4px' }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className="flex-1 text-center">{d}</span>
          ))}
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Top Moods */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Top moods</h3>
          {topMoods.length === 0 ? (
            <p className="text-gray-400 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topMoods.map((mood) => (
                <div key={mood.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{mood.name}</span>
                    <span className="text-xs text-gray-400">{mood.count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(mood.count / maxMood) * 100}%` }}
                      className="h-full bg-gray-800 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Clicked */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Most clicked</h3>
          {topItems.length === 0 ? (
            <p className="text-gray-400 text-sm">No clicks yet</p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700 truncate max-w-[140px]">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">{item.clicks}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Live activity</h3>
            {isLive && <LivePulse />}
          </div>
          {liveActivity.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
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
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: `/v/${venue?.slug}`, icon: ExternalLink, label: 'Preview Guest Flow', ext: true },
          { href: '/dashboard/analytics', icon: BarChart3, label: 'Full Analytics' },
          { href: '/dashboard/menu', icon: Utensils, label: 'Manage Menu' },
          { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
        ].map(action => (
          <Link
            key={action.label}
            href={action.href}
            target={action.ext ? '_blank' : undefined}
            className="group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
          >
            <span className="text-sm font-medium text-gray-700">{action.label}</span>
            <action.icon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
