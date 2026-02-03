'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface FooterProps {
  variant?: 'default' | 'minimal'
}

export function Footer({ variant = 'default' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  if (variant === 'minimal') {
    return (
      <footer className="py-6 px-4 text-center">
        <p className="text-xs text-mesa-charcoal/40">
          © {currentYear} Mesa. All rights reserved.
        </p>
      </footer>
    )
  }

  return (
    <footer className="glass border-t border-mesa-charcoal/5">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-mesa-burgundy flex items-center justify-center">
                <span className="text-white font-serif text-lg">M</span>
              </div>
              <span className="font-serif text-xl text-mesa-charcoal">Mesa</span>
            </Link>
            <p className="text-sm text-mesa-charcoal/50 mt-4">
              The intelligent menu platform for modern restaurants.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-mesa-charcoal mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-sm text-mesa-charcoal/60 hover:text-mesa-charcoal transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-mesa-charcoal/60 hover:text-mesa-charcoal transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="text-sm text-mesa-charcoal/60 hover:text-mesa-charcoal transition">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="text-sm text-mesa-charcoal/60 hover:text-mesa-charcoal transition">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-mesa-charcoal mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-mesa-charcoal/60 hover:text-mesa-charcoal transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-mesa-charcoal/60 hover:text-mesa-charcoal transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm text-mesa-charcoal/60 hover:text-mesa-charcoal transition">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-mesa-charcoal/60 hover:text-mesa-charcoal transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-mesa-charcoal mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-mesa-charcoal/60 hover:text-mesa-charcoal transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-mesa-charcoal/60 hover:text-mesa-charcoal transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-mesa-charcoal/60 hover:text-mesa-charcoal transition">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 pt-8 border-t border-mesa-charcoal/5 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <p className="text-xs text-mesa-charcoal/40">
            © {currentYear} Mesa. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://twitter.com/mesa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mesa-charcoal/40 hover:text-mesa-charcoal transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com/company/mesa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mesa-charcoal/40 hover:text-mesa-charcoal transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="https://instagram.com/mesa"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mesa-charcoal/40 hover:text-mesa-charcoal transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
