export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen gradient-eatsight relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob blob-ocean w-[500px] h-[500px] -top-64 -left-64" />
      <div className="blob blob-coral w-[400px] h-[400px] bottom-0 right-0 opacity-10" />

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  )
}
