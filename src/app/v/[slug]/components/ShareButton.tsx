'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Check, Copy, Link2 } from 'lucide-react'

interface ShareButtonProps {
  venueName: string
  venueSlug: string
  recommendations: Array<{ name: string }>
}

export function ShareButton({ venueName, venueSlug, recommendations }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `/v/${venueSlug}`

  const shareText = [
    `My picks at ${venueName}:`,
    ...recommendations.slice(0, 3).map((item, i) => `${i + 1}. ${item.name}`),
    '',
    'Discover yours:',
  ].join('\n')

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [showMenu])

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const showCopiedFeedback = useCallback(() => {
    setCopied(true)
    setShowMenu(false)
    timerRef.current = setTimeout(() => setCopied(false), 2000)
  }, [])

  const handleShare = useCallback(async () => {
    // Try native share on mobile
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `My picks at ${venueName}`,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch {
        // User cancelled or share failed, fall through to dropdown
      }
    }

    // Desktop: show dropdown menu
    setShowMenu(prev => !prev)
  }, [venueName, shareText, shareUrl])

  const copyWithPicks = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      showCopiedFeedback()
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = `${shareText}\n${shareUrl}`
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      showCopiedFeedback()
    }
  }, [shareText, shareUrl, showCopiedFeedback])

  const copyLinkOnly = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      showCopiedFeedback()
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = shareUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      showCopiedFeedback()
    }
  }, [shareUrl, showCopiedFeedback])

  return (
    <div className="relative flex-1" ref={menuRef}>
      <button
        onClick={handleShare}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-full font-medium transition-all duration-300 ${
          copied
            ? 'bg-emerald-500 text-white'
            : 'mesa-btn'
        }`}
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Copied!
            </motion.div>
          ) : (
            <motion.div
              key="share"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Desktop dropdown */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-mesa-charcoal/10 overflow-hidden z-50"
          >
            <button
              onClick={copyWithPicks}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-mesa-charcoal/5 transition text-sm"
            >
              <Copy className="w-4 h-4 text-mesa-charcoal/50" />
              <span className="text-mesa-charcoal">Copy with picks</span>
            </button>
            <div className="h-px bg-mesa-charcoal/5" />
            <button
              onClick={copyLinkOnly}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-mesa-charcoal/5 transition text-sm"
            >
              <Link2 className="w-4 h-4 text-mesa-charcoal/50" />
              <span className="text-mesa-charcoal">Copy link only</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
