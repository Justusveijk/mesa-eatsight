'use client'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6" role="img" aria-label="No connection">
          📡
        </div>
        <h1 className="text-2xl font-semibold text-[#1a1a1a] mb-4">
          You&apos;re offline
        </h1>
        <p className="text-[#1a1a1a]/60 mb-8">
          Please check your internet connection and try again. Some features may be unavailable while offline.
        </p>
        <button
          onClick={handleRetry}
          className="px-6 py-3 bg-[#722F37] text-white rounded-xl hover:bg-[#5a252c] transition font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
