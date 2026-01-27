export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen gradient-eatsight relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob blob-coral w-[400px] h-[400px] -top-32 -right-32" />
      <div className="blob blob-ocean w-[400px] h-[400px] bottom-0 -left-32" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  )
}
