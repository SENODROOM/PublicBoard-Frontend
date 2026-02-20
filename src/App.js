import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import IssueDetail from './pages/IssueDetail';
import Donate from './pages/Donate';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminOverview from './pages/admin/AdminOverview';
import AdminIssues from './pages/admin/AdminIssues';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDonations from './pages/admin/AdminDonations';

// Guard: must be logged in AND have admin role
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading" style={{ minHeight: '100vh' }}>
      <div className="spinner" />Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public routes (with Navbar) ── */}
          <Route path="/"          element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/dashboard" element={<PublicLayout><Dashboard /></PublicLayout>} />
          <Route path="/report"    element={<PublicLayout><ReportIssue /></PublicLayout>} />
          <Route path="/issues/:id"element={<PublicLayout><IssueDetail /></PublicLayout>} />
          <Route path="/donate"    element={<PublicLayout><Donate /></PublicLayout>} />
          <Route path="/login"     element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/register"  element={<PublicLayout><Register /></PublicLayout>} />

          {/* ── Admin routes (own sidebar layout, no public Navbar) ── */}
          <Route path="/admin"           element={<AdminRoute><AdminOverview /></AdminRoute>} />
          <Route path="/admin/issues"    element={<AdminRoute><AdminIssues /></AdminRoute>} />
          <Route path="/admin/users"     element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/donations" element={<AdminRoute><AdminDonations /></AdminRoute>} />

          {/* ── 404 ── */}
          <Route path="*" element={
            <PublicLayout>
              <div style={{ textAlign: 'center', padding: '120px 20px' }}>
                <h1 style={{ fontSize: 80, fontFamily: 'var(--font-display)', color: 'var(--cement)' }}>404</h1>
                <p style={{ fontSize: 18, marginBottom: 24 }}>Page not found</p>
                <a href="/" className="btn btn-primary">Go Home</a>
              </div>
            </PublicLayout>
          } />
        </Routes>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0a0a0f',
              color: '#f5f0e8',
              fontFamily: "'Space Mono', monospace",
              fontSize: '13px',
              border: '2px solid #e8a020',
              borderRadius: 0
            },
            success: { iconTheme: { primary: '#2a7a4a', secondary: '#f5f0e8' } },
            error:   { iconTheme: { primary: '#c83232', secondary: '#f5f0e8' } }
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
