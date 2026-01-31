'use client'

export function AnimatedGradient() {
  return (
    <>
      <style>{`
        @keyframes blobMove1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(100px, 50px) scale(1.1); }
          66% { transform: translate(50px, 100px) scale(0.9); }
        }
        @keyframes blobMove2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-80px, -60px) scale(1.15); }
          66% { transform: translate(-40px, -100px) scale(0.95); }
        }
        @keyframes blobMove3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.3); }
        }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(114, 47, 55, 0.5)',
            filter: 'blur(80px)',
            top: '-100px',
            left: '-100px',
            animation: 'blobMove1 20s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(114, 47, 55, 0.4)',
            filter: 'blur(80px)',
            bottom: '-100px',
            right: '-100px',
            animation: 'blobMove2 25s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(180, 100, 100, 0.3)',
            filter: 'blur(80px)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'blobMove3 18s ease-in-out infinite',
          }}
        />
      </div>
    </>
  )
}
