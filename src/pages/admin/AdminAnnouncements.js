import { useState, useEffect } from 'react';
import api from '../../api';

const TYPE_COLORS = {
  info:     { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: 'Info' },
  warning:  { bg: '#fffbeb', text: '#92400e', border: '#fcd34d', label: 'Warning' },
  success:  { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: 'Success' },
  critical: { bg: '#fff1f2', text: '#be123c', border: '#fecdd3', label: 'Critical' }
};

const EMPTY = { title: '', body: '', type: 'info', pinned: false, dismissible: true, expiresAt: '', link: '', linkLabel: '' };

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get('/announcements/all').then(r => setAnnouncements(r.data.announcements));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return setError('Title and body are required');
    setSaving(true); setError('');
    try {
      await api.post('/announcements', { ...form, expiresAt: form.expiresAt || null });
      setForm(EMPTY); setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const toggle = async (id) => {
    await api.patch(`/announcements/${id}/toggle`);
    load();
  };

  const del = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await api.delete(`/announcements/${id}`);
    load();
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Announcements</h1>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 14 }}>Manage banners shown to all users on the dashboard</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          {showForm ? 'Cancel' : '+ New Announcement'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={submit} style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, padding: 24, marginBottom: 28 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16 }}>New Announcement</h3>
          {error && <div style={{ background: '#fff1f2', color: '#be123c', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 14 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={120}
                style={{ width: '100%', border: '1.5px solid #e5e0d8', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Body *</label>
              <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={3} maxLength={600}
                style={{ width: '100%', border: '1.5px solid #e5e0d8', borderRadius: 8, padding: '9px 12px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ width: '100%', border: '1.5px solid #e5e0d8', borderRadius: 8, padding: '9px 12px', fontSize: 14 }}>
                {Object.entries(TYPE_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Expires At (optional)</label>
              <input type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                style={{ width: '100%', border: '1.5px solid #e5e0d8', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Link URL (optional)</label>
              <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..."
                style={{ width: '100%', border: '1.5px solid #e5e0d8', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Link Label</label>
              <input value={form.linkLabel} onChange={e => setForm(f => ({ ...f, linkLabel: e.target.value }))} placeholder="Learn more"
                style={{ width: '100%', border: '1.5px solid #e5e0d8', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} />
              Pin to top
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.dismissible} onChange={e => setForm(f => ({ ...f, dismissible: e.target.checked }))} />
              Dismissible by users
            </label>
          </div>
          <button type="submit" disabled={saving}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Publish Announcement'}
          </button>
        </form>
      )}

      {/* List */}
      {announcements.length === 0
        ? <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>No announcements yet</div>
        : announcements.map(ann => {
          const c = TYPE_COLORS[ann.type] || TYPE_COLORS.info;
          const expired = ann.expiresAt && new Date(ann.expiresAt) < new Date();
          return (
            <div key={ann._id} style={{ background: ann.isActive ? '#fff' : '#f8f7f5', border: `1.5px solid ${ann.isActive ? c.border : '#e5e0d8'}`, borderRadius: 12, padding: 20, marginBottom: 16, opacity: (!ann.isActive || expired) ? 0.65 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    {ann.pinned && <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', borderRadius: 4, padding: '1px 6px' }}>📌 PINNED</span>}
                    <span style={{ fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, borderRadius: 4, padding: '2px 8px' }}>{c.label.toUpperCase()}</span>
                    {!ann.isActive && <span style={{ fontSize: 11, color: '#aaa' }}>INACTIVE</span>}
                    {expired && <span style={{ fontSize: 11, color: '#dc2626' }}>EXPIRED</span>}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{ann.title}</div>
                  <div style={{ fontSize: 14, color: '#555' }}>{ann.body}</div>
                  {ann.link && <a href={ann.link} style={{ fontSize: 13, color: '#2563eb', marginTop: 4, display: 'block' }}>{ann.linkLabel || ann.link}</a>}
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>
                    By {ann.createdBy} · {new Date(ann.createdAt).toLocaleDateString()}
                    {ann.expiresAt && ` · Expires ${new Date(ann.expiresAt).toLocaleDateString()}`}
                    {ann.dismissible && ' · Dismissible'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => toggle(ann._id)}
                    style={{ padding: '6px 14px', borderRadius: 6, border: '1.5px solid #e5e0d8', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    {ann.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => del(ann._id)}
                    style={{ padding: '6px 14px', borderRadius: 6, border: '1.5px solid #fecdd3', background: '#fff1f2', color: '#be123c', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })
      }
    </div>
  );
}
