import Link from 'next/link'
import { Mail, MapPin, MessageCircle, Camera } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="px-6 py-4 flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/" className="font-serif text-2xl text-[#1a1a1a]">Mesa</Link>
        <Link href="/login" className="text-[#722F37]">Sign in</Link>
      </header>

      <main className="px-6 py-16 max-w-xl mx-auto text-center">
        <h1 className="text-4xl font-serif text-[#1a1a1a] mb-4">Get in touch</h1>
        <p className="text-[#1a1a1a]/60 mb-12">
          We&apos;d love to hear from you. Whether you&apos;re a restaurant owner interested in Mesa,
          or just want to say hello.
        </p>

        <div className="space-y-6">
          <div className="p-6 bg-white rounded-2xl border border-[#1a1a1a]/5">
            <div className="w-10 h-10 rounded-lg bg-[#722F37]/10 flex items-center justify-center mx-auto mb-3">
              <Mail className="w-5 h-5 text-[#722F37]" />
            </div>
            <h3 className="font-medium text-[#1a1a1a] mb-1">Email us</h3>
            <a
              href="mailto:hello@eatsight.com"
              className="text-[#722F37] hover:text-[#5a252c]"
            >
              hello@eatsight.com
            </a>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-[#1a1a1a]/5">
            <div className="w-10 h-10 rounded-lg bg-[#722F37]/10 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-5 h-5 text-[#722F37]" />
            </div>
            <h3 className="font-medium text-[#1a1a1a] mb-1">Visit us</h3>
            <p className="text-[#1a1a1a]/60">
              Amsterdam, Netherlands
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-[#1a1a1a]/5">
            <div className="w-10 h-10 rounded-lg bg-[#722F37]/10 flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-5 h-5 text-[#722F37]" />
            </div>
            <h3 className="font-medium text-[#1a1a1a] mb-1">Schedule a demo</h3>
            <p className="text-[#1a1a1a]/60 mb-3">
              Want to see Mesa in action?
            </p>
            <Link
              href="/signup"
              className="inline-block px-6 py-2 bg-[#722F37] text-white rounded-full text-sm"
            >
              Start free trial
            </Link>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-[#1a1a1a]/5">
            <div className="w-10 h-10 rounded-lg bg-[#722F37]/10 flex items-center justify-center mx-auto mb-3">
              <Camera className="w-5 h-5 text-[#722F37]" />
            </div>
            <h3 className="font-medium text-[#1a1a1a] mb-1">Follow us</h3>
            <div className="space-y-2">
              <a
                href="https://instagram.com/eatsight.io"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[#722F37] hover:text-[#5a252c]"
              >
                @eatsight.io
              </a>
              <a
                href="https://instagram.com/mesa.menu"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[#722F37] hover:text-[#5a252c]"
              >
                @mesa.menu
              </a>
            </div>
          </div>
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
