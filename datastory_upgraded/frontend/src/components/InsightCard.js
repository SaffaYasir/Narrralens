import React from 'react';

const typeColors = {
  positive: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.35)', text: '#34d399', badge: '#064e3b' },
  negative: { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.35)',  text: '#fca5a5', badge: '#7f1d1d' },
  warning:  { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.35)', text: '#fbbf24', badge: '#78350f' },
  neutral:  { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.35)', text: '#a5b4fc', badge: '#1e1b4b' },
};

const iconMap = {
  'trend-up':   '📈',
  'trend-down': '📉',
  'alert':      '⚠️',
  'star':       '⭐',
  'chart':      '📊',
  'info':       'ℹ️',
};

export default function InsightCard({ card, delay = 0 }) {
  const colors = typeColors[card.type] || typeColors.neutral;

  return (
    <div style={{
      padding: '18px 20px',
      background: colors.bg,
      border: `1.5px solid ${colors.border}`,
      borderRadius: 'var(--radius)',
      animation: `fadeUp 0.4s ease ${delay}s both`,
      display: 'flex', flexDirection: 'column', gap: 6,
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
      minHeight: 100,
    }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${colors.border}`; }}
      onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11,
          color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {card.title}
        </span>
        <span style={{ fontSize: 18, lineHeight: 1 }}>{iconMap[card.icon] || '📊'}</span>
      </div>
      <p style={{
        fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: 'clamp(20px, 3vw, 28px)',
        color: colors.text, lineHeight: 1.1,
        wordBreak: 'break-word',
      }}>
        {card.value}
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 2 }}>
        {card.description}
      </p>
    </div>
  );
}
