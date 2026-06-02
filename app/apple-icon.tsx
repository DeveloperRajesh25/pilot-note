import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
          <div style={{ width: '20px', height: '55px', background: 'white', borderRadius: '6px' }} />
          <div style={{ width: '20px', height: '80px', background: '#10b981', borderRadius: '6px' }} />
          <div style={{ width: '20px', height: '55px', background: 'white', borderRadius: '6px' }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
