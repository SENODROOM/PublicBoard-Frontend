import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api';

const STATE = { loading: 'loading', success: 'success', error: 'error', missing: 'missing' };

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState(token ? STATE.loading : STATE.missing);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    authAPI.verifyEmail(token)
      .then(() => setState(STATE.success))
      .catch(err => {
        setMessage(err.response?.data?.message || 'Verification failed.');
        setState(STATE.error);
      });
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--paper)' }}>
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 48, boxShadow: 'var(--shadow-lg)' }}>

          {state === STATE.loading && (
            <>
              <div className="spinner" style={{ margin: '0 auto 20px' }} />
              <h2 style={{ fontSize: 22, marginBottom: 8 }}>Verifying your email…</h2>
              <p style={{ color: '#777', fontSize: 14 }}>This will only take a moment.</p>
            </>
          )}

          {state === STATE.success && (
            <>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontSize: 24, marginBottom: 12, color: 'var(--green)' }}>Email Verified!</h2>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 28 }}>
                Your account is now fully verified. You've earned +5 reputation points. Welcome to PublicBoard!
              </p>
              <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-block' }}>Go to Dashboard</Link>
            </>
          )}

          {state === STATE.error && (
            <>
              <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
              <h2 style={{ fontSize: 22, marginBottom: 12 }}>Verification Failed</h2>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 28 }}>
                {message || 'This verification link is invalid or has expired (links expire after 24 hours).'}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/login" className="btn btn-primary">Sign In</Link>
                <Link to="/register" className="btn">Create Account</Link>
              </div>
            </>
          )}

          {state === STATE.missing && (
            <>
              <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
              <h2 style={{ fontSize: 22, marginBottom: 12 }}>No Token Found</h2>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 28 }}>
                This verification link is incomplete. Please click the link in your email, or request a new one.
              </p>
              <Link to="/login" className="btn btn-primary">Go to Login</Link>
            </>
          )}

        </div>
      </div>
    </div>
  );
}