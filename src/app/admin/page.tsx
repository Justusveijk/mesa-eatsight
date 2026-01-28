'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GlassPanel } from '@/components/shared/GlassPanel'
import { RefreshCw, Store, Users, Scan, TrendingUp, CreditCard, DollarSign, Target } from 'lucide-react'

interface VenueWithStats {
  id: string
  name: string
  slug: string
  city: string
  category: string
  created_at: string
  subscription_status: string
  subscription_plan: string
  total_scans: number
  total_items: number
  last_scan: string | null
  owner_email: string
}

interface Stats {
  totalVenues: number
  activeVenues: number
  totalScans: number
  trialVenues: number
  paidVenues: number
  mrr: number
  arr: number
  monthlyCount: number
  annualCount: number
}

export default function AdminPage() {
  const [venues, setVenues] = useState<VenueWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<Stats>({
    totalVenues: 0,
    activeVenues: 0,
    totalScans: 0,
    trialVenues: 0,
    paidVenues: 0,
    mrr: 0,
    arr: 0,
    monthlyCount: 0,
    annualCount: 0
  })

  const supabase = createClient()

  const fetchAllVenues = async () => {
    try {
      // Get all venues with their operators and subscriptions
      const { data: venuesData, error: venuesError } = await supabase
        .from('venues')
        .select(`
          *,
          operator_users (email),
          subscriptions (status, plan)
        `)
        .order('created_at', { ascending: false })

      if (venuesError) {
        console.error('Error fetching venues:', venuesError)
        return
      }

      // Get scan counts per venue
      const { data: scanCounts } = await supabase
        .from('rec_sessions')
        .select('venue_id')

      // Count scans per venue
      const scansByVenue: Record<string, number> = {}
      scanCounts?.forEach(s => {
        scansByVenue[s.venue_id] = (scansByVenue[s.venue_id] || 0) + 1
      })

      // Get last scan per venue
      const { data: lastScans } = await supabase
        .from('rec_sessions')
        .select('venue_id, started_at')
        .order('started_at', { ascending: false })

      const lastScanByVenue: Record<string, string> = {}
      lastScans?.forEach(s => {
        if (!lastScanByVenue[s.venue_id]) {
          lastScanByVenue[s.venue_id] = s.started_at
        }
      })

      // Get menu item counts per venue
      const { data: menuData } = await supabase
        .from('menus')
        .select('id, venue_id')

      const menuByVenue: Record<string, string> = {}
      menuData?.forEach(m => {
        if (!menuByVenue[m.venue_id]) {
          menuByVenue[m.venue_id] = m.id
        }
      })

      const { data: itemCounts } = await supabase
        .from('menu_items')
        .select('menu_id')

      const itemsByMenu: Record<string, number> = {}
      itemCounts?.forEach(i => {
        itemsByMenu[i.menu_id] = (itemsByMenu[i.menu_id] || 0) + 1
      })

      const enrichedVenues: VenueWithStats[] = venuesData?.map(v => {
        const operators = v.operator_users as { email: string }[] | null
        const subscriptions = v.subscriptions as { status: string; plan: string }[] | null
        const menuId = menuByVenue[v.id]

        return {
          id: v.id,
          name: v.name,
          slug: v.slug,
          city: v.city || '-',
          category: v.category || '-',
          created_at: v.created_at,
          subscription_status: subscriptions?.[0]?.status || 'none',
          subscription_plan: subscriptions?.[0]?.plan || '-',
          total_scans: scansByVenue[v.id] || 0,
          total_items: menuId ? (itemsByMenu[menuId] || 0) : 0,
          last_scan: lastScanByVenue[v.id] || null,
          owner_email: operators?.[0]?.email || '-'
        }
      }) || []

      setVenues(enrichedVenues)

      // Calculate overall stats
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Calculate MRR
      const monthlyCount = enrichedVenues.filter(v =>
        v.subscription_status === 'active' && v.subscription_plan === 'monthly'
      ).length
      const annualCount = enrichedVenues.filter(v =>
        v.subscription_status === 'active' && v.subscription_plan === 'annual'
      ).length
      const mrr = (monthlyCount * 295) + (annualCount * 249)
      const arr = mrr * 12

      setStats({
        totalVenues: enrichedVenues.length,
        activeVenues: enrichedVenues.filter(v =>
          v.last_scan && new Date(v.last_scan) > sevenDaysAgo
        ).length,
        totalScans: Object.values(scansByVenue).reduce((a, b) => a + b, 0),
        trialVenues: enrichedVenues.filter(v => v.subscription_status === 'trialing').length,
        paidVenues: enrichedVenues.filter(v => v.subscription_status === 'active').length,
        mrr,
        arr,
        monthlyCount,
        annualCount
      })
    } catch (error) {
      console.error('Error in fetchAllVenues:', error)
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchAllVenues()
      setLoading(false)
    }
    load()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAllVenues()
    setRefreshing(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400'
      case 'trialing':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'canceled':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-ocean-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Admin Dashboard</h1>
            <p className="text-text-muted">Internal view of all venues and metrics</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ocean-700 border border-line text-text-primary hover:bg-ocean-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <GlassPanel className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-ocean-700 flex items-center justify-center">
                <Store className="w-5 h-5 text-signal" />
              </div>
            </div>
            <div className="text-3xl font-bold text-text-primary">
              {loading ? '-' : stats.totalVenues}
            </div>
            <div className="text-sm text-text-muted">Total Venues</div>
          </GlassPanel>

          <GlassPanel className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-green-400">
              {loading ? '-' : stats.activeVenues}
            </div>
            <div className="text-sm text-text-muted">Active (7d)</div>
          </GlassPanel>

          <GlassPanel className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-ocean-700 flex items-center justify-center">
                <Scan className="w-5 h-5 text-signal" />
              </div>
            </div>
            <div className="text-3xl font-bold text-text-primary">
              {loading ? '-' : stats.totalScans}
            </div>
            <div className="text-sm text-text-muted">Total Scans</div>
          </GlassPanel>

          <GlassPanel className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              {loading ? '-' : stats.trialVenues}
            </div>
            <div className="text-sm text-text-muted">On Trial</div>
          </GlassPanel>

          <GlassPanel className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-signal/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-signal" />
              </div>
            </div>
            <div className="text-3xl font-bold text-signal">
              {loading ? '-' : stats.paidVenues}
            </div>
            <div className="text-sm text-text-muted">Paid</div>
          </GlassPanel>
        </div>

        {/* Revenue Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <GlassPanel className="p-6 bg-gradient-to-br from-signal/10 to-ocean-800 border-signal/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-signal/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-signal" />
              </div>
              <div>
                <div className="text-sm text-text-muted">Monthly Recurring Revenue</div>
                <div className="text-3xl font-bold text-text-primary">€{loading ? '-' : stats.mrr.toLocaleString()}</div>
              </div>
            </div>
            <div className="text-sm text-text-muted">
              ARR: €{loading ? '-' : stats.arr.toLocaleString()}
            </div>
            <div className="text-xs text-text-muted mt-1">
              {stats.monthlyCount} monthly × €295 + {stats.annualCount} annual × €249
            </div>
          </GlassPanel>

          {/* Milestones */}
          <div className="md:col-span-2">
            <GlassPanel className="p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-ocean-700 flex items-center justify-center">
                  <Target className="w-5 h-5 text-signal" />
                </div>
                <h2 className="text-lg font-semibold text-text-primary">Milestones</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Milestone 1: First 10 Venues */}
                <div className="p-3 rounded-lg bg-ocean-700/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-text-muted">First 10 Venues</span>
                    <span className={`text-xs ${stats.totalVenues >= 10 ? 'text-green-400' : 'text-text-muted'}`}>
                      {stats.totalVenues >= 10 ? '✓' : `${stats.totalVenues}/10`}
                    </span>
                  </div>
                  <div className="w-full bg-ocean-600 rounded-full h-1.5">
                    <div
                      className="bg-signal h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(stats.totalVenues / 10 * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Milestone 2: First €1K MRR */}
                <div className="p-3 rounded-lg bg-ocean-700/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-text-muted">First €1K MRR</span>
                    <span className={`text-xs ${stats.mrr >= 1000 ? 'text-green-400' : 'text-text-muted'}`}>
                      {stats.mrr >= 1000 ? '✓' : `€${stats.mrr}`}
                    </span>
                  </div>
                  <div className="w-full bg-ocean-600 rounded-full h-1.5">
                    <div
                      className="bg-signal h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(stats.mrr / 1000 * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Milestone 3: 5 Paid Venues */}
                <div className="p-3 rounded-lg bg-ocean-700/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-text-muted">5 Paid Venues</span>
                    <span className={`text-xs ${stats.paidVenues >= 5 ? 'text-green-400' : 'text-text-muted'}`}>
                      {stats.paidVenues >= 5 ? '✓' : `${stats.paidVenues}/5`}
                    </span>
                  </div>
                  <div className="w-full bg-ocean-600 rounded-full h-1.5">
                    <div
                      className="bg-signal h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(stats.paidVenues / 5 * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Milestone 4: 1,000 Total Scans */}
                <div className="p-3 rounded-lg bg-ocean-700/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-text-muted">1K Scans</span>
                    <span className={`text-xs ${stats.totalScans >= 1000 ? 'text-green-400' : 'text-text-muted'}`}>
                      {stats.totalScans >= 1000 ? '✓' : `${stats.totalScans}`}
                    </span>
                  </div>
                  <div className="w-full bg-ocean-600 rounded-full h-1.5">
                    <div
                      className="bg-signal h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(stats.totalScans / 1000 * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>

        {/* Venues Table */}
        <GlassPanel className="overflow-hidden">
          <div className="p-6 border-b border-line">
            <h2 className="text-xl font-semibold text-text-primary">All Venues</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-signal mx-auto"></div>
              <p className="text-text-muted mt-4">Loading venues...</p>
            </div>
          ) : venues.length === 0 ? (
            <div className="p-8 text-center">
              <Store className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">No venues registered yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="p-4 text-sm font-medium text-text-muted">Venue</th>
                    <th className="p-4 text-sm font-medium text-text-muted">Owner</th>
                    <th className="p-4 text-sm font-medium text-text-muted">City</th>
                    <th className="p-4 text-sm font-medium text-text-muted">Plan</th>
                    <th className="p-4 text-sm font-medium text-text-muted">Status</th>
                    <th className="p-4 text-sm font-medium text-text-muted">Items</th>
                    <th className="p-4 text-sm font-medium text-text-muted">Scans</th>
                    <th className="p-4 text-sm font-medium text-text-muted">Last Active</th>
                    <th className="p-4 text-sm font-medium text-text-muted">Signed Up</th>
                  </tr>
                </thead>
                <tbody>
                  {venues.map(venue => (
                    <tr key={venue.id} className="border-b border-line/50 hover:bg-ocean-700/30">
                      <td className="p-4">
                        <div className="font-medium text-text-primary">{venue.name}</div>
                        <div className="text-sm text-text-muted">/v/{venue.slug}</div>
                      </td>
                      <td className="p-4 text-sm text-text-muted">{venue.owner_email}</td>
                      <td className="p-4 text-text-muted">{venue.city}</td>
                      <td className="p-4 text-text-muted capitalize">{venue.subscription_plan}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(venue.subscription_status)}`}>
                          {venue.subscription_status}
                        </span>
                      </td>
                      <td className="p-4 text-text-muted">{venue.total_items}</td>
                      <td className="p-4 text-text-muted">{venue.total_scans}</td>
                      <td className="p-4 text-sm text-text-muted">
                        {venue.last_scan ? formatDate(venue.last_scan) : '-'}
                      </td>
                      <td className="p-4 text-sm text-text-muted">
                        {formatDate(venue.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  )
}
