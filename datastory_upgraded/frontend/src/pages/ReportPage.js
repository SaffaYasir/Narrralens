import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import ChartBlock from '../components/ChartBlock';
import InsightCard from '../components/InsightCard';
import StatsTable from '../components/StatsTable';
import ChatPanel from '../components/ChatPanel';
import CorrelationTable from '../components/CorrelationTable';
import StoryPreferencesModal from '../components/StoryPreferencesModal';
import { useAuth } from '../context/AuthContext';

const SIDEBAR_W = 240;

export default function ReportPage() {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Loading dataset...');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('story');
  const [exporting, setExporting] = useState(false);
  const [showPrefModal, setShowPrefModal] = useState(false);

  const loadingMessages = [
    'Loading your dataset...', 'Running statistical analysis...',
    'Detecting anomalies...', 'Computing correlations...',
    'Generating AI narrative...', 'Building charts...', 'Almost ready...',
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => { i = (i + 1) % loadingMessages.length; setLoadingMsg(loadingMessages[i]); }, 2200);
    axios.get(`/api/analyze/${fileId}`)
      .then(res => { setData(res.data); setLoading(false); clearInterval(interval); })
      .catch(err => { setError(err.response?.data?.error || 'Analysis failed.'); setLoading(false); clearInterval(interval); });
    return () => clearInterval(interval);
  }, [fileId]);

  const handleExport = async (preferences = null) => {
    setExporting(true); setShowPrefModal(false);
    try {
      const resp = preferences
        ? await axios.post(`/api/report/${fileId}`, preferences, { responseType: 'blob' })
        : await axios.get(`/api/report/${fileId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'narrralens_report.pdf'; a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert('Export failed. Please try again.'); }
    finally { setExporting(false); }
  };

  const tabs = [
    { id: 'story',        label: '📖 Story' },
    { id: 'charts',       label: '📊 Charts' },
    { id: 'stats',        label: '🔢 Statistics' },
    { id: 'correlations', label: '🔗 Correlations' },
    { id: 'anomalies',    label: '🚨 Anomalies' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── SIDEBAR ─── */}
      <aside style={{
        width: SIDEBAR_W, flexShrink: 0,
        background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, overflowY: 'auto',
      }}>
        {/* Brand */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, var(--primary), var(--accent2))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 2px 12px rgba(99,102,241,0.4)', flexShrink: 0 }}>📡</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, background: 'linear-gradient(135deg, var(--primary-light), var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NarraLens</span>
          </div>
        </div>

        {/* Back nav */}
        <nav style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => navigate('/dashboard')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            ← Dashboard
          </button>
        </nav>

        {/* Tabs as sidebar nav */}
        <nav style={{ padding: '12px', flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)', padding: '4px 8px', marginBottom: 8 }}>Report Sections</p>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, border: 'none',
              background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary-light)' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', marginBottom: 2, textAlign: 'left',
              borderLeft: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.15s',
            }}>
              {tab.label}
            </button>
          ))}

          {/* Export actions */}
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)', padding: '4px 8px', marginBottom: 8 }}>Export</p>
            <button onClick={() => setShowPrefModal(true)} disabled={exporting} style={{ width: '100%', padding: '9px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, cursor: 'pointer', marginBottom: 6, textAlign: 'left', transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              ✨ Custom Story PDF
            </button>
            <button onClick={() => handleExport()} disabled={exporting} style={{ width: '100%', padding: '9px 12px', background: exporting ? 'var(--surface)' : 'var(--primary)', border: 'none', borderRadius: 8, color: 'white', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, cursor: exporting ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: exporting ? 0.7 : 1, transition: 'all 0.15s' }}>
              {exporting ? '⏳ Generating...' : '⬇ Export PDF'}
            </button>
          </div>
        </nav>

        {/* User section */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'white', fontWeight: 800, flexShrink: 0 }}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            </div>
          </div>
          <button onClick={logout} style={{ width: '100%', padding: '7px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-faint)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseOver={e => { e.target.style.borderColor = '#ef4444'; e.target.style.color = '#fca5a5'; }}
            onMouseOut={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-faint)'; }}
          >Sign Out</button>
        </div>
      </aside>

      {/* ── MAIN ─── */}
      <main style={{ marginLeft: SIDEBAR_W, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>

        {/* Loading */}
        {loading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, minHeight: 'calc(100vh - 0px)' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 72, height: 72, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>📡</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{loadingMsg}</p>
              <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>30–60 seconds for large datasets</p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', animation: `pulse-ring 1.2s ${i * 0.3}s infinite` }} />)}
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: 500 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
              <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 10 }}>Analysis Failed</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{error}</p>
              <button onClick={() => navigate('/dashboard')} style={{ padding: '11px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer' }}>← Back to Dashboard</button>
            </div>
          </div>
        )}

        {/* Report content */}
        {!loading && !error && data && (() => {
          const { analysis, narrative } = data;
          return (
            <>
              {/* Top bar with dataset info */}
              <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginBottom: 2 }}>Data Story Report</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {analysis?.shape?.rows?.toLocaleString()} rows · {analysis?.shape?.columns} columns · {analysis?.numeric_cols?.length} numeric · {analysis?.categorical_cols?.length} categorical
                    </p>
                  </div>
                  <div style={{ padding: '4px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 100, fontSize: 11, color: '#34d399', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                    ✓ Analysis Complete
                  </div>
                </div>
              </div>

              {/* Insight cards — dynamic grid based on actual count */}
              {narrative?.insight_cards?.length > 0 && (() => {
                const cards = narrative.insight_cards;
                const count = cards.length;
                const cols = count <= 3 ? count : count === 4 ? 2 : count <= 6 ? 3 : 4;
                return (
                  <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', background: 'rgba(15,23,42,0.3)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-faint)', marginBottom: 14 }}>Key Metrics</p>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
                      {cards.map((card, i) => (
                        <InsightCard key={i} card={card} delay={i * 0.05} />
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Tab content */}
              <div style={{ flex: 1, overflow: 'auto', padding: '28px' }}>
                <div style={{ maxWidth: 1000 }}>
                  {activeTab === 'story' && <div style={{ animation: 'fadeIn 0.3s ease' }}><NarrativeView text={narrative?.narrative} /></div>}
                  {activeTab === 'charts' && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                      <SectionHeader title="Auto-Generated Charts" sub={`${analysis?.charts?.length || 0} charts from your dataset`} />
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 20 }}>
                        {analysis?.charts?.map((chart, i) => <ChartBlock key={i} chart={chart} delay={i * 0.1} />)}
                      </div>
                    </div>
                  )}
                  {activeTab === 'stats' && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                      <SectionHeader title="Statistical Summary" sub="Descriptive statistics for all numeric columns" />
                      <StatsTable statistics={analysis?.statistics} />
                    </div>
                  )}
                  {activeTab === 'correlations' && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                      <SectionHeader title="Correlation Analysis" sub="Relationships between numeric variables" />
                      <CorrelationTable topPairs={analysis?.correlations?.top_pairs} outliers={analysis?.outliers} trends={analysis?.trends} />
                    </div>
                  )}
                  {activeTab === 'anomalies' && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                      <SectionHeader title="Anomalies & Outliers" sub="Records flagged by IsolationForest + IQR bounds" />
                      <AnomaliesView anomalyRows={analysis?.anomaly_rows} outliers={analysis?.outliers} />
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </main>

      <ChatPanel fileId={fileId} />

      {showPrefModal && (
        <StoryPreferencesModal loading={exporting} onGenerate={handleExport} onClose={() => setShowPrefModal(false)} />
      )}
    </div>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{title}</h2>
      {sub && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{sub}</p>}
    </div>
  );
}

function NarrativeView({ text }) {
  if (!text) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '36px 40px', lineHeight: 1.8 }}>
      <ReactMarkdown components={{
        h2: ({ children }) => <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--primary-light)', marginTop: 28, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, marginTop: 18, marginBottom: 8 }}>{children}</h3>,
        p: ({ children }) => <p style={{ color: 'var(--text)', marginBottom: 14, lineHeight: 1.8, fontSize: 14 }}>{children}</p>,
        strong: ({ children }) => <strong style={{ color: 'var(--accent)', fontWeight: 700 }}>{children}</strong>,
        ol: ({ children }) => <ol style={{ paddingLeft: 24, marginBottom: 14, color: 'var(--text)', fontSize: 14 }}>{children}</ol>,
        ul: ({ children }) => <ul style={{ paddingLeft: 24, marginBottom: 14, color: 'var(--text)', fontSize: 14 }}>{children}</ul>,
        li: ({ children }) => <li style={{ marginBottom: 8, lineHeight: 1.7 }}>{children}</li>,
      }}>{text}</ReactMarkdown>
    </div>
  );
}

function AnomaliesView({ anomalyRows, outliers }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12, marginBottom: 32 }}>
        {outliers && Object.entries(outliers).map(([col, info]) => (
          <div key={col} style={{ padding: 16, background: info.count > 0 ? 'rgba(245,158,11,0.08)' : 'var(--surface)', border: `1px solid ${info.count > 0 ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`, borderRadius: 10 }}>
            <p style={{ fontWeight: 600, fontSize: 12, marginBottom: 6, color: 'var(--text)' }}>{col}</p>
            <p style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 800, color: info.count > 0 ? 'var(--warning)' : 'var(--success)' }}>{info.count}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{info.pct}% · [{info.lower_bound}, {info.upper_bound}]</p>
          </div>
        ))}
      </div>
      {anomalyRows?.length > 0 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Anomalous Records (IsolationForest)</h3>
          <div style={{ overflowX: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--bg2)' }}>
                  {Object.keys(anomalyRows[0] || {}).slice(0, 8).map(col => (
                    <th key={col} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'var(--font-display)', fontWeight: 600, borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {anomalyRows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
                    {Object.values(row).slice(0, 8).map((val, j) => (
                      <td key={j} style={{ padding: '9px 14px', color: 'var(--warning)' }}>{String(val).slice(0, 28)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}