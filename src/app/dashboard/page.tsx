'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  QrCode, MousePointer, TrendingUp, Clock, ExternalLink,
  BarChart3, Utensils, Download, Wifi, WifiOff, Settings, RefreshCw,
} from 'lucide-react'

type DateRange = '7d' | '30d' | 'all'

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
    case 'scan': return 'bg-emerald-500'
    case 'click': return 'bg-purple-500'
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

  const [metrics, setMetrics] = useState({
    totalScans: 0,
    totalClicks: 0,
    clickRate: 0,
    unmetDemand: 0,
  })

  const [topMoods, setTopMoods] = useState<{ name: string; count: number }[]>([])
  const [topItems, setTopItems] = useState<{ name: string; clicks: number }[]>([])
  const [liveActivity, setLiveActivity] = useState<LiveEvent[]>([])

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

  // Load data
  const loadData = useCallback(async () => {
    if (!venueId) return

    const now = new Date()
    let startDate = new Date()
    if (dateRange === '7d') startDate.setDate(now.getDate() - 7)
    else if (dateRange === '30d') startDate.setDate(now.getDate() - 30)
    else startDate = new Date(0)

    const startISO = startDate.toISOString()

    const [
      { count: totalScans },
      { count: totalClicks },
      { data: sessions },
      { data: clickEvents },
      { count: unmetCount },
    ] = await Promise.all([
      supabase.from('rec_sessions').select('*', { count: 'exact', head: true }).eq('venue_id', venueId).gte('started_at', startISO),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('venue_id', venueId).eq('name', 'recommendation_clicked').gte('ts', startISO),
      supabase.from('rec_sessions').select('intent_chips').eq('venue_id', venueId).gte('started_at', startISO),
      supabase.from('events').select('props').eq('venue_id', venueId).eq('name', 'recommendation_clicked').gte('ts', startISO),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('venue_id', venueId).eq('name', 'no_match_found').gte('ts', startISO),
    ])

    // Calculate moods
    const moodCounts: Record<string, number> = {}
    const moodLabels: Record<string, string> = {
      'mood_comfort': 'Comfort',
      'mood_light': 'Light',
      'mood_protein': 'Protein',
      'mood_warm': 'Warm',
      'mood_treat': 'Treat',
    }
    sessions?.forEach(s => {
      ((s.intent_chips as string[] | null) || []).forEach((chip: string) => {
        if (chip.startsWith('mood_')) {
          const label = moodLabels[chip] || chip
          moodCounts[label] = (moodCounts[label] || 0) + 1
        }
      })
    })
    const moods = Object.entries(moodCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Calculate top items
    const itemCounts: Record<string, number> = {}
    clickEvents?.forEach(e => {
      const name = (e.props as any)?.item_name
      if (name) itemCounts[name] = (itemCounts[name] || 0) + 1
    })
    const items = Object.entries(itemCounts)
      .map(([name, clicks]) => ({ name, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)

    setMetrics({
      totalScans: totalScans || 0,
      totalClicks: totalClicks || 0,
      clickRate: totalScans && totalScans > 0 ? Math.round((totalClicks || 0) / totalScans * 100) : 0,
      unmetDemand: unmetCount || 0,
    })
    setTopMoods(moods)
    setTopItems(items)
    setLastUpdate(new Date())
    setLoading(false)
  }, [venueId, dateRange, supabase])

  useEffect(() => {
    if (venueId) loadData()
  }, [venueId, dateRange, loadData])

  // Real-time subscriptions
  useEffect(() => {
    if (!venueId) return

    const sessionsChannel = supabase
      .channel('realtime-sessions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rec_sessions',
        filter: `venue_id=eq.${venueId}`,
      }, (payload) => {
        setMetrics(prev => ({ ...prev, totalScans: prev.totalScans + 1 }))
        setLiveActivity(prev => [{
          id: (payload.new as any).id,
          type: 'scan',
          message: (payload.new as any).table_ref ? `Table ${(payload.new as any).table_ref} scanned` : 'New scan',
          time: new Date(),
        }, ...prev].slice(0, 10))
        setLastUpdate(new Date())
      })
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'))

    const eventsChannel = supabase
      .channel('realtime-events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
        filter: `venue_id=eq.${venueId}`,
      }, (payload) => {
        const event = payload.new as any
        if (event.name === 'recommendation_clicked') {
          setMetrics(prev => ({
            ...prev,
            totalClicks: prev.totalClicks + 1,
            clickRate: prev.totalScans > 0 ? Math.round((prev.totalClicks + 1) / prev.totalScans * 100) : 0,
          }))
          setLiveActivity(prev => [{
            id: event.id,
            type: 'click',
            message: `Clicked: ${event.props?.item_name || 'item'}`,
            time: new Date(),
          }, ...prev].slice(0, 10))
        }
        if (event.name === 'upsell_liked' || event.name === 'upsell_clicked') {
          setLiveActivity(prev => [{
            id: event.id,
            type: 'upsell',
            message: `Upsell ${event.name === 'upsell_liked' ? 'saved' : 'added'}: ${event.props?.item_name || 'drink'}`,
            time: new Date(),
          }, ...prev].slice(0, 10))
        }
        if (event.name === 'no_match_found') {
          setMetrics(prev => ({ ...prev, unmetDemand: prev.unmetDemand + 1 }))
        }
        setLastUpdate(new Date())
      })
      .subscribe()

    return () => {
      supabase.removeChannel(sessionsChannel)
      supabase.removeChannel(eventsChannel)
    }
  }, [venueId, supabase])

  if (loading && !venue) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 text-neutral-400 animate-spin" />
      </div>
    )
  }

  const maxMood = topMoods.length > 0 ? topMoods[0].count : 1

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{venue?.name || 'Dashboard'}</h1>
          <div className="flex items-center gap-3 mt-1">
            <div className={`flex items-center gap-1.5 text-sm ${isLive ? 'text-emerald-600' : 'text-gray-400'}`}>
              {isLive ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{isLive ? 'Live' : 'Connecting...'}</span>
              {isLive && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
            </div>
            {lastUpdate && <span className="text-gray-400 text-sm">Updated {timeAgo(lastUpdate)}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {(['7d', '30d', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                dateRange === range ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {range === '7d' ? '7 days' : range === '30d' ? '30 days' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          key={`scans-${metrics.totalScans}`}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3 }}
          className="p-5 bg-white rounded-xl border border-gray-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalScans}</p>
          <p className="text-gray-500 text-sm">Total scans</p>
        </motion.div>

        <motion.div
          key={`clicks-${metrics.totalClicks}`}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3 }}
          className="p-5 bg-white rounded-xl border border-gray-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.totalClicks}</p>
          <p className="text-gray-500 text-sm">Clicks</p>
        </motion.div>

        <motion.div
          key={`rate-${metrics.clickRate}`}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3 }}
          className="p-5 bg-white rounded-xl border border-gray-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.clickRate}%</p>
          <p className="text-gray-500 text-sm">Click-through</p>
        </motion.div>

        <motion.div
          key={`unmet-${metrics.unmetDemand}`}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.3 }}
          className={`p-5 rounded-xl border ${metrics.unmetDemand > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${metrics.unmetDemand > 0 ? 'bg-amber-100' : 'bg-gray-50'}`}>
              <Clock className={`w-5 h-5 ${metrics.unmetDemand > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{metrics.unmetDemand}</p>
          <p className="text-gray-500 text-sm">Unmet requests</p>
        </motion.div>
      </div>

      {/* Data Row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Top Moods */}
        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Top moods</h3>
          {topMoods.length === 0 ? (
            <p className="text-gray-400 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topMoods.map((mood, i) => (
                <div key={mood.name} className="flex items-center gap-3">
                  <span className="w-5 text-gray-400 text-sm">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-900 text-sm">{mood.name}</span>
                      <span className="text-gray-400 text-sm">{mood.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full">
                      <div className="h-full bg-gray-900 rounded-full" style={{ width: `${(mood.count / maxMood) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Clicked */}
        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Most clicked</h3>
          {topItems.length === 0 ? (
            <p className="text-gray-400 text-sm">No clicks yet</p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600">{i + 1}</span>
                    <span className="text-gray-900 text-sm truncate max-w-[140px]">{item.name}</span>
                  </div>
                  <span className="text-emerald-600 font-medium text-sm">{item.clicks}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Activity */}
        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Live activity</h3>
            {isLive && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
          </div>
          {liveActivity.length === 0 ? (
            <p className="text-gray-400 text-sm">Waiting for activity...</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {liveActivity.map(e => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"
                  >
                    <div className={`w-2 h-2 rounded-full ${getEventColor(e.type)}`} />
                    <span className="text-gray-700 text-sm flex-1 truncate">{e.message}</span>
                    <span className="text-gray-400 text-xs">{timeAgo(e.time)}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href={`/v/${venue?.slug}`} target="_blank" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors flex items-center justify-between">
          <span className="text-gray-900 font-medium">Preview Guest Flow</span>
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </Link>
        <Link href="/dashboard/analytics" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors flex items-center justify-between">
          <span className="text-gray-900 font-medium">View Analytics</span>
          <BarChart3 className="w-4 h-4 text-gray-400" />
        </Link>
        <Link href="/dashboard/menu" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors flex items-center justify-between">
          <span className="text-gray-900 font-medium">Manage Menu</span>
          <Utensils className="w-4 h-4 text-gray-400" />
        </Link>
        <Link href="/dashboard/qr" className="p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors flex items-center justify-between">
          <span className="text-gray-900 font-medium">Download QR</span>
          <Download className="w-4 h-4 text-gray-400" />
        </Link>
      </div>
    </div>
  )
}
