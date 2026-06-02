import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
          <div style={{ width: '5px', height: '14px', background: 'white', borderRadius: '2px' }} />
          <div style={{ width: '5px', height: '20px', background: '#10b981', borderRadius: '2px' }} />
          <div style={{ width: '5px', height: '14px', background: 'white', borderRadius: '2px' }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
