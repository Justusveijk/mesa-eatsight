export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#722F37] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-[#1a1a1a]/50 text-sm">Loading...</p>
      </div>
    </div>
  )
}
