import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Email is required');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      // Server always returns 200 to prevent enumeration — only real errors land here
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--paper)' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 48, height: 48, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--amber)' }}>PB</div>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Forgot Password</h1>
          <p style={{ color: '#777', fontSize: 14 }}>Enter your email and we'll send you a reset link</p>
        </div>

        <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 36, boxShadow: 'var(--shadow-lg)' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
              <h2 style={{ fontSize: 20, marginBottom: 12 }}>Check your inbox</h2>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 24 }}>
                If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly. Check your spam folder if it doesn't arrive.
              </p>
              <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block' }}>Back to Login</Link>
            </div>
          ) : (
            <>
              {error && <div className="error-msg">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ width: '100%', padding: '12px', fontSize: 14, marginTop: 8 }}
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
              <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#777' }}>
                Remember your password?{' '}
                <Link to="/login" style={{ color: 'var(--ink)', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}