import { useState, useEffect } from 'react';
import { api } from '../api';

const TYPE_STYLES = {
  info:     { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: 'ℹ️' },
  warning:  { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '⚠️' },
  success:  { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: '✅' },
  critical: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '🚨' },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pb_dismissed_ann') || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    api.get('/announcements')
      .then(d => setAnnouncements(d.announcements || []))
      .catch(() => {});
  }, []);

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('pb_dismissed_ann', JSON.stringify(next));
  };

  const visible = announcements.filter(a => !dismissed.includes(a._id));
  if (!visible.length) return null;

  // Show pinned first, then rest
  const sorted = [...visible].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {sorted.map(ann => {
        const style = TYPE_STYLES[ann.type] || TYPE_STYLES.info;
        return (
          <div key={ann._id} style={{
            background: style.bg,
            borderBottom: `1px solid ${style.border}`,
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: style.text,
          }}>
            {ann.pinned && <span style={{ fontSize: 11, fontWeight: 700, background: style.border, padding: '1px 6px', borderRadius: 4, marginRight: 4 }}>📌 PINNED</span>}
            <span>{style.icon}</span>
            <span style={{ fontWeight: 600 }}>{ann.title}</span>
            {ann.body && <span style={{ color: style.text, opacity: 0.85 }}>— {ann.body}</span>}
            {ann.link && (
              <a href={ann.link} target="_blank" rel="noreferrer"
                style={{ marginLeft: 6, color: style.text, fontWeight: 600, textDecoration: 'underline' }}>
                {ann.linkLabel || 'Learn more'}
              </a>
            )}
            <div style={{ flex: 1 }} />
            {ann.dismissible && (
              <button onClick={() => dismiss(ann._id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: style.text, opacity: 0.6, padding: '0 4px', lineHeight: 1 }}>
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
