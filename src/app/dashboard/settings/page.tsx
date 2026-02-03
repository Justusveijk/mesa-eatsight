'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Building2,
  Bell,
  CreditCard,
  Shield,
  Check,
  ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'profile' | 'venue' | 'notifications' | 'billing' | 'security'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [user, setUser] = useState<any>(null)
  const [venue, setVenue] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
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
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'venue' as Tab, label: 'Venue', icon: Building2 },
    { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
    { id: 'billing' as Tab, label: 'Billing', icon: CreditCard },
    { id: 'security' as Tab, label: 'Security', icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-lg font-semibold text-neutral-900">Settings</h1>
          <p className="text-sm text-neutral-500">Manage your account and venue</p>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-6 border-t border-neutral-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                  activeTab === tab.id
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === 'profile' && <ProfileSection user={user} />}
        {activeTab === 'venue' && <VenueSection venue={venue} />}
        {activeTab === 'notifications' && <NotificationsSection />}
        {activeTab === 'billing' && <BillingSection />}
        {activeTab === 'security' && <SecuritySection user={user} />}
      </div>
    </div>
  )
}

function ProfileSection({ user }: { user: any }) {
  const [name, setName] = useState(user?.user_metadata?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')

  return (
    <div className="bg-white border border-neutral-200 rounded-lg">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h2 className="text-sm font-medium text-neutral-900">Profile Information</h2>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
          />
        </div>
        <div className="pt-4 border-t border-neutral-100">
          <button className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

function VenueSection({ venue }: { venue: any }) {
  const [name, setName] = useState(venue?.name || '')
  const [address, setAddress] = useState(venue?.address || '')

  return (
    <div className="bg-white border border-neutral-200 rounded-lg">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h2 className="text-sm font-medium text-neutral-900">Venue Details</h2>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Venue Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
          />
        </div>
        <div className="pt-4 border-t border-neutral-100">
          <button className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

function NotificationsSection() {
  const [settings, setSettings] = useState({
    dailyDigest: true,
    weeklyReport: true,
    productUpdates: false,
  })

  return (
    <div className="bg-white border border-neutral-200 rounded-lg">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h2 className="text-sm font-medium text-neutral-900">Email Notifications</h2>
      </div>
      <div className="divide-y divide-neutral-100">
        {[
          { key: 'dailyDigest', label: 'Daily Digest', desc: 'Summary of guest activity' },
          { key: 'weeklyReport', label: 'Weekly Report', desc: 'Analytics and insights' },
          { key: 'productUpdates', label: 'Product Updates', desc: 'New features and improvements' },
        ].map((item) => (
          <div key={item.key} className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">{item.label}</p>
              <p className="text-xs text-neutral-500">{item.desc}</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
              className={`relative w-10 h-6 rounded-full transition ${
                settings[item.key as keyof typeof settings] ? 'bg-neutral-900' : 'bg-neutral-200'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition ${
                settings[item.key as keyof typeof settings] ? 'left-5' : 'left-1'
              }`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function BillingSection() {
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white border border-neutral-200 rounded-lg">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-medium text-neutral-900">Current Plan</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between p-4 bg-neutral-900 text-white rounded-lg">
            <div>
              <p className="text-xs text-neutral-400">You&apos;re on the</p>
              <p className="text-lg font-semibold">Pro Plan</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums">€249</p>
              <p className="text-xs text-neutral-400">/month</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-green-600 flex items-center gap-1">
            <Check className="w-4 h-4" />
            Active • Next billing: March 1, 2026
          </p>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white border border-neutral-200 rounded-lg">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-900">Payment Method</h2>
          <button className="text-xs font-medium text-neutral-600 hover:text-neutral-900">Update</button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">VISA</div>
            <div>
              <p className="text-sm text-neutral-900">•••• •••• •••• 4242</p>
              <p className="text-xs text-neutral-500">Expires 12/27</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SecuritySection({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      {/* Password */}
      <div className="bg-white border border-neutral-200 rounded-lg">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-medium text-neutral-900">Change Password</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Current Password</label>
            <input type="password" className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900/10" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">New Password</label>
            <input type="password" className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900/10" />
          </div>
          <div className="pt-4 border-t border-neutral-100">
            <button className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 rounded-md hover:bg-neutral-800 transition">
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-red-200 rounded-lg">
        <div className="px-6 py-4 border-b border-red-100">
          <h2 className="text-sm font-medium text-red-600">Danger Zone</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-neutral-600 mb-4">
            Permanently delete your account and all data. This cannot be undone.
          </p>
          <button className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
