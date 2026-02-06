'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface RealtimeMetrics {
  totalScans: number
  totalClicks: number
  totalLikes: number
  clickRate: number
  unmetRequests: number
}

interface LiveEvent {
  id: string
  type: 'scan' | 'click' | 'like' | 'upsell' | 'unmet'
  message: string
  time: Date
  itemName?: string
}

interface UseRealtimeAnalyticsOptions {
  venueId: string | null
  dateRange?: '7d' | '30d' | '90d' | 'all'
}

export function useRealtimeAnalytics({ venueId, dateRange = '7d' }: UseRealtimeAnalyticsOptions) {
  const [metrics, setMetrics] = useState<RealtimeMetrics>({
    totalScans: 0,
    totalClicks: 0,
    totalLikes: 0,
    clickRate: 0,
    unmetRequests: 0,
  })

  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Calculate date range
  const getStartDate = useCallback(() => {
    const now = new Date()
    if (dateRange === 'all') return new Date(0)
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  }, [dateRange])

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!venueId) return

    const startDate = getStartDate().toISOString()

    const [
      { count: scans },
      { count: clicks },
      { count: likes },
      { count: unmet },
    ] = await Promise.all([
      supabase.from('rec_sessions').select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId).gte('started_at', startDate),
      supabase.from('events').select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId).eq('name', 'recommendation_clicked').gte('ts', startDate),
      supabase.from('events').select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId).eq('name', 'recommendation_liked').gte('ts', startDate),
      supabase.from('events').select('*', { count: 'exact', head: true })
        .eq('venue_id', venueId).eq('name', 'no_match_found').gte('ts', startDate),
    ])

    const totalScans = scans || 0
    const totalClicks = clicks || 0
    const totalLikes = likes || 0

    setMetrics({
      totalScans,
      totalClicks,
      totalLikes,
      clickRate: totalScans > 0 ? Math.round(totalClicks / totalScans * 100) : 0,
      unmetRequests: unmet || 0,
    })

    setLoading(false)
    setLastUpdate(new Date())
  }, [venueId, getStartDate, supabase])

  // Setup realtime subscriptions
  useEffect(() => {
    if (!venueId) return

    loadInitialData()

    // Sessions channel
    const sessionsChannel = supabase
      .channel(`realtime-sessions-${venueId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rec_sessions',
        filter: `venue_id=eq.${venueId}`,
      }, (payload) => {
        const session = payload.new as any

        setMetrics(prev => {
          const newScans = prev.totalScans + 1
          return {
            ...prev,
            totalScans: newScans,
            clickRate: newScans > 0 ? Math.round(prev.totalClicks / newScans * 100) : 0,
          }
        })

        setLiveEvents(prev => [{
          id: session.id,
          type: 'scan' as const,
          message: session.table_ref ? `Table ${session.table_ref} scanned` : 'New guest scan',
          time: new Date(),
        }, ...prev].slice(0, 20))

        setLastUpdate(new Date())
      })
      .subscribe(status => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    // Events channel
    const eventsChannel = supabase
      .channel(`realtime-events-${venueId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
        filter: `venue_id=eq.${venueId}`,
      }, (payload) => {
        const event = payload.new as any

        setMetrics(prev => {
          const updates = { ...prev }

          if (event.name === 'recommendation_clicked') {
            updates.totalClicks = prev.totalClicks + 1
            updates.clickRate = prev.totalScans > 0
              ? Math.round((prev.totalClicks + 1) / prev.totalScans * 100)
              : 0
          }

          if (event.name === 'recommendation_liked') {
            updates.totalLikes = prev.totalLikes + 1
          }

          if (event.name === 'no_match_found') {
            updates.unmetRequests = prev.unmetRequests + 1
          }

          return updates
        })

        // Add to live feed
        const itemName = event.props?.item_name || event.props?.name
        let liveEvent: LiveEvent | null = null

        switch (event.name) {
          case 'recommendation_clicked':
            liveEvent = {
              id: event.id,
              type: 'click',
              message: `Clicked: ${itemName || 'item'}`,
              time: new Date(),
              itemName,
            }
            break
          case 'recommendation_liked':
            liveEvent = {
              id: event.id,
              type: 'like',
              message: `Liked: ${itemName || 'item'}`,
              time: new Date(),
              itemName,
            }
            break
          case 'upsell_clicked':
            liveEvent = {
              id: event.id,
              type: 'upsell',
              message: `Upsell: ${itemName || 'drink'}`,
              time: new Date(),
              itemName,
            }
            break
          case 'no_match_found':
            liveEvent = {
              id: event.id,
              type: 'unmet',
              message: 'Unmet demand logged',
              time: new Date(),
            }
            break
        }

        if (liveEvent) {
          setLiveEvents(prev => [liveEvent!, ...prev].slice(0, 20))
        }

        setLastUpdate(new Date())
      })
      .subscribe()

    return () => {
      supabase.removeChannel(sessionsChannel)
      supabase.removeChannel(eventsChannel)
    }
  }, [venueId, supabase, loadInitialData])

  // Refresh function
  const refresh = useCallback(() => {
    loadInitialData()
  }, [loadInitialData])

  return {
    metrics,
    liveEvents,
    isConnected,
    lastUpdate,
    loading,
    refresh,
  }
}

export type { RealtimeMetrics, LiveEvent }
