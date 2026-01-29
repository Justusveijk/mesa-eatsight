import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/" className="font-serif text-2xl text-[#1a1a1a]">Mesa</Link>
        <Link href="/login" className="text-[#722F37]">Sign in</Link>
      </header>

      <main className="px-6 py-16 max-w-3xl mx-auto">
        <h1 className="text-4xl font-serif text-[#1a1a1a] mb-8">About Mesa & Eatsight</h1>

        <div className="prose prose-lg text-[#1a1a1a]/70 space-y-6">
          <p>
            Mesa was born from a simple observation: restaurant menus haven&apos;t evolved with technology.
            While everything else has become personalized, menus remain static pages that treat every guest the same.
          </p>

          <p>
            We&apos;re changing that. Mesa uses smart preference matching to help guests discover dishes
            they&apos;ll love, while Eatsight gives restaurant operators insights into what their guests actually want.
          </p>

          <h2 className="text-2xl font-serif text-[#1a1a1a] mt-12 mb-4">Our Mission</h2>
          <p>
            To make every dining experience more personal, one menu at a time.
          </p>

          <h2 className="text-2xl font-serif text-[#1a1a1a] mt-12 mb-4">Based in Amsterdam</h2>
          <p>
            We&apos;re a small team working out of Amsterdam, the Netherlands. We love good food,
            great hospitality, and building technology that makes both better.
          </p>
        </div>

        <div className="mt-12">
          <Link
            href="/"
            className="text-[#722F37] hover:text-[#5a252c]"
          >
            &larr; Back to home
          </Link>
        </div>
      </main>
    </div>
  )
}
