export function ReputationBadge({ reputation = 0, size = 'sm' }) {
  const level = reputation >= 500 ? { label: 'Champion', color: '#f59e0b', bg: '#fffbeb' }
    : reputation >= 200 ? { label: 'Advocate', color: '#4f46e5', bg: '#eff6ff' }
    : reputation >= 100 ? { label: 'Contributor', color: '#059669', bg: '#f0fdf4' }
    : reputation >= 25 ? { label: 'Member', color: '#0891b2', bg: '#ecfeff' }
    : { label: 'Newcomer', color: '#6b7280', bg: '#f9fafb' };

  const styles = size === 'lg'
    ? { padding: '4px 12px', fontSize: 13, borderRadius: 20 }
    : { padding: '2px 8px', fontSize: 11, borderRadius: 20 };

  return (
    <span style={{ ...styles, background: level.bg, color: level.color, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {size === 'lg' && <span>{level.label}</span>}
      <span>{reputation} pts</span>
    </span>
  );
}

export function BadgeList({ badges = [], maxShow = 5 }) {
  if (!badges.length) return <span style={{ fontSize: 12, color: '#9ca3af' }}>No badges yet</span>;
  const shown = badges.slice(0, maxShow);
  const rest = badges.length - maxShow;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {shown.map((badge, i) => (
        <span key={i} title={badge.label} style={{
          fontSize: 18, cursor: 'default',
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
        }}>{badge.icon}</span>
      ))}
      {rest > 0 && <span style={{ fontSize: 12, color: '#6b7280' }}>+{rest} more</span>}
    </div>
  );
}

export function BadgeGrid({ badges = [] }) {
  const ALL_BADGES = [
    { id: 'first_report', label: 'First Report', icon: '📋', desc: 'Report your first community issue' },
    { id: 'five_reports', label: 'Active Reporter', icon: '🗂️', desc: 'Report 5 issues' },
    { id: 'ten_reports', label: 'Community Advocate', icon: '📣', desc: 'Report 10 issues' },
    { id: 'first_resolve', label: 'Problem Solver', icon: '✅', desc: 'Have your first issue resolved' },
    { id: 'five_resolves', label: 'Change Maker', icon: '🏆', desc: 'Have 5 issues resolved' },
    { id: 'supporter', label: 'Supporter', icon: '▲', desc: 'Support 5 issues' },
    { id: 'donor', label: 'Donor', icon: '💚', desc: 'Make a donation' },
    { id: 'veteran', label: 'Veteran', icon: '⭐', desc: 'Member for over a year' },
  ];
  const earnedIds = badges.map(b => b.id);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
      {ALL_BADGES.map(b => {
        const earned = earnedIds.includes(b.id);
        return (
          <div key={b.id} title={b.desc} style={{
            padding: '14px 12px', borderRadius: 10, textAlign: 'center',
            border: `1px solid ${earned ? '#e0e7ff' : '#f3f4f6'}`,
            background: earned ? '#f5f3ff' : '#f9fafb',
            opacity: earned ? 1 : 0.45,
            transition: 'all 0.2s',
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{b.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: earned ? '#4f46e5' : '#6b7280' }}>{b.label}</div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>{b.desc}</div>
          </div>
        );
      })}
    </div>
  );
}
