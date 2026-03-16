import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../api';
import AdminLayout from './AdminLayout';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  'Open': '#c83232', 'In Progress': '#1a4a8a',
  'Pending Review': '#6a3a9a', 'Resolved': '#2a7a4a'
};
const PRIORITY_COLORS = { 'Low': '#888', 'Medium': '#1a4a8a', 'High': '#e8a020', 'Critical': '#c83232' };

const StatBox = ({ num, label, color = 'var(--ink)', sub }) => (
  <div style={{ padding: '20px 24px', background: color, color: 'white', border: '2px solid var(--ink)', boxShadow: '3px 3px 0 var(--ink)' }}>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{num}</div>
    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6, opacity: 0.85 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>{sub}</div>}
  </div>
);

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getOverview()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load overview'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><div className="loading"><div className="spinner" />Loading overview...</div></AdminLayout>;

  const { stats, recentIssues, recentUsers, recentDonations, categoryBreakdown, priorityBreakdown } = data;
  const maxCat = Math.max(...(categoryBreakdown?.map(c => c.count) || [1]));

  const timeAgo = (d) => {
    const diff = Date.now() - new Date(d);
    const days = Math.floor(diff / 86400000);
    return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`;
  };

  // Map priority breakdown to ordered array
  const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];
  const priorityMap = Object.fromEntries((priorityBreakdown || []).map(p => [p._id, p.count]));

  return (
    <AdminLayout>
      <div style={{ padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Admin Panel</div>
          <h1 style={{ fontSize: 'clamp(24px,3vw,38px)' }}>Overview</h1>
        </div>

        {/* Top stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 32 }}>
          <StatBox num={stats.totalIssues} label="Total Issues" color="#0a0a0f" />
          <StatBox num={stats.openIssues} label="Open" color="#c83232" />
          <StatBox num={stats.inProgressIssues} label="In Progress" color="#1a4a8a" />
          <StatBox num={stats.resolvedIssues} label="Resolved" color="#2a7a4a" sub={`${stats.resolutionRate}% rate`} />
          <StatBox num={stats.totalUsers} label="Users" color="#6a3a9a" />
          <StatBox num={`$${stats.totalRaised?.toLocaleString() || 0}`} label="Total Raised" color="#2a7a4a" sub={`${stats.totalDonations} donations`} />
        </div>

        {/* Three-column breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 24 }}>
          {/* Category breakdown */}
          <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 24 }}>
            <h3 style={{ fontSize: 16, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
              Issues by Category
              <Link to="/admin/issues" style={{ fontSize: 11, color: '#888' }}>View all →</Link>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {categoryBreakdown?.map(cat => (
                <div key={cat._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{cat._id}</span>
                    <span style={{ fontWeight: 700 }}>{cat.count}</span>
                  </div>
                  <div style={{ height: 6, background: '#eee', border: '1px solid #ddd' }}>
                    <div style={{ height: '100%', background: 'var(--amber)', width: `${(cat.count / maxCat) * 100}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status breakdown */}
          <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 24 }}>
            <h3 style={{ fontSize: 16, marginBottom: 20 }}>Status Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { status: 'Open', count: stats.openIssues },
                { status: 'In Progress', count: stats.inProgressIssues },
                { status: 'Pending Review', count: stats.pendingIssues },
                { status: 'Resolved', count: stats.resolvedIssues }
              ].map(item => (
                <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 14, height: 14, background: STATUS_COLORS[item.status], border: '2px solid var(--ink)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span>{item.status}</span>
                      <span style={{ fontWeight: 700 }}>{item.count}</span>
                    </div>
                    <div style={{ height: 4, background: '#eee', marginTop: 3 }}>
                      <div style={{ height: '100%', background: STATUS_COLORS[item.status], width: `${stats.totalIssues > 0 ? (item.count / stats.totalIssues) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority breakdown */}
          <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 24 }}>
            <h3 style={{ fontSize: 16, marginBottom: 20 }}>Priority Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {priorityOrder.map(p => {
                const count = priorityMap[p] || 0;
                const maxP = Math.max(...Object.values(priorityMap), 1);
                return (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 14, height: 14, background: PRIORITY_COLORS[p], border: '2px solid var(--ink)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p}</span>
                        <span style={{ fontWeight: 700 }}>{count}</span>
                      </div>
                      <div style={{ height: 4, background: '#eee', marginTop: 3 }}>
                        <div style={{ height: '100%', background: PRIORITY_COLORS[p], width: `${(count / maxP) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Critical alert if any */}
              {(priorityMap['Critical'] || 0) > 0 && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#ffeaea', border: '1px solid #c83232', fontSize: 12, color: '#c83232', fontFamily: 'var(--font-mono)' }}>
                  ⚠ {priorityMap['Critical']} critical issue{priorityMap['Critical'] !== 1 ? 's' : ''} need attention!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Three panels — recent data */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {/* Recent Issues */}
          <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 24 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              Recent Issues <Link to="/admin/issues" style={{ fontSize: 11, color: '#888' }}>All →</Link>
            </h3>
            {recentIssues?.map(issue => (
              <div key={issue._id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.title}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2, display: 'flex', gap: 8 }}>
                      <span>{issue.reporter?.name}</span>
                      <span>·</span>
                      <span>{timeAgo(issue.createdAt)}</span>
                      {issue.priority === 'Critical' && <span style={{ color: '#c83232', fontWeight: 700 }}>🔴 CRIT</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 6px', border: `1px solid ${STATUS_COLORS[issue.status]}`, color: STATUS_COLORS[issue.status], flexShrink: 0 }}>{issue.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Users */}
          <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 24 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              New Users <Link to="/admin/users" style={{ fontSize: 11, color: '#888' }}>All →</Link>
            </h3>
            {recentUsers?.map(u => (
              <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed #eee' }}>
                <div style={{ width: 32, height: 32, background: u.role === 'admin' ? '#e8a020' : '#0a0a0f', color: u.role === 'admin' ? '#0a0a0f' : '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 6px', background: u.role === 'admin' ? '#e8a020' : '#eee', color: u.role === 'admin' ? '#0a0a0f' : '#555', fontWeight: 700 }}>{u.role}</span>
              </div>
            ))}
          </div>

          {/* Recent Donations */}
          <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 24 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              Recent Donations <Link to="/admin/donations" style={{ fontSize: 11, color: '#888' }}>All →</Link>
            </h3>
            {recentDonations?.map(d => (
              <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed #eee' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{d.isAnonymous ? 'Anonymous' : d.donor?.name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{timeAgo(d.createdAt)}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#2a7a4a' }}>${d.amount}</div>
              </div>
            ))}
            {(!recentDonations || recentDonations.length === 0) && (
              <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: 20 }}>No donations yet</div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
