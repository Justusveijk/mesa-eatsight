'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, UtensilsCrossed, BarChart3, Settings, LogOut, Sun, Moon } from 'lucide-react'
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
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('eatsight-theme')
    if (saved === 'dark') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('eatsight-theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('eatsight-theme', 'dark')
    }
    setDarkMode(!darkMode)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut()
    router.push('/login')
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${darkMode ? 'gradient-eatsight' : 'bg-[#FDFBF7]'}`}>
      {/* Sidebar */}
      <aside className={`w-64 flex flex-col border-r transition-colors duration-300 ${
        darkMode
          ? 'bg-ocean-800/80 backdrop-blur-xl border-line'
          : 'bg-white border-gray-200'
      }`}>
        {/* Logo */}
        <div className={`p-6 border-b transition-colors duration-300 ${darkMode ? 'border-line' : 'border-gray-200'}`}>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-signal' : 'bg-[#1e3a5f]'}`}>
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className={`font-semibold text-lg ${darkMode ? 'text-text-primary' : 'text-[#1a1a1a]'}`}>Eatsight</span>
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
                      ${darkMode
                        ? isActive
                          ? 'bg-signal/20 text-text-primary'
                          : 'text-text-muted hover:bg-ocean-700/50 hover:text-text-primary'
                        : isActive
                          ? 'bg-[#1e3a5f] text-white'
                          : 'text-[#1a1a1a]/70 hover:bg-gray-100 hover:text-[#1a1a1a]'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${
                      darkMode
                        ? isActive ? 'text-signal' : ''
                        : isActive ? 'text-white' : ''
                    }`} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className={`p-4 border-t transition-colors duration-300 ${darkMode ? 'border-line' : 'border-gray-200'}`}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
              darkMode
                ? 'text-text-muted hover:bg-ocean-700/50 hover:text-text-primary'
                : 'text-[#1a1a1a]/70 hover:bg-gray-100 hover:text-[#1a1a1a]'
            }`}
          >
            <span className="flex items-center gap-3">
              {darkMode ? <Moon size={20} /> : <Sun size={20} />}
              {darkMode ? 'Dark mode' : 'Light mode'}
            </span>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${
              darkMode ? 'bg-[#1e3a5f]' : 'bg-gray-200'
            }`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                darkMode ? 'translate-x-4' : ''
              }`} />
            </div>
          </button>

          {/* Venue info */}
          <div className={`px-4 py-3 my-2 rounded-xl ${
            darkMode ? 'bg-ocean-700/50' : 'bg-gray-100'
          }`}>
            <p className={`text-xs uppercase tracking-wider ${darkMode ? 'text-text-muted' : 'text-[#1a1a1a]/40'}`}>Venue</p>
            <p className={`text-sm font-medium truncate ${darkMode ? 'text-text-primary' : 'text-[#1a1a1a]'}`}>{venueName}</p>
            <p className={`text-xs mt-1 truncate ${darkMode ? 'text-text-muted' : 'text-[#1a1a1a]/50'}`}>{userEmail}</p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
              darkMode
                ? 'text-text-muted hover:bg-ocean-700/50 hover:text-text-primary'
                : 'text-[#1a1a1a]/70 hover:bg-red-50 hover:text-red-600'
            }`}
          >
            <LogOut className="w-5 h-5" />
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 p-8 overflow-auto ${darkMode ? 'dark-scrollbar' : ''}`}>
        <div className="relative">
          {/* Background blobs */}
          {darkMode ? (
            <>
              <div className="blob blob-coral w-[400px] h-[400px] -top-32 right-0 opacity-5" />
              <div className="blob blob-ocean w-[300px] h-[300px] bottom-0 left-1/4 opacity-10" />
            </>
          ) : (
            <>
              <div className="absolute -top-32 right-0 w-[400px] h-[400px] rounded-full bg-[#1e3a5f]/5 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-[#FF6B5A]/5 blur-3xl pointer-events-none" />
            </>
          )}

          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
