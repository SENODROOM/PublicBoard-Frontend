import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api';
import AdminLayout from './AdminLayout';
import toast from 'react-hot-toast';

const STATUSES = ['Open', 'In Progress', 'Pending Review', 'Resolved'];
const STATUS_COLORS = { 'Open': '#c83232', 'In Progress': '#1a4a8a', 'Pending Review': '#6a3a9a', 'Resolved': '#2a7a4a' };
const CATEGORIES = ['Infrastructure', 'Safety', 'Sanitation', 'Community Resources', 'Environment', 'Transportation', 'Other'];

export default function AdminIssues() {
  const [issues, setIssues] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [filters, setFilters] = useState({ status: '', category: '', search: '', sort: '-createdAt' });
  const [editModal, setEditModal] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setSelected([]);
    try {
      const params = { page, limit: 15, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await adminAPI.getIssues(params);
      setIssues(res.data.issues);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(selected.length === issues.length ? [] : issues.map(i => i._id));

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this issue?')) return;
    try { await adminAPI.deleteIssue(id); toast.success('Deleted'); fetchIssues(); }
    catch { toast.error('Failed'); }
  };

  const handleBulkStatus = async (status) => {
    if (!selected.length) return toast.error('Select issues first');
    try { await adminAPI.bulkStatusUpdate(selected, status); toast.success(`${selected.length} issues updated`); fetchIssues(); }
    catch { toast.error('Failed'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return toast.error('Select issues first');
    if (!window.confirm(`Delete ${selected.length} issues?`)) return;
    try { await adminAPI.bulkDelete(selected); toast.success(`${selected.length} deleted`); fetchIssues(); }
    catch { toast.error('Failed'); }
  };

  const openEdit = (issue) => { setEditModal(issue); setEditStatus(issue.status); setEditMessage(''); };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await adminAPI.updateIssue(editModal._id, { status: editStatus, message: editMessage });
      toast.success('Updated!'); setEditModal(null); fetchIssues();
    } catch { toast.error('Failed'); }
    finally { setUpdating(false); }
  };

  const timeAgo = (d) => { const days = Math.floor((Date.now() - new Date(d)) / 86400000); return days === 0 ? 'Today' : `${days}d ago`; };

  return (
    <AdminLayout>
      <div style={{ padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: '#888', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Admin / Issues</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <h1 style={{ fontSize: 'clamp(22px,3vw,34px)' }}>Issue Management <span style={{ fontSize: 16, color: '#888', fontWeight: 400 }}>({total})</span></h1>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 16, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input placeholder="Search..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && fetchIssues()}
            style={{ flex: '1 1 180px', padding: '8px 12px', border: '2px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--paper)' }} />
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            style={{ flex: '0 0 140px', padding: '8px 12px', border: '2px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--paper)' }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
            style={{ flex: '0 0 160px', padding: '8px 12px', border: '2px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--paper)' }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={fetchIssues} className="btn btn-primary btn-sm">Filter</button>
        </div>

        {/* Bulk actions */}
        {selected.length > 0 && (
          <div style={{ background: '#e8a020', border: '2px solid var(--ink)', padding: '10px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700 }}>{selected.length} selected</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <button key={s} onClick={() => handleBulkStatus(s)} className="btn btn-sm" style={{ fontSize: 11 }}>→ {s}</button>
              ))}
              <button onClick={handleBulkDelete} className="btn btn-sm btn-red" style={{ fontSize: 11 }}>🗑 Delete All</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', overflowX: 'auto' }}>
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', width: 40 }}>
                    <input type="checkbox" checked={selected.length === issues.length && issues.length > 0} onChange={toggleAll}
                      style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  </th>
                  {['Title', 'Category', 'Status', 'Reporter', 'Support', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {issues.map((issue, i) => (
                  <tr key={issue._id} style={{ borderBottom: '1px solid #eee', background: selected.includes(issue._id) ? '#fffbe8' : i % 2 === 0 ? 'white' : '#fafaf8' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <input type="checkbox" checked={selected.includes(issue._id)} onChange={() => toggleSelect(issue._id)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: '10px 16px', maxWidth: 200 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>📍 {issue.location}</div>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 11, background: '#eee', padding: '2px 8px', fontFamily: 'var(--font-mono)' }}>{issue.category}</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', border: `1.5px solid ${STATUS_COLORS[issue.status]}`, color: STATUS_COLORS[issue.status], fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {issue.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13 }}>{issue.reporter?.name || '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, textAlign: 'center' }}>{issue.supportCount || 0}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>{timeAgo(issue.createdAt)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(issue)} className="btn btn-sm" style={{ fontSize: 10, padding: '4px 10px' }}>Edit</button>
                        <button onClick={() => handleDelete(issue._id)} className="btn btn-sm btn-red" style={{ fontSize: 10, padding: '4px 10px' }}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-sm">← Prev</button>
            <span style={{ padding: '6px 14px', border: '2px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              {page} / {pages}
            </span>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn btn-sm">Next →</button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 20 }}>Edit Issue</h2>
              <button className="modal-close" onClick={() => setEditModal(null)}>×</button>
            </div>
            <div style={{ marginBottom: 16, fontSize: 14, color: '#555', fontStyle: 'italic' }}>{editModal.title}</div>
            <div className="form-group">
              <label>Status</label>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Admin Note (optional)</label>
              <textarea value={editMessage} onChange={e => setEditMessage(e.target.value)} rows={3} placeholder="Add an update message..." />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleUpdate} className="btn btn-primary" disabled={updating}>{updating ? 'Saving...' : 'Save Changes'}</button>
              <button onClick={() => setEditModal(null)} className="btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
