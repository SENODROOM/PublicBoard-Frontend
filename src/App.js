import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import useSSE              from './hooks/useSSE';
import useNotifications    from './hooks/useNotifications';

import Navbar              from './components/Navbar';
import NotificationPanel   from './components/NotificationPanel';
import Footer              from './components/Footer';
import ErrorBoundary       from './components/ErrorBoundary';

import Home                from './pages/Home';
import Dashboard           from './pages/Dashboard';
import IssueDetail         from './pages/IssueDetail';
import ReportIssue         from './pages/ReportIssue';
import Donate              from './pages/Donate';
import Login               from './pages/Login';
import Register            from './pages/Register';
import UserProfile         from './pages/UserProfile';
import Bookmarks           from './pages/Bookmarks';
import AdvancedSearch      from './pages/AdvancedSearch';

import AdminLayout         from './pages/admin/AdminLayout';
import AdminOverview       from './pages/admin/AdminOverview';
import AdminIssues         from './pages/admin/AdminIssues';
import AdminUsers          from './pages/admin/AdminUsers';
import AdminDonations      from './pages/admin/AdminDonations';
import AdminAnalytics      from './pages/admin/AdminAnalytics';
import AdminActivityLog    from './pages/admin/AdminActivityLog';
import AdminAnnouncements  from './pages/admin/AdminAnnouncements';

// ── Route guards ─────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" />Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" />Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.role !== 'moderator') return <Navigate to="/" replace />;
  return children;
}

// ── Main app shell (needs auth context) ──────────────────
function AppShell() {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const {
    notifications, unreadCount,
    markRead, markAllRead, addNotification
  } = useNotifications();

  // SSE handler — real-time events
  const handleSSE = useCallback((event) => {
    if (event.type === 'notification') {
      const { recipientId, notification } = event.payload;
      if (user && recipientId === user.id) {
        addNotification(notification);
      }
    }
    // Other event types (issue.created, issue.status, etc.)
    // are handled locally in each page via their own re-fetch logic
  }, [user, addNotification]);

  useSSE(handleSSE, !!user);

  const isAdminRoute = window.location.pathname.startsWith('/admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Skip-to-content — visible on keyboard focus only */}
      <a
        href="#main-content"
        style={{
          position: 'absolute', top: -60, left: 0,
          background: 'var(--amber)', color: 'var(--ink)',
          padding: '8px 16px', fontFamily: 'var(--font-mono)',
          fontSize: 12, fontWeight: 700, textDecoration: 'none',
          zIndex: 9999, transition: 'top 0.15s'
        }}
        onFocus={e => { e.target.style.top = '0'; }}
        onBlur={e => { e.target.style.top = '-60px'; }}
      >
        Skip to main content
      </a>

      {!isAdminRoute && (
        <Navbar
          unreadCount={unreadCount}
          onNotifClick={() => setNotifOpen(o => !o)}
        />
      )}

      {notifOpen && (
        <>
          <div
            onClick={() => setNotifOpen(false)}
            aria-hidden="true"
            style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.3)' }}
          />
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onClose={() => setNotifOpen(false)}
          />
        </>
      )}

      <main id="main-content" style={{ flex: 1 }}>
        <ErrorBoundary>
          <Routes>
            {/* Public */}
            <Route path="/"            element={<Home />} />
            <Route path="/dashboard"   element={<Dashboard />} />
            <Route path="/issues/:id"  element={<IssueDetail />} />
            <Route path="/report"      element={<ReportIssue />} />
            <Route path="/donate"      element={<Donate />} />
            <Route path="/login"       element={<Login />} />
            <Route path="/register"    element={<Register />} />
            <Route path="/search"      element={<AdvancedSearch />} />

            {/* Authenticated */}
            <Route path="/profile"   element={<RequireAuth><UserProfile /></RequireAuth>} />
            <Route path="/bookmarks" element={<RequireAuth><Bookmarks /></RequireAuth>} />

            {/* Admin */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index                 element={<AdminOverview />} />
              <Route path="issues"         element={<AdminIssues />} />
              <Route path="users"          element={<AdminUsers />} />
              <Route path="donations"      element={<AdminDonations />} />
              <Route path="analytics"      element={<AdminAnalytics />} />
              <Route path="activity"       element={<AdminActivityLog />} />
              <Route path="announcements"  element={<AdminAnnouncements />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={
              <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                <img
                  src="/logo.png"
                  alt="PublicBoard"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: 'contain',
                    marginBottom: 24,
                    opacity: 0.5,
                  }}
                />
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 80, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>404</div>
                <div style={{ fontSize: 18, color: '#888', marginTop: 16 }}>Page not found</div>
                <a href="/" style={{ display: 'inline-block', marginTop: 24, padding: '10px 24px', background: 'var(--ink)', color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: 13 }}>← Go Home</a>
              </div>
            } />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Footer on every public page — hidden inside /admin */}
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              background: 'var(--ink)',
              color: '#fff',
              border: '1px solid var(--amber)',
              borderRadius: 0,
            },
            success: { iconTheme: { primary: '#2a7a4a', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#c83232', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}