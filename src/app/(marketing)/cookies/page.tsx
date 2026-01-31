import Link from 'next/link'

export const metadata = {
  title: 'Cookie Policy',
  description: 'Learn about how Eatsight uses cookies.',
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-[#1a1a1a]/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-serif text-[#1a1a1a]">Eatsight</Link>
          <Link href="/login" className="text-sm text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition-colors">Log in</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-serif text-[#1a1a1a] mb-8">Cookie Policy</h1>

        <div className="prose prose-lg text-[#1a1a1a]/80 space-y-6">
          <p className="text-[#1a1a1a]/50">
            Last updated: January 2025
          </p>

          <h2 className="text-xl font-semibold text-[#1a1a1a] mt-8 mb-4">What are cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website.
            They help websites remember your preferences and improve your experience.
          </p>

          <h2 className="text-xl font-semibold text-[#1a1a1a] mt-8 mb-4">How we use cookies</h2>

          <h3 className="text-lg font-medium text-[#1a1a1a] mt-6 mb-3">Essential cookies</h3>
          <p>
            Required for the website to function. These cannot be disabled.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Authentication and session management</li>
            <li>Security features</li>
            <li>Cookie consent preferences</li>
          </ul>

          <h3 className="text-lg font-medium text-[#1a1a1a] mt-6 mb-3">Analytics cookies</h3>
          <p>
            Help us understand how visitors use our website.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Page views and navigation patterns</li>
            <li>Device and browser information</li>
            <li>Approximate location (country level)</li>
          </ul>

          <h2 className="text-xl font-semibold text-[#1a1a1a] mt-8 mb-4">Managing cookies</h2>
          <p>
            You can control cookies through your browser settings. Note that disabling
            certain cookies may affect website functionality.
          </p>

          <h2 className="text-xl font-semibold text-[#1a1a1a] mt-8 mb-4">Contact</h2>
          <p>
            Questions about our cookie policy? Contact us at{' '}
            <a href="mailto:privacy@eatsight.io" className="text-[#722F37]">
              privacy@eatsight.io
            </a>
          </p>
        </div>

        <div className="mt-12">
          <Link href="/" className="text-[#722F37] hover:text-[#5a252c]">
            &larr; Back to home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} Eatsight. All rights reserved.
          </p>
          <div className="flex gap-6 text-white/40 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
