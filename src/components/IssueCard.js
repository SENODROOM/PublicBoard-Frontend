import React from 'react';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  'Open':           { bg: '#c83232', text: '#fff' },
  'In Progress':    { bg: '#1a4a8a', text: '#fff' },
  'Pending Review': { bg: '#6a3a9a', text: '#fff' },
  'Resolved':       { bg: '#2a7a4a', text: '#fff' },
};
const PRIORITY_COLORS = {
  'Low':      '#888',
  'Medium':   '#1a4a8a',
  'High':     '#e8a020',
  'Critical': '#c83232',
};

function timeAgo(d) {
  const diff = Date.now() - new Date(d);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30)  return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function IssueCard({ issue, onSupport, hasSupported, compact = false }) {
  const status = STATUS_COLORS[issue.status] || STATUS_COLORS['Open'];
  const prioColor = PRIORITY_COLORS[issue.priority] || PRIORITY_COLORS['Medium'];

  return (
    <div style={{
      background: 'var(--white)',
      border: '2px solid var(--ink)',
      boxShadow: '3px 3px 0 var(--ink)',
      transition: 'transform 0.12s, box-shadow 0.12s',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '5px 5px 0 var(--ink)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0 var(--ink)'; }}
    >
      {/* Priority stripe */}
      <div style={{ height: 3, background: prioColor }} />

      <div style={{ padding: compact ? '12px 14px' : '18px' }}>
        {/* Badges row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', padding: '3px 7px',
            background: status.bg, color: status.text, textTransform: 'uppercase'
          }}>{issue.status}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', padding: '3px 7px',
            background: prioColor + '18', color: prioColor,
            border: `1px solid ${prioColor}`, textTransform: 'uppercase'
          }}>{issue.priority}</span>
          <span style={{
            fontSize: 9, padding: '3px 7px', background: 'var(--paper)',
            border: '1px solid var(--cement)', color: '#666', textTransform: 'uppercase', letterSpacing: '0.04em'
          }}>{issue.category}</span>
        </div>

        {/* Title */}
        <Link to={`/issues/${issue._id}`} style={{ textDecoration: 'none' }}>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: compact ? 14 : 16, lineHeight: 1.3,
            color: 'var(--ink)', marginBottom: 6
          }}>{issue.title}</h3>
        </Link>

        {/* Meta */}
        <div style={{ fontSize: 10, color: '#888', display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: compact ? 0 : 10 }}>
          <span>📍 {issue.location}</span>
          {issue.neighborhood && <span>🏘️ {issue.neighborhood}</span>}
          <span>🕒 {timeAgo(issue.createdAt)}</span>
        </div>

        {/* Tags */}
        {!compact && issue.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
            {issue.tags.slice(0, 4).map(t => (
              <Link key={t} to={`/dashboard?tags=${t}`}
                style={{ fontSize: 9, color: '#999', letterSpacing: '0.04em', textDecoration: 'none' }}
                onClick={e => e.stopPropagation()}>
                #{t}
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        {!compact && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: 10, marginTop: 4 }}>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSupport?.(issue._id); }}
              aria-label={`Support this issue — ${issue.supportCount || 0} supporters`}
              aria-pressed={!!hasSupported}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontFamily: 'var(--font-mono)',
                padding: '4px 10px',
                border: `1.5px solid ${hasSupported ? 'var(--ink)' : 'var(--ink)'}`,
                background: hasSupported ? 'var(--ink)' : 'none',
                color: hasSupported ? 'var(--amber)' : 'var(--ink)',
                cursor: 'pointer', transition: 'all 0.12s',
                fontWeight: hasSupported ? 700 : 400
              }}
            >
              ▲ {issue.supportCount || 0}
            </button>
            <div style={{ display: 'flex', gap: 10, fontSize: 10, color: '#aaa' }}>
              <span>👁 {issue.views || 0}</span>
              <span>💬 {issue.comments?.length || 0}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}