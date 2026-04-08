import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const size = {
  width: 32,
  height: 32,
}
 
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#1E5631',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '20%',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M120 192L120 160L352 160L352 128L416 176L352 224L352 192L120 192Z" fill="white"/>
          <path d="M392 320L392 352L160 352L160 384L96 336L160 288L160 320L392 320Z" fill="white"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
