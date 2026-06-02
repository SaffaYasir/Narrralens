import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      borderBottom: '1px solid var(--border)',
      background: 'rgba(3, 7, 18, 0.88)',
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 24px',
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--primary), var(--accent2))',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 2px 12px rgba(99,102,241,0.4)',
          }}>
            📡
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20,
            background: 'linear-gradient(135deg, var(--primary-light), var(--accent2))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            NarraLens
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            padding: '4px 12px',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 100, fontSize: 11,
            color: 'var(--primary-light)',
            fontFamily: 'var(--font-display)', fontWeight: 600,
            display: 'none',
          }} className="ai-badge">
            AI-Powered
          </span>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                padding: '6px 14px',
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 100, fontSize: 13,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-display)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: 'white', fontWeight: 700,
                }}>
                  {user.name?.charAt(0).toUpperCase() || '?'}
                </div>
                {user.name}
              </div>
              <button onClick={handleLogout} style={{
                padding: '7px 14px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text-muted)',
                fontFamily: 'var(--font-display)', fontWeight: 600,
                fontSize: 13, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                onMouseOver={e => { e.target.style.borderColor = 'var(--danger)'; e.target.style.color = '#fca5a5'; }}
                onMouseOut={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-muted)'; }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" style={{
                padding: '7px 16px', textDecoration: 'none',
                background: 'transparent', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text-muted)',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
                transition: 'all 0.2s',
              }}>
                Sign In
              </Link>
              <Link to="/signup" style={{
                padding: '7px 16px', textDecoration: 'none',
                background: 'var(--primary)',
                borderRadius: 8, color: 'white',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
                boxShadow: '0 2px 10px rgba(99,102,241,0.4)',
              }}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
