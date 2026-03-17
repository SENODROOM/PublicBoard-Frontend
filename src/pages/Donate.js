import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { donationsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#1a1a2e',
      '::placeholder': { color: '#aaa' },
    },
    invalid: { color: '#c83232' },
  },
};

// ── Inner form (needs Stripe context) ────────────────────
function DonationForm({ stats, donations, onSuccess }) {
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    amount: '',
    customAmount: '',
    message: '',
    isAnonymous: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [cardError, setCardError] = useState('');

  const finalAmount = form.amount === 'custom'
    ? parseFloat(form.customAmount)
    : parseFloat(form.amount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCardError('');

    if (!finalAmount || finalAmount < 1)
      return toast.error('Minimum donation is $1');
    if (finalAmount > 10000)
      return toast.error('Maximum donation is $10,000');
    if (!form.name.trim())
      return toast.error('Name is required');
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      return toast.error('Valid email is required');
    if (!stripe || !elements)
      return toast.error('Payment system not ready. Please wait.');

    setSubmitting(true);
    try {
      // Step 1: create PaymentIntent on server
      const { data } = await donationsAPI.createPaymentIntent({
        amount: finalAmount,
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        isAnonymous: form.isAnonymous,
      });

      // Step 2: confirm card payment on Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: form.name.trim(),
              email: form.email.trim(),
            },
          },
        }
      );

      if (error) {
        setCardError(error.message);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess(finalAmount);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Donation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 32, boxShadow: 'var(--shadow)' }}>
      <h2 style={{ fontSize: 22, marginBottom: 24 }}>Make a Contribution</h2>
      <form onSubmit={handleSubmit}>
        {/* Amount presets */}
        <div className="form-group">
          <label>Donation Amount</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 10 }}>
            {PRESET_AMOUNTS.map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setForm(f => ({ ...f, amount: String(amt), customAmount: '' }))}
                style={{
                  padding: '10px 4px',
                  border: `2px solid ${form.amount === String(amt) ? 'var(--ink)' : 'var(--cement)'}`,
                  background: form.amount === String(amt) ? 'var(--ink)' : 'var(--paper)',
                  color: form.amount === String(amt) ? 'var(--paper)' : 'var(--ink)',
                  fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                ${amt}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, amount: 'custom' }))}
              style={{
                padding: '10px 16px', border: `2px solid ${form.amount === 'custom' ? 'var(--ink)' : 'var(--cement)'}`,
                background: form.amount === 'custom' ? 'var(--ink)' : 'var(--paper)',
                color: form.amount === 'custom' ? 'var(--paper)' : 'var(--ink)',
                fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Custom
            </button>
            {form.amount === 'custom' && (
              <input
                type="number"
                min="1"
                max="10000"
                step="1"
                placeholder="Enter amount"
                value={form.customAmount}
                onChange={e => setForm(f => ({ ...f, customAmount: e.target.value }))}
                style={{ flex: 1 }}
                autoFocus
              />
            )}
          </div>
        </div>

        {/* Donor info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-group">
            <label>Your Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Jane Smith"
              required
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="jane@example.com"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Message (optional)</label>
          <textarea
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            rows={2}
            maxLength={500}
            placeholder="Leave a message for your community…"
            style={{ resize: 'vertical' }}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 20, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.isAnonymous}
            onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))}
          />
          Donate anonymously (your name won't be shown publicly)
        </label>

        {/* Stripe Card Element */}
        <div className="form-group">
          <label>Card Details</label>
          <div style={{
            border: '2px solid var(--cement)', padding: '12px 14px',
            background: 'white', borderRadius: 2,
          }}>
            <CardElement options={CARD_STYLE} onChange={e => setCardError(e.error?.message || '')} />
          </div>
          {cardError && (
            <div style={{ color: '#c83232', fontSize: 12, marginTop: 6 }}>{cardError}</div>
          )}
        </div>

        <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#666' }}>
          🔒 Payments are processed securely by Stripe. PublicBoard never stores your card details.
        </div>

        <button
          type="submit"
          className="btn btn-green"
          disabled={submitting || !stripe}
          style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700 }}
        >
          {submitting ? 'Processing…' : `Donate $${finalAmount || '—'}`}
        </button>
      </form>
    </div>
  );
}

// ── Main page wrapper ─────────────────────────────────────
export default function Donate() {
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);

  useEffect(() => {
    Promise.all([donationsAPI.getAll(), donationsAPI.getStats()])
      .then(([dr, sr]) => {
        setDonations(dr.data.donations);
        setStats(sr.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSuccess = async (amount) => {
    setSuccessAmount(amount);
    setSuccess(true);
    // Refresh stats
    try {
      const [dr, sr] = await Promise.all([donationsAPI.getAll(), donationsAPI.getStats()]);
      setDonations(dr.data.donations);
      setStats(sr.data);
    } catch (_) {}
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
          {/* Form or success state */}
          <div>
            {success ? (
              <div style={{ background: 'var(--white)', border: '2px solid var(--green)', padding: 48, textAlign: 'center', boxShadow: '6px 6px 0 var(--green)' }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontSize: 28, marginBottom: 12, color: 'var(--green)' }}>Thank You!</h2>
                <p style={{ fontSize: 15, color: '#555', lineHeight: 1.7, marginBottom: 24 }}>
                  Your donation of <strong>${successAmount}</strong> has been processed successfully. You'll receive a receipt by email.
                </p>
                <button onClick={() => setSuccess(false)} className="btn btn-green">Donate Again</button>
              </div>
            ) : (
              <Elements stripe={stripePromise}>
                <DonationForm stats={stats} donations={donations} onSuccess={handleSuccess} />
              </Elements>
            )}
          </div>

          {/* Donation feed */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 20, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
              Recent Contributions
            </h3>
            {loading ? (
              <div className="loading"><div className="spinner" />Loading…</div>
            ) : donations.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#888', fontSize: 14 }}>
                No donations yet. Be the first!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {donations.slice(0, 15).map((d) => (
                  <div key={d._id} style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{d.donor?.name || 'Anonymous'}</div>
                      {d.message && (
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4, lineHeight: 1.5, fontStyle: 'italic' }}>
                          "{d.message.slice(0, 100)}{d.message.length > 100 ? '…' : ''}"
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                        {timeAgo(d.createdAt)}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--green)', flexShrink: 0 }}>
                      ${d.amount}
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