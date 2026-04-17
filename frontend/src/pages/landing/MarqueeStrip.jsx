import React from 'react';

const ITEMS = [
  '🔧 MH Request Management',
  '📊 Vendor Intelligence',
  '📍 Plant Location Mapping',
  '📁 Document Vault',
  '👥 Employee Master',
  '🏭 Asset Lifecycle Tracking',
  '📈 Live Analytics Dashboard',
  '🔐 Role-Based Access Control',
  '🔄 Automated Data Flow',
  '📋 Audit Trail',
  '📤 Report Generation',
  '⚡ Real-Time Sync',
];

export default function MarqueeStrip() {
  return (
    <div style={{
      background: '#1B3A7A',
      borderTop: '1px solid #162E63',
      borderBottom: '1px solid #162E63',
      overflow: 'hidden',
      padding: '14px 0',
      position: 'relative',
    }}>
      {/* Fade edges */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 100, zIndex: 2,
        background: 'linear-gradient(to right, #1B3A7A, transparent)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 100, zIndex: 2,
        background: 'linear-gradient(to left, #1B3A7A, transparent)',
        pointerEvents: 'none',
      }} />

      {/* Scrolling track */}
      <div style={{
        display: 'flex', gap: 0,
        animation: 'marquee-scroll 30s linear infinite',
        width: 'fit-content',
      }}>
        {/* Duplicate for seamless loop */}
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0 28px', whiteSpace: 'nowrap',
              fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
              letterSpacing: '0.02em',
            }}
          >
            {item}
            <span style={{
              width: 4, height: 4, borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)', flexShrink: 0,
              marginLeft: 20,
            }} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
