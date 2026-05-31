import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ─── Static data ───────────────────────────────────────────── */
const FEATURES = [
  { icon: '🧠', label: 'AI Narratives',       desc: 'Claude writes a full analyst-grade story from your CSV — findings, patterns, recommendations.' },
  { icon: '📊', label: 'Auto Charts',          desc: 'Bar, line, scatter, histogram — all generated automatically from your dataset.' },
  { icon: '🔍', label: 'Anomaly Detection',    desc: 'IsolationForest flags outliers and unusual records instantly.' },
  { icon: '💬', label: 'Chat with Data',       desc: 'Ask anything in natural language. Claude Haiku answers in seconds.' },
  { icon: '✨', label: 'Custom Story Tone',    desc: 'Regenerate as executive brief, technical report, or casual summary.' },
  { icon: '📄', label: 'PDF Export',           desc: 'Beautifully formatted report with stats tables, insight cards, and full narrative.' },
];

const STATS = [
  { v: '100 MB', l: 'Max file size' },
  { v: '~60s',   l: 'Analysis time' },
  { v: '6+',     l: 'Chart types' },
  { v: 'Claude', l: 'AI engine' },
];

/* ─── Component ─────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const [mode, setMode]       = useState('login'); // 'login' | 'signup'
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [pw, setPw]           = useState('');
  const [err, setErr]         = useState('');
  const [busy, setBusy]       = useState(false);

  const submit = async e => {
    e.preventDefault();
    setErr('');
    if (mode === 'signup' && pw.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    setBusy(true);
    try {
      mode === 'login' ? await login(email, pw) : await signup(name, email, pw);
      navigate('/dashboard');
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Something went wrong — please try again.');
    } finally { setBusy(false); }
  };

  const switchMode = next => { setMode(next); setErr(''); };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      /* single unified dark background across the entire page */
      background: 'linear-gradient(150deg,#080d1c 0%,#030712 55%)',
      overflow: 'hidden',
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative',
    }}>

      {/* ── Global ambient blobs (visible on both sides) ── */}
      <div style={{ position:'fixed', top:-180, left:-120, width:640, height:640, borderRadius:'50%',
                    background:'radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 65%)', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:60, right:-100, width:500, height:500, borderRadius:'50%',
                    background:'radial-gradient(circle,rgba(240,171,252,.07) 0%,transparent 65%)', pointerEvents:'none', zIndex:0 }} />
      {/* center divider glow */}
      <div style={{ position:'fixed', top:'10%', left:'48%', width:4, height:'80%',
                    background:'linear-gradient(180deg,transparent,rgba(99,102,241,.18) 30%,rgba(240,171,252,.12) 70%,transparent)',
                    filter:'blur(3px)', pointerEvents:'none', zIndex:0 }} />

      {/* ══════════════ LEFT — overview ══════════════ */}
      <div style={{
        flex:'0 0 50%', width:'50%', overflowY: 'auto',
        padding: '36px 48px',
        position: 'relative', display: 'flex', flexDirection: 'column',
        zIndex: 1,
        /* subtle left-side extra depth */
        background: 'linear-gradient(150deg,rgba(8,13,28,.4) 0%,transparent 60%)',
      }}>

        {/* logo */}
        <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:36, position:'relative' }}>
          <div style={{
            width:40, height:40, borderRadius:11,
            background:'linear-gradient(135deg,#6366f1,#f0abfc)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:19, boxShadow:'0 4px 20px rgba(99,102,241,.45)', flexShrink:0,
          }}>📡</div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:21,
            background:'linear-gradient(135deg,#818cf8,#f0abfc)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            NarraLens
          </span>
        </div>

        {/* hero */}
        <div style={{ position:'relative', marginBottom:28 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 14px',
            borderRadius:100, marginBottom:22,
            background:'rgba(99,102,241,.11)', border:'1px solid rgba(99,102,241,.28)',
            fontSize:12, color:'#a5b4fc', fontFamily:"'Syne',sans-serif", fontWeight:600,
          }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#6366f1',
                           display:'inline-block', animation:'pulse-ring 2s infinite' }} />
            Powered by Claude AI
          </div>

          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800,
            fontSize:'clamp(24px,2vw,34px)', lineHeight:1.18,
            letterSpacing:'-0.02em', marginBottom:14, color:'#f1f5f9',
          }}>
            Turn raw data into<br />
            <span style={{ background:'linear-gradient(135deg,#818cf8 20%,#f0abfc)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              a story worth reading.
            </span>
          </h1>

          <p style={{ fontSize:15, color:'#94a3b8', maxWidth:480, lineHeight:1.75, fontWeight:300 }}>
            Drop any CSV or Excel file. NarraLens runs statistical analysis, detects anomalies,
            generates charts, and writes a full AI narrative report — like a senior data analyst did it.
          </p>
        </div>

        {/* stats row */}
        <div style={{ display:'flex', gap:32, marginBottom:28, flexWrap:'wrap' }}>
          {STATS.map((s,i) => (
            <div key={i}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:22, color:'#818cf8' }}>{s.v}</div>
              <div style={{ fontSize:11, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* features grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {FEATURES.map((f,i) => (
            <div key={i} style={{
              padding:'15px 17px', borderRadius:12,
              background:'rgba(30,41,59,.45)', border:'1px solid rgba(51,65,85,.7)',
              transition:'border-color .18s,transform .18s', cursor:'default',
            }}
              onMouseOver={e=>{ e.currentTarget.style.borderColor='rgba(99,102,241,.45)'; e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseOut={e=>{ e.currentTarget.style.borderColor='rgba(51,65,85,.7)'; e.currentTarget.style.transform='translateY(0)'; }}
            >
              <div style={{ fontSize:20, marginBottom:7 }}>{f.icon}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:'#f1f5f9', marginBottom:4 }}>{f.label}</div>
              <div style={{ fontSize:11.5, color:'#94a3b8', lineHeight:1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* footer */}
        <div style={{ marginTop:'auto', paddingTop:40, fontSize:12, color:'#475569' }}>
          NarraLens · Built with Claude, Python & React
        </div>
      </div>

      {/* ══════════════ RIGHT — auth ══════════════ */}
      <div style={{
        flex:'0 0 50%', width:'50%', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'52px 60px', overflowY:'auto',
        position: 'relative', zIndex: 1,
        /* very subtle right-side tint so it's distinct but still the same bg family */
        background: 'linear-gradient(150deg,transparent 0%,rgba(15,23,42,.25) 100%)',
      }}>

        {/* thin vertical separator line */}
        <div style={{
          position:'absolute', left:0, top:'8%', height:'84%', width:1,
          background:'linear-gradient(180deg,transparent,rgba(99,102,241,.22) 30%,rgba(240,171,252,.15) 70%,transparent)',
        }} />

        <div style={{ width:'100%', maxWidth:420 }}>

          {/* heading */}
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:36,
                       color:'#f1f5f9', marginBottom:8 }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ color:'#94a3b8', fontSize:16, marginBottom:32 }}>
            {mode === 'login' ? 'Sign in to open your dashboard' : 'Start analyzing data for free'}
          </p>

          {/* toggle */}
          <div style={{ display:'flex', background:'rgba(3,7,18,.6)', border:'1px solid #1e293b',
                        borderRadius:10, padding:4, marginBottom:26 }}>
            {[['login','Sign In'],['signup','Sign Up']].map(([m,label]) => (
              <button key={m} onClick={()=>switchMode(m)} style={{
                flex:1, padding:'9px 0', border:'none', borderRadius:8, cursor:'pointer',
                fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13,
                background: mode===m ? '#6366f1' : 'transparent',
                color: mode===m ? '#fff' : '#94a3b8',
                boxShadow: mode===m ? '0 2px 10px rgba(99,102,241,.38)' : 'none',
                transition:'all .18s',
              }}>{label}</button>
            ))}
          </div>

          {/* form */}
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:15 }}>
            {mode === 'signup' && (
              <Field label="Full Name" type="text" val={name} set={setName} ph="John Doe" />
            )}
            <Field label="Email" type="email" val={email} set={setEmail} ph="you@example.com" />
            <Field label="Password" type="password" val={pw} set={setPw}
                   ph={mode==='login' ? 'Your password' : 'Min. 6 characters'} />

            {err && (
              <div style={{ padding:'10px 14px', background:'rgba(239,68,68,.1)',
                border:'1px solid rgba(239,68,68,.28)', borderRadius:8,
                color:'#fca5a5', fontSize:13, display:'flex', gap:8, alignItems:'center' }}>
                ⚠️ {err}
              </div>
            )}

            <button type="submit" disabled={busy} style={{
              marginTop:4, padding:'13px',
              background: busy ? '#1e293b' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
              color:'#fff', border:'none', borderRadius:10,
              fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:15,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? .7 : 1, transition:'all .18s',
              boxShadow: busy ? 'none' : '0 4px 20px rgba(99,102,241,.42)',
            }}>
              {busy ? '⏳ Please wait…' : mode==='login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign:'center', color:'#475569', fontSize:13, marginTop:20 }}>
            {mode==='login' ? "Don't have an account? " : 'Already have an account? '}
            <span onClick={()=>switchMode(mode==='login'?'signup':'login')}
              style={{ color:'#a5b4fc', cursor:'pointer', fontWeight:600 }}>
              {mode==='login' ? 'Sign up free' : 'Sign in'}
            </span>
          </p>

          {/* info box */}
          <div style={{ marginTop:32, padding:'14px 16px',
            background:'rgba(99,102,241,.06)', border:'1px solid rgba(99,102,241,.16)',
            borderRadius:10, fontSize:12, color:'#64748b' }}>
            <p style={{ fontWeight:600, color:'#94a3b8', marginBottom:4 }}>💡 First time?</p>
            Sign up in seconds — no credit card needed. Your data stays private and is never stored permanently.
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type, val, set, ph }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94a3b8',
        marginBottom:7, fontFamily:"'Syne',sans-serif",
        textTransform:'uppercase', letterSpacing:'0.06em' }}>
        {label}
      </label>
      <input type={type} value={val} onChange={e=>set(e.target.value)}
        placeholder={ph} required
        style={{ width:'100%', padding:'11px 14px',
          background:'rgba(3,7,18,.7)', border:'1px solid #334155',
          borderRadius:8, color:'#f1f5f9', fontSize:14,
          fontFamily:"'DM Sans',sans-serif", outline:'none', boxSizing:'border-box',
          transition:'border-color .18s',
        }}
        onFocus={e=>e.target.style.borderColor='#6366f1'}
        onBlur={e=>e.target.style.borderColor='#334155'}
      />
    </div>
  );
}
