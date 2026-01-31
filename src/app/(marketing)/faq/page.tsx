import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    category: 'For Restaurants',
    questions: [
      {
        q: 'What is Eatsight?',
        a: 'Eatsight is a menu intelligence platform that helps your guests find dishes they\'ll love. Guests scan a QR code, answer 3 quick questions, and get personalized recommendations from your menu.'
      },
      {
        q: 'How does it work?',
        a: 'You upload your menu and tag each item with flavor profiles, dietary info, and mood descriptors. When guests scan your QR code, our algorithm matches their preferences to your dishes and recommends the best options.'
      },
      {
        q: 'How long does setup take?',
        a: 'Most restaurants are up and running within 30 minutes. Upload your menu via CSV, add tags to your items, and print your QR code. That\'s it!'
      },
      {
        q: 'Can you set up my menu for me?',
        a: 'Yes! We offer a Done-for-you setup service where we\'ll upload and tag your entire menu. Contact us for pricing.'
      },
      {
        q: 'What does it cost?',
        a: 'Eatsight costs €295/month or €249/month when billed annually (€2,988/year). Every plan includes a 14-day free trial with no credit card required.'
      },
      {
        q: 'Can I try it before committing?',
        a: 'Absolutely! Start your 14-day free trial today. No credit card required. Cancel anytime.'
      },
      {
        q: 'What data do I get?',
        a: 'Your dashboard shows: how many guests use Mesa, what flavors and moods they\'re craving, which dishes get the most interest, and real-time activity. Use these insights to optimize your menu.'
      },
      {
        q: 'Do guests need to download an app?',
        a: 'No! Guests simply scan a QR code with their phone camera. It opens in their browser instantly - no app download required.'
      },
    ]
  },
  {
    category: 'For Guests',
    questions: [
      {
        q: 'What is Mesa?',
        a: 'Mesa is the guest-facing experience powered by Eatsight. Scan a QR code at participating restaurants to get personalized menu recommendations based on your mood and preferences.'
      },
      {
        q: 'Do I need to create an account?',
        a: 'No! Mesa works instantly without any signup. Just scan, answer 3 questions, and get recommendations.'
      },
      {
        q: 'Is my data stored?',
        a: 'We don\'t store any personal information. Your preferences are used only for that session to generate recommendations. See our Privacy Policy for details.'
      },
      {
        q: 'How accurate are the recommendations?',
        a: 'Our algorithm matches your stated preferences (mood, dietary needs, flavor preferences) with the restaurant\'s menu tags. The more detailed the restaurant\'s tagging, the better the recommendations.'
      },
    ]
  },
  {
    category: 'Technical',
    questions: [
      {
        q: 'What file format should my menu be in?',
        a: 'We accept CSV files. Download our template from the dashboard for the correct format. You can also add items manually one by one.'
      },
      {
        q: 'Can I update my menu after setup?',
        a: 'Yes! Add, edit, or remove items anytime from your dashboard. Changes appear instantly for guests.'
      },
      {
        q: 'Does it work with my POS system?',
        a: 'Currently, Eatsight is a standalone system. POS integrations are on our roadmap. Contact us if you\'re interested in early access.'
      },
      {
        q: 'What languages are supported?',
        a: 'The interface is currently in English. Your menu items can be in any language. Multi-language support is coming soon.'
      },
    ]
  },
  {
    category: 'Billing',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards and iDEAL (for Dutch customers) via Stripe.'
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes! Cancel your subscription anytime from your dashboard. You\'ll retain access until the end of your billing period.'
      },
      {
        q: 'Do you offer refunds?',
        a: 'We offer a full refund within the first 14 days if you\'re not satisfied. After that, you can cancel anytime but we don\'t offer partial refunds.'
      },
      {
        q: 'Is there a setup fee?',
        a: 'No setup fee for self-service. Our Done-for-you menu upload service has a one-time fee - contact us for details.'
      },
    ]
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
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

      <main id="main-content" className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl sm:text-4xl font-serif text-[#1a1a1a] mb-4 text-center">
          Frequently Asked Questions
        </h1>
        <p className="text-[#1a1a1a]/60 text-center mb-12">
          Everything you need to know about Eatsight and Mesa
        </p>

        <div className="space-y-12">
          {faqs.map((category) => (
            <section key={category.category}>
              <h2 className="text-xl font-semibold text-[#1a1a1a] mb-6 pb-2 border-b border-[#1a1a1a]/10">
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((faq, i) => (
                  <details
                    key={i}
                    className="group bg-white rounded-xl border border-[#1a1a1a]/5 overflow-hidden"
                  >
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                      <span className="font-medium text-[#1a1a1a] pr-4">
                        {faq.q}
                      </span>
                      <ChevronDown
                        size={20}
                        className="text-[#1a1a1a]/40 group-open:rotate-180 transition-transform flex-shrink-0"
                      />
                    </summary>
                    <div className="px-4 pb-4">
                      <p className="text-[#1a1a1a]/70">{faq.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-16 text-center bg-white rounded-2xl border border-[#1a1a1a]/5 p-8">
          <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">
            Still have questions?
          </h2>
          <p className="text-[#1a1a1a]/60 mb-6">
            We&apos;re here to help. Reach out anytime.
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-[#722F37] text-white rounded-xl hover:bg-[#5a252c] transition"
          >
            Contact Us
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a]/5 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-[#1a1a1a]/50">
          © 2025 Eatsight. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
