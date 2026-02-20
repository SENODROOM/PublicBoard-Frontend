import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: '⬛' },
  { to: '/admin/issues', label: 'Issues', icon: '📋' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/donations', label: 'Donations', icon: '💚' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const Sidebar = ({ mobile }) => (
    <aside style={{
      width: mobile ? '100%' : 240,
      background: '#0a0a0f',
      borderRight: mobile ? 'none' : '2px solid #e8a020',
      borderBottom: mobile ? '2px solid #e8a020' : 'none',
      display: 'flex',
      flexDirection: 'column',
      minHeight: mobile ? 'auto' : '100vh',
      position: mobile ? 'static' : 'sticky',
      top: 0,
      flexShrink: 0
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(232,160,32,0.3)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#e8a020', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: '#0a0a0f' }}>PB</div>
          <div>
            <div style={{ color: '#f5f0e8', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15 }}>PublicBoard</div>
            <div style={{ color: '#e8a020', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>ADMIN PANEL</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {NAV_ITEMS.map(item => {
          const active = item.to === '/admin'
            ? location.pathname === '/admin'
            : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 24px',
                color: active ? '#e8a020' : '#c8c2b4',
                background: active ? 'rgba(232,160,32,0.1)' : 'transparent',
                borderLeft: active ? '3px solid #e8a020' : '3px solid transparent',
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
                fontWeight: active ? 700 : 400,
                transition: 'all 0.15s',
                textDecoration: 'none'
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>Signed in as</div>
        <div style={{ color: '#f5f0e8', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 12 }}>{user?.name}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/" style={{ flex: 1, padding: '7px 0', textAlign: 'center', border: '1px solid #444', color: '#888', fontSize: 11, fontFamily: 'var(--font-mono)', textDecoration: 'none' }}>← Site</Link>
          <button onClick={handleLogout} style={{ flex: 1, padding: '7px 0', border: '1px solid #c83232', background: 'transparent', color: '#c83232', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f0e8' }}>
      {/* Desktop sidebar */}
      <div style={{ display: 'none' }} className="admin-sidebar-desktop">
        <Sidebar />
      </div>

      {/* Mobile top bar */}
      <div className="admin-mobile-bar" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: '#0a0a0f', borderBottom: '2px solid #e8a020',
        display: 'none', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 56
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: '#e8a020', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: '#0a0a0f' }}>PB</div>
          <span style={{ color: '#f5f0e8', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>Admin</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'none', border: '1px solid #444', color: '#f5f0e8', padding: '6px 12px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12 }}
        >
          {sidebarOpen ? '✕ Close' : '☰ Menu'}
        </button>
      </div>

      {/* Mobile dropdown nav */}
      {sidebarOpen && (
        <div className="admin-mobile-dropdown" style={{
          position: 'fixed', top: 56, left: 0, right: 0, zIndex: 199
        }}>
          <Sidebar mobile />
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>

      <style>{`
        @media (min-width: 769px) {
          .admin-sidebar-desktop { display: flex !important; }
          .admin-mobile-bar { display: none !important; }
        }
        @media (max-width: 768px) {
          .admin-mobile-bar { display: flex !important; }
          main { padding-top: 56px; }
        }
      `}</style>
    </div>
  );
}
