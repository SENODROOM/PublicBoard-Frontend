import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { issuesAPI } from '../api';

const STATUS_COLORS = {
  'Open': '#ef4444',
  'In Progress': '#f59e0b',
  'Pending Review': '#8b5cf6',
  'Resolved': '#10b981',
};

const PRIORITY_COLORS = {
  Critical: '#ef4444', High: '#f59e0b', Medium: '#3b82f6', Low: '#6b7280'
};

export default function RelatedIssues({ issueId, category }) {
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!issueId) return;
    issuesAPI.getRelated(issueId)
      .then(d => { setRelated(d.related || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [issueId]);

  if (loading) return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 10 }}>Related Issues</div>
      <div style={{ color: '#9ca3af', fontSize: 13 }}>Loading…</div>
    </div>
  );

  if (!related.length) return null;

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 12 }}>Related Issues</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {related.map(issue => (
          <Link key={issue._id} to={`/issues/${issue._id}`}
            style={{ textDecoration: 'none', color: 'inherit', display: 'block', padding: '10px 12px', borderRadius: 8, border: '1px solid #f3f4f6', background: '#fafafa', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#d1d5db'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#f3f4f6'}
          >
            <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 6, lineHeight: 1.3 }}>
              {issue.title}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, padding: '1px 7px', borderRadius: 20,
                background: STATUS_COLORS[issue.status] + '18', color: STATUS_COLORS[issue.status], fontWeight: 600
              }}>{issue.status}</span>
              <span style={{
                fontSize: 11, padding: '1px 7px', borderRadius: 20,
                background: PRIORITY_COLORS[issue.priority] + '18', color: PRIORITY_COLORS[issue.priority], fontWeight: 600
              }}>{issue.priority}</span>
              <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>▲ {issue.supportCount}</span>
            </div>
          </Link>
        ))}
      </div>
      <Link to={`/dashboard?category=${category}`}
        style={{ display: 'block', marginTop: 12, fontSize: 12, color: '#4f46e5', textDecoration: 'none', textAlign: 'center' }}>
        View all in {category} →
      </Link>
    </div>
  );
}
