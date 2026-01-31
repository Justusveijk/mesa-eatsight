'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  Calendar,
  ExternalLink,
  Search,
  RefreshCw,
  DollarSign
} from 'lucide-react'

// Hardcoded admin emails - only these can access
const ADMIN_EMAILS = [
  'vaneijkjustus@gmail.com',
  'justusvaneijk@hotmail.com',
  // Add co-founder emails here
]

interface VenueWithStats {
  id: string
  name: string
  slug: string
  city: string
  country: string
  category: string
  created_at: string
  operator_users: { email: string; role: string; created_at: string }[]
  menus: { id: string; status: string }[]
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [venues, setVenues] = useState<VenueWithStats[]>([])
  const [users, setUsers] = useState<{ id: string; email: string; created_at: string; role?: string; venues?: { name: string } }[]>([])
  const [stats, setStats] = useState({
    totalVenues: 0,
    totalUsers: 0,
    totalSessions: 0,
    totalEvents: 0,
    venuesThisWeek: 0,
    sessionsToday: 0,
    trialVenues: 0,
    paidVenues: 0,
    mrr: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  const fetchData = async () => {
    // Check if user is logged in and is an admin
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      setAuthorized(false)
      setLoading(false)
      return
    }

    setAuthorized(true)

    // Load all venues with their operators
    const { data: venuesData } = await supabase
      .from('venues')
      .select(`
        *,
        operator_users (email, role, created_at),
        menus (id, status)
      `)
      .order('created_at', { ascending: false })

    setVenues(venuesData || [])

    // Load all operator users
    const { data: usersData } = await supabase
      .from('operator_users')
      .select(`
        *,
        venues (name, slug)
      `)
      .order('created_at', { ascending: false })

    setUsers(usersData || [])

    // Get stats
    const { count: venueCount } = await supabase
      .from('venues')
      .select('*', { count: 'exact', head: true })

    const { count: userCount } = await supabase
      .from('operator_users')
      .select('*', { count: 'exact', head: true })

    const { count: sessionCount } = await supabase
      .from('rec_sessions')
      .select('*', { count: 'exact', head: true })

    const { count: eventCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })

    // Venues this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { count: venuesThisWeek } = await supabase
      .from('venues')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    // Sessions today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: sessionsToday } = await supabase
      .from('rec_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('started_at', today.toISOString())

    // Get subscription stats
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('status, plan')

    const trialVenues = subscriptions?.filter(s => s.status === 'trialing').length || 0
    const paidVenues = subscriptions?.filter(s => s.status === 'active').length || 0
    const monthlyCount = subscriptions?.filter(s => s.status === 'active' && s.plan === 'monthly').length || 0
    const annualCount = subscriptions?.filter(s => s.status === 'active' && s.plan === 'annual').length || 0
    const mrr = (monthlyCount * 295) + (annualCount * 249)

    setStats({
      totalVenues: venueCount || 0,
      totalUsers: userCount || 0,
      totalSessions: sessionCount || 0,
      totalEvents: eventCount || 0,
      venuesThisWeek: venuesThisWeek || 0,
      sessionsToday: sessionsToday || 0,
      trialVenues,
      paidVenues,
      mrr
    })

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#722F37] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/50">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-6">🔒</div>
          <h1 className="text-2xl font-semibold text-white mb-4">Admin Access Only</h1>
          <p className="text-white/60 mb-8">You don&apos;t have permission to view this page.</p>
          <Link href="/login" className="text-[#722F37] hover:text-[#5a252c]">
            Login with admin account →
          </Link>
        </div>
      </div>
    )
  }

  const filteredVenues = venues.filter(v =>
    v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.city?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xl font-semibold text-white">🛡️ Eatsight Admin</span>
            <span className="text-white/40 text-sm">Platform Overview</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link href="/" className="text-white/60 hover:text-white text-sm">
              ← Back to site
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/40 text-sm mb-2">
              <Building2 size={16} />
              Total Venues
            </div>
            <div className="text-3xl font-semibold text-white">{stats.totalVenues}</div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/40 text-sm mb-2">
              <Users size={16} />
              Total Users
            </div>
            <div className="text-3xl font-semibold text-white">{stats.totalUsers}</div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/40 text-sm mb-2">
              <BarChart3 size={16} />
              Total Sessions
            </div>
            <div className="text-3xl font-semibold text-white">{stats.totalSessions}</div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 text-white/40 text-sm mb-2">
              <TrendingUp size={16} />
              Total Events
            </div>
            <div className="text-3xl font-semibold text-white">{stats.totalEvents}</div>
          </div>

          <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
              <Calendar size={16} />
              New This Week
            </div>
            <div className="text-3xl font-semibold text-green-400">{stats.venuesThisWeek}</div>
          </div>

          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
              <TrendingUp size={16} />
              Sessions Today
            </div>
            <div className="text-3xl font-semibold text-blue-400">{stats.sessionsToday}</div>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#722F37]/20 rounded-xl p-6 border border-[#722F37]/30">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-[#722F37]" />
              <span className="text-white/60">Monthly Recurring Revenue</span>
            </div>
            <div className="text-4xl font-bold text-white">€{stats.mrr.toLocaleString()}</div>
            <div className="text-sm text-white/40 mt-1">ARR: €{(stats.mrr * 12).toLocaleString()}</div>
          </div>

          <div className="bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-yellow-400 text-sm mb-2">
              <Users size={16} />
              On Trial
            </div>
            <div className="text-4xl font-bold text-yellow-400">{stats.trialVenues}</div>
            <div className="text-sm text-white/40 mt-1">14-day free trials</div>
          </div>

          <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
              <TrendingUp size={16} />
              Paid Customers
            </div>
            <div className="text-4xl font-bold text-green-400">{stats.paidVenues}</div>
            <div className="text-sm text-white/40 mt-1">Active subscriptions</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search venues..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
        </div>

        {/* Venues List */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">All Venues ({filteredVenues.length})</h2>
          </div>

          <div className="divide-y divide-white/10">
            {filteredVenues.map((venue) => (
              <div key={venue.id} className="px-6 py-4 hover:bg-white/5 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-white">{venue.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        venue.slug === 'bella-taverna'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-white/10 text-white/60'
                      }`}>
                        {venue.slug === 'bella-taverna' ? 'Demo' : venue.category || 'venue'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-white/40">
                      <span>{venue.city || 'Unknown'}, {venue.country || 'Unknown'}</span>
                      <span>·</span>
                      <span>/{venue.slug}</span>
                      <span>·</span>
                      <span>{new Date(venue.created_at).toLocaleDateString()}</span>
                    </div>
                    {venue.operator_users?.length > 0 && (
                      <div className="mt-2 text-sm text-white/60">
                        👤 {venue.operator_users.map((op) => op.email).join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/v/${venue.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {filteredVenues.length === 0 && (
              <div className="px-6 py-12 text-center text-white/40">
                No venues found
              </div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Recent Signups</h2>
          </div>

          <div className="divide-y divide-white/10">
            {users.slice(0, 10).map((user) => (
              <div key={user.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <div className="text-white">{user.email}</div>
                  <div className="text-sm text-white/40">
                    {user.venues?.name || 'No venue'} · {user.role}
                  </div>
                </div>
                <div className="text-sm text-white/40">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="px-6 py-8 text-center text-white/40">
                No users yet
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
