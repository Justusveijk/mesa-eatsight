import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/" className="font-serif text-2xl text-[#1a1a1a]">Mesa</Link>
        <Link href="/login" className="text-[#722F37]">Sign in</Link>
      </header>

      <main className="px-6 py-16 max-w-3xl mx-auto">
        <h1 className="text-4xl font-serif text-[#1a1a1a] mb-8">Terms of Service</h1>

        <div className="prose text-[#1a1a1a]/70 space-y-6">
          <p><em>Last updated: January 2026</em></p>

          <h2 className="text-xl font-medium text-[#1a1a1a] mt-8">Service</h2>
          <p>
            Mesa provides menu recommendation technology for restaurants.
            Eatsight provides analytics dashboards for restaurant operators.
          </p>

          <h2 className="text-xl font-medium text-[#1a1a1a] mt-8">Your account</h2>
          <p>
            You&apos;re responsible for maintaining the security of your account and password.
          </p>

          <h2 className="text-xl font-medium text-[#1a1a1a] mt-8">Billing</h2>
          <p>
            Subscriptions are billed monthly or annually. You can cancel anytime.
            We offer a 14-day free trial for new accounts.
          </p>

          <h2 className="text-xl font-medium text-[#1a1a1a] mt-8">Acceptable use</h2>
          <p>
            Don&apos;t use our service for anything illegal or harmful.
          </p>

          <h2 className="text-xl font-medium text-[#1a1a1a] mt-8">Contact</h2>
          <p>
            Questions? Email us at{' '}
            <a href="mailto:legal@eatsight.com" className="text-[#722F37]">legal@eatsight.com</a>
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
