'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VenueNotFound() {
  return (
    <div className="min-h-screen bg-mesa-ivory relative overflow-hidden">
      {/* Warm gradient blobs */}
      <div className="blob blob-mesa w-[400px] h-[400px] -top-32 -right-32 opacity-15" />
      <div className="blob blob-mesa w-[300px] h-[300px] bottom-0 -left-32 opacity-10" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12"
      >
        <div className="text-center max-w-sm">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}
            className="w-20 h-20 bg-mesa-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8"
          >
            <Search className="w-10 h-10 text-[#B2472A]" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold text-mesa-ink mb-4"
          >
            Venue not found
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-mesa-graphite mb-8"
          >
            We couldn&apos;t find the restaurant you&apos;re looking for. Please check the URL or scan the QR code again.
          </motion.p>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/">
              <Button variant="mesa-outline" size="lg" className="w-full">
                Go to homepage
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
