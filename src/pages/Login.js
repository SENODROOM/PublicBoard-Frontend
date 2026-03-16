import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      // Admins go straight to admin panel
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--paper)' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img 
            src="/logo.png" 
            alt="PublicBoard" 
            style={{ 
              width: 56, 
              height: 56, 
              objectFit: 'contain',
              margin: '0 auto 16px',
              border: '3px solid var(--amber)'
            }} 
          />
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>Welcome Back</h1>
          <p style={{ color: '#777', fontSize: 14 }}>Sign in to your PublicBoard account</p>
        </div>

        <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 36, boxShadow: 'var(--shadow-lg)' }}>
          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          {/* Admin hint */}
          <div style={{ marginTop: 20, padding: '12px 16px', background: '#fffbe8', border: '1px dashed var(--amber)', fontSize: 12, color: '#888', fontFamily: 'var(--font-mono)' }}>
            <strong style={{ color: 'var(--amber)' }}>Admin?</strong> Use your ADMIN_EMAIL and ADMIN_PASSWORD from the .env file. Admins are redirected to the panel automatically.
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#666' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--ink)', fontWeight: 700 }}>Register here →</Link>
        </p>
      </div>
    </div>
  );
}
