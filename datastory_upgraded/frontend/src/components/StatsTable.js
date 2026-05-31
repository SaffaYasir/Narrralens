import React from 'react';

export default function StatsTable({ statistics }) {
  if (!statistics || Object.keys(statistics).length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>No numeric columns found.</p>;
  }

  const cols = Object.keys(statistics);
  const fields = ['mean', 'median', 'std', 'min', 'max', 'q1', 'q3', 'skewness', 'missing_pct'];
  const labels = { mean: 'Mean', median: 'Median', std: 'Std Dev', min: 'Min', max: 'Max', q1: 'Q1', q3: 'Q3', skewness: 'Skewness', missing_pct: 'Missing %' };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={thStyle(true)}>Column</th>
            {fields.map(f => <th key={f} style={thStyle()}>{labels[f]}</th>)}
          </tr>
        </thead>
        <tbody>
          {cols.map((col, i) => {
            const s = statistics[col];
            return (
              <tr key={col} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--bg2)' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface)' : 'var(--bg2)'}
              >
                <td style={{ ...tdStyle(), fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--accent)' }}>
                  {col}
                </td>
                {fields.map(f => (
                  <td key={f} style={tdStyle()}>
                    {f === 'missing_pct'
                      ? <span style={{ color: s[f] > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>{s[f]}%</span>
                      : <span>{formatNum(s[f])}</span>
                    }
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function thStyle(first = false) {
  return {
    padding: '12px 14px',
    textAlign: first ? 'left' : 'right',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: 12,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg2)',
    whiteSpace: 'nowrap',
  };
}

function tdStyle() {
  return {
    padding: '10px 14px',
    textAlign: 'right',
    borderBottom: '1px solid rgba(51,65,85,0.5)',
    color: 'var(--text)',
    transition: 'background 0.15s',
    whiteSpace: 'nowrap',
  };
}

function formatNum(n) {
  if (n === null || n === undefined) return '—';
  if (typeof n !== 'number') return n;
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return n.toFixed(4).replace(/\.?0+$/, '');
}
