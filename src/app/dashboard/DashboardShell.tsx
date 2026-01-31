'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, UtensilsCrossed, BarChart3, Settings, LogOut, Menu, X, ExternalLink } from 'lucide-react'
import { signOut } from '@/lib/supabase/auth'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

interface DashboardShellProps {
  children: React.ReactNode
  venueName: string
  userEmail: string
  venueSlug?: string
}

export function DashboardShell({ children, venueName, userEmail, venueSlug }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#1a1a1a]/10 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
        >
          <Menu size={24} />
        </button>
        <span className="font-serif text-lg text-[#1e3a5f]">Eatsight</span>
        <div className="w-10" />
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Mobile close button */}
        <div className="lg:hidden absolute top-4 right-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-serif text-xl text-[#1a1a1a]">Eatsight</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-[#1e3a5f] text-white'
                        : 'text-[#1a1a1a]/70 hover:bg-gray-100 hover:text-[#1a1a1a]'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          {venueSlug && (
            <a
              href={`/v/${venueSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/5 hover:text-[#1a1a1a] transition-all mt-4 text-sm font-medium"
            >
              <ExternalLink size={20} />
              Preview Guest View
            </a>
          )}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-gray-200">
          {/* Venue info */}
          <div className="px-4 py-3 my-2 rounded-xl bg-gray-100">
            <p className="text-xs uppercase tracking-wider text-[#1a1a1a]/40">Venue</p>
            <p className="text-sm font-medium truncate text-[#1a1a1a]">{venueName}</p>
            <p className="text-xs mt-1 truncate text-[#1a1a1a]/50">{userEmail}</p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 text-[#1a1a1a]/70 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="w-5 h-5" />
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 relative">
          {/* Background blobs */}
          <div className="absolute -top-32 right-0 w-[400px] h-[400px] rounded-full bg-[#1e3a5f]/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-[#722F37]/5 blur-3xl pointer-events-none" />

          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
