import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { issuesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import IssueCard from '../components/IssueCard';
import toast from 'react-hot-toast';

const STATUSES = ['All', 'Open', 'In Progress', 'Pending Review', 'Resolved'];
const CATEGORIES = ['All', 'Infrastructure', 'Safety', 'Sanitation', 'Community Resources', 'Environment', 'Transportation', 'Other'];
const SORTS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: '-supportCount', label: 'Most Supported' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [sort, setSort] = useState('-createdAt');

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort };
      if (status !== 'All') params.status = status;
      if (category !== 'All') params.category = category;
      if (search) params.search = search;
      const res = await issuesAPI.getAll(params);
      setIssues(res.data.issues);
    } catch (err) {
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [status, category, sort, search]);

  useEffect(() => { issuesAPI.getStats().then(r => setStats(r.data)).catch(() => {}); }, []);
  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const handleSupport = async (id) => {
    if (!user) return toast.error('Login to support issues');
    try {
      const res = await issuesAPI.support(id);
      setIssues(prev => prev.map(i => i._id === id ? res.data.issue : i));
      toast.success(res.data.supported ? 'Issue supported!' : 'Support removed');
    } catch (err) {
      toast.error('Failed to update support');
    }
  };

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 36 }}>
            {[
              { num: stats.total, label: 'Total', color: 'var(--ink)' },
              { num: stats.open, label: 'Open', color: 'var(--red)' },
              { num: stats.inProgress, label: 'In Progress', color: 'var(--blue)' },
              { num: stats.pendingReview, label: 'Pending', color: 'var(--purple)' },
              { num: stats.resolved, label: 'Resolved', color: 'var(--green)' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '16px 20px',
                background: s.color,
                color: 'var(--white)',
                border: '2px solid var(--ink)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.1s',
                opacity: status === STATUSES[i] || (i === 0 && status === 'All') ? 1 : 0.7
              }}
              onClick={() => setStatus(i === 0 ? 'All' : STATUSES[i])}
              onMouseEnter={e => e.currentTarget.style.transform = 'translate(-2px,-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, opacity: 0.85 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 20, marginBottom: 28, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label>Search</label>
            <input
              type="text"
              placeholder="Search issues..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchIssues()}
            />
          </div>
          <div style={{ flex: '0 0 160px' }}>
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: '0 0 160px' }}>
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex: '0 0 160px' }}>
            <label>Sort By</label>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={fetchIssues}>Filter</button>
        </div>

        {/* Results */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#666' }}>
            {loading ? 'Loading...' : `${issues.length} issue${issues.length !== 1 ? 's' : ''} found`}
          </span>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" />Loading issues...</div>
        ) : issues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#888' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h3 style={{ marginBottom: 8 }}>No issues found</h3>
            <p style={{ fontSize: 14 }}>Try adjusting your filters or be the first to report!</p>
          </div>
        ) : (
          <div className="grid-3">
            {issues.map(issue => (
              <IssueCard key={issue._id} issue={issue} onSupport={handleSupport} currentUser={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
