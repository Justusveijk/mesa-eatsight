'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  UtensilsCrossed,
  BarChart3,
  QrCode,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/qr', label: 'QR Code', icon: QrCode },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [venue, setVenue] = useState<any>(null)

  const supabase = createClient()

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
          .select('name, slug')
          .eq('id', operator.venue_id)
          .single()
        setVenue(data)
      }
    }
    fetchVenue()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        className="hidden lg:flex flex-col h-screen bg-white border-r border-neutral-200 fixed left-0 top-0 z-40"
      >
        {/* Logo */}
        <div className={`h-14 flex items-center border-b border-neutral-100 ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
          {!collapsed && (
            <span className="text-base font-semibold text-neutral-900">Eatsight</span>
          )}
          {collapsed && (
            <span className="text-base font-semibold text-neutral-900">E</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded hover:bg-neutral-100 transition ${collapsed ? 'hidden' : ''}`}
          >
            <ChevronLeft className={`w-4 h-4 text-neutral-400 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Venue */}
        {venue && !collapsed && (
          <div className="px-3 py-3 border-b border-neutral-100">
            <div className="px-3 py-2 bg-neutral-50 rounded-md">
              <p className="text-xs font-medium text-neutral-900 truncate">{venue.name}</p>
              <p className="text-xs text-neutral-400 truncate">/{venue.slug}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                  isActive
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}

          {/* Preview Link */}
          {venue && (
            <a
              href={`/v/${venue.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title={collapsed ? 'Preview Guest View' : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition ${collapsed ? 'justify-center' : ''}`}
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>Preview Guest View</span>}
            </a>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-neutral-100">
          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign Out' : undefined}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-neutral-600 hover:bg-red-50 hover:text-red-600 transition ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2">
            <Menu className="w-5 h-5 text-neutral-700" />
          </button>
          <span className="text-base font-semibold text-neutral-900">Eatsight</span>
          <div className="w-9" />
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 lg:hidden"
            >
              <div className="h-14 flex items-center justify-between px-4 border-b border-neutral-100">
                <span className="text-base font-semibold text-neutral-900">Eatsight</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 -mr-2">
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <nav className="p-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                        isActive
                          ? 'bg-neutral-900 text-white'
                          : 'text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-neutral-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
