'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  BarChart3,
  Zap,
  AlertCircle,
  Heart,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type Period = 'today' | 'week' | 'month'

interface DashStats {
  sessions: number
  recommendations: number
  likeRate: number
  avgDurationSec: number
  prevSessions: number
  prevRecommendations: number
  prevLikeRate: number
  prevAvgDurationSec: number
}

interface ChartPoint {
  label: string
  sessions: number
  recs: number
}

interface ActivityItem {
  time: string
  action: string
  detail: string
}

function getDateRange(period: Period): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date()
  const end = now

  if (period === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const prevEnd = new Date(start.getTime() - 1)
    const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), prevEnd.getDate())
    return { start, end, prevStart, prevEnd }
  }

  if (period === 'week') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const prevEnd = new Date(start.getTime() - 1)
    const prevStart = new Date(prevEnd.getTime() - 7 * 24 * 60 * 60 * 1000)
    return { start, end, prevStart, prevEnd }
  }

  // month
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const prevEnd = new Date(start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - 30 * 24 * 60 * 60 * 1000)
  return { start, end, prevStart, prevEnd }
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  return `${(seconds / 60).toFixed(1)}m`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export default function DashboardPage() {
  const [venue, setVenue] = useState<any>(null)
  const [venueId, setVenueId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('week')
  const [stats, setStats] = useState<DashStats | null>(null)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [unmetDemandCount, setUnmetDemandCount] = useState(0)
  const [topUnmetTag, setTopUnmetTag] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch venue
  useEffect(() => {
    async function fetchVenue() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: operator } = await supabase
        .from('operator_users')
        .select('venue_id')
        .eq('auth_user_id', user.id)
        .single()

      if (operator?.venue_id) {
        const { data } = await supabase
          .from('venues')
          .select('*')
          .eq('id', operator.venue_id)
          .single()
        setVenue(data)
        setVenueId(operator.venue_id)
      }
      setLoading(false)
    }
    fetchVenue()
  }, [])

  // Fetch stats when venueId or period changes
  const fetchStats = useCallback(async () => {
    if (!venueId) return

    const { start, end, prevStart, prevEnd } = getDateRange(period)
    const startStr = start.toISOString()
    const endStr = end.toISOString()
    const prevStartStr = prevStart.toISOString()
    const prevEndStr = prevEnd.toISOString()

    // Current period sessions
    const { data: sessions } = await supabase
      .from('rec_sessions')
      .select('id, started_at')
      .eq('venue_id', venueId)
      .gte('started_at', startStr)
      .lte('started_at', endStr)

    // Previous period sessions
    const { data: prevSessions } = await supabase
      .from('rec_sessions')
      .select('id')
      .eq('venue_id', venueId)
      .gte('started_at', prevStartStr)
      .lte('started_at', prevEndStr)

    // Current period recommendation results
    const sessionIds = (sessions || []).map(s => s.id)
    let recCount = 0
    let prevRecCount = 0

    if (sessionIds.length > 0) {
      const { count } = await supabase
        .from('rec_results')
        .select('id', { count: 'exact', head: true })
        .in('session_id', sessionIds)
      recCount = count || 0
    }

    const prevSessionIds = (prevSessions || []).map(s => s.id)
    if (prevSessionIds.length > 0) {
      const { count } = await supabase
        .from('rec_results')
        .select('id', { count: 'exact', head: true })
        .in('session_id', prevSessionIds)
      prevRecCount = count || 0
    }

    // Like events (item_selected)
    const { count: likeCount } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('name', 'item_selected')
      .gte('ts', startStr)
      .lte('ts', endStr)

    const { count: prevLikeCount } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('name', 'item_selected')
      .gte('ts', prevStartStr)
      .lte('ts', prevEndStr)

    // Flow completed events for avg duration
    const { data: completedEvents } = await supabase
      .from('events')
      .select('ts, props')
      .eq('venue_id', venueId)
      .eq('name', 'flow_completed')
      .gte('ts', startStr)
      .lte('ts', endStr)

    // Calculate average duration from session started_at to flow_completed ts
    let avgDur = 0
    if (completedEvents && completedEvents.length > 0 && sessions) {
      const sessionStartMap = new Map(sessions.map(s => [s.id, new Date(s.started_at).getTime()]))
      // Approximate: take avg of event timestamps - earliest session start
      const durations: number[] = []
      completedEvents.forEach(e => {
        const ts = new Date(e.ts).getTime()
        // Find closest session that started before this event
        let closestStart = 0
        sessionStartMap.forEach(startTime => {
          if (startTime <= ts && startTime > closestStart) closestStart = startTime
        })
        if (closestStart > 0) durations.push((ts - closestStart) / 1000)
      })
      if (durations.length > 0) {
        avgDur = durations.reduce((a, b) => a + b, 0) / durations.length
      }
    }

    const currentSessions = sessions?.length || 0
    const currentLikeRate = currentSessions > 0 ? Math.round(((likeCount || 0) / currentSessions) * 100) : 0
    const previousSessions = prevSessions?.length || 0
    const previousLikeRate = previousSessions > 0 ? Math.round(((prevLikeCount || 0) / previousSessions) * 100) : 0

    setStats({
      sessions: currentSessions,
      recommendations: recCount,
      likeRate: currentLikeRate,
      avgDurationSec: avgDur,
      prevSessions: previousSessions,
      prevRecommendations: prevRecCount,
      prevLikeRate: previousLikeRate,
      prevAvgDurationSec: 0,
    })

    // Chart data - group sessions by day
    const dayMap = new Map<string, { sessions: number; recs: number }>()
    const days = period === 'today' ? 1 : period === 'week' ? 7 : 30

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(end.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      const label = period === 'today'
        ? 'Today'
        : d.toLocaleDateString('en-US', { weekday: 'short' })
      dayMap.set(key, { sessions: 0, recs: 0 })
    }

    sessions?.forEach(s => {
      const key = s.started_at.split('T')[0]
      const entry = dayMap.get(key)
      if (entry) entry.sessions++
    })

    const points: ChartPoint[] = []
    dayMap.forEach((val, key) => {
      const d = new Date(key)
      points.push({
        label: period === 'today'
          ? 'Today'
          : period === 'month'
            ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : d.toLocaleDateString('en-US', { weekday: 'short' }),
        sessions: val.sessions,
        recs: val.recs,
      })
    })
    setChartData(points)

    // Recent activity from events
    const { data: recentEvents } = await supabase
      .from('events')
      .select('name, ts, props')
      .eq('venue_id', venueId)
      .order('ts', { ascending: false })
      .limit(5)

    const activityItems: ActivityItem[] = (recentEvents || []).map(e => {
      const eventLabels: Record<string, string> = {
        scan: 'QR code scanned',
        flow_started: 'Flow started',
        flow_completed: 'Session completed',
        recommendations_shown: 'Recommendations served',
        item_selected: 'Item liked',
        unmet_demand: 'Unmet demand logged',
      }
      const props = (e.props || {}) as Record<string, any>
      const detail = props.item_name
        || (props.item_names ? (props.item_names as string[]).slice(0, 2).join(', ') : '')
        || (props.table_ref ? `Table ${props.table_ref}` : '')
        || ''

      return {
        time: timeAgo(e.ts),
        action: eventLabels[e.name] || e.name,
        detail,
      }
    })
    setActivity(activityItems)

    // Unmet demand
    const { data: unmetEvents, count: unmetCount } = await supabase
      .from('events')
      .select('props', { count: 'exact' })
      .eq('venue_id', venueId)
      .eq('name', 'unmet_demand')
      .gte('ts', startStr)
      .lte('ts', endStr)

    setUnmetDemandCount(unmetCount || 0)

    // Find most common unmet tag
    if (unmetEvents && unmetEvents.length > 0) {
      const tagCounts = new Map<string, number>()
      unmetEvents.forEach(e => {
        const props = (e.props || {}) as Record<string, any>
        const dietary = props.requested_dietary as string[] | undefined
        dietary?.forEach(t => tagCounts.set(t, (tagCounts.get(t) || 0) + 1))
        if (props.requested_mood) {
          tagCounts.set(props.requested_mood, (tagCounts.get(props.requested_mood) || 0) + 1)
        }
      })
      let topTag = ''
      let topCount = 0
      tagCounts.forEach((count, tag) => {
        if (count > topCount) { topTag = tag; topCount = count }
      })
      setTopUnmetTag(topTag || null)
    }
  }, [venueId, period, supabase])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const statCards = stats ? [
    {
      label: 'Sessions',
      value: stats.sessions.toLocaleString(),
      change: pctChange(stats.sessions, stats.prevSessions),
      period: period === 'today' ? 'vs yesterday' : `vs prev ${period}`,
      icon: Users,
    },
    {
      label: 'Recs Served',
      value: stats.recommendations.toLocaleString(),
      change: pctChange(stats.recommendations, stats.prevRecommendations),
      period: period === 'today' ? 'vs yesterday' : `vs prev ${period}`,
      icon: Sparkles,
    },
    {
      label: 'Like Rate',
      value: `${stats.likeRate}%`,
      change: stats.likeRate - stats.prevLikeRate,
      period: period === 'today' ? 'vs yesterday' : `vs prev ${period}`,
      icon: Heart,
    },
    {
      label: 'Avg. Duration',
      value: stats.avgDurationSec > 0 ? formatDuration(stats.avgDurationSec) : '--',
      change: 0,
      period: 'per session',
      icon: Clock,
    },
  ] : []

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">Dashboard</h1>
              <p className="text-sm text-neutral-500">{venue?.name || 'Loading...'}</p>
            </div>

            {/* Period Toggle */}
            <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-md">
              {(['today', 'week', 'month'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded capitalize transition ${
                    period === p
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {p === 'today' ? 'Today' : p === 'week' ? '7 days' : '30 days'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading || !stats ? (
            // Skeleton
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-lg p-4">
                <div className="h-3 bg-neutral-100 rounded w-16 mb-3 animate-pulse" />
                <div className="h-7 bg-neutral-100 rounded w-20 animate-pulse" />
              </div>
            ))
          ) : (
            statCards.map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <stat.icon className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-neutral-900 tabular-nums">
                    {stat.value}
                  </span>
                  {stat.change !== 0 && (
                    <span className={`flex items-center gap-0.5 text-xs font-medium ${
                      stat.change > 0 ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {stat.change > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(stat.change)}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-1">{stat.period}</p>
              </div>
            ))
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-neutral-900">Guest Activity</h2>
                <p className="text-xs text-neutral-500">Sessions per day</p>
              </div>
              <Link
                href="/dashboard/analytics"
                className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900"
              >
                View details
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#171717" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#171717" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#737373' }}
                      dy={8}
                      interval={period === 'month' ? 4 : 0}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#737373' }}
                      dx={-8}
                      width={30}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e5e5',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      stroke="#171717"
                      strokeWidth={2}
                      fill="url(#colorSessions)"
                      name="Sessions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-60 flex items-center justify-center text-neutral-400 text-sm">
                  No data yet for this period
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white border border-neutral-200 rounded-lg">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-900">Recent Activity</h2>
              {activity.length > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-green-600">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <div className="divide-y divide-neutral-100">
              {activity.length === 0 ? (
                <div className="px-4 py-8 text-center text-neutral-400 text-sm">
                  No activity yet. Share your QR code to start collecting data.
                </div>
              ) : (
                activity.map((item, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-neutral-50 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-neutral-900">{item.action}</p>
                        {item.detail && (
                          <p className="text-xs text-neutral-500">{item.detail}</p>
                        )}
                      </div>
                      <span className="text-xs text-neutral-400 tabular-nums whitespace-nowrap">{item.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            {activity.length > 0 && (
              <div className="px-4 py-3 border-t border-neutral-100">
                <Link
                  href="/dashboard/analytics"
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  View all activity →
                </Link>
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

        {/* Unmet Demand Alert */}
        {unmetDemandCount > 0 && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Unmet Demand</p>
              <p className="text-sm text-amber-700 mt-0.5">
                {unmetDemandCount} guest{unmetDemandCount !== 1 ? 's' : ''} couldn&apos;t find a match for their preferences this {period === 'today' ? 'day' : period}.
                {topUnmetTag && (
                  <> Most requested: <span className="font-medium">{topUnmetTag.replace(/_/g, ' ')}</span>.</>
                )}
              </p>
              <Link href="/dashboard/analytics" className="text-xs font-medium text-amber-900 hover:underline mt-2 inline-block">
                View Details →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
