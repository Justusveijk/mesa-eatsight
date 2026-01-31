'use client'

export function AnimatedGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Embedded keyframes for reliable animation */}
      <style>{`
        @keyframes blob1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, 50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.95);
          }
        }
        @keyframes blob2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-40px, -30px) scale(1.05);
          }
          66% {
            transform: translate(30px, -50px) scale(1.1);
          }
        }
        @keyframes blob3 {
          0%, 100% {
            transform: translateX(-50%) scale(1);
          }
          50% {
            transform: translateX(-50%) scale(1.2);
          }
        }
      `}</style>

      {/* Blob 1 - top left, burgundy */}
      <div
        className="absolute rounded-full"
        style={{
          width: '600px',
          height: '600px',
          background: 'rgba(114, 47, 55, 0.4)',
          filter: 'blur(100px)',
          top: '-10%',
          left: '-5%',
          animation: 'blob1 20s ease-in-out infinite',
        }}
      />

      {/* Blob 2 - bottom right, burgundy lighter */}
      <div
        className="absolute rounded-full"
        style={{
          width: '500px',
          height: '500px',
          background: 'rgba(114, 47, 55, 0.3)',
          filter: 'blur(120px)',
          bottom: '-15%',
          right: '-10%',
          animation: 'blob2 25s ease-in-out infinite',
        }}
      />

      {/* Blob 3 - center, subtle warm */}
      <div
        className="absolute rounded-full"
        style={{
          width: '400px',
          height: '400px',
          background: 'rgba(180, 100, 100, 0.25)',
          filter: 'blur(80px)',
          top: '40%',
          left: '50%',
          transform: 'translateX(-50%)',
          animation: 'blob3 18s ease-in-out infinite',
        }}
      />
    </div>
  )
}
