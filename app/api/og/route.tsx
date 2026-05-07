import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1E5631',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Icon card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '48px',
            padding: '48px 64px',
            gap: '32px',
          }}
        >
          {/* SVG arrows icon */}
          <svg
            width="160"
            height="160"
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="512" height="512" rx="115" fill="white" fillOpacity="0.15" />
            <path
              d="M120 192L120 160L352 160L352 128L416 176L352 224L352 192L120 192Z"
              fill="white"
            />
            <path
              d="M392 320L392 352L160 352L160 384L96 336L160 288L160 320L392 320Z"
              fill="white"
            />
          </svg>

          {/* DartSwap wordmark */}
          <div
            style={{
              display: 'flex',
              fontSize: '80px',
              fontWeight: '800',
              color: 'white',
              letterSpacing: '-2px',
            }}
          >
            DartSwap
          </div>

          {/* Tagline */}
          <div
            style={{
              display: 'flex',
              fontSize: '32px',
              fontWeight: '400',
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: '0.5px',
            }}
          >
            Buy. Sell. Repeat.
          </div>
        </div>

        {/* Bottom label */}
        <div
          style={{
            display: 'flex',
            marginTop: '40px',
            fontSize: '24px',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          Dartmouth&apos;s Clothing Marketplace
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
