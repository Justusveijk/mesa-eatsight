'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, QrCode } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TAG_LABELS } from '@/lib/types/taxonomy'

interface Metrics {
  scansToday: number
  scansWeek: number
  clicksToday: number
  clicksWeek: number
  ctr: number
  topMoods: { name: string; percent: number }[]
  topItems: { name: string; clicks: number }[]
  recentActivity: { ts: string; name: string; message: string }[]
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const }
  }
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } }
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
    topItems: [],
    recentActivity: [],
  })

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

      // Get sessions with intent chips for mood analysis
      const { data: sessions } = await supabase
        .from('rec_sessions')
        .select('intent_chips')
        .eq('venue_id', venueId)
        .gte('started_at', periodStart.toISOString())

      // Count mood tags
      const moodCounts: Record<string, number> = {}
      let totalMoods = 0

      sessions?.forEach(session => {
        const chips = session.intent_chips as string[] | null
        chips?.forEach((chip: string) => {
          if (chip.startsWith('mood_')) {
            moodCounts[chip] = (moodCounts[chip] || 0) + 1
            totalMoods++
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

      // Get recent activity
      const { data: recentEvents } = await supabase
        .from('events')
        .select('ts, name, props')
        .eq('venue_id', venueId)
        .order('ts', { ascending: false })
        .limit(10)

      const recentActivity = (recentEvents || []).map(event => {
        const props = event.props as Record<string, unknown> | null
        let message = event.name.replace(/_/g, ' ')
        if (event.name === 'rec_clicked') {
          message = `Clicked: ${props?.item_name || 'Item'}`
        } else if (event.name === 'flow_started') {
          message = `New session${props?.tableRef ? ` (Table ${props.tableRef})` : ''}`
        }
        return { ts: event.ts, name: event.name, message }
      })

      // Calculate CTR
      const ctr = scansWeek && scansWeek > 0 ? ((clicksWeek || 0) / scansWeek * 100) : 0

      // Format mood labels
      const formatTag = (tag: string) => {
        return TAG_LABELS[tag as keyof typeof TAG_LABELS] ||
          tag.replace('mood_', '').replace('_', ' ')
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
          .map(([tag, count]) => ({
            name: formatTag(tag),
            percent: totalMoods > 0 ? Math.round((count / totalMoods) * 100) : 0
          })),
        topItems,
        recentActivity,
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }, [venueId, dateRange, supabase])

  // Initial load and polling
  useEffect(() => {
    if (!venueId) return

    const loadData = async () => {
      setLoading(true)
      await fetchMetrics()
      setLoading(false)
    }

    loadData()

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [venueId, fetchMetrics])

  // Refetch when date range changes
  useEffect(() => {
    if (venueId) {
      fetchMetrics()
    }
  }, [dateRange, venueId, fetchMetrics])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMetrics()
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

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-1">Dashboard</h1>
          <p className="text-[#1a1a1a]/50">Overview of your menu performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-[#1a1a1a] text-white hover:bg-[#333] transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="px-4 py-2 rounded-lg bg-[#1a1a1a] text-white border-0 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {metrics.scansWeek === 0 && !loading && (
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          className="bg-white rounded-2xl p-12 border border-[#1a1a1a]/5 text-center mb-8"
        >
          <div className="w-16 h-16 bg-[#722F37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="text-[#722F37]" size={28} />
          </div>
          <h3 className="text-xl font-medium text-[#1a1a1a] mb-2">No activity yet</h3>
          <p className="text-[#1a1a1a]/40 max-w-md mx-auto mb-6">
            Share your QR code with guests to start receiving recommendations data.
            Go to Settings to download your QR codes.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-block px-6 py-3 bg-[#722F37] text-white rounded-full hover:bg-[#5a252c] transition"
          >
            Get QR Codes
          </Link>
        </motion.div>
      )}

      {/* Metrics Grid */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8"
        variants={stagger}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={fadeIn} className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5">
          <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-2">Scans Today</p>
          {loading ? (
            <div className="h-10 w-16 bg-gray-100 animate-pulse rounded" />
          ) : (
            <p className="text-4xl font-semibold text-[#1a1a1a]">{metrics.scansToday}</p>
          )}
        </motion.div>
        <motion.div variants={fadeIn} className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5">
          <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-2">Scans ({dateRange}d)</p>
          {loading ? (
            <div className="h-10 w-16 bg-gray-100 animate-pulse rounded" />
          ) : (
            <p className="text-4xl font-semibold text-[#1a1a1a]">{metrics.scansWeek}</p>
          )}
        </motion.div>
        <motion.div variants={fadeIn} className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5">
          <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-2">Clicks Today</p>
          {loading ? (
            <div className="h-10 w-16 bg-gray-100 animate-pulse rounded" />
          ) : (
            <p className="text-4xl font-semibold text-[#1a1a1a]">{metrics.clicksToday}</p>
          )}
        </motion.div>
        <motion.div variants={fadeIn} className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5">
          <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-2">CTR</p>
          {loading ? (
            <div className="h-10 w-16 bg-gray-100 animate-pulse rounded" />
          ) : (
            <p className="text-4xl font-semibold text-[#1a1a1a]">{metrics.ctr}%</p>
          )}
        </motion.div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Top Moods */}
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
        >
          <h3 className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-6">Top Cravings</h3>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : metrics.topMoods.length > 0 ? (
            <div className="space-y-4">
              {metrics.topMoods.map((mood) => (
                <div key={mood.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#1a1a1a] capitalize">{mood.name}</span>
                    <span className="text-[#1a1a1a]/50">{mood.percent}%</span>
                  </div>
                  <div className="h-2 bg-[#1a1a1a]/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#722F37] rounded-full transition-all duration-500"
                      style={{ width: `${mood.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#1a1a1a]/40">No mood data yet</p>
          )}
        </motion.div>

        {/* Most Clicked Items */}
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
        >
          <h3 className="text-xs uppercase tracking-wider text-[#1a1a1a]/40 mb-6">Most Clicked Items</h3>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : metrics.topItems.length > 0 ? (
            <div className="space-y-4">
              {metrics.topItems.map((item, i) => (
                <div key={item.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-[#1a1a1a]/30 font-mono text-sm w-4">{i + 1}</span>
                    <span className="text-[#1a1a1a]">{item.name}</span>
                  </div>
                  <span className="text-[#722F37] font-medium">{item.clicks}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#1a1a1a]/40">No click data yet</p>
          )}
        </motion.div>

        {/* Live Activity */}
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs uppercase tracking-wider text-[#1a1a1a]/40">Live Activity</h3>
            <span className="flex items-center gap-1.5 text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : metrics.recentActivity.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-auto">
              {metrics.recentActivity.map((activity, i) => (
                <div key={i} className="text-sm p-3 bg-[#FDFBF7] rounded-xl">
                  <span className="text-[#1a1a1a]/40 mr-2">{timeAgo(activity.ts)}</span>
                  <span className="text-[#1a1a1a]">{activity.message}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#1a1a1a]/40">No recent activity</p>
          )}
        </motion.div>
      </div>
    </div>
  )
}
