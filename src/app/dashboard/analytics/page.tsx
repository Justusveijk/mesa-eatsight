'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  Download,
  ChevronDown,
  ArrowUpRight,
  AlertCircle,
  Utensils,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts'

// Sample data
const trafficData = [
  { date: 'Mon', guests: 45, recommendations: 135 },
  { date: 'Tue', guests: 52, recommendations: 156 },
  { date: 'Wed', guests: 38, recommendations: 114 },
  { date: 'Thu', guests: 65, recommendations: 195 },
  { date: 'Fri', guests: 89, recommendations: 267 },
  { date: 'Sat', guests: 127, recommendations: 381 },
  { date: 'Sun', guests: 98, recommendations: 294 },
]

const moodData = [
  { name: 'Comfort Food', value: 234 },
  { name: 'Light & Healthy', value: 187 },
  { name: 'Adventurous', value: 156 },
  { name: 'Quick Bite', value: 98 },
  { name: 'Sharing', value: 76 },
]

const topDishes = [
  { name: 'Truffle Risotto', count: 89, percentage: 100 },
  { name: 'Grilled Sea Bass', count: 76, percentage: 85 },
  { name: 'Beef Tenderloin', count: 64, percentage: 72 },
  { name: 'Garden Salad', count: 52, percentage: 58 },
  { name: 'Tiramisu', count: 48, percentage: 54 },
]

const dietaryData = [
  { name: 'No Restrictions', value: 45, color: '#171717' },
  { name: 'Vegetarian', value: 28, color: '#22c55e' },
  { name: 'Vegan', value: 15, color: '#10b981' },
  { name: 'Gluten-free', value: 8, color: '#f59e0b' },
  { name: 'Other', value: 4, color: '#d4d4d4' },
]

const heatmapData = generateHeatmapData()

function generateHeatmapData() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const data: { day: string; hour: number; value: number }[] = []

  days.forEach(day => {
    for (let hour = 10; hour <= 22; hour++) {
      const isLunch = hour >= 12 && hour <= 14
      const isDinner = hour >= 18 && hour <= 21
      const isWeekend = day === 'Sat' || day === 'Sun'

      let base = Math.random() * 10
      if (isLunch) base += 15
      if (isDinner) base += 25
      if (isWeekend) base += 10

      data.push({ day, hour, value: Math.floor(base) })
    }
  })

  return data
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')

  const stats = [
    { label: 'Total Guests', value: '514', change: 12, icon: Users },
    { label: 'Recommendations', value: '1,542', change: 18, icon: Sparkles },
    { label: 'Satisfaction Rate', value: '94%', change: 3, icon: TrendingUp },
    { label: 'Avg. Decision Time', value: '2.3m', change: -8, icon: Clock },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">Analytics</h1>
              <p className="text-sm text-neutral-500">Guest insights and menu performance</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Period Toggle */}
              <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-md">
                {(['7d', '30d', '90d'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition ${
                      period === p
                        ? 'bg-white text-neutral-900 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    {p === '7d' ? '7 days' : p === '30d' ? '30 days' : '90 days'}
                  </button>
                ))}
              </div>

              <button className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-neutral-200 rounded-lg p-4"
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
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Traffic Chart */}
          <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg">
            <div className="px-4 py-3 border-b border-neutral-100">
              <h2 className="text-sm font-medium text-neutral-900">Guest Traffic</h2>
              <p className="text-xs text-neutral-500">Daily guests and recommendations</p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#171717" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#171717" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
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
                    fill="url(#colorTraffic)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dietary Breakdown */}
          <div className="bg-white border border-neutral-200 rounded-lg">
            <div className="px-4 py-3 border-b border-neutral-100">
              <h2 className="text-sm font-medium text-neutral-900">Dietary Preferences</h2>
              <p className="text-xs text-neutral-500">Guest requirements breakdown</p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={dietaryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {dietaryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {dietaryData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-neutral-600">{item.name}</span>
                    </div>
                    <span className="font-medium text-neutral-900 tabular-nums">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Guest Moods */}
          <div className="bg-white border border-neutral-200 rounded-lg">
            <div className="px-4 py-3 border-b border-neutral-100">
              <h2 className="text-sm font-medium text-neutral-900">Guest Moods</h2>
              <p className="text-xs text-neutral-500">What guests are looking for</p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={moodData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e5e5',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {moodData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#171717' : '#d4d4d4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Dishes */}
          <div className="bg-white border border-neutral-200 rounded-lg">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-neutral-900">Top Recommended</h2>
                <p className="text-xs text-neutral-500">Most recommended dishes</p>
              </div>
              <button className="text-xs font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-neutral-100">
              {topDishes.map((dish, index) => (
                <div key={dish.name} className="px-4 py-3 flex items-center gap-4">
                  <span className="w-6 h-6 rounded bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-600">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{dish.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-900 rounded-full"
                          style={{ width: `${dish.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-500 tabular-nums">{dish.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-white border border-neutral-200 rounded-lg mb-6">
          <div className="px-4 py-3 border-b border-neutral-100">
            <h2 className="text-sm font-medium text-neutral-900">Peak Hours</h2>
            <p className="text-xs text-neutral-500">When guests are most active</p>
          </div>
          <div className="p-4 overflow-x-auto">
            <HeatmapGrid data={heatmapData} />
          </div>
        </div>

        {/* Unmet Demand */}
        <div className="bg-white border border-neutral-200 rounded-lg">
          <div className="px-4 py-3 border-b border-neutral-100">
            <h2 className="text-sm font-medium text-neutral-900">Unmet Demand</h2>
            <p className="text-xs text-neutral-500">Preferences your menu doesn&apos;t fully satisfy</p>
          </div>
          <div className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Vegan', requests: 23, matches: 2 },
                { label: 'Gluten-free', requests: 18, matches: 4 },
                { label: 'Spicy', requests: 15, matches: 3 },
              ].map((item) => (
                <div key={item.label} className="p-4 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-900">{item.label}</span>
                    <span className="text-lg font-semibold text-red-600">{item.requests - item.matches}</span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {item.requests} requests • {item.matches} items match
                  </p>
                  <div className="mt-2 h-1.5 bg-red-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${(item.matches / item.requests) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
              <Utensils className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Recommendation:</span> Consider adding more vegan options.
                  23 guests requested vegan dishes this week, but only 2 items match.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Heatmap Component
function HeatmapGrid({ data }: { data: { day: string; hour: number; value: number }[] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 13 }, (_, i) => i + 10) // 10-22
  const maxValue = Math.max(...data.map(d => d.value))

  const getValue = (day: string, hour: number) => {
    const item = data.find(d => d.day === day && d.hour === hour)
    return item?.value || 0
  }

  const getOpacity = (value: number) => {
    return 0.1 + (value / maxValue) * 0.9
  }

  return (
    <div className="min-w-[600px]">
      {/* Hours header */}
      <div className="flex ml-12 mb-2">
        {hours.filter((_, i) => i % 2 === 0).map(hour => (
          <div key={hour} className="flex-1 text-xs text-neutral-400 text-center">
            {hour}:00
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-1">
        {days.map((day) => (
          <div key={day} className="flex items-center gap-2">
            <span className="w-10 text-xs text-neutral-500 text-right">{day}</span>
            <div className="flex-1 flex gap-0.5">
              {hours.map(hour => {
                const value = getValue(day, hour)
                return (
                  <div
                    key={`${day}-${hour}`}
                    className="flex-1 h-6 rounded-sm cursor-pointer hover:ring-1 hover:ring-neutral-400"
                    style={{ backgroundColor: `rgba(23, 23, 23, ${getOpacity(value)})` }}
                    title={`${day} ${hour}:00 - ${value} guests`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <span className="text-xs text-neutral-400">Less</span>
        {[0.1, 0.3, 0.5, 0.7, 0.9].map(opacity => (
          <div
            key={opacity}
            className="w-4 h-4 rounded-sm"
            style={{ backgroundColor: `rgba(23, 23, 23, ${opacity})` }}
          />
        ))}
        <span className="text-xs text-neutral-400">More</span>
      </div>
    </div>
  )
}
