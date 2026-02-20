import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api';
import AdminLayout from './AdminLayout';
import toast from 'react-hot-toast';

export default function AdminDonations() {
  const [donations, setDonations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [totalRaised, setTotalRaised] = useState(0);
  const [avgDonation, setAvgDonation] = useState(0);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const res = await adminAPI.getDonations(params);
      setDonations(res.data.donations);
      setTotal(res.data.total);
      setPages(res.data.pages);
      // Compute totals from all completed
      const completed = res.data.donations.filter(d => d.status === 'completed');
      const sum = completed.reduce((acc, d) => acc + d.amount, 0);
      setTotalRaised(sum);
      setAvgDonation(completed.length ? Math.round(sum / completed.length * 100) / 100 : 0);
    } catch { toast.error('Failed to load donations'); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);

  const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const STATUS_COLORS = { completed: '#2a7a4a', pending: '#e8a020', failed: '#c83232', refunded: '#6a3a9a' };

  return (
    <AdminLayout>
      <div style={{ padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: '#888', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Admin / Donations</div>
          <h1 style={{ fontSize: 'clamp(22px,3vw,34px)' }}>Donation Management</h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          <div style={{ background: '#2a7a4a', color: 'white', padding: '20px 24px', border: '2px solid var(--ink)', boxShadow: '3px 3px 0 var(--ink)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800 }}>${totalRaised.toLocaleString()}</div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, opacity: 0.85 }}>Page Total</div>
          </div>
          <div style={{ background: '#1a4a8a', color: 'white', padding: '20px 24px', border: '2px solid var(--ink)', boxShadow: '3px 3px 0 var(--ink)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800 }}>{total}</div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, opacity: 0.85 }}>Total Records</div>
          </div>
          <div style={{ background: '#6a3a9a', color: 'white', padding: '20px 24px', border: '2px solid var(--ink)', boxShadow: '3px 3px 0 var(--ink)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800 }}>${avgDonation}</div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, opacity: 0.85 }}>Avg Donation</div>
          </div>
        </div>

        {/* Filter */}
        <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 16, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ flex: '0 0 160px', padding: '8px 12px', border: '2px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--paper)' }}>
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <button onClick={fetchDonations} className="btn btn-primary btn-sm">Filter</button>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', overflowX: 'auto' }}>
          {loading ? (
            <div className="loading"><div className="spinner" /></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead>
                <tr style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
                  {['Donor', 'Amount', 'Message', 'Status', 'Date', 'Reference'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donations.map((d, i) => (
                  <tr key={d._id} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? 'white' : '#fafaf8' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{d.isAnonymous ? '🕵️ Anonymous' : d.donor?.name}</div>
                      {!d.isAnonymous && <div style={{ fontSize: 11, color: '#888' }}>{d.donor?.email}</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#2a7a4a' }}>${d.amount}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#555', maxWidth: 200 }}>
                      {d.message ? (
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{d.message}"</span>
                      ) : <span style={{ color: '#bbb' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', background: STATUS_COLORS[d.status] + '22', color: STATUS_COLORS[d.status], border: `1px solid ${STATUS_COLORS[d.status]}`, fontWeight: 700 }}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>{fmt(d.createdAt)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#aaa', display: 'block', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {d.stripePaymentIntentId || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && donations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: '#aaa', fontSize: 14 }}>No donations found</div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn btn-sm">← Prev</button>
            <span style={{ padding: '6px 14px', border: '2px solid var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{page} / {pages}</span>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn btn-sm">Next →</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
