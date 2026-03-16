import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

const CATEGORIES = ['Infrastructure', 'Safety', 'Sanitation', 'Community Resources', 'Environment', 'Transportation', 'Other'];
const STATUSES = ['Open', 'In Progress', 'Pending Review', 'Resolved'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const SORTS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: '-supportCount', label: 'Most Supported' },
  { value: '-views', label: 'Most Viewed' },
  { value: '-comments', label: 'Most Discussed' }
];

const STATUS_COLORS = { Open: '#2563eb', 'In Progress': '#d97706', 'Pending Review': '#7c3aed', Resolved: '#059669' };
const PRIORITY_COLORS = { Critical: '#dc2626', High: '#d97706', Medium: '#2563eb', Low: '#6b7280' };

function IssueRow({ issue }) {
  return (
    <Link to={`/issues/${issue._id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
      <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 10, padding: '16px 20px',
        marginBottom: 10, transition: 'border-color 0.15s, box-shadow 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 2px 12px #2563eb18'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e0d8'; e.currentTarget.style.boxShadow = 'none'; }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ background: STATUS_COLORS[issue.status] + '18', color: STATUS_COLORS[issue.status],
                borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{issue.status}</span>
              <span style={{ background: PRIORITY_COLORS[issue.priority] + '18', color: PRIORITY_COLORS[issue.priority],
                borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{issue.priority}</span>
              <span style={{ fontSize: 11, color: '#888', background: '#f0ede8', borderRadius: 6, padding: '2px 8px' }}>{issue.category}</span>
              {issue.tags?.slice(0, 3).map(t => (
                <span key={t} style={{ fontSize: 11, color: '#7c3aed', background: '#f5f3ff', borderRadius: 6, padding: '2px 8px' }}>#{t}</span>
              ))}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{issue.title}</div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {issue.description}
            </div>
            <div style={{ fontSize: 12, color: '#aaa' }}>
              📍 {issue.location}
              {issue.neighborhood && ` · ${issue.neighborhood}`}
              {' · '}Reported by {issue.reporter?.name}
              {' · '}{new Date(issue.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#d97706' }}>▲ {issue.supportCount || 0}</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>💬 {issue.comments?.length || 0}</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>👁 {issue.views || 0}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function AdvancedSearch() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [filters, setFilters] = useState({
    category: params.get('category') || '',
    status: params.get('status') || '',
    priority: params.get('priority') || '',
    neighborhood: params.get('neighborhood') || '',
    tags: params.get('tags') || '',
    sort: params.get('sort') || '-createdAt'
  });
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [savedSearches, setSavedSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pb_saved_searches') || '[]'); } catch { return []; }
  });
  const [neighborhoods, setNeighborhoods] = useState([]);
  const LIMIT = 15;

  useEffect(() => {
    api.get('/issues/stats').then(r => setNeighborhoods((r.data.neighborhoods || []).map(n => n._id))).catch(() => {});
  }, []);

  const search = useCallback(async (pg = 1) => {
    setLoading(true); setHasSearched(true);
    try {
      const qp = new URLSearchParams({ page: pg, limit: LIMIT, sort: filters.sort });
      if (query) qp.set('search', query);
      if (filters.category) qp.set('category', filters.category);
      if (filters.status) qp.set('status', filters.status);
      if (filters.priority) qp.set('priority', filters.priority);
      if (filters.neighborhood) qp.set('neighborhood', filters.neighborhood);
      if (filters.tags) qp.set('tags', filters.tags);
      const r = await api.get(`/issues?${qp}`);
      setResults(r.data.issues); setTotal(r.data.total); setPage(pg);
      // Sync URL
      const newParams = {};
      if (query) newParams.q = query;
      Object.entries(filters).forEach(([k, v]) => { if (v && v !== '-createdAt') newParams[k] = v; });
      setParams(newParams);
    } finally { setLoading(false); }
  }, [query, filters]);

  // Auto-search if URL has params
  useEffect(() => {
    if (params.get('q') || params.get('category') || params.get('status')) search(1);
  }, []);

  const saveSearch = () => {
    const label = prompt('Name this search:');
    if (!label) return;
    const saved = { label, query, filters, savedAt: Date.now() };
    const updated = [saved, ...savedSearches].slice(0, 8);
    setSavedSearches(updated);
    localStorage.setItem('pb_saved_searches', JSON.stringify(updated));
  };

  const loadSaved = (s) => {
    setQuery(s.query);
    setFilters(s.filters);
    setTimeout(() => search(1), 0);
  };

  const deleteSaved = (i) => {
    const updated = savedSearches.filter((_, idx) => idx !== i);
    setSavedSearches(updated);
    localStorage.setItem('pb_saved_searches', JSON.stringify(updated));
  };

  const pages = Math.ceil(total / LIMIT);
  const hasFilters = Object.values(filters).some(v => v && v !== '-createdAt');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Advanced Search</h1>
        <p style={{ color: '#888', margin: '4px 0 0', fontSize: 14 }}>Search and filter all community issues</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        {/* Sidebar Filters */}
        <div>
          {/* Search Input */}
          <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Keywords</label>
            <input value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search(1)}
              placeholder="Search titles, descriptions, locations…"
              style={{ width: '100%', border: '1.5px solid #e5e0d8', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box' }} />
          </div>

          <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: '#333' }}>Filters</div>

            {/* Category */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 6 }}>CATEGORY</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {CATEGORIES.map(c => (
                  <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="radio" checked={filters.category === c} onChange={() => setFilters(f => ({ ...f, category: c }))} />
                    {c}
                  </label>
                ))}
                {filters.category && <button onClick={() => setFilters(f => ({ ...f, category: '' }))} style={{ fontSize: 11, color: '#888', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Clear</button>}
              </div>
            </div>

            {/* Status */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 6 }}>STATUS</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setFilters(f => ({ ...f, status: f.status === s ? '' : s }))}
                    style={{ padding: '4px 10px', borderRadius: 20, border: '1.5px solid',
                      borderColor: filters.status === s ? STATUS_COLORS[s] : '#e5e0d8',
                      background: filters.status === s ? STATUS_COLORS[s] + '18' : '#fff',
                      color: filters.status === s ? STATUS_COLORS[s] : '#555',
                      fontSize: 12, fontWeight: filters.status === s ? 700 : 400, cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 6 }}>PRIORITY</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PRIORITIES.map(p => (
                  <button key={p} onClick={() => setFilters(f => ({ ...f, priority: f.priority === p ? '' : p }))}
                    style={{ padding: '4px 10px', borderRadius: 20, border: '1.5px solid',
                      borderColor: filters.priority === p ? PRIORITY_COLORS[p] : '#e5e0d8',
                      background: filters.priority === p ? PRIORITY_COLORS[p] + '18' : '#fff',
                      color: filters.priority === p ? PRIORITY_COLORS[p] : '#555',
                      fontSize: 12, fontWeight: filters.priority === p ? 700 : 400, cursor: 'pointer' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Neighborhood */}
            {neighborhoods.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 6 }}>NEIGHBORHOOD</label>
                <select value={filters.neighborhood} onChange={e => setFilters(f => ({ ...f, neighborhood: e.target.value }))}
                  style={{ width: '100%', border: '1.5px solid #e5e0d8', borderRadius: 8, padding: '7px 10px', fontSize: 13 }}>
                  <option value="">Any neighborhood</option>
                  {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            )}

            {/* Tags */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#888', display: 'block', marginBottom: 6 }}>TAGS (comma-separated)</label>
              <input value={filters.tags} onChange={e => setFilters(f => ({ ...f, tags: e.target.value }))}
                placeholder="e.g. pothole, flooding"
                style={{ width: '100%', border: '1.5px solid #e5e0d8', borderRadius: 8, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Sort */}
          <div style={{ background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Sort By</label>
            <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
              style={{ width: '100%', border: '1.5px solid #e5e0d8', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <button onClick={() => search(1)} disabled={loading}
            style={{ width: '100%', padding: '11px', borderRadius: 9, border: 'none', background: '#2563eb',
              color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 10 }}>
            {loading ? 'Searching…' : '🔍 Search'}
          </button>
          {hasFilters && (
            <button onClick={() => { setFilters({ category: '', status: '', priority: '', neighborhood: '', tags: '', sort: '-createdAt' }); setQuery(''); }}
              style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1.5px solid #e5e0d8', background: '#fff', color: '#888', cursor: 'pointer', fontSize: 13 }}>
              Clear All Filters
            </button>
          )}

          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div style={{ marginTop: 20, background: '#fff', border: '1.5px solid #e5e0d8', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Saved Searches</div>
              {savedSearches.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <button onClick={() => loadSaved(s)} style={{ flex: 1, textAlign: 'left', fontSize: 13, border: 'none', background: 'none', cursor: 'pointer', color: '#2563eb', padding: 0 }}>{s.label}</button>
                  <button onClick={() => deleteSaved(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#aaa', fontSize: 14, padding: '0 4px' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          {hasSearched && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: '#555' }}>
                {loading ? 'Searching…' : `${total} result${total !== 1 ? 's' : ''} found`}
              </div>
              {!loading && total > 0 && (
                <button onClick={saveSearch}
                  style={{ fontSize: 13, color: '#7c3aed', border: '1.5px solid #e9d5ff', background: '#faf5ff', borderRadius: 7, padding: '5px 12px', cursor: 'pointer' }}>
                  💾 Save Search
                </button>
              )}
            </div>
          )}

          {!hasSearched && (
            <div style={{ textAlign: 'center', padding: '80px 40px', color: '#aaa' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 16 }}>Use the filters on the left to search issues</div>
            </div>
          )}

          {hasSearched && !loading && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 40px', color: '#aaa' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
              <div style={{ fontSize: 16, marginBottom: 8 }}>No issues match your search</div>
              <div style={{ fontSize: 14 }}>Try removing some filters or broadening your keywords</div>
            </div>
          )}

          {results.map(issue => <IssueRow key={issue._id} issue={issue} />)}

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
              <button onClick={() => search(page - 1)} disabled={page === 1}
                style={{ padding: '7px 14px', borderRadius: 7, border: '1.5px solid #e5e0d8', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
              {Array.from({ length: Math.min(7, pages) }, (_, i) => {
                const p = page <= 4 ? i + 1 : page - 3 + i;
                if (p < 1 || p > pages) return null;
                return (
                  <button key={p} onClick={() => search(p)}
                    style={{ padding: '7px 12px', borderRadius: 7, border: '1.5px solid', borderColor: page === p ? '#2563eb' : '#e5e0d8',
                      background: page === p ? '#2563eb' : '#fff', color: page === p ? '#fff' : '#333', cursor: 'pointer', minWidth: 36 }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => search(page + 1)} disabled={page === pages}
                style={{ padding: '7px 14px', borderRadius: 7, border: '1.5px solid #e5e0d8', background: '#fff', cursor: page === pages ? 'not-allowed' : 'pointer' }}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
