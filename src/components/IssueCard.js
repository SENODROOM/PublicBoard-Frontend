import React from 'react';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  'Open': { cls: 'badge-open', label: 'Open' },
  'In Progress': { cls: 'badge-progress', label: 'In Progress' },
  'Pending Review': { cls: 'badge-pending', label: 'Pending Review' },
  'Resolved': { cls: 'badge-resolved', label: 'Resolved' }
};

const CATEGORY_COLORS = {
  'Infrastructure': '#1a4a8a',
  'Safety': '#c83232',
  'Sanitation': '#2a7a4a',
  'Community Resources': '#e8a020',
  'Environment': '#2a7a4a',
  'Transportation': '#6a3a9a',
  'Other': '#555'
};

export default function IssueCard({ issue, onSupport, currentUser }) {
  const statusCfg = STATUS_CONFIG[issue.status] || STATUS_CONFIG['Open'];
  const catColor = CATEGORY_COLORS[issue.category] || '#555';
  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const isSupported = currentUser && issue.supporters?.includes(currentUser.id);

  return (
    <div className="card animate-in" style={{ padding: 0, overflow: 'hidden', cursor: 'default' }}>
      {/* Top accent bar */}
      <div style={{ height: 4, background: catColor }} />
      
      <div style={{ padding: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <span className="tag" style={{ background: catColor }}>{issue.category}</span>
          <span className={`badge ${statusCfg.cls}`}>{statusCfg.label}</span>
        </div>

        {/* Title */}
        <Link to={`/issues/${issue._id}`}>
          <h3 style={{ fontSize: 16, marginBottom: 8, fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 1.3 }}
              onMouseEnter={e => e.target.style.color = catColor}
              onMouseLeave={e => e.target.style.color = 'var(--ink)'}>
            {issue.title}
          </h3>
        </Link>

        {/* Description */}
        <p style={{ color: '#555', fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
          {issue.description.length > 120 ? issue.description.slice(0, 120) + '...' : issue.description}
        </p>

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, color: '#777', fontSize: 12 }}>
          <span>📍</span>
          <span>{issue.location}</span>
        </div>

        <hr style={{ border: 'none', borderTop: '1px dashed var(--cement)', marginBottom: 14 }} />

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#888', fontFamily: 'var(--font-mono)' }}>
            <div>{issue.reporter?.name}</div>
            <div>{timeAgo(issue.createdAt)}</div>
          </div>

          <button
            onClick={() => onSupport && onSupport(issue._id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: isSupported ? 'var(--ink)' : 'var(--paper)',
              color: isSupported ? 'var(--paper)' : 'var(--ink)',
              border: '2px solid var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 700,
              cursor: onSupport ? 'pointer' : 'default',
              transition: 'all 0.1s'
            }}
          >
            <span>▲</span>
            <span>{issue.supportCount || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
