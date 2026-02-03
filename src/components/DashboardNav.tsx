'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  User,
  Bell,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/qr', label: 'QR Code', icon: QrCode },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

interface DashboardNavProps {
  defaultCollapsed?: boolean
}

export function DashboardNav({ defaultCollapsed = false }: DashboardNavProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [venueName, setVenueName] = useState('')

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: operatorUser } = await supabase
        .from('operator_users')
        .select('name, venues(name)')
        .eq('auth_user_id', user.id)
        .single()

      if (operatorUser) {
        setUserName(operatorUser.name || 'User')
        if (operatorUser.venues && typeof operatorUser.venues === 'object' && 'name' in operatorUser.venues) {
          setVenueName((operatorUser.venues as { name: string }).name || '')
        }
      }
    }

    fetchUserData()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white border-r border-neutral-200 z-40"
      >
        {/* Logo */}
        <div className="p-4 border-b border-neutral-100">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-900 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">ES</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <span className="font-semibold text-neutral-900 whitespace-nowrap">Eatsight</span>
                  {venueName && (
                    <p className="text-xs text-neutral-500 truncate">{venueName}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 group relative ${
                  active
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-neutral-900' : ''}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-2 border-t border-neutral-100">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-neutral-50 transition cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-neutral-600" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <p className="text-sm font-medium text-neutral-900 truncate">{userName}</p>
                  <p className="text-xs text-neutral-500">Owner</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-neutral-500 hover:bg-red-50 hover:text-red-600 transition w-full mt-0.5 ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  Log out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:border-neutral-300 transition"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </motion.aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-neutral-200 z-40 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-neutral-900 flex items-center justify-center">
            <span className="text-white font-semibold text-xs">ES</span>
          </div>
          <span className="font-semibold text-neutral-900">Eatsight</span>
        </Link>

        <div className="flex items-center gap-1">
          <button className="p-2 rounded-md hover:bg-neutral-100 transition">
            <Bell className="w-5 h-5 text-neutral-500" />
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md hover:bg-neutral-100 transition"
          >
            <Menu className="w-5 h-5 text-neutral-700" />
          </button>
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
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 z-50"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed right-0 top-0 h-screen w-72 bg-white border-l border-neutral-200 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-neutral-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{userName}</p>
                    <p className="text-xs text-neutral-500">{venueName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-md hover:bg-neutral-100 transition"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md transition ${
                        active
                          ? 'bg-neutral-100 text-neutral-900'
                          : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* Logout */}
              <div className="p-2 border-t border-neutral-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-md text-neutral-500 hover:bg-red-50 hover:text-red-600 transition w-full"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  <span className="text-sm font-medium">Log out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed elements */}
      <div className="hidden lg:block" style={{ width: collapsed ? 72 : 240 }} />
      <div className="lg:hidden h-14" />
    </>
  )
}
