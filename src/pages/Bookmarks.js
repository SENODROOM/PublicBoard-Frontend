import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = { Open: '#2563eb', 'In Progress': '#d97706', 'Pending Review': '#7c3aed', Resolved: '#059669' };

export default function Bookmarks() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/users/me/bookmarks')
      .then(r => setIssues(r.data.issues))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const removeBookmark = async (id) => {
    await api.post(`/issues/${id}/bookmark`);
    setIssues(prev => prev.filter(i => i._id !== id));
  };

  if (!user) return (
    <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔖</div>
      <h2>Sign in to view bookmarks</h2>
      <Link to="/login" style={{ color: '#2563eb' }}>Go to Login</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>🔖 Bookmarks</h1>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 14 }}>Issues you've saved to follow up on</p>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Loading…</div>}

      {!loading && issues.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 40px', color: '#aaa' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔖</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No bookmarks yet</div>
          <div style={{ fontSize: 14, marginBottom: 20 }}>Save issues to come back to them later</div>
          <Link to="/" style={{ color: '#2563eb', fontWeight: 600 }}>Browse Issues</Link>
        </div>
      )}

      {issues.map(issue => (
        <div key={issue._id} style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, padding: '18px 20px', marginBottom: 12, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ background: STATUS_COLORS[issue.status] + '18', color: STATUS_COLORS[issue.status], borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{issue.status}</span>
              <span style={{ fontSize: 11, color: '#888', background: '#f0ede8', borderRadius: 6, padding: '2px 8px' }}>{issue.category}</span>
              {issue.tags?.slice(0,3).map(t => <span key={t} style={{ fontSize: 11, color: '#7c3aed', background: '#f5f3ff', borderRadius: 6, padding: '2px 6px' }}>#{t}</span>)}
            </div>
            <Link to={`/issues/${issue._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{issue.title}</div>
            </Link>
            <div style={{ fontSize: 13, color: '#888' }}>
              📍 {issue.location} · ▲ {issue.supportCount} · 💬 {issue.comments?.length || 0}
            </div>
          </div>
          <button onClick={() => removeBookmark(issue._id)}
            title="Remove bookmark"
            style={{ border: '1.5px solid #fecdd3', background: '#fff1f2', color: '#be123c', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
