export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen gradient-eatsight relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob blob-coral w-[400px] h-[400px] -top-32 -right-32" />
      <div className="blob blob-ocean w-[500px] h-[500px] top-1/2 -left-64" />
      <div className="blob blob-coral w-[300px] h-[300px] bottom-32 right-1/4 opacity-10" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
