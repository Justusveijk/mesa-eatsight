import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Eatsight - Menu Intelligence Platform'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        {/* Decorative gradient circles */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(114,47,55,0.3) 0%, transparent 70%)',
            top: '-200px',
            left: '-100px',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(114,47,55,0.2) 0%, transparent 70%)',
            bottom: '-100px',
            right: '-50px',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              background: '#722F37',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '36px',
              marginRight: '16px',
            }}
          >
            E
          </div>
          <span style={{ color: 'white', fontSize: '48px' }}>Eatsight</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '64px',
            color: 'white',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          Three questions.
        </div>
        <div
          style={{
            fontSize: '64px',
            color: 'white',
            fontStyle: 'italic',
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          Perfect match.
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '24px',
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
          }}
        >
          Menu intelligence that delights your guests
        </div>
      </div>
    ),
    { ...size }
  )
}
