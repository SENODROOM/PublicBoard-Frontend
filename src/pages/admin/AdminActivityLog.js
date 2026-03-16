import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

const ACTION_META = {
  'issue.created':               { icon: '📋', color: '#2563eb', label: 'Issue Created' },
  'issue.updated':               { icon: '✏️', color: '#7c3aed', label: 'Issue Updated' },
  'issue.deleted':               { icon: '🗑️', color: '#dc2626', label: 'Issue Deleted' },
  'issue.status_changed':        { icon: '🔄', color: '#059669', label: 'Status Changed' },
  'issue.supported':             { icon: '▲',  color: '#d97706', label: 'Issue Supported' },
  'issue.commented':             { icon: '💬', color: '#0891b2', label: 'Comment Added' },
  'issue.watched':               { icon: '🔔', color: '#6b7280', label: 'Issue Watched' },
  'user.registered':             { icon: '👤', color: '#059669', label: 'User Registered' },
  'user.login':                  { icon: '🔑', color: '#6b7280', label: 'User Login' },
  'user.role_changed':           { icon: '⚙️', color: '#7c3aed', label: 'Role Changed' },
  'user.deleted':                { icon: '🚫', color: '#dc2626', label: 'User Deleted' },
  'donation.created':            { icon: '💚', color: '#059669', label: 'Donation Received' },
  'admin.announcement_created':  { icon: '📢', color: '#2563eb', label: 'Announcement Created' },
  'admin.announcement_deleted':  { icon: '📢', color: '#dc2626', label: 'Announcement Deleted' },
  'admin.bulk_status':           { icon: '⚡', color: '#7c3aed', label: 'Bulk Status Update' },
  'admin.bulk_delete':           { icon: '⚡', color: '#dc2626', label: 'Bulk Delete' }
};

function timeAgo(date) {
  const s = Math.round((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export default function AdminActivityLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ action: '', role: '' });
  const [loading, setLoading] = useState(true);
  const LIMIT = 25;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (filter.action) params.set('action', filter.action);
    if (filter.role) params.set('role', filter.role);
    api.get(`/admin/activity?${params}`)
      .then(r => { setLogs(r.data.logs); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [page, filter]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Activity Log</h1>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 14 }}>Full audit trail of platform activity</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <select value={filter.action} onChange={e => { setFilter(f => ({ ...f, action: e.target.value })); setPage(1); }}
          style={{ border: '1.5px solid #e5e0d8', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
          <option value="">All Actions</option>
          {Object.entries(ACTION_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filter.role} onChange={e => { setFilter(f => ({ ...f, role: e.target.value })); setPage(1); }}
          style={{ border: '1.5px solid #e5e0d8', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="user">User</option>
        </select>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#888', alignSelf: 'center' }}>
          {total} events total
        </div>
      </div>

      {/* Log Table */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, overflow: 'hidden' }}>
        {loading
          ? <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>Loading…</div>
          : logs.length === 0
          ? <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>No activity found</div>
          : logs.map((log, i) => {
            const meta = ACTION_META[log.action] || { icon: '•', color: '#888', label: log.action };
            return (
              <div key={log._id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
                borderBottom: i < logs.length - 1 ? '1px solid #f0ede8' : 'none',
                background: i % 2 === 0 ? '#fff' : '#fdfcfb' }}>
                {/* Icon */}
                <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: meta.color + '18', fontSize: 16, flexShrink: 0 }}>
                  {meta.icon}
                </div>
                {/* Actor */}
                <div style={{ minWidth: 130 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{log.actor?.name || 'System'}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{log.actor?.role}</div>
                </div>
                {/* Action */}
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: meta.color }}>{meta.label}</span>
                  {log.target?.label && (
                    <span style={{ fontSize: 13, color: '#555' }}>
                      {' — '}
                      {log.target.type === 'issue'
                        ? <Link to={`/issues/${log.target.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>{log.target.label}</Link>
                        : log.target.label}
                    </span>
                  )}
                  {/* Extra meta for status changes */}
                  {log.meta?.from && log.meta?.to && (
                    <span style={{ fontSize: 12, color: '#888' }}> ({log.meta.from} → {log.meta.to})</span>
                  )}
                </div>
                {/* Time */}
                <div style={{ fontSize: 12, color: '#aaa', flexShrink: 0 }}>{timeAgo(log.createdAt)}</div>
              </div>
            );
          })
        }
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '7px 14px', borderRadius: 7, border: '1.5px solid #e5e0d8', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#ccc' : '#333' }}>
            ← Prev
          </button>
          {Array.from({ length: Math.min(7, pages) }, (_, i) => {
            const p = page <= 4 ? i + 1 : page - 3 + i;
            if (p < 1 || p > pages) return null;
            return (
              <button key={p} onClick={() => setPage(p)}
                style={{ padding: '7px 12px', borderRadius: 7, border: '1.5px solid', borderColor: page === p ? '#2563eb' : '#e5e0d8',
                  background: page === p ? '#2563eb' : '#fff', color: page === p ? '#fff' : '#333', cursor: 'pointer', minWidth: 36 }}>
                {p}
              </button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            style={{ padding: '7px 14px', borderRadius: 7, border: '1.5px solid #e5e0d8', background: '#fff', cursor: page === pages ? 'not-allowed' : 'pointer', color: page === pages ? '#ccc' : '#333' }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
