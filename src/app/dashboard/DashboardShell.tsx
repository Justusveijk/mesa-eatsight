'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, UtensilsCrossed, BarChart3, Settings, LogOut } from 'lucide-react'
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
}

export function DashboardShell({ children, venueName, userEmail }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#FDFBF7]">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-semibold text-lg text-[#1a1a1a]">Eatsight</span>
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
      <main className="flex-1 p-8 overflow-auto">
        <div className="relative">
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
