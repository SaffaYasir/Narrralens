import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SIDEBAR_W = 248;

const NAV_ITEMS = [
  { id: 'upload', icon: '⬆', label: 'Upload Data' },
  { id: 'recent', icon: '🕐', label: 'Recent Analyses' },
  { id: 'tips',   icon: '💡', label: 'Tips & Tricks' },
];

const TIPS = [
  { icon: '📋', title: 'UTF-8 CSV works best',        body: 'Use a header row on line 1. Avoid merged cells or multi-row headers.' },
  { icon: '📅', title: 'Add date columns',             body: 'Date/time columns unlock time-series trend charts and peak analysis.' },
  { icon: '🔢', title: 'More numeric = richer story',  body: '3+ numeric columns generate correlations, scatter plots, and deeper stats.' },
  { icon: '🏷',  title: 'Categorical columns matter',  body: 'Text columns like region or status power bar chart breakdowns.' },
  { icon: '✨', title: 'Custom Story tone',            body: 'After a report is ready, hit "Custom Story PDF" to choose executive, technical, or casual.' },
  { icon: '💬', title: 'Chat is fast',                body: 'The chat panel uses Claude Haiku — instant answers about columns, outliers, patterns.' },
];

function loadRecent() {
  try { return JSON.parse(localStorage.getItem('nl_recent') || '[]'); } catch { return []; }
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('upload');
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [preview, setPreview] = useState(null);

  const [recent, setRecent] = useState(loadRecent);
  const recentRef = useRef(recent);
  recentRef.current = recent;

  const onDrop = useCallback(async (files) => {
    if (!files.length) return;
    setUploadErr('');
    setUploading(true);
    setPreview(null);
    try {
      const fd = new FormData();
      fd.append('file', files[0]);
      const { data } = await axios.post('/api/upload', fd);
      setPreview(data);
      const rec = {
        file_id:  data.file_id,
        filename: data.filename,
        rows:     data.rows,
        cols:     data.columns,
        ts:       Date.now(),
      };
      const next = [rec, ...recentRef.current.filter(r => r.file_id !== data.file_id)].slice(0, 8);
      setRecent(next);
      localStorage.setItem('nl_recent', JSON.stringify(next));
    } catch (ex) {
      setUploadErr(ex.response?.data?.error || 'Upload failed — please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#030712', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside style={{
        width: SIDEBAR_W, flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        background: '#0f172a', borderRight: '1px solid #1e293b',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>

        {/* Brand */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 33, height: 33, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg,#6366f1,#f0abfc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, boxShadow: '0 2px 12px rgba(99,102,241,.4)',
          }}>📡</div>
          <span style={{
            fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18,
            background: 'linear-gradient(135deg,#818cf8,#f0abfc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>NarraLens</span>
        </div>

        {/* Main nav */}
        <nav style={{ padding: '14px 10px 0', flexShrink: 0 }}>
          <p style={labelStyle}>Workspace</p>
          {NAV_ITEMS.map(item => (
            <NavBtn
              key={item.id}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </NavBtn>
          ))}
        </nav>

        {/* Recent files */}
        {recent.length > 0 && (
          <nav style={{ padding: '0 10px', flexShrink: 0 }}>
            <p style={{ ...labelStyle, paddingTop: 20 }}>Recent Files</p>
            {recent.slice(0, 6).map(r => (
              <button
                key={r.file_id}
                onClick={() => navigate(`/report/${r.file_id}`)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '8px 10px', borderRadius: 8, border: 'none',
                  background: 'transparent', cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                  transition: 'background .14s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 13, marginTop: 2, flexShrink: 0 }}>📁</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.filename}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>
                    {r.rows?.toLocaleString()} rows · {r.cols} cols
                  </div>
                </div>
              </button>
            ))}
          </nav>
        )}

        <div style={{ flex: 1 }} />

        {/* User block */}
        <div style={{ padding: '14px', borderTop: '1px solid #1e293b', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#6366f1,#f0abfc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 800, fontFamily: "'Syne',sans-serif",
            }}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Syne',sans-serif" }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%', padding: '7px', borderRadius: 7, cursor: 'pointer',
              border: '1px solid #334155', background: 'transparent',
              color: '#64748b', fontSize: 12, fontFamily: "'Syne',sans-serif", fontWeight: 600,
              transition: 'all .14s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#fca5a5'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#64748b'; }}
          >Sign Out</button>
        </div>
      </aside>

      {/* ═══════════════ MAIN ═══════════════ */}
      <main style={{ marginLeft: SIDEBAR_W, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Top bar */}
        <header style={{
          padding: '18px 32px', borderBottom: '1px solid #1e293b',
          background: 'rgba(15,23,42,.75)', backdropFilter: 'blur(14px)',
          position: 'sticky', top: 0, zIndex: 40,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 19, color: '#f1f5f9', marginBottom: 2 }}>
              {activeTab === 'upload' && 'Upload & Analyze'}
              {activeTab === 'recent' && 'Recent Analyses'}
              {activeTab === 'tips'   && 'Tips & Tricks'}
            </h1>
            <p style={{ color: '#64748b', fontSize: 12 }}>
              {activeTab === 'upload' && 'Drop a CSV or Excel file to generate an AI-powered data story'}
              {activeTab === 'recent' && 'Click any file below to reopen its report'}
              {activeTab === 'tips'   && 'Get the most out of NarraLens'}
            </p>
          </div>
          <div style={{
            padding: '4px 13px', borderRadius: 100, fontSize: 11,
            background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.25)',
            color: '#a5b4fc', fontFamily: "'Syne',sans-serif", fontWeight: 600,
          }}>● Claude AI</div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* ── UPLOAD TAB ── */}
          {activeTab === 'upload' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

              {/* Full-page drop zone — stretches to fill the entire remaining area */}
              <div
                {...getRootProps()}
                style={{
                  flex: 1,
                  minHeight: 'calc(100vh - 73px)', /* subtract header height */
                  border: `2px dashed ${isDragActive ? '#6366f1' : '#1e293b'}`,
                  cursor: 'pointer',
                  background: isDragActive
                    ? 'rgba(99,102,241,.06)'
                    : 'linear-gradient(180deg,#0c1120 0%,#080d1c 100%)',
                  transition: 'all .22s',
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                {/* ambient blobs inside the drop zone */}
                <div style={{ position:'absolute', top:-100, right:-80, width:480, height:480, borderRadius:'50%',
                              background:'radial-gradient(circle,rgba(99,102,241,.08) 0%,transparent 65%)', pointerEvents:'none' }} />
                <div style={{ position:'absolute', bottom:-60, left:'20%', width:320, height:320, borderRadius:'50%',
                              background:'radial-gradient(circle,rgba(240,171,252,.05) 0%,transparent 65%)', pointerEvents:'none' }} />

                {isDragActive && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
                                background: 'radial-gradient(circle at 50%,rgba(99,102,241,.14) 0%,transparent 60%)' }} />
                )}

                <input {...getInputProps()} />

                {uploading ? (
                  <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
                                  border: '3px solid #1e293b', borderTopColor: '#6366f1',
                                  animation: 'spin .8s linear infinite' }} />
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 20, color: '#f1f5f9', marginBottom: 8 }}>
                      Uploading…
                    </p>
                    <p style={{ color: '#64748b', fontSize: 14 }}>Parsing columns and types</p>
                  </div>
                ) : preview ? (
                  /* Preview card in centre of full-page zone */
                  <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 700, padding: '0 32px' }}>
                    {uploadErr && (
                      <div style={{ padding: '11px 15px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 9, color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>
                        ⚠️ {uploadErr}
                      </div>
                    )}
                    <PreviewCard
                      preview={preview}
                      onAnalyze={() => navigate(`/report/${preview.file_id}`)}
                    />
                    <p style={{ textAlign: 'center', color: '#334155', fontSize: 12, marginTop: 14 }}>
                      Drop another file to replace · or click Generate Story above
                    </p>
                  </div>
                ) : (
                  /* Default idle state */
                  <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 40px' }}>

                    {/* big icon */}
                    <div style={{ fontSize: 72, marginBottom: 24, animation: 'float 3.5s ease-in-out infinite',
                                  filter: 'drop-shadow(0 0 32px rgba(99,102,241,.4))' }}>
                      {isDragActive ? '📂' : '📡'}
                    </div>

                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800,
                                fontSize: 'clamp(22px,2.2vw,32px)', lineHeight: 1.2,
                                color: isDragActive ? '#818cf8' : '#f1f5f9', marginBottom: 12 }}>
                      {isDragActive ? 'Release to upload!' : 'Drag & drop your dataset'}
                    </p>

                    <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 10 }}>
                      or click anywhere in this area to browse
                    </p>

                    <p style={{ color: '#475569', fontSize: 13, marginBottom: 32 }}>
                      CSV, XLS, or XLSX &nbsp;·&nbsp; up to{' '}
                      <span style={{ color: '#a5b4fc', fontWeight: 600 }}>100 MB</span>
                    </p>

                    <button
                      onClick={e => e.stopPropagation()} /* let dropzone handle the click */
                      style={{
                        padding: '13px 36px',
                        background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                        color: '#fff', border: 'none', borderRadius: 10,
                        fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15,
                        cursor: 'pointer',
                        boxShadow: '0 4px 24px rgba(99,102,241,.45)',
                        pointerEvents: 'none', /* let parent div catch click */
                      }}>
                      Browse Files
                    </button>

                    {/* supported formats strip */}
                    <div style={{ marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                      {['.CSV', '.XLS', '.XLSX'].map(fmt => (
                        <span key={fmt} style={{
                          padding: '4px 14px', borderRadius: 100, fontSize: 12,
                          background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)',
                          color: '#818cf8', fontFamily: "'Syne',sans-serif", fontWeight: 700,
                          letterSpacing: '0.04em',
                        }}>{fmt}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error outside drop zone if it exists without a preview */}
              {uploadErr && !preview && (
                <div style={{ padding: '11px 32px 16px' }}>
                  <div style={{ padding: '11px 15px', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 9, color: '#fca5a5', fontSize: 13 }}>
                    ⚠️ {uploadErr}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── RECENT TAB ── */}
          {activeTab === 'recent' && (
            <div style={{ padding: '28px 36px', maxWidth: 720 }}>
              {recent.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#475569' }}>
                  <div style={{ fontSize: 46, marginBottom: 14 }}>📂</div>
                  <p style={{ fontSize: 15, marginBottom: 20 }}>No analyses yet.</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                  >
                    Upload a file →
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recent.map(r => (
                    <div key={r.file_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', borderRadius: 12, background: '#1e293b', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 9, background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📊</div>
                        <div>
                          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 3 }}>{r.filename}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {r.rows?.toLocaleString()} rows · {r.cols} cols · {new Date(r.ts).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/report/${r.file_id}`)}
                        style={{ padding: '8px 18px', background: '#6366f1', border: 'none', borderRadius: 8, color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >View Report →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TIPS TAB ── */}
          {activeTab === 'tips' && (
            <div style={{ padding: '28px 36px', maxWidth: 740 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 14 }}>
                {TIPS.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '18px 20px', background: '#1e293b', border: '1px solid #334155', borderRadius: 12, animation: `fadeUp .4s ease ${i * .06}s both` }}>
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: '#f1f5f9', marginBottom: 5 }}>{t.title}</div>
                      <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{t.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes float {
          0%,100% { transform: translateY(0);    }
          50%      { transform: translateY(-12px); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0);    }
        }
      `}</style>
    </div>
  );
}

/* ─── Small helpers ─── */

function NavBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
        padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
        marginBottom: 2, textAlign: 'left',
        background: active ? 'rgba(99,102,241,.15)' : 'transparent',
        color: active ? '#818cf8' : '#94a3b8',
        fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: 13,
        borderLeft: active ? '2px solid #6366f1' : '2px solid transparent',
        transition: 'all .14s',
      }}
    >
      {children}
    </button>
  );
}

const labelStyle = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: '#334155', padding: '0 10px', marginBottom: 6,
  display: 'block',
};

function PreviewCard({ preview, onAnalyze }) {
  const numeric = Object.values(preview.dtypes || {}).filter(t => /float|int/.test(t)).length;
  const categ   = Object.values(preview.dtypes || {}).filter(t => /object/.test(t)).length;
  const missing = Object.values(preview.missing_values || {}).some(v => v > 0);

  const badges = [
    { label: `${preview.rows?.toLocaleString()} Rows`, color: '#10b981' },
    { label: `${preview.columns} Columns`,             color: '#6366f1' },
    numeric && { label: `${numeric} Numeric`,          color: '#f59e0b' },
    categ   && { label: `${categ} Categorical`,        color: '#a5b4fc' },
    missing && { label: '⚠ Missing Values',            color: '#ef4444' },
  ].filter(Boolean);

  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: '22px', animation: 'fadeUp .35s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 17 }}>✅</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{preview.filename}</span>
          </div>
          <p style={{ color: '#64748b', fontSize: 12 }}>
            {preview.file_size_mb && `${preview.file_size_mb} MB · `}{preview.rows?.toLocaleString()} rows × {preview.columns} columns
          </p>
        </div>
        <button
          onClick={onAnalyze}
          style={{ padding: '10px 22px', flexShrink: 0, background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: 9, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(99,102,241,.42)' }}
        >Generate Story →</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
        {badges.map((b, i) => (
          <span key={i} style={{ padding: '3px 11px', borderRadius: 100, fontSize: 11, background: `${b.color}1a`, border: `1px solid ${b.color}40`, color: b.color, fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>
            {b.label}
          </span>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 7 }}>
        {preview.column_names?.slice(0, 10).map(c => (
          <div key={c} style={{ padding: '6px 10px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#a5b4fc', marginRight: 5 }}>▪</span>{c}
          </div>
        ))}
        {(preview.column_names?.length || 0) > 10 && (
          <div style={{ padding: '6px 10px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, fontSize: 11, color: '#475569' }}>
            +{preview.column_names.length - 10} more
          </div>
        )}
      </div>
    </div>
  );
}
