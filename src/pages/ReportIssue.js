import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['Infrastructure', 'Safety', 'Sanitation', 'Community Resources', 'Environment', 'Transportation', 'Other'];

export default function ReportIssue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    reporterName: user?.name || '',
    reporterEmail: user?.email || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.category) errs.category = 'Please select a category';
    if (!form.location.trim()) errs.location = 'Location is required';
    if (!form.reporterName.trim()) errs.reporterName = 'Your name is required';
    if (!form.reporterEmail.trim()) errs.reporterEmail = 'Your email is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await issuesAPI.create({
        title: form.title,
        description: form.description,
        category: form.category,
        location: form.location,
        reporter: {
          name: form.reporterName,
          email: form.reporterEmail,
          userId: user?._id || null
        }
      });
      toast.success('Issue reported successfully!');
      navigate(`/issues/${res.data.issue._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit issue');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: 'var(--ink)', padding: '40px 0', borderBottom: '2px solid var(--amber)' }}>
        <div className="container">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>New Report</div>
          <h1 style={{ color: 'var(--paper)', fontSize: 'clamp(28px, 4vw, 48px)' }}>Report an Issue</h1>
          <p style={{ color: 'var(--cement)', fontSize: 14, marginTop: 8 }}>Help your community by reporting problems you encounter</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 48 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 36, alignItems: 'start' }}>
          {/* Form */}
          <div>
            <form onSubmit={handleSubmit}>
              {/* Issue Details */}
              <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 32, marginBottom: 24, boxShadow: 'var(--shadow)' }}>
                <h2 style={{ fontSize: 22, marginBottom: 24 }}>Issue Details</h2>

                <div className="form-group">
                  <label>Issue Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Broken streetlight on Main St"
                    value={form.title}
                    onChange={e => update('title', e.target.value)}
                    maxLength={200}
                  />
                  {errors.title && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.title}</div>}
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select value={form.category} onChange={e => update('category', e.target.value)}>
                    <option value="">Select a category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.category}</div>}
                </div>

                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    placeholder="e.g. Corner of Oak Ave & 5th Street"
                    value={form.location}
                    onChange={e => update('location', e.target.value)}
                  />
                  {errors.location && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.location}</div>}
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    placeholder="Describe the issue in detail. Include when it started, severity, and any relevant context..."
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    rows={6}
                    maxLength={2000}
                    style={{ resize: 'vertical' }}
                  />
                  <div style={{ textAlign: 'right', fontSize: 11, color: '#999', marginTop: 4 }}>
                    {form.description.length}/2000
                  </div>
                  {errors.description && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.description}</div>}
                </div>
              </div>

              {/* Reporter Info */}
              <div style={{ background: 'var(--white)', border: '2px solid var(--ink)', padding: 32, marginBottom: 24, boxShadow: 'var(--shadow)' }}>
                <h2 style={{ fontSize: 22, marginBottom: 8 }}>Your Information</h2>
                <p style={{ fontSize: 13, color: '#777', marginBottom: 24 }}>Your contact details for follow-up purposes</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="form-group">
                    <label>Your Name *</label>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={form.reporterName}
                      onChange={e => update('reporterName', e.target.value)}
                    />
                    {errors.reporterName && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.reporterName}</div>}
                  </div>
                  <div className="form-group">
                    <label>Your Email *</label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={form.reporterEmail}
                      onChange={e => update('reporterEmail', e.target.value)}
                    />
                    {errors.reporterEmail && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.reporterEmail}</div>}
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? 'Submitting...' : 'Submit Report →'}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div>
            <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: 28, border: '2px solid var(--ink)', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ color: 'var(--amber)', fontSize: 18, marginBottom: 16 }}>Tips for a Good Report</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '📍', tip: 'Be specific about the location — include street names, landmarks, or nearby businesses' },
                  { icon: '📝', tip: 'Describe the impact on the community, not just what you see' },
                  { icon: '📅', tip: 'Mention when the issue first appeared if you know' },
                  { icon: '🏷️', tip: 'Choose the right category to help admins prioritize' },
                  { icon: '🔍', tip: 'Check if the issue is already reported to avoid duplicates' },
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--cement)', lineHeight: 1.5 }}>
                    <span>{item.icon}</span>
                    <span>{item.tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ background: 'var(--amber)', padding: 24, border: '2px solid var(--ink)', marginTop: 20, boxShadow: 'var(--shadow)' }}>
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>After You Report</h3>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                Your issue will appear on the public dashboard immediately. Community members can show their support, and you'll be able to track status updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
