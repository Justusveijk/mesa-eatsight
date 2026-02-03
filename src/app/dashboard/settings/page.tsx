'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Building2,
  Bell,
  CreditCard,
  Shield,
  Camera,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  Save,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Smartphone,
  Utensils,
  ChefHat,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ScrollReveal } from '@/components/ScrollReveal'

type TabType = 'profile' | 'venue' | 'notifications' | 'billing' | 'security'

interface ProfileData {
  name: string
  email: string
  phone: string
  role: string
}

interface VenueData {
  name: string
  slug: string
  address: string
  phone: string
  website: string
  cuisine_type: string
  opening_hours: string
}

interface NotificationSettings {
  email_orders: boolean
  email_reports: boolean
  push_orders: boolean
  push_stock: boolean
  sms_critical: boolean
}

const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'venue', label: 'Venue', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    role: 'Owner',
  })

  const [venue, setVenue] = useState<VenueData>({
    name: '',
    slug: '',
    address: '',
    phone: '',
    website: '',
    cuisine_type: '',
    opening_hours: '',
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_orders: true,
    email_reports: true,
    push_orders: true,
    push_stock: true,
    sms_critical: false,
  })

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = useCallback(async () => {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: operatorUser } = await supabase
      .from('operator_users')
      .select('*, venues(*)')
      .eq('auth_user_id', user.id)
      .single()

    if (operatorUser) {
      setProfile({
        name: operatorUser.name || '',
        email: user.email || '',
        phone: operatorUser.phone || '',
        role: operatorUser.role || 'Owner',
      })

      if (operatorUser.venues) {
        const v = operatorUser.venues as Record<string, string | null>
        setVenue({
          name: v.name || '',
          slug: v.slug || '',
          address: v.address || '',
          phone: v.phone || '',
          website: v.website || '',
          cuisine_type: v.cuisine_type || '',
          opening_hours: v.opening_hours || '',
        })
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('operator_users')
        .update({
          name: profile.name,
          phone: profile.phone,
        })
        .eq('auth_user_id', user.id)

      if (error) throw error
      showToast('Profile saved successfully', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveVenue = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: operatorUser } = await supabase
        .from('operator_users')
        .select('venue_id')
        .eq('auth_user_id', user.id)
        .single()

      if (!operatorUser?.venue_id) throw new Error('No venue found')

      const { error } = await supabase
        .from('venues')
        .update({
          name: venue.name,
          address: venue.address,
          phone: venue.phone,
          website: venue.website,
          cuisine_type: venue.cuisine_type,
          opening_hours: venue.opening_hours,
        })
        .eq('id', operatorUser.venue_id)

      if (error) throw error
      showToast('Venue settings saved', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showToast('Password updated successfully', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update password', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mesa-burgundy"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
                toast.type === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-serif text-mesa-charcoal">Settings</h1>
          <p className="text-sm text-mesa-charcoal/50 mt-1">
            Manage your account and venue settings
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-mesa-burgundy text-white'
                    : 'glass text-mesa-charcoal/70 hover:text-mesa-charcoal'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <ScrollReveal>
                  <div className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl bg-mesa-burgundy/10 flex items-center justify-center">
                          <User className="w-10 h-10 text-mesa-burgundy/50" />
                        </div>
                        <button className="absolute -bottom-1 -right-1 p-2 bg-mesa-burgundy text-white rounded-full shadow-lg hover:bg-mesa-burgundy/90 transition">
                          <Camera className="w-3 h-3" />
                        </button>
                      </div>
                      <div>
                        <h2 className="font-semibold text-mesa-charcoal">{profile.name || 'Your Name'}</h2>
                        <p className="text-sm text-mesa-charcoal/50">{profile.role}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-mesa-charcoal mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mesa-charcoal/30" />
                          <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="w-full pl-11 pr-4 py-3 glass rounded-xl text-mesa-charcoal placeholder:text-mesa-charcoal/30 focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-mesa-charcoal mb-2">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mesa-charcoal/30" />
                          <input
                            type="email"
                            value={profile.email}
                            disabled
                            className="w-full pl-11 pr-4 py-3 glass rounded-xl text-mesa-charcoal/50 bg-mesa-charcoal/5 cursor-not-allowed"
                          />
                        </div>
                        <p className="text-xs text-mesa-charcoal/40 mt-1">Contact support to change email</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-mesa-charcoal mb-2">
                          Phone
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mesa-charcoal/30" />
                          <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                            className="w-full pl-11 pr-4 py-3 glass rounded-xl text-mesa-charcoal placeholder:text-mesa-charcoal/30 focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-mesa-burgundy text-white rounded-xl font-medium hover:bg-mesa-burgundy/90 disabled:opacity-50 transition"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            )}

            {/* Venue Tab */}
            {activeTab === 'venue' && (
              <div className="space-y-6">
                <ScrollReveal>
                  <div className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-mesa-burgundy/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-mesa-burgundy" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-mesa-charcoal">Venue Details</h2>
                        <p className="text-sm text-mesa-charcoal/50">Basic information about your restaurant</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-mesa-charcoal mb-2">
                          Venue Name
                        </label>
                        <div className="relative">
                          <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mesa-charcoal/30" />
                          <input
                            type="text"
                            value={venue.name}
                            onChange={(e) => setVenue({ ...venue, name: e.target.value })}
                            className="w-full pl-11 pr-4 py-3 glass rounded-xl text-mesa-charcoal focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-mesa-charcoal mb-2">
                          URL Slug
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mesa-charcoal/30" />
                          <input
                            type="text"
                            value={venue.slug}
                            disabled
                            className="w-full pl-11 pr-4 py-3 glass rounded-xl text-mesa-charcoal/50 bg-mesa-charcoal/5 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-mesa-charcoal mb-2">
                          Address
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-3 w-4 h-4 text-mesa-charcoal/30" />
                          <textarea
                            value={venue.address}
                            onChange={(e) => setVenue({ ...venue, address: e.target.value })}
                            rows={2}
                            className="w-full pl-11 pr-4 py-3 glass rounded-xl text-mesa-charcoal focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20 resize-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-mesa-charcoal mb-2">
                          Phone
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mesa-charcoal/30" />
                          <input
                            type="tel"
                            value={venue.phone}
                            onChange={(e) => setVenue({ ...venue, phone: e.target.value })}
                            className="w-full pl-11 pr-4 py-3 glass rounded-xl text-mesa-charcoal focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-mesa-charcoal mb-2">
                          Website
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mesa-charcoal/30" />
                          <input
                            type="url"
                            value={venue.website}
                            onChange={(e) => setVenue({ ...venue, website: e.target.value })}
                            placeholder="https://"
                            className="w-full pl-11 pr-4 py-3 glass rounded-xl text-mesa-charcoal placeholder:text-mesa-charcoal/30 focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-mesa-charcoal mb-2">
                          Cuisine Type
                        </label>
                        <div className="relative">
                          <ChefHat className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mesa-charcoal/30" />
                          <input
                            type="text"
                            value={venue.cuisine_type}
                            onChange={(e) => setVenue({ ...venue, cuisine_type: e.target.value })}
                            placeholder="e.g., Italian, Modern European"
                            className="w-full pl-11 pr-4 py-3 glass rounded-xl text-mesa-charcoal placeholder:text-mesa-charcoal/30 focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-mesa-charcoal mb-2">
                          Opening Hours
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mesa-charcoal/30" />
                          <input
                            type="text"
                            value={venue.opening_hours}
                            onChange={(e) => setVenue({ ...venue, opening_hours: e.target.value })}
                            placeholder="e.g., Tue-Sun 12:00-22:00"
                            className="w-full pl-11 pr-4 py-3 glass rounded-xl text-mesa-charcoal placeholder:text-mesa-charcoal/30 focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <button
                        onClick={handleSaveVenue}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-mesa-burgundy text-white rounded-xl font-medium hover:bg-mesa-burgundy/90 disabled:opacity-50 transition"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <ScrollReveal>
                  <div className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-mesa-burgundy/10 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-mesa-burgundy" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-mesa-charcoal">Email Notifications</h2>
                        <p className="text-sm text-mesa-charcoal/50">Manage what emails you receive</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 glass rounded-xl cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-mesa-charcoal">Order notifications</p>
                          <p className="text-xs text-mesa-charcoal/50">Receive emails for new orders</p>
                        </div>
                        <div
                          onClick={() => setNotifications({ ...notifications, email_orders: !notifications.email_orders })}
                          className={`relative w-11 h-6 rounded-full transition cursor-pointer ${
                            notifications.email_orders ? 'bg-mesa-burgundy' : 'bg-mesa-charcoal/20'
                          }`}
                        >
                          <motion.div
                            animate={{ x: notifications.email_orders ? 20 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                          />
                        </div>
                      </label>

                      <label className="flex items-center justify-between p-4 glass rounded-xl cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-mesa-charcoal">Weekly reports</p>
                          <p className="text-xs text-mesa-charcoal/50">Summary of weekly analytics</p>
                        </div>
                        <div
                          onClick={() => setNotifications({ ...notifications, email_reports: !notifications.email_reports })}
                          className={`relative w-11 h-6 rounded-full transition cursor-pointer ${
                            notifications.email_reports ? 'bg-mesa-burgundy' : 'bg-mesa-charcoal/20'
                          }`}
                        >
                          <motion.div
                            animate={{ x: notifications.email_reports ? 20 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                  <div className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-mesa-burgundy/10 flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-mesa-burgundy" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-mesa-charcoal">Push Notifications</h2>
                        <p className="text-sm text-mesa-charcoal/50">Real-time alerts on your device</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 glass rounded-xl cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-mesa-charcoal">New orders</p>
                          <p className="text-xs text-mesa-charcoal/50">Instant alerts for incoming orders</p>
                        </div>
                        <div
                          onClick={() => setNotifications({ ...notifications, push_orders: !notifications.push_orders })}
                          className={`relative w-11 h-6 rounded-full transition cursor-pointer ${
                            notifications.push_orders ? 'bg-mesa-burgundy' : 'bg-mesa-charcoal/20'
                          }`}
                        >
                          <motion.div
                            animate={{ x: notifications.push_orders ? 20 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                          />
                        </div>
                      </label>

                      <label className="flex items-center justify-between p-4 glass rounded-xl cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-mesa-charcoal">Stock alerts</p>
                          <p className="text-xs text-mesa-charcoal/50">Notifications when items run low</p>
                        </div>
                        <div
                          onClick={() => setNotifications({ ...notifications, push_stock: !notifications.push_stock })}
                          className={`relative w-11 h-6 rounded-full transition cursor-pointer ${
                            notifications.push_stock ? 'bg-mesa-burgundy' : 'bg-mesa-charcoal/20'
                          }`}
                        >
                          <motion.div
                            animate={{ x: notifications.push_stock ? 20 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <ScrollReveal>
                  <div className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-mesa-burgundy/10 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-mesa-burgundy" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-mesa-charcoal">Current Plan</h2>
                        <p className="text-sm text-mesa-charcoal/50">Manage your subscription</p>
                      </div>
                    </div>

                    <div className="glass-warm rounded-xl p-6 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-xs font-medium text-mesa-burgundy uppercase tracking-wider">Current Plan</span>
                          <h3 className="text-2xl font-serif text-mesa-charcoal mt-1">Professional</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-semibold text-mesa-charcoal">€79</span>
                          <span className="text-mesa-charcoal/50">/month</span>
                        </div>
                      </div>
                      <ul className="space-y-2 text-sm text-mesa-charcoal/70">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          Unlimited menu items
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          Advanced analytics
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          Priority support
                        </li>
                      </ul>
                    </div>

                    <div className="flex items-center gap-3">
                      <button className="flex-1 py-2.5 glass rounded-xl text-sm font-medium text-mesa-charcoal hover:bg-mesa-charcoal/5 transition">
                        Change Plan
                      </button>
                      <button className="flex-1 py-2.5 glass rounded-xl text-sm font-medium text-mesa-charcoal hover:bg-mesa-charcoal/5 transition">
                        View Invoices
                      </button>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                  <div className="glass rounded-2xl p-6">
                    <h3 className="font-semibold text-mesa-charcoal mb-4">Payment Method</h3>
                    <div className="flex items-center gap-4 p-4 glass rounded-xl">
                      <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded flex items-center justify-center text-white text-xs font-bold">
                        VISA
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-mesa-charcoal">•••• •••• •••• 4242</p>
                        <p className="text-xs text-mesa-charcoal/50">Expires 12/25</p>
                      </div>
                      <button className="text-sm text-mesa-burgundy hover:underline">
                        Update
                      </button>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <ScrollReveal>
                  <div className="glass rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-mesa-burgundy/10 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-mesa-burgundy" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-mesa-charcoal">Change Password</h2>
                        <p className="text-sm text-mesa-charcoal/50">Update your account password</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-mesa-charcoal mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-12 glass rounded-xl text-mesa-charcoal focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-mesa-charcoal/40 hover:text-mesa-charcoal"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-mesa-charcoal mb-2">
                          New Password
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 glass rounded-xl text-mesa-charcoal focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-mesa-charcoal mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 glass rounded-xl text-mesa-charcoal focus:outline-none focus:ring-2 focus:ring-mesa-burgundy/20"
                        />
                      </div>

                      <button
                        onClick={handleChangePassword}
                        disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                        className="w-full py-3 bg-mesa-burgundy text-white rounded-xl font-medium hover:bg-mesa-burgundy/90 disabled:opacity-50 transition"
                      >
                        {saving ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                  <div className="glass rounded-2xl p-6">
                    <h3 className="font-semibold text-mesa-charcoal mb-4">Active Sessions</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 p-4 glass rounded-xl">
                        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-mesa-charcoal">Current session</p>
                          <p className="text-xs text-mesa-charcoal/50">This device - Active now</p>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.2}>
                  <div className="glass rounded-2xl p-6 border border-red-200">
                    <h3 className="font-semibold text-red-600 mb-2">Danger Zone</h3>
                    <p className="text-sm text-mesa-charcoal/50 mb-4">
                      Permanently delete your account and all associated data.
                    </p>
                    <button className="px-4 py-2 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition">
                      Delete Account
                    </button>
                  </div>
                </ScrollReveal>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
