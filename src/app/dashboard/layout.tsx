'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, UtensilsCrossed, BarChart3, Settings, LogOut } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen gradient-eatsight">
      {/* Sidebar */}
      <aside className="w-64 bg-ocean-800/80 backdrop-blur-xl border-r border-line flex flex-col">
        {/* Logo */}
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-signal flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="text-text-primary font-semibold text-lg">Eatsight</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4">
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
                      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                      ${
                        isActive
                          ? 'bg-signal/20 text-text-primary'
                          : 'text-text-muted hover:bg-ocean-700/50 hover:text-text-primary'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-signal' : ''}`} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Venue info & Logout */}
        <div className="p-4 border-t border-line">
          <div className="px-4 py-2 mb-2">
            <p className="text-xs text-text-muted uppercase tracking-wider">Venue</p>
            <p className="text-sm text-text-primary font-medium">Bella Taverna</p>
            <p className="text-xs text-text-muted mt-1">demo@eatsight.com</p>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-text-muted hover:bg-ocean-700/50 hover:text-text-primary transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto dark-scrollbar">
        <div className="relative">
          {/* Background blobs */}
          <div className="blob blob-coral w-[400px] h-[400px] -top-32 right-0 opacity-5" />
          <div className="blob blob-ocean w-[300px] h-[300px] bottom-0 left-1/4 opacity-10" />

          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
