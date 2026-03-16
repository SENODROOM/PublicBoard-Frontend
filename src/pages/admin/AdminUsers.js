import { useState, useEffect } from 'react';
import api from '../../api';

const ROLE_COLORS = { admin: '#7c3aed', moderator: '#2563eb', user: '#6b7280' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [banModal, setBanModal] = useState(null);
  const [banReason, setBanReason] = useState('');
  const LIMIT = 20;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    api.get(`/admin/users?${params}`)
      .then(r => { setUsers(r.data.users); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, roleFilter]);
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [search]);

  const changeRole = async (userId, role) => {
    await api.patch(`/admin/users/${userId}/role`, { role });
    load();
  };

  const toggleBan = async () => {
    const user = banModal;
    if (user.isBanned) {
      await api.patch(`/admin/users/${user._id}/unban`);
    } else {
      await api.patch(`/admin/users/${user._id}/ban`, { reason: banReason });
    }
    setBanModal(null); setBanReason('');
    load();
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>User Management</h1>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 14 }}>{total} registered users</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or email…"
          style={{ flex: 1, border: '1.5px solid #e5e0d8', borderRadius: 8, padding: '9px 14px', fontSize: 14 }} />
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          style={{ border: '1.5px solid #e5e0d8', borderRadius: 8, padding: '9px 12px', fontSize: 13 }}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fdfcfb', borderBottom: '1.5px solid #e5e0d8' }}>
              {['User', 'Role', 'Reputation', 'Issues', 'Resolved', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#888', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Loading…</td></tr>
              : users.length === 0
              ? <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>No users found</td></tr>
              : users.map((u, i) => (
                <tr key={u._id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f0ede8' : 'none',
                  background: u.isBanned ? '#fff5f5' : 'transparent' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <select value={u.role} onChange={e => changeRole(u._id, e.target.value)}
                      style={{ border: '1.5px solid #e5e0d8', borderRadius: 6, padding: '4px 8px', fontSize: 12,
                        color: ROLE_COLORS[u.role], fontWeight: 600, cursor: 'pointer' }}>
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14 }}>
                    <span style={{ color: '#d97706', fontWeight: 600 }}>⭐ {u.reputation || 0}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#555' }}>{u.stats?.issuesReportedCount || 0}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, color: '#059669', fontWeight: 500 }}>{u.stats?.issuesResolvedCount || 0}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#888' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.isBanned
                      ? <span style={{ background: '#fff1f2', color: '#be123c', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>BANNED</span>
                      : <span style={{ background: '#f0fdf4', color: '#15803d', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>ACTIVE</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setSelected(u)}
                        style={{ border: '1.5px solid #e5e0d8', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', background: '#fff' }}>
                        View
                      </button>
                      <button onClick={() => setBanModal(u)}
                        style={{ border: `1.5px solid ${u.isBanned ? '#bbf7d0' : '#fecdd3'}`,
                          background: u.isBanned ? '#f0fdf4' : '#fff1f2',
                          color: u.isBanned ? '#15803d' : '#be123c',
                          borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '7px 14px', borderRadius: 7, border: '1.5px solid #e5e0d8', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
          {Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{ padding: '7px 12px', borderRadius: 7, border: '1.5px solid', borderColor: page === p ? '#2563eb' : '#e5e0d8',
                background: page === p ? '#2563eb' : '#fff', color: page === p ? '#fff' : '#333', cursor: 'pointer', minWidth: 36 }}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            style={{ padding: '7px 14px', borderRadius: 7, border: '1.5px solid #e5e0d8', background: '#fff', cursor: page === pages ? 'not-allowed' : 'pointer' }}>Next →</button>
        </div>
      )}

      {/* User Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000060', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 480, maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>{selected.name}</h2>
              <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                ['Email', selected.email],
                ['Role', selected.role],
                ['Reputation', `⭐ ${selected.reputation || 0}`],
                ['Joined', new Date(selected.createdAt).toLocaleDateString()],
                ['Issues Reported', selected.stats?.issuesReportedCount || 0],
                ['Issues Resolved', selected.stats?.issuesResolvedCount || 0],
                ['Comments', selected.stats?.commentsCount || 0],
                ['Support Given', selected.stats?.totalSupportGiven || 0],
                ['Neighborhood', selected.neighborhood || '—'],
                ['Last Seen', selected.lastSeenAt ? new Date(selected.lastSeenAt).toLocaleDateString() : '—']
              ].map(([k, v]) => (
                <div key={k} style={{ background: '#fdfcfb', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
            {selected.badges?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Badges</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selected.badges.map(b => (
                    <span key={b.id} style={{ background: '#fdf9c4', border: '1px solid #fde047', borderRadius: 20, padding: '3px 12px', fontSize: 13 }}>
                      {b.icon} {b.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selected.bio && (
              <div style={{ marginTop: 16, background: '#f8f7f5', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#555' }}>
                {selected.bio}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000060', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setBanModal(null)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 400 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18 }}>{banModal.isBanned ? 'Unban' : 'Ban'} {banModal.name}?</h3>
            {!banModal.isBanned && (
              <>
                <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>Provide a reason (optional):</p>
                <textarea value={banReason} onChange={e => setBanReason(e.target.value)} rows={3}
                  placeholder="Reason for ban…"
                  style={{ width: '100%', border: '1.5px solid #e5e0d8', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box', resize: 'none' }} />
              </>
            )}
            {banModal.isBanned && <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>This will restore the user's access to the platform.</p>}
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={toggleBan}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                  background: banModal.isBanned ? '#059669' : '#dc2626', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                {banModal.isBanned ? 'Unban User' : 'Ban User'}
              </button>
              <button onClick={() => setBanModal(null)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #e5e0d8', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
