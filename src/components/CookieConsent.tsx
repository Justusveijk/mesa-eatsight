'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setTimeout(() => setShowBanner(true), 1000)
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', 'all')
    setShowBanner(false)
  }

  const acceptEssential = () => {
    localStorage.setItem('cookie-consent', 'essential')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-[#1a1a1a]/10 p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="flex-1">
            <h3 className="font-semibold text-[#1a1a1a] mb-2">
              Cookie preferences
            </h3>
            <p className="text-sm text-[#1a1a1a]/60">
              We use cookies to improve your experience and analyze site traffic.
              See our{' '}
              <Link href="/cookies" className="text-[#722F37] underline">
                Cookie Policy
              </Link>
              {' '}for details.
            </p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={acceptEssential}
              className="flex-1 sm:flex-initial px-4 py-2 text-sm border border-[#1a1a1a]/20 rounded-xl hover:border-[#1a1a1a]/40 transition-colors"
            >
              Essential only
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 sm:flex-initial px-4 py-2 text-sm bg-[#722F37] text-white rounded-xl hover:bg-[#5a252c] transition-colors"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
