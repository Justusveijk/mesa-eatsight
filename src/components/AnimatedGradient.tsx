'use client'

export function AnimatedGradient() {
  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 0%;
          }
          25% {
            background-position: 50% 100%;
          }
          50% {
            background-position: 100% 50%;
          }
          75% {
            background-position: 50% 0%;
          }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 20% 30%, rgba(114, 47, 55, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(114, 47, 55, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(160, 80, 80, 0.2) 0%, transparent 40%)
          `,
          backgroundSize: '200% 200%',
          animation: 'gradientShift 15s ease-in-out infinite',
        }}
      />
    </>
  )
}
