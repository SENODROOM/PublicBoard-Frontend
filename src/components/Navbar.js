import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_LINKS = [
  { to: '/',          label: 'Home'      },
  { to: '/dashboard', label: 'Issues'    },
  { to: '/report',    label: 'Report'    },
  { to: '/donate',    label: 'Donate'    },
];

export default function Navbar({ unreadCount = 0, onNotifClick }) {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [userOpen, setUserOpen]   = useState(false);
  const userRef = useRef(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
    setUserOpen(false);
  };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav
      aria-label="Main navigation"
      style={{
      background: 'var(--ink)',
      borderBottom: '2px solid var(--amber)',
      position: 'sticky', top: 0, zIndex: 200,
      fontFamily: 'var(--font-mono)'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', height: 56 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <img
            src="/logo.png"
            alt="PublicBoard"
            style={{
              width: 34,
              height: 34,
              objectFit: 'contain',
            }}
          />
          <span style={{ color: 'white', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>PublicBoard</span>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', gap: 2, marginLeft: 28, alignItems: 'center' }} className="nav-desktop">
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} style={{
              color: isActive(to) ? 'var(--amber)' : 'var(--cement)',
              fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase',
              padding: '6px 12px', textDecoration: 'none',
              borderBottom: isActive(to) ? '2px solid var(--amber)' : '2px solid transparent',
              transition: 'color 0.15s'
            }}>{label}</Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* Notification Bell */}
          {user && (
            <button
              onClick={onNotifClick}
              aria-label={unreadCount > 0 ? `Notifications — ${unreadCount} unread` : 'Notifications'}
              aria-haspopup="dialog"
              style={{
                position: 'relative', background: 'none', border: 'none',
                cursor: 'pointer', padding: '6px 8px', color: 'var(--cement)',
                fontSize: 18, lineHeight: 1
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  background: 'var(--red)', color: '#fff',
                  fontSize: 9, fontWeight: 800, fontFamily: 'var(--font-mono)',
                  width: 16, height: 16, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--ink)'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User menu or auth links */}
          {user ? (
            <div style={{ position: 'relative' }} ref={userRef}>
              <button
                onClick={() => setUserOpen(o => !o)}
                aria-label={`${user.name} — account menu`}
                aria-expanded={userOpen}
                aria-haspopup="menu"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '5px 10px', cursor: 'pointer',
                  color: 'white', fontFamily: 'var(--font-mono)', fontSize: 11
                }}
              >
                <div style={{
                  width: 24, height: 24, background: 'var(--amber)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, color: 'var(--ink)'
                }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span className="nav-desktop-only">{user.name}</span>
                {user.role === 'admin' && (
                  <span style={{ background: 'var(--amber)', color: 'var(--ink)', fontSize: 8, padding: '1px 5px', fontWeight: 800, letterSpacing: '0.1em' }}>ADMIN</span>
                )}
                <span style={{ fontSize: 9 }}>▼</span>
              </button>

              {userOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: 'var(--ink)', border: '2px solid var(--amber)',
                  minWidth: 180, zIndex: 300, boxShadow: '4px 4px 0 rgba(0,0,0,0.3)'
                }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(232,160,32,0.3)' }}>
                    <div style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{user.name}</div>
                    <div style={{ color: 'var(--cement)', fontSize: 10, marginTop: 2 }}>{user.email}</div>
                    <div style={{ color: 'var(--amber)', fontSize: 10, marginTop: 4 }}>
                      ⭐ {user.reputation || 0} rep
                    </div>
                  </div>
                  <Link to="/profile" onClick={() => setUserOpen(false)} style={{ display: 'block', padding: '10px 14px', color: 'var(--cement)', fontSize: 12, textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>👤 My Profile</Link>
                  <Link to="/bookmarks" onClick={() => setUserOpen(false)} style={{ display: 'block', padding: '10px 14px', color: 'var(--cement)', fontSize: 12, textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>🔖 Bookmarks</Link>
                  {(user.role === 'admin' || user.role === 'moderator') && (
                    <Link to="/admin" onClick={() => setUserOpen(false)} style={{ display: 'block', padding: '10px 14px', color: 'var(--amber)', fontSize: 12, fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>⚙️ Admin Panel</Link>
                  )}
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--red)', fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer', textAlign: 'left' }}>
                    ← Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <Link to="/login" style={{ padding: '6px 14px', border: '1.5px solid var(--cement)', color: 'var(--cement)', fontSize: 11, textDecoration: 'none', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>Login</Link>
              <Link to="/register" style={{ padding: '6px 14px', border: '1.5px solid var(--amber)', background: 'var(--amber)', color: 'var(--ink)', fontSize: 11, textDecoration: 'none', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Register</Link>
            </div>
          )}

          {/* Hamburger (mobile) */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '5px 10px', cursor: 'pointer', fontSize: 14 }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div id="mobile-nav" style={{ background: 'var(--ink)', borderTop: '1px solid rgba(232,160,32,0.3)', padding: '8px 0' }} className="nav-mobile">
          {NAV_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)} style={{
              display: 'block', padding: '12px 20px',
              color: isActive(to) ? 'var(--amber)' : 'var(--cement)',
              fontSize: 12, textDecoration: 'none', letterSpacing: '0.07em',
              textTransform: 'uppercase', borderLeft: isActive(to) ? '3px solid var(--amber)' : '3px solid transparent'
            }}>{label}</Link>
          ))}
          {user && (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px 20px', color: 'var(--cement)', fontSize: 12, textDecoration: 'none' }}>👤 Profile</Link>
              {(user.role === 'admin' || user.role === 'moderator') && (
                <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px 20px', color: 'var(--amber)', fontSize: 12, textDecoration: 'none', fontWeight: 700 }}>⚙️ Admin Panel</Link>
              )}
            </>
          )}
        </div>
      )}

      <style>{`
        .nav-desktop { display: flex !important; }
        .nav-hamburger { display: none !important; }
        .nav-mobile { display: none; }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: block !important; }
          .nav-mobile { display: block; }
          .nav-desktop-only { display: none; }
        }
      `}</style>
    </nav>
  );
}