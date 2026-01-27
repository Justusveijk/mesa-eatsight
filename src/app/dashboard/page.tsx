'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Scan, MousePointerClick, Percent, Wine } from 'lucide-react'
import { GlassPanel } from '@/components/shared/GlassPanel'

// Mock data
const mockStats = {
  scansToday: 47,
  scansTrend: 12,
  recsShown: 142,
  recsTrend: 8,
  ctr: 34,
  ctrTrend: 5,
  upsellRate: 18,
  upsellTrend: -2,
}

const mockMoodData = [
  { label: 'Comfort', value: 34, color: 'bg-signal' },
  { label: 'Light', value: 28, color: 'bg-signal/80' },
  { label: 'Warm', value: 22, color: 'bg-signal/60' },
  { label: 'Protein', value: 10, color: 'bg-signal/40' },
  { label: 'Treat', value: 6, color: 'bg-signal/20' },
]

const mockTopItems = [
  { name: 'Classic Cheeseburger', clicks: 28 },
  { name: 'Spicy Miso Ramen', clicks: 24 },
  { name: 'Truffle Mac & Cheese', clicks: 19 },
  { name: 'Grilled Salmon Salad', clicks: 15 },
  { name: 'Chocolate Lava Cake', clicks: 12 },
]

const mockActivity = [
  { type: 'scan', message: 'Table 5 scanned', time: '2s ago' },
  { type: 'click', message: 'Clicked: Spicy Chicken Wings', time: '15s ago' },
  { type: 'scan', message: 'Table 12 scanned', time: '30s ago' },
  { type: 'click', message: 'Clicked: Classic Cheeseburger', time: '45s ago' },
  { type: 'scan', message: 'New session started', time: '1m ago' },
  { type: 'click', message: 'Clicked: Truffle Mac & Cheese', time: '1m ago' },
  { type: 'scan', message: 'Table 3 scanned', time: '2m ago' },
  { type: 'click', message: 'Clicked: Chocolate Lava Cake', time: '2m ago' },
]

interface StatCardProps {
  title: string
  value: string | number
  trend?: number
  icon: React.ElementType
}

function StatCard({ title, value, trend, icon: Icon }: StatCardProps) {
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
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </GlassPanel>
  )
}

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('7d')
  const [activity, setActivity] = useState(mockActivity)

  // Simulate live activity updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivities = [
        { type: 'scan', message: `Table ${Math.floor(Math.random() * 20) + 1} scanned`, time: 'Just now' },
        { type: 'click', message: `Clicked: ${mockTopItems[Math.floor(Math.random() * mockTopItems.length)].name}`, time: 'Just now' },
      ]
      const newActivity = newActivities[Math.floor(Math.random() * newActivities.length)]
      setActivity((prev) => [newActivity, ...prev.slice(0, 9)])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-muted">Overview of your menu performance</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
          className="px-4 py-2 rounded-lg bg-ocean-700 border border-line text-text-primary text-sm focus:outline-none focus:border-signal"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Scans today"
              value={mockStats.scansToday}
              trend={mockStats.scansTrend}
              icon={Scan}
            />
            <StatCard
              title="Recs shown"
              value={mockStats.recsShown}
              trend={mockStats.recsTrend}
              icon={MousePointerClick}
            />
            <StatCard
              title="Click-through"
              value={`${mockStats.ctr}%`}
              trend={mockStats.ctrTrend}
              icon={Percent}
            />
            <StatCard
              title="Upsell rate"
              value={`${mockStats.upsellRate}%`}
              trend={mockStats.upsellTrend}
              icon={Wine}
            />
          </div>

          {/* Top Cravings */}
          <GlassPanel className="p-6">
            <h3 className="font-semibold text-text-primary mb-4">Top cravings</h3>
            <div className="space-y-3">
              {mockMoodData.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">{item.label}</span>
                    <span className="text-text-primary">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-ocean-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${item.color} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* Top Clicked Items */}
          <GlassPanel className="p-6">
            <h3 className="font-semibold text-text-primary mb-4">Most clicked items</h3>
            <div className="space-y-3">
              {mockTopItems.map((item, index) => (
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
            <div className="space-y-3 max-h-[600px] overflow-auto dark-scrollbar">
              {activity.map((event, index) => (
                <motion.div
                  key={`${event.message}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 py-2 border-b border-line/50 last:border-0"
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      event.type === 'click' ? 'bg-signal' : 'bg-ocean-600'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{event.message}</p>
                    <p className="text-xs text-text-muted">{event.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
