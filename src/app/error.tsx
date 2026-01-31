'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">😕</div>
        <h1 className="text-2xl font-serif text-[#1a1a1a] mb-4">
          Something went wrong
        </h1>
        <p className="text-[#1a1a1a]/60 mb-8">
          We&apos;re sorry, but something unexpected happened. Please try again.
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
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-8 p-4 bg-red-50 rounded-lg text-left text-sm text-red-800 overflow-auto max-h-48">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        )}
      </div>
    </div>
  )
}
