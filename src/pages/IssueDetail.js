import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { issuesAPI } from '../api';
import RelatedIssues from '../components/RelatedIssues';

const STATUS_COLORS = { Open: '#ef4444', 'In Progress': '#f59e0b', 'Pending Review': '#8b5cf6', Resolved: '#10b981' };
const PRIORITY_COLORS = { Critical: '#ef4444', High: '#f59e0b', Medium: '#3b82f6', Low: '#6b7280' };
const STATUSES = ['Open', 'In Progress', 'Pending Review', 'Resolved'];

function Pill({ label, color }) {
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: color + '20', color, display: 'inline-block'
    }}>{label}</span>
  );
}

function ActionBtn({ onClick, active, icon, label, color = '#374151', activeColor = '#4f46e5' }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
      borderRadius: 8, border: `1px solid ${active ? activeColor : '#e5e7eb'}`,
      background: active ? activeColor + '12' : '#fff', cursor: 'pointer',
      color: active ? activeColor : color, fontSize: 13, fontWeight: 500, transition: 'all 0.15s'
    }}>
      <span>{icon}</span><span>{label}</span>
    </button>
  );
}

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const commentRef = useRef(null);
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';
  const isReporter = user && issue?.reporter?.userId === user._id;

  useEffect(() => {
    issuesAPI.getOne(id)
      .then(d => { setIssue(d.issue); setNewStatus(d.issue.status); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [id]);

  const isWatching = issue?.watchers?.includes(user?._id);
  const isBookmarked = issue?.bookmarks?.includes(user?._id);
  const hasSupported = issue?.supporters?.includes(user?._id);

  const handleSupport = async () => {
    if (!user) return navigate('/login');
    const d = await issuesAPI.support(id);
    setIssue(d.issue);
  };

  const handleWatch = async () => {
    if (!user) return navigate('/login');
    const d = await issuesAPI.watch(id);
    setIssue(d.issue);
  };

  const handleBookmark = async () => {
    if (!user) return navigate('/login');
    const d = await issuesAPI.bookmark(id);
    setIssue(d.issue);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const d = await issuesAPI.addComment(id, commentText.trim());
      setIssue(d.issue);
      setCommentText('');
    } catch (err) {
      setStatusMsg(err.response?.data?.message || 'Failed to post comment');
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    const d = await issuesAPI.deleteComment(id, commentId);
    setIssue(d.issue);
  };

  const handleStatusUpdate = async () => {
    try {
      const d = await issuesAPI.updateStatus(id, newStatus, statusNote);
      setIssue(d.issue);
      setShowStatusForm(false);
      setStatusNote('');
      setStatusMsg('Status updated!');
      setTimeout(() => setStatusMsg(''), 2000);
    } catch {
      setStatusMsg('Failed to update status');
    }
  };

  const handleLock = async () => {
    const d = await issuesAPI.lockComments(id);
    setIssue(d.issue);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 24px', color: '#9ca3af', fontFamily: 'system-ui, sans-serif' }}>Loading issue…</div>;
  if (!issue) return (
    <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 40 }}>😕</div>
      <div style={{ fontSize: 18, fontWeight: 600, marginTop: 12, marginBottom: 8 }}>Issue not found</div>
      <Link to="/dashboard" style={{ color: '#4f46e5' }}>← Back to Dashboard</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', padding: '32px 24px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>
        <Link to="/dashboard" style={{ color: '#6b7280', textDecoration: 'none' }}>Dashboard</Link>
        {' / '}
        <Link to={`/dashboard?category=${issue.category}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{issue.category}</Link>
        {' / '}
        <span style={{ color: '#374151' }}>{issue.title.slice(0, 40)}…</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>
        {/* Main column */}
        <div>
          {/* Header */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '24px 28px', marginBottom: 16 }}>
            {/* Lock indicator */}
            {issue.isLocked && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#fef3c7', borderRadius: 8, fontSize: 12, color: '#92400e', marginBottom: 14 }}>
                🔒 Comments are locked on this issue
              </div>
            )}

            {/* Title + pills */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <Pill label={issue.status} color={STATUS_COLORS[issue.status]} />
              <Pill label={issue.priority} color={PRIORITY_COLORS[issue.priority]} />
            </div>
            <h1 style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{issue.title}</h1>

            {/* Tags */}
            {issue.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {issue.tags.map(t => (
                  <Link key={t} to={`/dashboard?tags=${t}`}
                    style={{ fontSize: 12, color: '#4f46e5', background: '#eff6ff', padding: '2px 8px', borderRadius: 20, textDecoration: 'none' }}>
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{issue.description}</p>

            {/* Meta row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#6b7280', borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
              <span>📋 <strong>{issue.category}</strong></span>
              <span>📍 {issue.location}</span>
              {issue.neighborhood && <span>🏘️ {issue.neighborhood}</span>}
              <span>👤 {issue.reporter?.name}</span>
              <span>🕒 {new Date(issue.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              {issue.assignedTo?.name && <span>⚙️ Assigned to <strong>{issue.assignedTo.name}</strong></span>}
            </div>
          </div>

          {/* Action bar */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <ActionBtn onClick={handleSupport} active={hasSupported} icon={hasSupported ? '▲' : '△'}
              label={`${issue.supportCount} Support${issue.supportCount !== 1 ? 's' : ''}`}
              activeColor="#4f46e5" />
            <ActionBtn onClick={handleWatch} active={isWatching}
              icon={isWatching ? '🔔' : '🔕'} label={isWatching ? 'Watching' : 'Watch'} activeColor="#059669" />
            <ActionBtn onClick={handleBookmark} active={isBookmarked}
              icon={isBookmarked ? '🔖' : '🏷️'} label={isBookmarked ? 'Bookmarked' : 'Bookmark'} activeColor="#f59e0b" />
            <ActionBtn onClick={handleShare} active={copied}
              icon={copied ? '✓' : '🔗'} label={copied ? 'Copied!' : 'Share'} activeColor="#059669" />
            {(isAdmin || isReporter) && (
              <ActionBtn onClick={() => setShowStatusForm(s => !s)} active={showStatusForm}
                icon="🔄" label="Update Status" activeColor="#7c3aed" />
            )}
            {isAdmin && (
              <ActionBtn onClick={handleLock} active={issue.isLocked}
                icon={issue.isLocked ? '🔓' : '🔒'} label={issue.isLocked ? 'Unlock' : 'Lock'} activeColor="#f59e0b" />
            )}
          </div>

          {/* Status update form */}
          {showStatusForm && (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 18, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Update Status</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setNewStatus(s)}
                    style={{
                      padding: '6px 14px', borderRadius: 8, border: '1px solid',
                      borderColor: newStatus === s ? STATUS_COLORS[s] : '#e5e7eb',
                      background: newStatus === s ? STATUS_COLORS[s] + '18' : '#fff',
                      color: newStatus === s ? STATUS_COLORS[s] : '#374151',
                      fontSize: 13, cursor: 'pointer', fontWeight: newStatus === s ? 600 : 400
                    }}>{s}</button>
                ))}
              </div>
              <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)}
                placeholder="Optional note (will appear in updates)…" rows={2}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }} />
              <button onClick={handleStatusUpdate}
                style={{ padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Apply Change
              </button>
            </div>
          )}

          {statusMsg && <div style={{ padding: '8px 14px', background: '#f0fdf4', color: '#166534', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{statusMsg}</div>}

          {/* Updates log */}
          {issue.updates?.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 18, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Status Updates</div>
              {issue.updates.map((u, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 10, borderBottom: i < issue.updates.length - 1 ? '1px solid #f3f4f6' : 'none', marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[u.status] || '#9ca3af', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, color: '#111827' }}>{u.message || `Status changed to ${u.status}`}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{u.updatedBy} · {new Date(u.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comments */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
              Comments ({issue.comments?.length || 0})
            </div>

            {!issue.comments?.length && <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 20 }}>No comments yet. Be the first!</div>}

            {issue.comments?.map(comment => {
              const isOwner = user?._id === comment.author?.userId;
              const canDelete = isOwner || isAdmin;
              return (
                <div key={comment._id} style={{
                  padding: '14px 0', borderBottom: '1px solid #f3f4f6',
                  background: comment.isAdminNote ? '#fffbeb' : 'transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: comment.isAdminNote ? '#fef3c7' : '#e0e7ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      color: comment.isAdminNote ? '#92400e' : '#4f46e5'
                    }}>{comment.author?.name?.[0]?.toUpperCase()}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{comment.author?.name}</span>
                    {comment.isAdminNote && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#fcd34d', color: '#92400e' }}>ADMIN</span>
                    )}
                    <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                    {canDelete && (
                      <button onClick={() => handleDeleteComment(comment._id)}
                        style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>
                        Delete
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, paddingLeft: 36 }}>
                    {/* Highlight @mentions */}
                    {comment.text.split(/(@\w+)/g).map((part, i) =>
                      part.startsWith('@')
                        ? <span key={i} style={{ color: '#4f46e5', fontWeight: 600 }}>{part}</span>
                        : part
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add comment form */}
            {user ? (
              issue.isLocked && !isAdmin ? (
                <div style={{ marginTop: 16, padding: '10px 14px', background: '#fef9ee', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
                  🔒 Comments are locked on this issue
                </div>
              ) : (
                <form onSubmit={handleComment} style={{ marginTop: 16 }}>
                  <textarea
                    ref={commentRef}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a comment… Use @name to mention someone"
                    rows={3} maxLength={1000}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#4f46e5'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{commentText.length}/1000</span>
                    <button type="submit" disabled={!commentText.trim() || submitting}
                      style={{
                        padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none',
                        borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        opacity: !commentText.trim() || submitting ? 0.5 : 1
                      }}>
                      {submitting ? 'Posting…' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              )
            ) : (
              <div style={{ marginTop: 14, fontSize: 13, color: '#6b7280' }}>
                <Link to="/login" style={{ color: '#4f46e5', fontWeight: 600 }}>Sign in</Link> to leave a comment
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>
          {/* Stats */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue Stats</div>
            {[
              { icon: '▲', label: 'Supporters', value: issue.supportCount },
              { icon: '👁', label: 'Views', value: issue.views || 0 },
              { icon: '💬', label: 'Comments', value: issue.comments?.length || 0 },
              { icon: '🔔', label: 'Watchers', value: issue.watchers?.length || 0 },
              { icon: '🔖', label: 'Bookmarks', value: issue.bookmarks?.length || 0 },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f9fafb', fontSize: 13 }}>
                <span style={{ color: '#6b7280' }}>{icon} {label}</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>{value}</span>
              </div>
            ))}
            {issue.resolutionTimeHours != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13 }}>
                <span style={{ color: '#6b7280' }}>⏱ Resolved in</span>
                <span style={{ fontWeight: 600, color: '#059669' }}>
                  {issue.resolutionTimeHours < 24 ? `${issue.resolutionTimeHours}h` : `${Math.round(issue.resolutionTimeHours / 24)}d`}
                </span>
              </div>
            )}
          </div>

          {/* Related Issues */}
          <RelatedIssues issueId={issue._id} category={issue.category} />

          {/* Print-friendly / admin actions */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={handleShare}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: copied ? '#f0fdf4' : '#fff', cursor: 'pointer', fontSize: 13, color: copied ? '#166534' : '#374151', textAlign: 'left' }}>
                {copied ? '✓ Link Copied!' : '🔗 Copy Link'}
              </button>
              <button onClick={() => window.print()}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151', textAlign: 'left' }}>
                🖨️ Print Issue
              </button>
              <Link to={`/report?related=${issue._id}&category=${encodeURIComponent(issue.category)}&neighborhood=${encodeURIComponent(issue.neighborhood || '')}`}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', textDecoration: 'none', fontSize: 13, color: '#374151' }}>
                📋 Report Similar
              </Link>
              {isAdmin && (
                <Link to={`/admin/issues?id=${issue._id}`}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', textDecoration: 'none', fontSize: 13, color: '#7c3aed' }}>
                  ⚙️ Manage in Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
