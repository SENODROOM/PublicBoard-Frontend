import React, { useEffect, useState } from 'react';
import { donationsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

export default function Donate() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    amount: '',
    customAmount: '',
    message: '',
    isAnonymous: false
  });

  useEffect(() => {
    Promise.all([donationsAPI.getAll(), donationsAPI.getStats()])
      .then(([dr, sr]) => { setDonations(dr.data.donations); setStats(sr.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const finalAmount = form.amount === 'custom' ? parseFloat(form.customAmount) : parseFloat(form.amount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!finalAmount || finalAmount < 1) return toast.error('Minimum donation is $1');
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.email.trim()) return toast.error('Email is required');

    setSubmitting(true);
    try {
      await donationsAPI.create({
        name: form.name,
        email: form.email,
        amount: finalAmount,
        message: form.message,
        isAnonymous: form.isAnonymous
      });
      setSuccess(true);
      // Refresh donations
      const [dr, sr] = await Promise.all([donationsAPI.getAll(), donationsAPI.getStats()]);
      setDonations(dr.data.donations);
      setStats(sr.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Donation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: 'var(--green)', padding: '60px 0', borderBottom: '3px solid var(--ink)' }}>
        <div className="container">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>
            Community Fund
          </div>
          <h1 style={{ color: 'white', fontSize: 'clamp(32px, 5vw, 60px)', marginBottom: 16 }}>Support Your Community</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, maxWidth: 560, lineHeight: 1.7 }}>
            Pool resources with your neighbors to fund solutions, organize events, and make lasting improvements in your area.
          </p>

          {/* Fund total */}
          {stats && (
            <div style={{ display: 'inline-flex', gap: 40, background: 'rgba(0,0,0,0.2)', border: '2px solid rgba(255,255,255,0.3)', padding: '20px 32px', marginTop: 32 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800, color: 'white', lineHeight: 1 }}>
                  ${stats.totalRaised?.toLocaleString() || 0}
                </div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Total Raised</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: 40 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800, color: 'white', lineHeight: 1 }}>
                  {stats.donationCount || 0}
                </div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Contributions</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container" style={{ paddingTop: 48 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, alignItems: 'start' }}>
          {/* Donation Form */}
          <div>
            {success ? (
              <div style={{ background: 'var(--white)', border: '2px solid var(--green)', padding: 48, textAlign: 'center', boxShadow: '6px 6px 0 var(--green)' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontSize: 28, marginBottom: 12, color: 'var(--green)' }}>Thank You!</h2>
                <p style={{ fontSize: 15, color: '#555', lineHeight: 1.7, marginBottom: 24 }}>
                  Your donation of <strong>${finalAmount}</strong> has been processed. Your generosity helps make this community better for everyone.
                </p>
                <button
                  onClick={() => { setSuccess(false); setForm({ name: user?.name||'', email: user?.email||'', amount: '', customAmount: '', message: '', isAnonymous: false }); }}
                  className="btn btn-green"
                >
                  Donate Again
                </button>
              </div>
            ) : (
              <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 32, boxShadow: 'var(--shadow)' }}>
                <h2 style={{ fontSize: 22, marginBottom: 24 }}>Make a Contribution</h2>
                <form onSubmit={handleSubmit}>
                  {/* Amount selection */}
                  <div className="form-group">
                    <label>Donation Amount</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 10 }}>
                      {PRESET_AMOUNTS.map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, amount: amt.toString(), customAmount: '' }))}
                          style={{
                            padding: '10px 0',
                            border: '2px solid var(--ink)',
                            background: form.amount == amt ? 'var(--ink)' : 'var(--paper)',
                            color: form.amount == amt ? 'var(--paper)' : 'var(--ink)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: 13
                          }}
                        >${amt}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, amount: 'custom' }))}
                        style={{
                          padding: '10px 16px',
                          border: '2px solid var(--ink)',
                          background: form.amount === 'custom' ? 'var(--ink)' : 'var(--paper)',
                          color: form.amount === 'custom' ? 'var(--paper)' : 'var(--ink)',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700, cursor: 'pointer', fontSize: 13,
                          whiteSpace: 'nowrap'
                        }}
                      >Custom</button>
                      {form.amount === 'custom' && (
                        <input
                          type="number"
                          min="1"
                          placeholder="Enter amount"
                          value={form.customAmount}
                          onChange={e => setForm(f => ({ ...f, customAmount: e.target.value }))}
                          autoFocus
                        />
                      )}
                    </div>
                  </div>

                  {/* Personal info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label>Your Name</label>
                      <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                    </div>
                    <div className="form-group">
                      <label>Your Email</label>
                      <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Message (optional)</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Leave an encouraging message for the community..."
                      rows={3}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <input
                      type="checkbox"
                      id="anon"
                      checked={form.isAnonymous}
                      onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <label htmlFor="anon" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 400, cursor: 'pointer' }}>
                      Donate anonymously
                    </label>
                  </div>

                  {/* Total display */}
                  {finalAmount >= 1 && (
                    <div style={{ background: 'var(--green)', color: 'white', padding: '12px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Total</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>${finalAmount}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-green btn-lg"
                    disabled={submitting || !finalAmount || finalAmount < 1}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {submitting ? 'Processing...' : `Donate${finalAmount >= 1 ? ` $${finalAmount}` : ''} →`}
                  </button>

                  <p style={{ fontSize: 11, color: '#999', textAlign: 'center', marginTop: 12 }}>
                    🔒 Secure payment processing (demo mode)
                  </p>
                </form>
              </div>
            )}
          </div>

          {/* Recent Donations */}
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 20 }}>Recent Contributions</h2>
            {loading ? (
              <div className="loading"><div className="spinner" /></div>
            ) : donations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888', border: '2px dashed var(--cement)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💝</div>
                <p>Be the first to contribute!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {donations.map((donation, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, background: 'var(--white)', border: '2px solid var(--ink)', padding: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 40, height: 40, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                      {donation.donor.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{donation.donor.name}</div>
                          <div style={{ fontSize: 11, color: '#999' }}>{timeAgo(donation.createdAt)}</div>
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--green)', flexShrink: 0 }}>
                          ${donation.amount}
                        </div>
                      </div>
                      {donation.message && (
                        <p style={{ fontSize: 13, color: '#555', marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' }}>
                          "{donation.message}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
