import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import useSSE           from './hooks/useSSE';
import useNotifications from './hooks/useNotifications';

import Navbar            from './components/Navbar';
import NotificationPanel from './components/NotificationPanel';
import Footer            from './components/Footer';
import ErrorBoundary     from './components/ErrorBoundary';

import Home              from './pages/Home';
import Dashboard         from './pages/Dashboard';
import IssueDetail       from './pages/IssueDetail';
import ReportIssue       from './pages/ReportIssue';
import Donate            from './pages/Donate';
import Login             from './pages/Login';
import Register          from './pages/Register';
import UserProfile       from './pages/UserProfile';
import Bookmarks         from './pages/Bookmarks';
import AdvancedSearch    from './pages/AdvancedSearch';
import ForgotPassword    from './pages/ForgotPassword';
import ResetPassword     from './pages/ResetPassword';
import VerifyEmail       from './pages/VerifyEmail';

import AdminLayout       from './pages/admin/AdminLayout';
import AdminOverview     from './pages/admin/AdminOverview';
import AdminIssues       from './pages/admin/AdminIssues';
import AdminUsers        from './pages/admin/AdminUsers';
import AdminDonations    from './pages/admin/AdminDonations';
import AdminAnalytics    from './pages/admin/AdminAnalytics';
import AdminActivityLog  from './pages/admin/AdminActivityLog';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';

// ── Route guards ──────────────────────────────────────────
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

// ── Unverified email banner ───────────────────────────────
function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  if (!user || user.isEmailVerified || dismissed) return null;
  return (
    <div style={{
      background: '#fffbeb', borderBottom: '2px solid #f59e0b',
      padding: '10px 20px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 12, fontSize: 13, flexWrap: 'wrap',
    }}>
      <span>⚠️ Your email address hasn't been verified yet.</span>
      <span style={{ color: '#666' }}>Check your inbox for a verification link.</span>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 18, lineHeight: 1, padding: 0 }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

// ── Main app shell ────────────────────────────────────────
function AppShell() {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead, addNotification } = useNotifications();

  const handleSSE = useCallback((event) => {
    if (event.type === 'notification') {
      const { recipientId, notification } = event.payload;
      if (user && recipientId === user.id) addNotification(notification);
    }
  }, [user, addNotification]);

  useSSE(handleSSE, !!user);

  const isAdminRoute = window.location.pathname.startsWith('/admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Skip-to-content */}
      <a
        href="#main-content"
        style={{
          position: 'absolute', top: -60, left: 0,
          background: 'var(--amber)', color: 'var(--ink)',
          padding: '8px 16px', fontFamily: 'var(--font-mono)',
          fontSize: 12, fontWeight: 700, textDecoration: 'none',
          zIndex: 9999, transition: 'top 0.15s',
        }}
        onFocus={e => { e.target.style.top = '0'; }}
        onBlur={e => { e.target.style.top = '-60px'; }}
      >
        Skip to main content
      </a>

      <EmailVerificationBanner />

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
            <Route path="/"               element={<Home />} />
            <Route path="/dashboard"      element={<Dashboard />} />
            <Route path="/issues/:id"     element={<IssueDetail />} />
            <Route path="/report"         element={<ReportIssue />} />
            <Route path="/donate"         element={<Donate />} />
            <Route path="/login"          element={<Login />} />
            <Route path="/register"       element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email"   element={<VerifyEmail />} />
            <Route path="/search"         element={<AdvancedSearch />} />

            {/* Protected */}
            <Route path="/profile" element={<RequireAuth><UserProfile /></RequireAuth>} />
            <Route path="/bookmarks" element={<RequireAuth><Bookmarks /></RequireAuth>} />

            {/* Admin */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index        element={<AdminOverview />} />
              <Route path="issues"        element={<AdminIssues />} />
              <Route path="users"         element={<AdminUsers />} />
              <Route path="donations"     element={<AdminDonations />} />
              <Route path="analytics"     element={<AdminAnalytics />} />
              <Route path="activity"      element={<AdminActivityLog />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {!isAdminRoute && <Footer />}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            border: '2px solid var(--ink)',
            borderRadius: 0,
          },
        }}
      />
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 80, fontWeight: 800, color: 'var(--amber)', lineHeight: 1 }}>404</div>
      <h2 style={{ fontSize: 24, margin: '16px 0 8px' }}>Page not found</h2>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 28 }}>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}