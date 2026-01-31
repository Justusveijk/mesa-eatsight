'use client'

export function AnimatedGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient blobs */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-3xl animate-gradient-1"
        style={{
          background: 'radial-gradient(circle, rgba(114,47,55,0.4) 0%, transparent 70%)',
          top: '-20%',
          left: '-10%',
        }}
      />
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl animate-gradient-2"
        style={{
          background: 'radial-gradient(circle, rgba(114,47,55,0.3) 0%, transparent 70%)',
          bottom: '-10%',
          right: '-5%',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-3xl animate-gradient-3"
        style={{
          background: 'radial-gradient(circle, rgba(253,251,247,0.1) 0%, transparent 70%)',
          top: '30%',
          right: '20%',
        }}
      />
    </div>
  )
}
