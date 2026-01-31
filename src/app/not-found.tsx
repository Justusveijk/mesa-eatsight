import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1a1a1a]/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-serif text-[#1a1a1a]">
            Eatsight
          </Link>
          <Link
            href="/login"
            className="text-sm text-[#1a1a1a]/70 hover:text-[#1a1a1a]"
          >
            Log in
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="text-center max-w-md">
          {/* Menu-themed 404 illustration */}
          <div className="mb-8">
            <div className="w-32 h-40 mx-auto bg-white rounded-lg shadow-lg border border-[#1a1a1a]/10 p-4 relative transform -rotate-3">
              {/* Menu header */}
              <div className="border-b border-[#1a1a1a]/10 pb-2 mb-3">
                <div className="h-2 w-16 bg-[#1a1a1a]/10 rounded mx-auto" />
              </div>
              {/* Menu lines */}
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-[#1a1a1a]/5 rounded" />
                <div className="h-1.5 w-3/4 bg-[#1a1a1a]/5 rounded" />
                <div className="h-1.5 w-full bg-[#1a1a1a]/5 rounded" />
                <div className="h-1.5 w-2/3 bg-[#1a1a1a]/5 rounded" />
              </div>
              {/* Question mark overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl opacity-20">?</span>
              </div>
            </div>
          </div>

          <h1 className="text-6xl font-serif text-[#722F37] mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-4">
            This page isn&apos;t on the menu
          </h2>
          <p className="text-[#1a1a1a]/60 mb-8">
            Looks like this dish got 86&apos;d. The page you&apos;re looking for
            doesn&apos;t exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#722F37] text-white rounded-xl hover:bg-[#5a252c] transition font-medium"
            >
              Back to Home
            </Link>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 border border-[#1a1a1a]/20 text-[#1a1a1a] rounded-xl hover:bg-[#1a1a1a]/5 transition font-medium"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a]/5 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[#1a1a1a]/50">
          <p>© 2025 Eatsight. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/faq" className="hover:text-[#1a1a1a]">FAQ</Link>
            <Link href="/about" className="hover:text-[#1a1a1a]">About</Link>
            <Link href="/privacy" className="hover:text-[#1a1a1a]">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
