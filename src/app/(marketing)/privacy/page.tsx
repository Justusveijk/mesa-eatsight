import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/" className="font-serif text-2xl text-[#1a1a1a]">Mesa</Link>
        <Link href="/login" className="text-[#722F37]">Sign in</Link>
      </header>

      <main className="px-6 py-16 max-w-3xl mx-auto">
        <h1 className="text-4xl font-serif text-[#1a1a1a] mb-8">Privacy Policy</h1>

        <div className="prose text-[#1a1a1a]/70 space-y-6">
          <p><em>Last updated: January 2026</em></p>

          <h2 className="text-xl font-medium text-[#1a1a1a] mt-8">What we collect</h2>
          <p>
            For restaurant operators: email, venue information, and menu data.
            For guests: anonymous preference data to provide recommendations. We do not require accounts or personal information from guests.
          </p>

          <h2 className="text-xl font-medium text-[#1a1a1a] mt-8">How we use it</h2>
          <p>
            To provide personalized menu recommendations and analytics to restaurant operators.
            We never sell your data to third parties.
          </p>

          <h2 className="text-xl font-medium text-[#1a1a1a] mt-8">Cookies</h2>
          <p>
            We use essential cookies to keep you logged in. We don&apos;t use tracking cookies or third-party analytics.
          </p>

          <h2 className="text-xl font-medium text-[#1a1a1a] mt-8">Contact</h2>
          <p>
            Questions? Email us at{' '}
            <a href="mailto:privacy@eatsight.com" className="text-[#722F37]">privacy@eatsight.com</a>
          </p>
        </div>

        <div className="mt-12">
          <Link href="/" className="text-[#1a1a1a]/40 hover:text-[#1a1a1a]/60">
            &larr; Back to home
          </Link>
        </div>
      </main>
    </div>
  )
}
