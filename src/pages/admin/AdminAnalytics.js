import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import api from '../../api';

const PRIORITY_COLORS = { Critical: '#dc2626', High: '#d97706', Medium: '#2563eb', Low: '#6b7280' };
const CATEGORY_COLORS = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626','#0891b2'];

const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function StatCard({ label, value, sub, color = '#2563eb' }) {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 10, padding: '20px 24px', minWidth: 140 }}>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/analytics?range=${range}`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [range]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#888' }}>
      Loading analytics…
    </div>
  );
  if (!data) return <div style={{ padding: 40, color: '#888' }}>Failed to load analytics.</div>;

  const { issuesTrend, resolutionByCategory, topLocations, topNeighborhoods,
    byDayOfWeek, byHour, topIssues, donationTrend, avgResolutionTime, categoryTrend } = data;

  const priorityBars = ['Critical','High','Medium','Low'].map(p => ({
    name: p,
    count: (data.priorityBreakdown || []).find(x => x._id === p)?.count || 0
  }));

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Analytics</h1>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 14 }}>Platform-wide insights and trends</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['7','30','90','365'].map(d => (
            <button key={d} onClick={() => setRange(d)}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1.5px solid',
                borderColor: range === d ? '#2563eb' : '#e5e0d8',
                background: range === d ? '#2563eb' : '#fff',
                color: range === d ? '#fff' : '#333',
                fontWeight: range === d ? 600 : 400, cursor: 'pointer', fontSize: 13 }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
        <StatCard label="Avg Resolution Time" value={avgResolutionTime.avg ? `${Math.round(avgResolutionTime.avg)}h` : '—'} sub="across resolved issues" color="#059669" />
        <StatCard label="Fastest Resolve" value={avgResolutionTime.min ? `${Math.round(avgResolutionTime.min)}h` : '—'} sub="min resolution" color="#2563eb" />
        <StatCard label="Issues Reported" value={issuesTrend.reduce((s, d) => s + d.created, 0)} sub={`last ${range} days`} />
        <StatCard label="Issues Resolved" value={issuesTrend.reduce((s, d) => s + d.resolved, 0)} sub={`last ${range} days`} color="#7c3aed" />
      </div>

      {/* Issues Over Time */}
      <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600 }}>Issues Over Time</h3>
        {issuesTrend.length === 0 ? <div style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>No data in this range</div> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={issuesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#2563eb" strokeWidth={2} dot={false} name="Reported" />
              <Line type="monotone" dataKey="resolved" stroke="#059669" strokeWidth={2} dot={false} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row: Category Breakdown + Resolution by Category */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600 }}>By Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryTrend} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={75} label={({ _id, percent }) => `${_id} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {categoryTrend.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600 }}>Avg Resolution Time by Category</h3>
          {resolutionByCategory.length === 0
            ? <div style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>No resolved issues yet</div>
            : <ResponsiveContainer width="100%" height={200}>
                <BarChart data={resolutionByCategory} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="h" />
                  <YAxis dataKey="_id" type="category" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip formatter={v => `${Math.round(v)}h`} />
                  <Bar dataKey="avgHours" fill="#7c3aed" radius={[0,4,4,0]} name="Avg Hours" />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* Row: Day of Week Heatmap + Hourly Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600 }}>Reports by Day of Week</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byDayOfWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[4,4,0,0]} name="Reports" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600 }}>Reports by Hour of Day</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={h => `${h}:00`} interval={3} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={h => `${h}:00`} />
              <Bar dataKey="count" fill="#d97706" radius={[3,3,0,0]} name="Reports" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row: Top Locations + Top Neighborhoods */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Top Locations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topLocations.slice(0, 7).map((loc, i) => {
              const max = topLocations[0]?.count || 1;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                    <span style={{ fontWeight: 500 }}>{loc._id || 'Unknown'}</span>
                    <span style={{ color: '#888' }}>{loc.count}</span>
                  </div>
                  <div style={{ background: '#f0ede8', borderRadius: 4, height: 6 }}>
                    <div style={{ width: `${(loc.count / max) * 100}%`, background: '#2563eb', height: 6, borderRadius: 4, transition: 'width 0.4s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Neighborhood Activity</h3>
          {topNeighborhoods.length === 0
            ? <div style={{ color: '#aaa', padding: 20 }}>No neighborhood data yet</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topNeighborhoods.map((n, i) => {
                  const resolvedPct = n.count > 0 ? Math.round((n.resolved / n.count) * 100) : 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{n._id}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{n.count} issues</div>
                      <div style={{ background: resolvedPct > 50 ? '#dcfce7' : '#fef9c3', color: resolvedPct > 50 ? '#059669' : '#a16207',
                        borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>
                        {resolvedPct}% resolved
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      </div>

      {/* Top Issues + Donation Trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Most Supported Open Issues</h3>
          {topIssues.length === 0
            ? <div style={{ color: '#aaa', padding: 20 }}>No open issues</div>
            : topIssues.map((issue, i) => (
              <Link key={issue._id} to={`/issues/${issue._id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                  borderBottom: i < topIssues.length - 1 ? '1px solid #f0ede8' : 'none',
                  textDecoration: 'none', color: 'inherit' }}>
                <span style={{ color: '#aaa', fontSize: 13, minWidth: 20 }}>#{i+1}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{issue.title}</span>
                <span style={{ fontSize: 12, color: '#888' }}>▲ {issue.supportCount}</span>
              </Link>
            ))
          }
        </div>

        <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, padding: 24 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600 }}>Monthly Donations</h3>
          {donationTrend.length === 0
            ? <div style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>No donation data</div>
            : <ResponsiveContainer width="100%" height={180}>
                <BarChart data={donationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                  <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={v => `$${v.toFixed(2)}`} />
                  <Bar dataKey="total" fill="#059669" radius={[4,4,0,0]} name="Total ($)" />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
      </div>
    </div>
  );
}
