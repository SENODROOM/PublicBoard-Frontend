import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ marginBottom: 12 }}>Invalid Reset Link</h2>
          <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>This password reset link is missing or malformed. Please request a new one.</p>
          <Link to="/forgot-password" className="btn btn-primary">Request New Link</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8)
      return setError('Password must be at least 8 characters');
    if (form.password !== form.confirm)
      return setError('Passwords do not match');

    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password: form.password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: 'Weak', color: '#c83232', width: '20%' };
    if (score <= 3) return { label: 'Fair', color: '#e8a020', width: '60%' };
    return { label: 'Strong', color: '#2a7a4a', width: '100%' };
  })();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--paper)' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 48, height: 48, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--amber)' }}>PB</div>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>Reset Password</h1>
          <p style={{ color: '#777', fontSize: 14 }}>Choose a new password for your account</p>
        </div>

        <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 36, boxShadow: 'var(--shadow-lg)' }}>
          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  required
                  autoFocus
                  style={{ paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888' }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
              {/* Strength meter */}
              {strength && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 4, background: '#e5e5e5', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: strength.width, background: strength.color, transition: 'width 0.3s, background 0.3s', borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 11, color: strength.color, marginTop: 4, fontFamily: 'var(--font-mono)' }}>{strength.label}</div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                placeholder="Repeat your new password"
                required
              />
              {form.confirm && form.password !== form.confirm && (
                <div style={{ fontSize: 12, color: '#c83232', marginTop: 4 }}>Passwords do not match</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || form.password !== form.confirm || form.password.length < 8}
              style={{ width: '100%', padding: '12px', fontSize: 14, marginTop: 8 }}
            >
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#777' }}>
            <Link to="/login" style={{ color: 'var(--ink)', fontWeight: 700, textDecoration: 'none' }}>← Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}