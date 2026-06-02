import React, { useState } from 'react';

const TONES = ['professional', 'casual', 'technical', 'executive'];
const FOCUS_OPTIONS = ['correlations', 'anomalies', 'trends', 'statistics', 'recommendations'];
const DETAIL_LEVELS = ['brief', 'standard', 'detailed'];

export default function StoryPreferencesModal({ onGenerate, onClose, loading }) {
  const [tone, setTone] = useState('professional');
  const [focus, setFocus] = useState([]);
  const [detail, setDetail] = useState('standard');
  const [customNote, setCustomNote] = useState('');

  const toggleFocus = (f) => {
    setFocus(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(3,7,18,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 300, padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 32,
        animation: 'fadeUp 0.3s ease both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, marginBottom: 4 }}>
              ✨ Customize Your Story
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Choose how you want the AI to tell your data's story
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        {/* Tone */}
        <div style={{ marginBottom: 24 }}>
          <p style={sectionLabel}>Writing Tone</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TONES.map(t => (
              <button key={t} onClick={() => setTone(t)} style={chipStyle(tone === t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Focus */}
        <div style={{ marginBottom: 24 }}>
          <p style={sectionLabel}>Focus Areas <span style={{ fontWeight: 400, fontSize: 11 }}>(optional — select any)</span></p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FOCUS_OPTIONS.map(f => (
              <button key={f} onClick={() => toggleFocus(f)} style={chipStyle(focus.includes(f))}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Detail level */}
        <div style={{ marginBottom: 24 }}>
          <p style={sectionLabel}>Detail Level</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {DETAIL_LEVELS.map(d => (
              <button key={d} onClick={() => setDetail(d)} style={{ ...chipStyle(detail === d), flex: 1 }}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom note */}
        <div style={{ marginBottom: 28 }}>
          <p style={sectionLabel}>Custom Instructions <span style={{ fontWeight: 400, fontSize: 11 }}>(optional)</span></p>
          <textarea
            value={customNote}
            onChange={e => setCustomNote(e.target.value)}
            placeholder="e.g. Focus on sales performance, avoid technical jargon, highlight Q4 numbers..."
            rows={3}
            style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 8, color: 'var(--text)',
              fontSize: 13, fontFamily: 'var(--font-body)',
              resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px',
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 10, color: 'var(--text-muted)',
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
            cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button
            onClick={() => onGenerate({ tone, focus, detail, custom_note: customNote })}
            disabled={loading}
            style={{
              flex: 2, padding: '12px',
              background: loading ? 'var(--bg2)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              border: 'none', borderRadius: 10, color: 'white',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.4)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '⏳ Generating PDF...' : '⬇ Generate Custom Report →'}
          </button>
        </div>
      </div>
    </div>
  );
}

const sectionLabel = {
  fontSize: 11, fontFamily: 'var(--font-display)',
  fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.06em', color: 'var(--text-muted)',
  marginBottom: 10,
};

function chipStyle(active) {
  return {
    padding: '7px 16px',
    background: active ? 'var(--primary)' : 'var(--bg2)',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
    borderRadius: 100, color: active ? 'white' : 'var(--text-muted)',
    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
    cursor: 'pointer', transition: 'all 0.15s',
    boxShadow: active ? '0 2px 10px rgba(99,102,241,0.4)' : 'none',
  };
}
