'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const weeklyData = [
  { day: 'Mon', guests: 45, recommendations: 135 },
  { day: 'Tue', guests: 52, recommendations: 156 },
  { day: 'Wed', guests: 38, recommendations: 114 },
  { day: 'Thu', guests: 65, recommendations: 195 },
  { day: 'Fri', guests: 89, recommendations: 267 },
  { day: 'Sat', guests: 127, recommendations: 381 },
  { day: 'Sun', guests: 98, recommendations: 294 },
]

const recentActivity = [
  { time: '2m', action: 'Recommendation served', detail: 'Table 5 • Truffle Risotto' },
  { time: '5m', action: 'Session completed', detail: 'Guest liked 3 items' },
  { time: '12m', action: 'Recommendation served', detail: 'Table 8 • Sea Bass, Tiramisu' },
  { time: '18m', action: 'Session completed', detail: 'Vegan preferences noted' },
  { time: '25m', action: 'Recommendation served', detail: 'Table 3 • Chef\'s Special' },
]

export default function DashboardPage() {
  const [venue, setVenue] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week')

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
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
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const stats = [
    {
      label: 'Guests',
      value: 514,
      change: 12,
      period: 'vs last week',
      icon: Users
    },
    {
      label: 'Recommendations',
      value: '1,542',
      change: 18,
      period: 'vs last week',
      icon: Sparkles
    },
    {
      label: 'Satisfaction',
      value: '94%',
      change: 3,
      period: 'vs last week',
      icon: TrendingUp
    },
    {
      label: 'Avg. Time',
      value: '2.3m',
      change: -8,
      period: 'faster',
      icon: Clock
    },
  ]

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
          {stats.map((stat) => (
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
              </div>
              <p className="text-xs text-neutral-400 mt-1">{stat.period}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-neutral-900">Guest Activity</h2>
                <p className="text-xs text-neutral-500">Daily recommendations served</p>
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
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorGuests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#171717" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#171717" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    dx={-8}
                    width={30}
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
                    dataKey="guests"
                    stroke="#171717"
                    strokeWidth={2}
                    fill="url(#colorGuests)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white border border-neutral-200 rounded-lg">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-900">Live Activity</h2>
              <span className="flex items-center gap-1.5 text-xs text-green-600">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            </div>
            <div className="divide-y divide-neutral-100">
              {recentActivity.map((item, i) => (
                <div key={i} className="px-4 py-3 hover:bg-neutral-50 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-neutral-900">{item.action}</p>
                      <p className="text-xs text-neutral-500">{item.detail}</p>
                    </div>
                    <span className="text-xs text-neutral-400 tabular-nums">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-neutral-100">
              <Link
                href="/dashboard/analytics"
                className="text-xs font-medium text-neutral-600 hover:text-neutral-900"
              >
                View all activity →
              </Link>
            </div>
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

        {/* Alerts/Insights */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Menu Insight</p>
            <p className="text-sm text-amber-700 mt-0.5">
              23 guests requested vegan options this week, but only 2 menu items match.
              Consider adding more vegan dishes.
            </p>
            <Link href="/dashboard/analytics" className="text-xs font-medium text-amber-900 hover:underline mt-2 inline-block">
              View Unmet Demand →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
