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
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen glass border-r border-mesa-charcoal/5 z-40"
      >
        {/* Logo */}
        <div className="p-4 border-b border-mesa-charcoal/5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mesa-burgundy flex items-center justify-center flex-shrink-0">
              <span className="text-white font-serif text-lg">M</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <span className="font-serif text-lg text-mesa-charcoal whitespace-nowrap">Mesa</span>
                  {venueName && (
                    <p className="text-xs text-mesa-charcoal/50 truncate">{venueName}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                  active
                    ? 'bg-mesa-burgundy text-white'
                    : 'text-mesa-charcoal/70 hover:bg-mesa-charcoal/5 hover:text-mesa-charcoal'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
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
                  <div className="absolute left-full ml-2 px-2 py-1 bg-mesa-charcoal text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-mesa-charcoal/5">
          <div className={`flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-mesa-charcoal/5 transition cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-mesa-burgundy/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-mesa-burgundy" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <p className="text-sm font-medium text-mesa-charcoal truncate">{userName}</p>
                  <p className="text-xs text-mesa-charcoal/50">Owner</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-mesa-charcoal/60 hover:bg-red-50 hover:text-red-600 transition w-full mt-1 ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
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
          className="absolute -right-3 top-20 w-6 h-6 rounded-full glass border border-mesa-charcoal/10 flex items-center justify-center text-mesa-charcoal/50 hover:text-mesa-charcoal transition shadow-sm"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </motion.aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 glass border-b border-mesa-charcoal/5 z-40 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-mesa-burgundy flex items-center justify-center">
            <span className="text-white font-serif">M</span>
          </div>
          <span className="font-serif text-lg text-mesa-charcoal">Mesa</span>
        </Link>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-xl hover:bg-mesa-charcoal/5 transition">
            <Bell className="w-5 h-5 text-mesa-charcoal/60" />
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl hover:bg-mesa-charcoal/5 transition"
          >
            <Menu className="w-5 h-5 text-mesa-charcoal" />
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
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed right-0 top-0 h-screen w-72 glass border-l border-mesa-charcoal/5 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-mesa-charcoal/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-mesa-burgundy/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-mesa-burgundy" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-mesa-charcoal">{userName}</p>
                    <p className="text-xs text-mesa-charcoal/50">{venueName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl hover:bg-mesa-charcoal/5 transition"
                >
                  <X className="w-5 h-5 text-mesa-charcoal/60" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                        active
                          ? 'bg-mesa-burgundy text-white'
                          : 'text-mesa-charcoal/70 hover:bg-mesa-charcoal/5 hover:text-mesa-charcoal'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* Logout */}
              <div className="p-3 border-t border-mesa-charcoal/5">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-mesa-charcoal/60 hover:bg-red-50 hover:text-red-600 transition w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Log out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed elements */}
      <div className="hidden lg:block" style={{ width: collapsed ? 80 : 260 }} />
      <div className="lg:hidden h-16" />
    </>
  )
}
