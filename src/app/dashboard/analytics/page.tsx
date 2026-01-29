'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Clock, AlertTriangle, BarChart3 } from 'lucide-react'

interface Analytics {
  scansByHour: { hour: number; count: number }[]
  conversionFunnel: {
    scans: number
    completedFlow: number
    clickedItem: number
  }
  unmetDemand: { tag: string; count: number }[]
  peakHours: { hour: string; scans: number }[]
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const }
  }
}

export default function AnalyticsPage() {
  const [venueId, setVenueId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('7')
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<Analytics>({
    scansByHour: [],
    conversionFunnel: {
      scans: 0,
      completedFlow: 0,
      clickedItem: 0
    },
    unmetDemand: [],
    peakHours: []
  })

  const supabase = createClient()

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

  const fetchAnalytics = useCallback(async () => {
    if (!venueId) return

    setLoading(true)
    const days = parseInt(dateRange)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Scans (sessions)
    const { data: sessions } = await supabase
      .from('rec_sessions')
      .select('started_at')
      .eq('venue_id', venueId)
      .gte('started_at', startDate.toISOString())

    // Scans by hour
    const hourMap: Record<number, number> = {}
    sessions?.forEach(s => {
      const hour = new Date(s.started_at).getHours()
      hourMap[hour] = (hourMap[hour] || 0) + 1
    })

    // Get events for funnel
    const { data: events } = await supabase
      .from('events')
      .select('name')
      .eq('venue_id', venueId)
      .gte('ts', startDate.toISOString())

    const completedFlow = events?.filter(e => e.name === 'recommendations_shown' || e.name === 'recs_shown').length || 0
    const clickedItem = events?.filter(e => e.name === 'rec_clicked').length || 0

    // Unmet demand
    const { data: unmetEvents } = await supabase
      .from('events')
      .select('props')
      .eq('venue_id', venueId)
      .eq('name', 'unmet_demand')
      .gte('ts', startDate.toISOString())

    const unmetTags: Record<string, number> = {}
    unmetEvents?.forEach(e => {
      const props = e.props as { requested_mood?: string; requested_dietary?: string[] } | null
      const tags = [
        props?.requested_mood,
        ...(props?.requested_dietary || [])
      ].filter(Boolean) as string[]
      tags.forEach((tag: string) => {
        unmetTags[tag] = (unmetTags[tag] || 0) + 1
      })
    })

    // Peak hours - top 3
    const peakHours = Object.entries(hourMap)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3)
      .map(([hour, scans]) => ({
        hour: `${hour.padStart(2, '0')}:00 - ${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`,
        scans: scans as number
      }))

    setAnalytics({
      scansByHour: Object.entries(hourMap)
        .map(([hour, count]) => ({
          hour: parseInt(hour),
          count: count as number
        }))
        .sort((a, b) => a.hour - b.hour),
      conversionFunnel: {
        scans: sessions?.length || 0,
        completedFlow,
        clickedItem
      },
      unmetDemand: Object.entries(unmetTags)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count: count as number })),
      peakHours
    })

    setLoading(false)
  }, [venueId, dateRange, supabase])

  useEffect(() => {
    if (venueId) fetchAnalytics()
  }, [venueId, fetchAnalytics])

  const formatTagLabel = (tag: string) => {
    return tag
      .replace('mood_', '')
      .replace('diet_', '')
      .replace('_', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-[#1a1a1a] mb-1">Analytics</h1>
          <p className="text-[#1a1a1a]/50">Deep dive into guest behavior and preferences</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 rounded-lg bg-[#1a1a1a] text-white border-0 text-sm"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#722F37]"></div>
        </div>
      ) : (
        <>
          {/* Conversion Funnel */}
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#722F37]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#722F37]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1a1a1a]">Conversion Funnel</h2>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="text-4xl font-bold text-[#1a1a1a]">{analytics.conversionFunnel.scans}</div>
                <div className="text-sm text-[#1a1a1a]/50 mt-1">Scans</div>
              </div>
              <div className="text-2xl text-[#1a1a1a]/30">→</div>
              <div className="text-center flex-1">
                <div className="text-4xl font-bold text-[#1a1a1a]">{analytics.conversionFunnel.completedFlow}</div>
                <div className="text-sm text-[#1a1a1a]/50 mt-1">Completed Flow</div>
                <div className="text-xs text-[#722F37] font-medium mt-1">
                  {analytics.conversionFunnel.scans > 0
                    ? Math.round(analytics.conversionFunnel.completedFlow / analytics.conversionFunnel.scans * 100)
                    : 0}%
                </div>
              </div>
              <div className="text-2xl text-[#1a1a1a]/30">→</div>
              <div className="text-center flex-1">
                <div className="text-4xl font-bold text-[#1a1a1a]">{analytics.conversionFunnel.clickedItem}</div>
                <div className="text-sm text-[#1a1a1a]/50 mt-1">Clicked Item</div>
                <div className="text-xs text-[#722F37] font-medium mt-1">
                  {analytics.conversionFunnel.completedFlow > 0
                    ? Math.round(analytics.conversionFunnel.clickedItem / analytics.conversionFunnel.completedFlow * 100)
                    : 0}%
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Peak Hours */}
            <motion.div
              variants={fadeIn}
              initial="initial"
              animate="animate"
              className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#722F37]/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#722F37]" />
                </div>
                <h2 className="text-lg font-semibold text-[#1a1a1a]">Peak Hours</h2>
              </div>
              {analytics.peakHours.length > 0 ? (
                <div className="space-y-3">
                  {analytics.peakHours.map((peak, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-[#FDFBF7]">
                      <span className="text-[#1a1a1a]">{peak.hour}</span>
                      <span className="text-[#722F37] font-medium">{peak.scans} scans</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#1a1a1a]/40">No data yet</p>
              )}
            </motion.div>

            {/* Unmet Demand */}
            <motion.div
              variants={fadeIn}
              initial="initial"
              animate="animate"
              className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#1a1a1a]">Unmet Demand</h2>
                  <p className="text-xs text-[#1a1a1a]/40">What guests wanted but couldn&apos;t find</p>
                </div>
              </div>
              {analytics.unmetDemand.length > 0 ? (
                <div className="space-y-3">
                  {analytics.unmetDemand.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-amber-50">
                      <span className="text-amber-800 capitalize">{formatTagLabel(item.tag)}</span>
                      <span className="text-amber-600 font-medium">{item.count} requests</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-[#1a1a1a]/40">All guest preferences were matched!</p>
                  <p className="text-2xl mt-2">🎉</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Scans by Hour Chart */}
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="bg-white rounded-2xl p-6 border border-[#1a1a1a]/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#722F37]/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-[#722F37]" />
              </div>
              <h2 className="text-lg font-semibold text-[#1a1a1a]">Scans by Hour</h2>
            </div>
            <div className="flex items-end h-48 gap-1">
              {Array.from({ length: 24 }, (_, hour) => {
                const data = analytics.scansByHour.find(h => h.hour === hour)
                const count = data?.count || 0
                const maxCount = Math.max(...analytics.scansByHour.map(h => h.count), 1)
                const height = (count / maxCount) * 100

                return (
                  <div key={hour} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full">
                      {count > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a1a1a] text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                          {count}
                        </div>
                      )}
                      <div
                        className="w-full bg-[#722F37]/80 rounded-t transition-all hover:bg-[#722F37]"
                        style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                      />
                    </div>
                    {hour % 4 === 0 && (
                      <span className="text-xs text-[#1a1a1a]/40 mt-2">{hour}h</span>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
