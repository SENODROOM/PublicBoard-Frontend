import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { issuesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUSES = ['Open', 'In Progress', 'Pending Review', 'Resolved'];
const STATUS_COLORS = {
  'Open': 'var(--red)', 'In Progress': 'var(--blue)',
  'Pending Review': 'var(--purple)', 'Resolved': 'var(--green)'
};

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    issuesAPI.getOne(id)
      .then(r => { setIssue(r.data.issue); setNewStatus(r.data.issue.status); })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSupport = async () => {
    if (!user) return toast.error('Login to support issues');
    try {
      const res = await issuesAPI.support(id);
      setIssue(res.data.issue);
      toast.success(res.data.supported ? 'Issue supported!' : 'Support removed');
    } catch (err) {
      toast.error('Failed');
    }
  };

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      const res = await issuesAPI.updateStatus(id, { status: newStatus, message: statusMessage });
      setIssue(res.data.issue);
      setShowStatusModal(false);
      setStatusMessage('');
      toast.success('Status updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this issue permanently?')) return;
    try {
      await issuesAPI.delete(id);
      toast.success('Issue deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const canUpdateStatus = user && (user.role === 'admin' || issue?.reporter?.email === user.email);

  if (loading) return <div className="loading"><div className="spinner" />Loading...</div>;
  if (!issue) return null;

  const statusColor = STATUS_COLORS[issue.status];
  const isSupported = user && issue.supporters?.includes(user.id);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      {/* Header bar with status color */}
      <div style={{ background: statusColor, height: 6 }} />
      <div style={{ background: 'var(--ink)', padding: '40px 0', borderBottom: '2px solid var(--ink)' }}>
        <div className="container">
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--cement)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
            ← Back to Dashboard
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                <span className="tag">{issue.category}</span>
                <span style={{
                  display: 'inline-block', padding: '3px 12px', border: `1.5px solid ${statusColor}`,
                  color: statusColor, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>{issue.status}</span>
              </div>
              <h1 style={{ color: 'var(--paper)', fontSize: 'clamp(22px, 3vw, 38px)', maxWidth: 680 }}>{issue.title}</h1>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {canUpdateStatus && (
                <button onClick={() => setShowStatusModal(true)} className="btn btn-amber btn-sm">
                  Update Status
                </button>
              )}
              {user?.role === 'admin' && (
                <button onClick={handleDelete} className="btn btn-sm btn-red">Delete</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 36 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, alignItems: 'start' }}>
          {/* Main content */}
          <div>
            {/* Description */}
            <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 32, marginBottom: 24, boxShadow: 'var(--shadow)' }}>
              <h2 style={{ fontSize: 18, marginBottom: 16 }}>Description</h2>
              <p style={{ lineHeight: 1.8, fontSize: 14, color: '#333', whiteSpace: 'pre-wrap' }}>{issue.description}</p>
            </div>

            {/* Updates timeline */}
            {issue.updates?.length > 0 && (
              <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 32, marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, marginBottom: 20 }}>Update Timeline</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {issue.updates.map((update, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16 }}>
                      <div style={{ flexShrink: 0, width: 12, height: 12, background: STATUS_COLORS[update.status] || 'var(--ink)', marginTop: 4, border: '2px solid var(--ink)' }} />
                      <div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{update.status}</span>
                          <span style={{ fontSize: 11, color: '#999' }}>by {update.updatedBy}</span>
                          <span style={{ fontSize: 11, color: '#999' }}>{new Date(update.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {update.message && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{update.message}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Support section */}
            <div style={{ background: 'var(--surface)', border: '2px solid var(--ink)', padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <button onClick={handleSupport} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 24px',
                  background: isSupported ? 'var(--ink)' : 'var(--white)',
                  color: isSupported ? 'var(--paper)' : 'var(--ink)',
                  border: '2px solid var(--ink)',
                  fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.1s'
                }}>
                  <span style={{ fontSize: 18 }}>▲</span>
                  <span>{issue.supportCount} Support{issue.supportCount !== 1 ? 's' : ''}</span>
                </button>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
                  {user ? 'Click to show your support for this issue.' : 'Login to support this issue and show the community you care.'}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Details */}
            <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 24 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Issue Details</h3>
              {[
                { label: 'Location', value: issue.location, icon: '📍' },
                { label: 'Reported by', value: issue.reporter?.name, icon: '👤' },
                { label: 'Date Reported', value: new Date(issue.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), icon: '📅' },
                { label: 'Supporters', value: issue.supportCount, icon: '▲' },
                ...(issue.resolvedAt ? [{ label: 'Resolved On', value: new Date(issue.resolvedAt).toLocaleDateString(), icon: '✅' }] : [])
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < 3 ? '1px dashed var(--cement)' : 'none' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: 4 }}>
                    {item.icon} {item.label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Status progress */}
            <div style={{ background: 'var(--ink)', padding: 24, color: 'var(--paper)' }}>
              <h3 style={{ fontSize: 14, marginBottom: 16, color: 'var(--amber)' }}>Status Progress</h3>
              {STATUSES.map((s, i) => {
                const current = STATUSES.indexOf(issue.status);
                const done = i <= current;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 16, height: 16, border: '2px solid', borderColor: done ? STATUS_COLORS[s] || 'var(--amber)' : 'var(--cement)', background: done ? STATUS_COLORS[s] || 'var(--amber)' : 'transparent', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: done ? 'var(--paper)' : 'var(--cement)' }}>{s}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 22 }}>Update Issue Status</h2>
              <button className="modal-close" onClick={() => setShowStatusModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>New Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Update Message (optional)</label>
              <textarea
                placeholder="Describe what's happening with this issue..."
                value={statusMessage}
                onChange={e => setStatusMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleStatusUpdate} className="btn btn-primary" disabled={updating}>
                {updating ? 'Updating...' : 'Update Status'}
              </button>
              <button onClick={() => setShowStatusModal(false)} className="btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
