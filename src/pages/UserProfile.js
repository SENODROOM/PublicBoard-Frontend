import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { issuesAPI, authAPI } from '../api';
import { ReputationBadge, BadgeGrid } from '../components/ReputationBadges';

const STATUS_COLORS = { Open: '#ef4444', 'In Progress': '#f59e0b', 'Pending Review': '#8b5cf6', Resolved: '#10b981' };
const PRIORITY_COLORS = { Critical: '#ef4444', High: '#f59e0b', Medium: '#3b82f6', Low: '#6b7280' };
const TABS = ['My Reports', 'Bookmarks', 'Badges'];

export default function UserProfile() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('My Reports');
  const [myIssues, setMyIssues] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  useEffect(() => {
    Promise.all([
      authAPI.me(),
      authAPI.getMyIssues().catch(() => ({ issues: [] })),
      authAPI.getMyBookmarks().catch(() => ({ issues: [] })),
    ]).then(([me, myIss, bkm]) => {
      setProfile(me.user || me);
      setBio(me.user?.bio || me.bio || '');
      setNeighborhood(me.user?.neighborhood || me.neighborhood || '');
      setMyIssues(myIss.issues || []);
      setBookmarks(bkm.issues || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveBio = async () => {
    setSaving(true);
    try {
      const updated = await authAPI.updateProfile({ bio, neighborhood });
      setProfile(updated.user || updated);
      setEditingBio(false);
    } catch {}
    setSaving(false);
  };

  const removeBookmark = async (id) => {
    await issuesAPI.bookmark(id);
    setBookmarks(b => b.filter(i => i._id !== id));
  };

  const displayName = profile?.name || user?.name;
  const reputation = profile?.reputation || 0;
  const badges = profile?.badges || [];
  const stats = profile?.stats || {};

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profile card */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, color: '#fff', fontWeight: 700, margin: '0 auto 12px'
            }}>
              {displayName?.[0]?.toUpperCase()}
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#111827', marginBottom: 4 }}>{displayName}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>{profile?.email || user?.email}</div>
            <div style={{ marginBottom: 12 }}>
              <ReputationBadge reputation={reputation} size="lg" />
            </div>

            {/* Bio */}
            {!editingBio ? (
              <div>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 8px', lineHeight: 1.5, minHeight: 40 }}>
                  {profile?.bio || <span style={{ fontStyle: 'italic', color: '#d1d5db' }}>No bio yet</span>}
                </p>
                {profile?.neighborhood && (
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>📍 {profile.neighborhood}</div>
                )}
                <button onClick={() => setEditingBio(true)}
                  style={{ fontSize: 12, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  ✏️ Edit profile
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'left' }}>
                <textarea value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="Write a short bio…" maxLength={200} rows={3}
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }} />
                <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)}
                  placeholder="Your neighborhood" maxLength={60}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12, marginTop: 6, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button onClick={saveBio} disabled={saving}
                    style={{ flex: 1, padding: '6px 0', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => setEditingBio(false)}
                    style={{ padding: '6px 10px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Stats</div>
            {[
              { label: 'Issues Reported', value: stats.issuesReportedCount ?? myIssues.length },
              { label: 'Issues Resolved', value: stats.issuesResolvedCount ?? myIssues.filter(i => i.status === 'Resolved').length },
              { label: 'Bookmarks', value: bookmarks.length },
              { label: 'Badges Earned', value: badges.length },
              { label: 'Reputation', value: reputation + ' pts' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                <span style={{ color: '#374151' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Actions</div>
            {[
              { to: '/report', label: '+ Report New Issue', color: '#4f46e5' },
              { to: '/dashboard', label: '📋 Browse Dashboard', color: '#374151' },
              { to: '/search', label: '🔍 Advanced Search', color: '#374151' },
              { to: '/donate', label: '💚 Make a Donation', color: '#059669' },
              ...(user?.role === 'admin' ? [{ to: '/admin', label: '⚙️ Admin Panel', color: '#7c3aed' }] : []),
            ].map(({ to, label, color }) => (
              <Link key={to} to={to}
                style={{ display: 'block', padding: '8px 0', fontSize: 13, color, textDecoration: 'none', borderBottom: '1px solid #f9fafb' }}>
                {label}
              </Link>
            ))}
            <button onClick={logout}
              style={{ display: 'block', width: '100%', textAlign: 'left', marginTop: 8, padding: '8px 0', fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
              🚪 Sign Out
            </button>
          </div>
        </div>

        {/* Main content */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #f3f4f6', paddingBottom: 0 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600,
                  color: tab === t ? '#4f46e5' : '#6b7280',
                  borderBottom: tab === t ? '2px solid #4f46e5' : '2px solid transparent',
                  marginBottom: -2,
                }}>
                {t}
                {t === 'My Reports' && <span style={{ marginLeft: 6, background: '#e0e7ff', color: '#4f46e5', fontSize: 11, padding: '1px 6px', borderRadius: 20 }}>{myIssues.length}</span>}
                {t === 'Bookmarks' && <span style={{ marginLeft: 6, background: '#fef3c7', color: '#92400e', fontSize: 11, padding: '1px 6px', borderRadius: 20 }}>{bookmarks.length}</span>}
                {t === 'Badges' && <span style={{ marginLeft: 6, background: '#f3e8ff', color: '#7c3aed', fontSize: 11, padding: '1px 6px', borderRadius: 20 }}>{badges.length}</span>}
              </button>
            ))}
          </div>

          {loading && <div style={{ color: '#9ca3af', padding: 40, textAlign: 'center' }}>Loading…</div>}

          {/* My Reports */}
          {!loading && tab === 'My Reports' && (
            <div>
              {myIssues.length === 0
                ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>No issues reported yet</div>
                    <Link to="/report" style={{ color: '#4f46e5', fontWeight: 600, fontSize: 13 }}>Report your first issue →</Link>
                  </div>
                : myIssues.map(issue => <IssueRow key={issue._id} issue={issue} />)
              }
            </div>
          )}

          {/* Bookmarks */}
          {!loading && tab === 'Bookmarks' && (
            <div>
              {bookmarks.length === 0
                ? <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔖</div>
                    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>No bookmarks yet</div>
                    <Link to="/dashboard" style={{ color: '#4f46e5', fontWeight: 600, fontSize: 13 }}>Browse issues →</Link>
                  </div>
                : bookmarks.map(issue => (
                    <IssueRow key={issue._id} issue={issue}
                      action={<button onClick={() => removeBookmark(issue._id)}
                        style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
                        Remove
                      </button>}
                    />
                  ))
              }
            </div>
          )}

          {/* Badges */}
          {!loading && tab === 'Badges' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
                  You've earned <strong>{badges.length}</strong> of 8 badges.
                  Keep reporting and engaging to unlock more!
                </div>
                <BadgeGrid badges={badges} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueRow({ issue, action }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <Link to={`/issues/${issue._id}`}
          style={{ fontSize: 14, fontWeight: 600, color: '#111827', textDecoration: 'none', display: 'block', marginBottom: 6 }}>
          {issue.title}
        </Link>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: STATUS_COLORS[issue.status] + '18', color: STATUS_COLORS[issue.status] }}>
            {issue.status}
          </span>
          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: PRIORITY_COLORS[issue.priority] + '18', color: PRIORITY_COLORS[issue.priority] }}>
            {issue.priority}
          </span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{issue.category}</span>
          {issue.neighborhood && <span style={{ fontSize: 11, color: '#9ca3af' }}>📍 {issue.neighborhood}</span>}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        {action}
        <div style={{ fontSize: 11, color: '#9ca3af' }}>▲ {issue.supportCount}</div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(issue.createdAt).toLocaleDateString()}</div>
      </div>
    </div>
  );
}
