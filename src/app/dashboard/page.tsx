'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Users,
  Sparkles,
  Heart,
  Clock,
  ArrowRight,
  ArrowUpRight,
  QrCode,
  Settings,
  BarChart3,
  RefreshCw,
  Rocket,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TAG_LABELS } from '@/lib/types/taxonomy'
import { StatCard } from '@/components/charts/StatCard'
import { AreaChartPremium } from '@/components/charts/AreaChartPremium'
import { ScrollReveal } from '@/components/ScrollReveal'

interface Metrics {
  scansToday: number
  scansWeek: number
  picksToday: number
  picksWeek: number
  pickRate: number
  topMoods: { name: string; percent: number }[]
  topPicks: { name: string; picks: number }[]
  recentActivity: { ts: string; name: string; message: string }[]
  dailyData: { date: string; value: number }[]
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DashboardPage() {
  const [venueId, setVenueId] = useState<string | null>(null)
  const [venueName, setVenueName] = useState<string>('your restaurant')
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('7')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [metrics, setMetrics] = useState<Metrics>({
    scansToday: 0,
    scansWeek: 0,
    picksToday: 0,
    picksWeek: 0,
    pickRate: 0,
    topMoods: [],
    topPicks: [],
    recentActivity: [],
    dailyData: [],
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

        // Get venue name
        const { data: venue } = await supabase
          .from('venues')
          .select('name')
          .eq('id', operator.venue_id)
          .single()

        if (venue?.name) {
          setVenueName(venue.name)
        }
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

      // Get sessions with timestamps for daily breakdown
      const { data: sessions } = await supabase
        .from('rec_sessions')
        .select('started_at, intent_chips')
        .eq('venue_id', venueId)
        .gte('started_at', periodStart.toISOString())

      // Build daily data
      const dayMap: Record<string, number> = {}
      sessions?.forEach(s => {
        const date = new Date(s.started_at)
        const dayKey = dayNames[date.getDay()]
        dayMap[dayKey] = (dayMap[dayKey] || 0) + 1
      })

      const dailyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
        date: day,
        value: dayMap[day] || 0
      }))

      // Picks today (heart button selections)
      const { count: picksToday } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId)
        .eq('name', 'item_selected')
        .gte('ts', todayStart.toISOString())

      // Picks this period
      const { count: picksWeek } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId)
        .eq('name', 'item_selected')
        .gte('ts', periodStart.toISOString())

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

      // Get top picked items (heart selections)
      const { data: pickEvents } = await supabase
        .from('events')
        .select('props')
        .eq('venue_id', venueId)
        .eq('name', 'item_selected')
        .gte('ts', periodStart.toISOString())

      const itemPicks: Record<string, number> = {}
      pickEvents?.forEach(event => {
        const props = event.props as Record<string, unknown> | null
        const itemName = props?.item_name as string | undefined
        if (itemName) {
          itemPicks[itemName] = (itemPicks[itemName] || 0) + 1
        }
      })

      // Get top picks by name
      const topPicks = Object.entries(itemPicks)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, picks]) => ({ name, picks }))

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
        } else if (event.name === 'item_selected') {
          message = `Liked: ${props?.item_name || 'Item'}`
        }
        return { ts: event.ts, name: event.name, message }
      })

      // Format mood labels
      const formatTag = (tag: string) => {
        return TAG_LABELS[tag as keyof typeof TAG_LABELS] ||
          tag.replace('mood_', '').replace('_', ' ')
      }

      // Calculate pick rate (picks / scans)
      const pickRate = scansWeek && scansWeek > 0 ? ((picksWeek || 0) / scansWeek * 100) : 0

      setMetrics({
        scansToday: scansToday || 0,
        scansWeek: scansWeek || 0,
        picksToday: picksToday || 0,
        picksWeek: picksWeek || 0,
        pickRate: Math.round(pickRate * 10) / 10,
        topMoods: Object.entries(moodCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag, count]) => ({
            name: formatTag(tag),
            percent: totalMoods > 0 ? Math.round((count / totalMoods) * 100) : 0
          })),
        topPicks,
        recentActivity,
        dailyData,
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

  // Get time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Sparkline data from daily values
  const sparklineData = metrics.dailyData.map(d => d.value)

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl font-serif text-mesa-charcoal">
              {getGreeting()}
            </h1>
            <p className="text-mesa-charcoal/50 mt-1">
              Here&apos;s what&apos;s happening at {venueName} today
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh data"
              className="p-2.5 glass rounded-xl text-mesa-charcoal/70 hover:text-mesa-charcoal transition disabled:opacity-50"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              className="px-4 py-2.5 glass rounded-xl text-sm text-mesa-charcoal border-0 focus:outline-none cursor-pointer"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </motion.div>
        </div>

        {/* Getting Started Banner - show when less than 5 scans */}
        {metrics.scansWeek < 5 && metrics.scansWeek >= 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 mb-8 border-l-4 border-mesa-burgundy"
          >
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-mesa-burgundy/10 flex items-center justify-center flex-shrink-0">
                <Rocket className="w-6 h-6 text-mesa-burgundy" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-mesa-charcoal mb-2">
                  {metrics.scansWeek === 0 ? 'Get your first scans!' : `You have ${metrics.scansWeek} scan${metrics.scansWeek !== 1 ? 's' : ''} this week!`}
                </h3>
                <p className="text-mesa-charcoal/60 text-sm mb-4">
                  {metrics.scansWeek === 0
                    ? "Your analytics dashboard will come alive once guests start using Mesa. Here's how to get started:"
                    : "You're off to a great start! Keep sharing your QR code to gather more guest insights."
                  }
                </p>
                <ol className="text-sm text-mesa-charcoal/70 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-mesa-burgundy text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                    Download your QR code from Settings
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-mesa-burgundy text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                    Print and place it on tables or menus
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-mesa-burgundy text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                    Watch the data flow in!
                  </li>
                </ol>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-1 mt-4 text-sm text-mesa-burgundy font-medium hover:underline"
                >
                  Go to Settings
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'View QR Code', icon: QrCode, href: '/dashboard/settings', color: '#722F37' },
            { label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics', color: '#C4654A' },
            { label: 'Edit Menu', icon: Settings, href: '/dashboard/menu', color: '#8B6F47' },
            { label: 'Guest Flow', icon: Sparkles, href: `/v/${venueId || 'demo'}`, color: '#22c55e' },
          ].map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={action.href}
                className="glass rounded-2xl p-4 flex items-center gap-3 hover-lift group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <action.icon className="w-5 h-5" style={{ color: action.color }} />
                </div>
                <span className="text-sm font-medium text-mesa-charcoal group-hover:text-mesa-burgundy transition">
                  {action.label}
                </span>
                <ArrowRight className="w-4 h-4 text-mesa-charcoal/30 ml-auto group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Today's Guests"
            value={metrics.scansToday}
            change={metrics.scansWeek > 0 ? Math.round((metrics.scansToday / (metrics.scansWeek / 7)) * 100 - 100) : 0}
            changeLabel="vs avg"
            icon={Users}
            sparklineData={sparklineData.length > 0 ? sparklineData : [0, 0, 0, 0, 0, 0, 0]}
            delay={0}
          />
          <StatCard
            title={`Scans (${dateRange}d)`}
            value={metrics.scansWeek}
            change={15}
            icon={Sparkles}
            sparklineData={sparklineData.length > 0 ? sparklineData : [0, 0, 0, 0, 0, 0, 0]}
            color="#C4654A"
            delay={0.1}
          />
          <StatCard
            title="Pick Rate"
            value={metrics.pickRate}
            suffix="%"
            change={2}
            icon={Heart}
            sparklineData={[88, 90, 89, 91, 92, 91, metrics.pickRate]}
            color="#22c55e"
            delay={0.2}
          />
          <StatCard
            title="Picks Today"
            value={metrics.picksToday}
            change={metrics.picksWeek > 0 ? Math.round((metrics.picksToday / (metrics.picksWeek / 7)) * 100 - 100) : 0}
            changeLabel="vs avg"
            icon={Clock}
            sparklineData={sparklineData.map(v => Math.floor(v * 0.8))}
            color="#8B6F47"
            delay={0.3}
          />
        </div>

        {/* Main Content Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Weekly Overview Chart */}
          <ScrollReveal className="lg:col-span-2">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-mesa-charcoal">Weekly Overview</h3>
                  <p className="text-sm text-mesa-charcoal/50">Guest recommendations by day</p>
                </div>
                <Link
                  href="/dashboard/analytics"
                  className="text-sm text-mesa-burgundy font-medium flex items-center gap-1 hover:underline"
                >
                  View details
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              {metrics.dailyData.some(d => d.value > 0) ? (
                <AreaChartPremium
                  data={metrics.dailyData}
                  height={260}
                  showGrid
                />
              ) : (
                <div className="h-[260px] flex items-center justify-center text-mesa-charcoal/40">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Chart data will appear after your first scans</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Live Activity Feed */}
          <ScrollReveal delay={0.1}>
            <div className="glass rounded-2xl p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-mesa-charcoal">Live Activity</h3>
                <span className="flex items-center gap-1.5 text-xs text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-mesa-charcoal/5 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : metrics.recentActivity.length > 0 ? (
                <div className="space-y-4 max-h-[300px] overflow-auto">
                  {metrics.recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3 pb-4 border-b border-mesa-charcoal/5 last:border-0 last:pb-0"
                    >
                      <div className="w-2 h-2 rounded-full bg-mesa-burgundy mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-mesa-charcoal truncate">
                          {activity.message}
                        </p>
                      </div>
                      <span className="text-xs text-mesa-charcoal/30 flex-shrink-0">
                        {timeAgo(activity.ts)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <div className="w-12 h-12 rounded-xl bg-mesa-charcoal/5 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-mesa-charcoal/30" />
                  </div>
                  <p className="font-medium text-mesa-charcoal text-sm mb-1">Waiting for activity</p>
                  <p className="text-xs text-mesa-charcoal/50">
                    Guest sessions will appear here in real-time
                  </p>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom Row - Moods & Picks */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Top Moods */}
          <ScrollReveal>
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-mesa-charcoal mb-6">Top Cravings</h3>
              {metrics.topMoods.length > 0 ? (
                <div className="space-y-4">
                  {metrics.topMoods.map((mood, i) => (
                    <motion.div
                      key={mood.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-mesa-charcoal capitalize">{mood.name}</span>
                        <span className="text-mesa-charcoal/50">{mood.percent}%</span>
                      </div>
                      <div className="h-2 bg-mesa-charcoal/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${mood.percent}%` }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                          className="h-full bg-gradient-to-r from-mesa-burgundy to-mesa-terracotta rounded-full"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[150px] text-center">
                  <div className="w-10 h-10 rounded-xl bg-mesa-charcoal/5 flex items-center justify-center mb-2">
                    <BarChart3 className="w-5 h-5 text-mesa-charcoal/30" />
                  </div>
                  <p className="font-medium text-mesa-charcoal text-sm mb-1">No mood data yet</p>
                  <p className="text-xs text-mesa-charcoal/50">
                    Data will appear once guests answer preference questions
                  </p>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Guest Picks */}
          <ScrollReveal delay={0.1}>
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-mesa-charcoal mb-6">Guest Picks</h3>
              {metrics.topPicks.length > 0 ? (
                <div className="space-y-4">
                  {metrics.topPicks.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex justify-between items-center p-3 rounded-xl hover:bg-mesa-charcoal/5 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-mesa-burgundy" fill="#722F37" />
                        <span className="text-mesa-charcoal font-medium">{item.name}</span>
                      </div>
                      <span className="text-mesa-burgundy font-semibold">{item.picks}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[150px] text-center">
                  <div className="w-10 h-10 rounded-xl bg-mesa-burgundy/10 flex items-center justify-center mb-2">
                    <Heart className="w-5 h-5 text-mesa-burgundy" />
                  </div>
                  <p className="font-medium text-mesa-charcoal text-sm mb-1">No picks yet</p>
                  <p className="text-xs text-mesa-charcoal/50">
                    When guests tap the heart, you&apos;ll see their favorites here
                  </p>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
