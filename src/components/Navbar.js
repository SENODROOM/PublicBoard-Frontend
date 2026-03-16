import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { issuesAPI } from '../api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [openCount, setOpenCount] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('pb_dark') === '1');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    issuesAPI.getStats()
      .then(d => setOpenCount(d.open || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('pb_dark', darkMode ? '1' : '0');
  }, [darkMode]);

  // Keyboard shortcut: "/" focuses search
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('navbar-search')?.focus();
      }
      if (e.key === 'Escape') {
        document.getElementById('navbar-search')?.blur();
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navLink = (to, label, extra) => {
    const active = location.pathname === to || location.pathname.startsWith(to + '/');
    return (
      <Link to={to} style={{
        textDecoration: 'none', fontSize: 14, fontWeight: 500,
        color: active ? '#4f46e5' : '#374151',
        borderBottom: active ? '2px solid #4f46e5' : '2px solid transparent',
        paddingBottom: 2, transition: 'color 0.15s',
        display: 'flex', alignItems: 'center', gap: 4
      }}>
        {label}
        {extra}
      </Link>
    );
  };

  return (
    <nav style={{
      background: '#fff', borderBottom: '1px solid #e5e7eb',
      padding: '0 24px', height: 58,
      display: 'flex', alignItems: 'center', gap: 20,
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', fontWeight: 800, fontSize: 17, color: '#111827', letterSpacing: '-0.02em', marginRight: 8 }}>
        Public<span style={{ color: '#4f46e5' }}>Board</span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        {navLink('/dashboard', 'Dashboard',
          openCount != null && openCount > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 700, padding: '1px 5px', minWidth: 16, textAlign: 'center' }}>
              {openCount > 99 ? '99+' : openCount}
            </span>
          )
        )}
        {navLink('/search', 'Search')}
        {navLink('/report', 'Report Issue')}
        {user && navLink('/bookmarks', '🔖 Saved')}
        {user?.role === 'admin' && navLink('/admin', 'Admin')}
      </div>

      {/* Inline search bar */}
      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 280, marginLeft: 'auto' }}>
        <div style={{ position: 'relative' }}>
          <input
            id="navbar-search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder='Search… ("/" to focus)'
            style={{
              width: '100%', padding: '7px 12px 7px 32px', borderRadius: 20,
              border: '1px solid #e5e7eb', fontSize: 13, outline: 'none',
              background: '#f9fafb', boxSizing: 'border-box', transition: 'border-color 0.2s, background 0.2s'
            }}
            onFocus={e => { e.target.style.background = '#fff'; e.target.style.borderColor = '#4f46e5'; }}
            onBlur={e => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#e5e7eb'; }}
          />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}>🔍</span>
        </div>
      </form>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Dark mode */}
        <button onClick={() => setDarkMode(d => !d)}
          title={darkMode ? 'Light mode' : 'Dark mode'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '2px 4px', lineHeight: 1 }}>
          {darkMode ? '☀️' : '🌙'}
        </button>

        {user ? (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(m => !m)} style={{
              display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1px solid #e5e7eb',
              padding: '5px 10px', borderRadius: 20, cursor: 'pointer', fontSize: 13
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700
              }}>{user.name?.[0]?.toUpperCase()}</div>
              <span style={{ color: '#374151', fontWeight: 500 }}>{user.name?.split(' ')[0]}</span>
              <span style={{ color: '#9ca3af', fontSize: 10 }}>▾</span>
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)', minWidth: 180,
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 200, overflow: 'hidden'
              }} onMouseLeave={() => setMenuOpen(false)}>
                {[
                  { to: '/profile', label: '👤 My Profile' },
                  { to: '/bookmarks', label: '🔖 Bookmarks' },
                  { to: '/report', label: '+ Report Issue' },
                  ...(user.role === 'admin' ? [{ to: '/admin', label: '⚙️ Admin Panel' }, { to: '/admin/analytics', label: '📊 Analytics' }] : []),
                ].map(({ to, label }) => (
                  <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                    style={{ display: 'block', padding: '10px 16px', fontSize: 13, color: '#374151', textDecoration: 'none', borderBottom: '1px solid #f9fafb' }}
                    onMouseEnter={e => e.target.style.background = '#f9fafb'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}>
                    {label}
                  </Link>
                ))}
                <button onClick={() => { logout(); setMenuOpen(false); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/login" style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e5e7eb', textDecoration: 'none', fontSize: 13, color: '#374151' }}>Login</Link>
            <Link to="/register" style={{ padding: '7px 14px', borderRadius: 8, background: '#4f46e5', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
