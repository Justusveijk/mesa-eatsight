'use client'

import Link from 'next/link'
import { useState } from 'react'

const team = [
  {
    name: 'Justus van Eijk',
    role: 'Founder & CEO',
    bio: 'Artificial intelligence student with an ambition for finding smart solutions.',
    image: '/team/justus.jpg',
    linkedin: 'https://linkedin.com/in/justus-van-eijk',
  },
]

function TeamMemberImage({ member }: { member: typeof team[0] }) {
  const [imageError, setImageError] = useState(false)

  if (imageError || !member.image) {
    return (
      <div className="w-full h-full flex items-center justify-center text-4xl">
        👤
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={member.image}
      alt={member.name}
      className="w-full h-full object-cover"
      onError={() => setImageError(true)}
    />
  )
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/" className="font-serif text-2xl text-[#1a1a1a]">Eatsight</Link>
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

        {/* Team Section */}
        <section className="mt-16">
          <h2 className="text-2xl font-serif text-[#1a1a1a] mb-8 text-center">
            Meet the Team
          </h2>

          <div className="flex justify-center">
            {team.map((member) => (
              <div key={member.name} className="text-center max-w-xs">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-[#F5F3EF] overflow-hidden">
                  <TeamMemberImage member={member} />
                </div>
                <h3 className="font-semibold text-[#1a1a1a]">{member.name}</h3>
                <p className="text-sm text-[#722F37] mb-2">{member.role}</p>
                <p className="text-sm text-[#1a1a1a]/60">{member.bio}</p>
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-[#1a1a1a]/40 hover:text-[#722F37] transition"
                    aria-label={`${member.name} on LinkedIn`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

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
