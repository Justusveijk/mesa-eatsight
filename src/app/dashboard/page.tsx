'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode,
  MousePointer,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  BarChart3,
  Zap,
  AlertCircle,
  Bell,
  Heart,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type DateRange = '7d' | '30d' | 'all'

interface Metrics {
  totalScans: number
  totalClicks: number
  clickRate: number
  unmetCount: number
  topMoods: { name: string; count: number }[]
  topItems: { name: string; clicks: number }[]
}

interface LiveEvent {
  id: string
  type: string
  message: string
  time: Date
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

function getEventColor(type: string): string {
  switch (type) {
    case 'scan': return 'bg-blue-500'
    case 'click': return 'bg-emerald-500'
    case 'like': return 'bg-pink-500'
    case 'upsell': return 'bg-purple-500'
    case 'unmet': return 'bg-amber-500'
    default: return 'bg-neutral-400'
  }
}

export default function DashboardPage() {
  const [venue, setVenue] = useState<any>(null)
  const [venueId, setVenueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>('7d')

  const [metrics, setMetrics] = useState<Metrics>({
    totalScans: 0,
    totalClicks: 0,
    clickRate: 0,
    unmetCount: 0,
    topMoods: [],
    topItems: [],
  })

  const [liveActivity, setLiveActivity] = useState<LiveEvent[]>([])

  const supabase = createClient()

  // Load initial data
  const loadData = useCallback(async () => {
    if (!venueId) return

    const now = new Date()
    let startDate = new Date()
    if (dateRange === '7d') startDate.setDate(now.getDate() - 7)
    else if (dateRange === '30d') startDate.setDate(now.getDate() - 30)
    else startDate = new Date(0)

    const startISO = startDate.toISOString()

    // Parallel fetch all metrics
    const [
      { count: totalScans },
      { count: totalClicks },
      { data: sessions },
      { data: clickEvents },
      { count: unmetCount },
    ] = await Promise.all([
      supabase
        .from('rec_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId)
        .gte('started_at', startISO),
      supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId)
        .eq('name', 'rec_clicked')
        .gte('ts', startISO),
      supabase
        .from('rec_sessions')
        .select('intent_chips')
        .eq('venue_id', venueId)
        .gte('started_at', startISO),
      supabase
        .from('events')
        .select('props')
        .eq('venue_id', venueId)
        .eq('name', 'rec_clicked')
        .gte('ts', startISO),
      supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId)
        .eq('name', 'unmet_demand')
        .gte('ts', startISO),
    ])

    // Calculate moods from intent_chips
    const moodCounts: Record<string, number> = {}
    sessions?.forEach(s => {
      (s.intent_chips as string[] | null)?.forEach((chip: string) => {
        if (chip.startsWith('mood_')) {
          moodCounts[chip] = (moodCounts[chip] || 0) + 1
        }
      })
    })

    const topMoods = Object.entries(moodCounts)
      .map(([name, count]) => ({ name: name.replace('mood_', '').replace(/_/g, ' '), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Calculate top clicked items
    const itemClicks: Record<string, number> = {}
    clickEvents?.forEach(e => {
      const props = e.props as Record<string, any> | null
      const name = props?.item_name
      if (name) itemClicks[name] = (itemClicks[name] || 0) + 1
    })

    const topItems = Object.entries(itemClicks)
      .map(([name, clicks]) => ({ name, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)

    const scans = totalScans || 0
    const clicks = totalClicks || 0
    const clickRate = scans > 0 ? Math.round((clicks / scans) * 100) : 0

    setMetrics({
      totalScans: scans,
      totalClicks: clicks,
      clickRate,
      unmetCount: unmetCount || 0,
      topMoods,
      topItems,
    })

    // Load recent activity
    const { data: recentEvents } = await supabase
      .from('events')
      .select('id, name, ts, props')
      .eq('venue_id', venueId)
      .order('ts', { ascending: false })
      .limit(10)

    const eventLabels: Record<string, string> = {
      scan: 'QR code scanned',
      flow_started: 'Flow started',
      flow_completed: 'Session completed',
      recommendations_shown: 'Recommendations served',
      item_selected: 'Item liked',
      rec_clicked: 'Recommendation clicked',
      upsell_liked: 'Upsell saved',
      upsell_clicked: 'Upsell added',
      unmet_demand: 'Unmet demand logged',
    }

    const activityItems: LiveEvent[] = (recentEvents || []).map(e => {
      const props = (e.props || {}) as Record<string, any>
      const detail = props.item_name
        || (props.item_names ? (props.item_names as string[]).slice(0, 2).join(', ') : '')
        || (props.table_ref ? `Table ${props.table_ref}` : '')
        || ''

      const eventType =
        e.name === 'scan' ? 'scan' :
        e.name === 'rec_clicked' || e.name === 'item_selected' ? 'click' :
        e.name === 'upsell_liked' || e.name === 'upsell_clicked' ? 'upsell' :
        e.name === 'unmet_demand' ? 'unmet' : 'click'

      return {
        id: e.id,
        type: eventType,
        message: detail
          ? `${eventLabels[e.name] || e.name}: ${detail}`
          : eventLabels[e.name] || e.name,
        time: new Date(e.ts),
      }
    })

    setLiveActivity(activityItems)
    setLastUpdate(new Date())
    setLoading(false)
  }, [venueId, dateRange, supabase])

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

        const { data: venueData } = await supabase
          .from('venues')
          .select('*')
          .eq('id', operator.venue_id)
          .single()

        setVenue(venueData)
      } else {
        setLoading(false)
      }
    }
    getVenue()
  }, [supabase])

  // Load data when venue or date range changes
  useEffect(() => {
    if (venueId) loadData()
  }, [venueId, dateRange, loadData])

  // ── REAL-TIME SUBSCRIPTIONS ──
  useEffect(() => {
    if (!venueId) return

    // Subscribe to new sessions (scans)
    const sessionsChannel = supabase
      .channel('realtime-sessions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rec_sessions',
          filter: `venue_id=eq.${venueId}`,
        },
        (payload) => {
          setMetrics(prev => ({
            ...prev,
            totalScans: prev.totalScans + 1,
          }))

          const newSession = payload.new as any
          setLiveActivity(prev => [{
            id: newSession.id,
            type: 'scan',
            message: newSession.table_ref
              ? `Table ${newSession.table_ref} scanned`
              : 'New scan started',
            time: new Date(),
          }, ...prev].slice(0, 20))

          setLastUpdate(new Date())
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
      })

    // Subscribe to new events
    const eventsChannel = supabase
      .channel('realtime-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `venue_id=eq.${venueId}`,
        },
        (payload) => {
          const event = payload.new as any

          if (event.name === 'rec_clicked' || event.name === 'item_selected') {
            setMetrics(prev => ({
              ...prev,
              totalClicks: prev.totalClicks + 1,
              clickRate: prev.totalScans > 0
                ? Math.round((prev.totalClicks + 1) / prev.totalScans * 100)
                : 0,
            }))

            setLiveActivity(prev => [{
              id: event.id,
              type: 'click',
              message: event.name === 'item_selected'
                ? `Liked: ${event.props?.item_name || 'item'}`
                : `Clicked: ${event.props?.item_name || 'item'}`,
              time: new Date(),
            }, ...prev].slice(0, 20))
          }

          if (event.name === 'upsell_liked' || event.name === 'upsell_clicked') {
            setLiveActivity(prev => [{
              id: event.id,
              type: 'upsell',
              message: `Upsell ${event.name === 'upsell_liked' ? 'saved' : 'added'}: ${event.props?.item_name || 'drink'}`,
              time: new Date(),
            }, ...prev].slice(0, 20))
          }

          if (event.name === 'unmet_demand') {
            setMetrics(prev => ({
              ...prev,
              unmetCount: prev.unmetCount + 1,
            }))

            setLiveActivity(prev => [{
              id: event.id,
              type: 'unmet',
              message: 'Unmet demand logged',
              time: new Date(),
            }, ...prev].slice(0, 20))
          }

          setLastUpdate(new Date())
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sessionsChannel)
      supabase.removeChannel(eventsChannel)
    }
  }, [venueId, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 text-neutral-400 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{venue?.name || 'Dashboard'}</h1>
          <div className="flex items-center gap-3 mt-1">
            {/* Live indicator */}
            <div className={`flex items-center gap-1.5 ${isLive ? 'text-emerald-600' : 'text-neutral-400'}`}>
              {isLive ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm">{isLive ? 'Live' : 'Connecting...'}</span>
              {isLive && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
            </div>
            {lastUpdate && (
              <span className="text-neutral-400 text-sm">
                Updated {timeAgo(lastUpdate)}
              </span>
            )}
          </div>
        </div>

        {/* Date range & refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2 text-neutral-400 hover:text-neutral-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
            {(['7d', '30d', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  dateRange === range
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {range === '7d' ? '7 days' : range === '30d' ? '30 days' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Scans */}
        <motion.div
          key={`scans-${metrics.totalScans}`}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3 }}
          className="p-5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 transition"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-neutral-900 mb-1 tabular-nums">{metrics.totalScans}</p>
          <p className="text-neutral-500 text-sm">Total scans</p>
        </motion.div>

        {/* Total Clicks */}
        <motion.div
          key={`clicks-${metrics.totalClicks}`}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3 }}
          className="p-5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 transition"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-neutral-900 mb-1 tabular-nums">{metrics.totalClicks}</p>
          <p className="text-neutral-500 text-sm">Clicks</p>
        </motion.div>

        {/* Click Rate */}
        <motion.div
          key={`rate-${metrics.clickRate}`}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3 }}
          className="p-5 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 transition"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-neutral-900 mb-1 tabular-nums">{metrics.clickRate}%</p>
          <p className="text-neutral-500 text-sm">Click-through</p>
        </motion.div>

        {/* Unmet Demand Count */}
        <div className={`p-5 rounded-xl border transition ${
          metrics.unmetCount > 0
            ? 'bg-amber-50 border-amber-200'
            : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              metrics.unmetCount > 0 ? 'bg-amber-100' : 'bg-neutral-100'
            }`}>
              <Bell className={`w-5 h-5 ${
                metrics.unmetCount > 0 ? 'text-amber-600' : 'text-neutral-400'
              }`} />
            </div>
          </div>
          <p className="text-3xl font-bold text-neutral-900 mb-1 tabular-nums">{metrics.unmetCount}</p>
          <p className="text-neutral-500 text-sm">Unmet requests</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Moods */}
        <div className="p-5 rounded-xl bg-white border border-neutral-200">
          <h3 className="text-neutral-900 font-medium mb-4">Top moods</h3>
          {metrics.topMoods.length === 0 ? (
            <p className="text-neutral-400 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {metrics.topMoods.map((mood, i) => (
                <div key={mood.name} className="flex items-center gap-3">
                  <span className="w-6 text-neutral-400 text-sm tabular-nums">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-neutral-900 capitalize text-sm">{mood.name}</span>
                      <span className="text-neutral-400 text-sm tabular-nums">{mood.count}</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(mood.count / metrics.topMoods[0].count) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Items */}
        <div className="p-5 rounded-xl bg-white border border-neutral-200">
          <h3 className="text-neutral-900 font-medium mb-4">Most clicked</h3>
          {metrics.topItems.length === 0 ? (
            <p className="text-neutral-400 text-sm">No clicks yet</p>
          ) : (
            <div className="space-y-3">
              {metrics.topItems.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs text-neutral-600 tabular-nums">
                      {i + 1}
                    </span>
                    <span className="text-neutral-900 truncate max-w-[150px] text-sm">{item.name}</span>
                  </div>
                  <span className="text-blue-600 font-medium tabular-nums text-sm">{item.clicks}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="p-5 rounded-xl bg-white border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-neutral-900 font-medium">Live activity</h3>
            {isLive && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
          </div>

          {liveActivity.length === 0 ? (
            <p className="text-neutral-400 text-sm">Waiting for activity...</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {liveActivity.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 py-2 border-b border-neutral-100 last:border-0"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getEventColor(event.type)}`} />
                    <span className="text-neutral-700 text-sm flex-1 truncate">{event.message}</span>
                    <span className="text-neutral-400 text-xs whitespace-nowrap">{timeAgo(event.time)}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: 'Preview Guest Flow', href: `/v/${venue?.slug}`, icon: ExternalLink, external: true },
          { label: 'View Analytics', href: '/dashboard/analytics', icon: BarChart3 },
          { label: 'Manage Menu', href: '/dashboard/menu', icon: Zap },
          { label: 'Download QR', href: '/dashboard/qr', icon: ArrowUpRight },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href || '#'}
            target={action.external ? '_blank' : undefined}
            className="flex items-center justify-between px-4 py-3 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 transition group"
          >
            <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
              {action.label}
            </span>
            <action.icon className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600" />
          </Link>
        ))}
      </div>
    </div>
  )
}
