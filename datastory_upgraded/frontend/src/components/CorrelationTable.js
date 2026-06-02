import React from 'react';

const strengthColor = {
  'very strong': '#10b981',
  'strong': '#34d399',
  'moderate': '#fbbf24',
  'weak': '#94a3b8',
  'negligible': '#475569',
};

export default function CorrelationTable({ topPairs, outliers, trends }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Top Correlations */}
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 16 }}>
          Top Correlated Variable Pairs
        </h3>
        {!topPairs?.length ? (
          <p style={{ color: 'var(--text-muted)' }}>Not enough numeric columns for correlation analysis.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topPairs.map((pair, i) => {
              const pct = Math.abs(pair.correlation) * 100;
              const color = strengthColor[pair.strength] || 'var(--primary-light)';
              return (
                <div key={i} style={{
                  padding: '14px 18px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  animation: `fadeUp 0.4s ease ${i * 0.06}s both`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                      <span style={{ color: 'var(--accent)' }}>{pair.col1}</span>
                      <span style={{ color: 'var(--text-faint)', margin: '0 8px' }}>↔</span>
                      <span style={{ color: 'var(--accent)' }}>{pair.col2}</span>
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {pair.direction} · {pair.strength} correlation
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <div style={{ width: 120, height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: color, borderRadius: 3,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: 16, color, minWidth: 50, textAlign: 'right',
                    }}>
                      {pair.correlation > 0 ? '+' : ''}{pair.correlation.toFixed(3)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trends */}
      {trends?.length > 0 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 16 }}>
            Temporal Trends
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {trends.map((t, i) => (
              <div key={i} style={{
                padding: 16,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
              }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                  {t.column}
                </p>
                <p style={{ fontSize: 13, color: t.trend_direction === 'upward' ? '#34d399' : '#fca5a5', marginBottom: 4 }}>
                  {t.trend_direction === 'upward' ? '↗' : '↘'} {t.trend_direction} trend
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  R² = {t.r_squared} · {t.significant ? '✅ statistically significant' : '⚠️ not significant'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
