'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-6">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">📊</div>
        <h1 className="text-2xl font-serif text-[#1a1a1a] mb-4">
          Dashboard Error
        </h1>
        <p className="text-[#1a1a1a]/60 mb-8">
          We couldn&apos;t load your dashboard. This might be a temporary issue.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#722F37] text-white rounded-xl font-medium hover:bg-[#5a252c] transition"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-[#1a1a1a]/20 rounded-xl font-medium hover:border-[#1a1a1a]/40 transition"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
