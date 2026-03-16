import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { issuesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import IssueCard from '../components/IssueCard';
import toast from 'react-hot-toast';

const STATUSES = ['All', 'Open', 'In Progress', 'Pending Review', 'Resolved'];
const CATEGORIES = ['All', 'Infrastructure', 'Safety', 'Sanitation', 'Community Resources', 'Environment', 'Transportation', 'Other'];
const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const SORTS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: '-supportCount', label: 'Most Supported' },
  { value: '-views', label: 'Most Viewed' },
  { value: '-comments.length', label: 'Most Discussed' },
];

const STATUS_STAT_COLORS = [
  { color: 'var(--ink)', label: 'Total' },
  { color: '#c83232', label: 'Open' },
  { color: '#1a4a8a', label: 'In Progress' },
  { color: '#6a3a9a', label: 'Pending' },
  { color: '#2a7a4a', label: 'Resolved' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Sync filters with URL
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [priority, setPriority] = useState(searchParams.get('priority') || 'All');
  const [sort, setSort] = useState(searchParams.get('sort') || '-createdAt');

  // Update URL when filters change
  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (status !== 'All') params.status = status;
    if (category !== 'All') params.category = category;
    if (priority !== 'All') params.priority = priority;
    if (sort !== '-createdAt') params.sort = sort;
    setSearchParams(params, { replace: true });
  }, [search, status, category, priority, sort, setSearchParams]);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort, page, limit: 12 };
      if (status !== 'All') params.status = status;
      if (category !== 'All') params.category = category;
      if (priority !== 'All') params.priority = priority;
      if (search) params.search = search;
      const res = await issuesAPI.getAll(params);
      setIssues(res.data.issues);
      setTotalPages(res.data.pages || 1);
      setTotalCount(res.data.total || 0);
    } catch { toast.error('Failed to load issues'); }
    finally { setLoading(false); }
  }, [status, category, priority, sort, search, page]);

  useEffect(() => { issuesAPI.getStats().then(r => setStats(r.data)).catch(() => {}); }, []);
  useEffect(() => { setPage(1); }, [status, category, priority, sort, search]);
  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const handleSupport = async (id) => {
    if (!user) return toast.error('Login to support issues');
    try {
      const res = await issuesAPI.support(id);
      setIssues(prev => prev.map(i => i._id === id ? res.data.issue : i));
      toast.success(res.data.supported ? 'Issue supported!' : 'Support removed');
    } catch { toast.error('Failed to update support'); }
  };

  const handleTagClick = (tag) => {
    setSearch(tag);
    setPage(1);
  };

  const statNums = stats ? [
    stats.total, stats.open, stats.inProgress, stats.pendingReview, stats.resolved
  ] : [];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: 'var(--ink)', padding: '40px 0', borderBottom: '2px solid var(--amber)' }}>
        <div className="container">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Live Dashboard</div>
          <h1 style={{ color: 'var(--paper)', fontSize: 'clamp(28px, 4vw, 48px)', marginBottom: 4 }}>Community Issues</h1>
          <p style={{ color: 'var(--cement)', fontSize: 14 }}>All active and resolved reports from your neighborhood</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 36 }}>
        {/* Stats row */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 36 }}>
            {STATUS_STAT_COLORS.map((s, i) => (
              <div key={i} style={{
                padding: '16px 20px', background: s.color, color: 'white',
                border: '2px solid var(--ink)', textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.1s',
                opacity: (i === 0 && status === 'All') || status === STATUSES[i] ? 1 : 0.7
              }}
                onClick={() => setStatus(i === 0 ? 'All' : STATUSES[i])}
                onMouseEnter={e => e.currentTarget.style.transform = 'translate(-2px,-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{statNums[i] ?? '...'}</div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, opacity: 0.85 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Top tags cloud (if stats has them) */}
        {stats?.topTags?.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#888', fontFamily: 'var(--font-mono)', marginRight: 4 }}>HOT TAGS:</span>
            {stats.topTags.slice(0, 8).map((tag, i) => (
              <button key={i} onClick={() => handleTagClick(tag._id)}
                style={{
                  padding: '3px 10px', fontSize: 11, fontFamily: 'var(--font-mono)',
                  background: search === tag._id ? 'var(--ink)' : 'var(--surface)',
                  color: search === tag._id ? 'var(--paper)' : '#555',
                  border: `1px solid ${search === tag._id ? 'var(--ink)' : 'var(--cement)'}`,
                  cursor: 'pointer'
                }}>
                #{tag._id} <span style={{ opacity: 0.6 }}>({tag.count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 20, marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label>Search</label>
              <input type="text" placeholder="Search issues, tags..."
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchIssues()} />
            </div>
            <div style={{ flex: '0 0 140px' }}>
              <label>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: '0 0 130px' }}>
              <label>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ flex: '0 0 120px' }}>
              <label>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ flex: '0 0 150px' }}>
              <label>Sort By</label>
              <select value={sort} onChange={e => setSort(e.target.value)}>
                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={() => { setPage(1); fetchIssues(); }}>Filter</button>
            {(search || status !== 'All' || category !== 'All' || priority !== 'All') && (
              <button className="btn" onClick={() => { setSearch(''); setStatus('All'); setCategory('All'); setPriority('All'); setSort('-createdAt'); }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results header */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#666' }}>
            {loading ? 'Loading...' : `${totalCount} issue${totalCount !== 1 ? 's' : ''} found`}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link to="/report" className="btn btn-primary btn-sm">+ Report Issue</Link>
            {/* View toggle */}
            <div style={{ display: 'flex', border: '2px solid var(--ink)' }}>
              {[
                { mode: 'grid', icon: '⊞' },
                { mode: 'list', icon: '☰' }
              ].map(v => (
                <button key={v.mode} onClick={() => setViewMode(v.mode)} style={{
                  padding: '6px 12px', background: viewMode === v.mode ? 'var(--ink)' : 'var(--paper)',
                  color: viewMode === v.mode ? 'var(--paper)' : 'var(--ink)',
                  border: 'none', cursor: 'pointer', fontSize: 16
                }}>{v.icon}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Issue grid or list */}
        {loading ? (
          <div className="loading"><div className="spinner" />Loading issues...</div>
        ) : issues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#888' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h3 style={{ marginBottom: 8 }}>No issues found</h3>
            <p style={{ fontSize: 14, marginBottom: 24 }}>Try adjusting your filters or be the first to report!</p>
            <Link to="/report" className="btn btn-primary">Report an Issue →</Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid-3">
            {issues.map(issue => (
              <IssueCard key={issue._id} issue={issue} onSupport={handleSupport} currentUser={user} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {issues.map(issue => (
              <Link key={issue._id} to={`/issues/${issue._id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 20px', background: 'var(--white)',
                  border: '2px solid var(--ink)', gap: 16, transition: 'all 0.1s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#888' }}>{issue.category}</span>
                      <span style={{ fontSize: 10, padding: '1px 6px', background: '#eee', fontFamily: 'var(--font-mono)' }}>{issue.priority}</span>
                      {issue.tags?.slice(0,2).map((t,i) => <span key={i} style={{ fontSize: 10, color: '#999', fontFamily: 'var(--font-mono)' }}>#{t}</span>)}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {issue.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#888', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      📍 {issue.location} · {issue.reporter?.name}
                      {issue.comments?.length > 0 && ` · 💬 ${issue.comments.length}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#888' }}>▲ {issue.supportCount || 0}</span>
                    <span style={{ fontSize: 10, padding: '3px 10px', border: '1.5px solid var(--ink)', fontWeight: 700, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {issue.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32, alignItems: 'center' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-sm">← Prev</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : i + Math.max(1, page - 3);
              if (p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)} className="btn btn-sm" style={{
                  background: page === p ? 'var(--ink)' : 'var(--paper)',
                  color: page === p ? 'var(--paper)' : 'var(--ink)'
                }}>{p}</button>
              );
            })}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn btn-sm">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
