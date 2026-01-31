'use client'

import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Check if dismissed recently (within 7 days)
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10)
      const sevenDays = 7 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedAt < sevenDays) {
        return
      }
    }

    // Detect iOS
    const ua = window.navigator.userAgent
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream
    setIsIOS(isIOSDevice)

    // For iOS, show after a delay
    if (isIOSDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 3000)
      return () => clearTimeout(timer)
    }

    // For Android/Chrome, listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm animate-in slide-in-from-bottom-4">
      <div className="bg-white rounded-2xl shadow-xl border border-[#1a1a1a]/10 p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 text-[#1a1a1a]/40 hover:text-[#1a1a1a]/60 transition"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-[#722F37]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-[#722F37]" />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="font-semibold text-[#1a1a1a] mb-1">Add to Home Screen</h3>
            {isIOS ? (
              <p className="text-sm text-[#1a1a1a]/60">
                Tap the share button, then &quot;Add to Home Screen&quot; for quick access.
              </p>
            ) : (
              <p className="text-sm text-[#1a1a1a]/60">
                Install Eatsight for faster access and an app-like experience.
              </p>
            )}
          </div>
        </div>

        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="mt-4 w-full py-2.5 bg-[#722F37] text-white rounded-xl font-medium hover:bg-[#5a252c] transition"
          >
            Install App
          </button>
        )}
      </div>
    </div>
  )
}
