import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from './AdminLayout';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [detailModal, setDetailModal] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await adminAPI.getUsers(params);
      setUsers(res.data.users);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleToggle = async (user) => {
    if (user._id === currentUser.id) return toast.error("Can't change your own role");
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await adminAPI.updateUserRole(user._id, newRole);
      toast.success(`${user.name} is now ${newRole}`);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (user) => {
    if (user._id === currentUser.id) return toast.error("Can't delete yourself");
    if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(user._id);
      toast.success('User deleted');
      fetchUsers();
    } catch { toast.error('Failed'); }
  };

  const openDetail = async (user) => {
    setDetailModal(user);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const res = await adminAPI.getUser(user._id);
      setDetailData(res.data);
    } catch { toast.error('Failed to load user details'); }
    finally { setDetailLoading(false); }
  };

  const timeAgo = (d) => { const days = Math.floor((Date.now() - new Date(d)) / 86400000); return days === 0 ? 'Today' : `${days}d ago`; };

  return (
    <AdminLayout>
      <div style={{ padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: '#888', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Admin / Users</div>
          <h1 style={{ fontSize: 'clamp(22px,3vw,34px)' }}>User Management <span style={{ fontSize: 16, color: '#888', fontWeight: 400 }}>({total})</span></h1>
        </div>

        {/* Filters */}
        <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 16, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <input placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchUsers()}
            style={{ flex: '1 1 200px', padding: '8px 12px', border: '2px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--paper)' }} />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            style={{ flex: '0 0 130px', padding: '8px 12px', border: '2px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--paper)' }}>
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={fetchUsers} className="btn btn-primary btn-sm">Filter</button>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', overflowX: 'auto' }}>
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead>
                <tr style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
                  {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? 'white' : '#fafaf8' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, background: u.role === 'admin' ? '#e8a020' : '#0a0a0f', color: u.role === 'admin' ? '#0a0a0f' : '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                          {u.name}
                          {u._id === currentUser.id && <span style={{ fontSize: 10, background: '#eee', padding: '1px 6px', marginLeft: 6 }}>YOU</span>}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', fontSize: 11, fontWeight: 700,
                        background: u.role === 'admin' ? '#e8a020' : '#eee',
                        color: u.role === 'admin' ? '#0a0a0f' : '#555'
                      }}>{u.role.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#888' }}>{timeAgo(u.createdAt)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => openDetail(u)} className="btn btn-sm" style={{ fontSize: 10, padding: '4px 10px' }}>View</button>
                        <button onClick={() => handleRoleToggle(u)} className="btn btn-sm btn-amber" style={{ fontSize: 10, padding: '4px 10px' }}
                          disabled={u._id === currentUser.id}>
                          {u.role === 'admin' ? '→ User' : '→ Admin'}
                        </button>
                        <button onClick={() => handleDelete(u)} className="btn btn-sm btn-red" style={{ fontSize: 10, padding: '4px 10px' }}
                          disabled={u._id === currentUser.id}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && users.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: '#aaa', fontSize: 14 }}>No users found</div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-sm">← Prev</button>
            <span style={{ padding: '6px 14px', border: '2px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{page} / {pages}</span>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn btn-sm">Next →</button>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2 style={{ fontSize: 20 }}>User Profile</h2>
              <button className="modal-close" onClick={() => setDetailModal(null)}>×</button>
            </div>
            {detailLoading ? (
              <div className="loading"><div className="spinner" /></div>
            ) : detailData ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: '#f9f9f7', border: '1px solid #ddd' }}>
                  <div style={{ width: 56, height: 56, background: detailData.user.role === 'admin' ? '#e8a020' : '#0a0a0f', color: detailData.user.role === 'admin' ? '#0a0a0f' : '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24 }}>
                    {detailData.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>{detailData.user.name}</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{detailData.user.email}</div>
                    <div style={{ marginTop: 4 }}>
                      <span style={{ padding: '2px 8px', fontSize: 10, fontWeight: 700, background: detailData.user.role === 'admin' ? '#e8a020' : '#eee' }}>
                        {detailData.user.role.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: 14, marginBottom: 12 }}>Issues Reported ({detailData.issues?.length || 0})</h4>
                  <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {detailData.issues?.slice(0, 10).map(issue => (
                      <div key={issue._id} style={{ padding: '8px 12px', background: '#f5f5f5', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{issue.title}</span>
                        <span style={{ fontSize: 11, color: '#888', flexShrink: 0, marginLeft: 8 }}>{issue.status}</span>
                      </div>
                    ))}
                    {(!detailData.issues || detailData.issues.length === 0) && (
                      <div style={{ color: '#aaa', fontSize: 13 }}>No issues reported yet</div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
