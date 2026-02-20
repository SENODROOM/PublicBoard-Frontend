import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const baseLinks = [
    { to: '/',          label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/report',    label: 'Report' },
    { to: '/donate',    label: 'Donate' },
  ];

  const isActive = (to) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <nav style={{ background: 'var(--ink)', borderBottom: '3px solid var(--amber)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--ink)', border: '2px solid rgba(255,255,255,0.15)' }}>PB</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--paper)', letterSpacing: '-0.02em' }}>PublicBoard</span>
          </Link>

          {/* Desktop links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }} className="nav-desktop">
            {baseLinks.map(link => (
              <Link key={link.to} to={link.to} style={{
                color: isActive(link.to) ? 'var(--amber)' : 'var(--cement)',
                fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '8px 12px',
                borderBottom: isActive(link.to) ? '2px solid var(--amber)' : '2px solid transparent',
                transition: 'all 0.15s', whiteSpace: 'nowrap'
              }}>{link.label}</Link>
            ))}

            {/* Admin panel link — only for admins */}
            {isAdmin && (
              <Link to="/admin" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginLeft: 8,
                padding: '6px 14px',
                background: location.pathname.startsWith('/admin') ? 'var(--amber)' : 'rgba(232,160,32,0.15)',
                color: 'var(--amber)',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                border: '1px solid var(--amber)',
                whiteSpace: 'nowrap', transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--amber)'}
              onMouseLeave={e => e.currentTarget.style.background = location.pathname.startsWith('/admin') ? 'var(--amber)' : 'rgba(232,160,32,0.15)'}
              >
                ⬛ Admin Panel
              </Link>
            )}
          </div>

          {/* Desktop auth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }} className="nav-desktop">
            {user ? (
              <>
                <span style={{ color: 'var(--cement)', fontSize: 11, fontFamily: 'var(--font-mono)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isAdmin && <span style={{ color: 'var(--amber)', marginRight: 4 }}>[ADMIN]</span>}
                  {user.name}
                </span>
                <button onClick={handleLogout} className="btn btn-sm" style={{ background: 'transparent', color: '#c83232', borderColor: '#c83232', fontSize: 11 }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn btn-sm" style={{ background: 'transparent', color: 'var(--paper)', borderColor: '#555', fontSize: 11 }}>Login</Link>
                <Link to="/register" className="btn btn-sm btn-amber" style={{ fontSize: 11 }}>Register</Link>
              </>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="nav-hamburger"
            style={{ background: 'none', border: '1px solid #444', color: 'var(--paper)', padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 14, display: 'none' }}
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{ background: '#111', borderTop: '1px solid #333' }}>
          {baseLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} style={{
              display: 'block', padding: '14px 24px',
              color: isActive(link.to) ? 'var(--amber)' : 'var(--cement)',
              fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: isActive(link.to) ? 700 : 400,
              borderBottom: '1px solid #222',
              borderLeft: isActive(link.to) ? '3px solid var(--amber)' : '3px solid transparent',
              textDecoration: 'none'
            }}>{link.label}</Link>
          ))}

          {/* Admin panel in mobile menu */}
          {isAdmin && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 24px',
              color: 'var(--amber)', background: 'rgba(232,160,32,0.1)',
              fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
              borderBottom: '1px solid #333',
              borderLeft: '3px solid var(--amber)',
              textDecoration: 'none'
            }}>⬛ Admin Panel</Link>
          )}

          {/* Mobile auth row */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid #333', display: 'flex', gap: 10, alignItems: 'center' }}>
            {user ? (
              <>
                <span style={{ color: '#888', fontSize: 12, fontFamily: 'var(--font-mono)', flex: 1 }}>
                  {isAdmin && <span style={{ color: 'var(--amber)' }}>[ADMIN] </span>}
                  {user.name}
                </span>
                <button onClick={handleLogout} className="btn btn-sm" style={{ background: 'transparent', color: '#c83232', borderColor: '#c83232', fontSize: 11 }}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login"    onClick={() => setMenuOpen(false)} className="btn btn-sm" style={{ flex: 1, textAlign: 'center', background: 'transparent', color: 'var(--paper)', borderColor: '#555', fontSize: 12 }}>Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn btn-sm btn-amber" style={{ flex: 1, textAlign: 'center', fontSize: 12 }}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop  { display: none !important; }
          .nav-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
