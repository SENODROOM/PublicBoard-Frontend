import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { issuesAPI } from '../api';

const CATEGORIES = ['Infrastructure', 'Safety', 'Sanitation', 'Community Resources', 'Environment', 'Transportation', 'Other'];
const PRIORITIES = [
  { value: 'Low', label: 'Low', color: '#6b7280', bg: '#f9fafb', desc: 'Minor issue, no urgency' },
  { value: 'Medium', label: 'Medium', color: '#3b82f6', bg: '#eff6ff', desc: 'Moderate, needs attention' },
  { value: 'High', label: 'High', color: '#f59e0b', bg: '#fffbeb', desc: 'Urgent, impacts daily life' },
  { value: 'Critical', label: 'Critical', color: '#ef4444', bg: '#fef2f2', desc: 'Emergency / safety hazard' },
];

export default function ReportIssue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: searchParams.get('category') || '',
    location: '',
    neighborhood: searchParams.get('neighborhood') || '',
    priority: 'Medium',
    tags: [],
    reporterName: user?.name || '',
    reporterEmail: user?.email || '',
  });
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill from related issue
  const relatedId = searchParams.get('related');
  useEffect(() => {
    if (relatedId) {
      issuesAPI.getOne(relatedId).then(d => {
        const rel = d.issue;
        setForm(f => ({
          ...f,
          category: f.category || rel.category,
          neighborhood: f.neighborhood || rel.neighborhood,
          tags: [...new Set([...f.tags, ...(rel.tags || [])])].slice(0, 5),
        }));
      }).catch(() => {});
    }
  }, [relatedId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addTag = (raw) => {
    const tag = raw.replace(/[^a-z0-9-]/gi, '').toLowerCase().slice(0, 30);
    if (tag && !form.tags.includes(tag) && form.tags.length < 5) {
      setForm(f => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput('');
  };

  const onTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === 'Backspace' && !tagInput && form.tags.length) {
      setForm(f => ({ ...f, tags: f.tags.slice(0, -1) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.category || !form.location.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = await issuesAPI.create({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
        neighborhood: form.neighborhood.trim(),
        priority: form.priority,
        tags: form.tags,
        reporter: {
          name: form.reporterName.trim() || 'Anonymous',
          email: form.reporterEmail.trim() || 'anon@publicboard.io',
          userId: user?._id || null,
        },
      });
      navigate(`/issues/${data.issue._id}?new=1`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    }
    setSubmitting(false);
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box',
    outline: 'none', transition: 'border-color 0.2s',
  };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 };

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>
          <Link to="/dashboard" style={{ color: '#6b7280', textDecoration: 'none' }}>Dashboard</Link> / Report Issue
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>Report a Community Issue</h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }}>
          Help your community by documenting problems that need attention.
          {relatedId && <span style={{ color: '#4f46e5' }}> Pre-filled from a related issue.</span>}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24, alignItems: 'start' }}>
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Title <span style={{ color: '#ef4444' }}>*</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="Brief description of the issue" maxLength={200} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>{form.title.length}/200</div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Description <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Describe the issue in detail: what it is, how long it has existed, how it affects the community…"
              rows={5} maxLength={2000} style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>{form.description.length}/2000</div>
          </div>

          {/* Category + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Category <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer', background: '#fff' }}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {PRIORITIES.map(p => (
                  <button type="button" key={p.value} onClick={() => set('priority', p.value)}
                    title={p.desc}
                    style={{
                      padding: '8px 6px', borderRadius: 8, border: '2px solid',
                      borderColor: form.priority === p.value ? p.color : '#e5e7eb',
                      background: form.priority === p.value ? p.bg : '#fff',
                      color: form.priority === p.value ? p.color : '#6b7280',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location + Neighborhood */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Location <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="e.g. 123 Main St, or Cross st" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
            <div>
              <label style={labelStyle}>Neighborhood</label>
              <input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)}
                placeholder="e.g. Downtown, Northside" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#4f46e5'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Tags <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}>(up to 5, press Enter or comma)</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1px solid #d1d5db', minHeight: 44, alignItems: 'center', background: '#fff' }}>
              {form.tags.map(t => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#eff6ff', color: '#4f46e5', padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  #{t}
                  <button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                </span>
              ))}
              {form.tags.length < 5 && (
                <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={onTagKey}
                  onBlur={() => { if (tagInput) addTag(tagInput); }}
                  placeholder={form.tags.length === 0 ? 'pothole, lighting, noise…' : ''}
                  style={{ border: 'none', outline: 'none', fontSize: 13, minWidth: 120, flex: 1 }} />
              )}
            </div>
          </div>

          {/* Reporter info */}
          {!user && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18, padding: 16, background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
              <div>
                <label style={labelStyle}>Your Name</label>
                <input value={form.reporterName} onChange={e => set('reporterName', e.target.value)}
                  placeholder="Anonymous" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div>
                <label style={labelStyle}>Your Email</label>
                <input type="email" value={form.reporterEmail} onChange={e => set('reporterEmail', e.target.value)}
                  placeholder="optional" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#4f46e5'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
            </div>
          )}

          {error && <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#991b1b', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <button type="submit" disabled={submitting}
            style={{
              width: '100%', padding: '13px', background: '#4f46e5', color: '#fff', border: 'none',
              borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer',
              opacity: submitting ? 0.7 : 1, transition: 'opacity 0.15s'
            }}>
            {submitting ? 'Submitting…' : '📋 Submit Issue Report'}
          </button>
        </form>

        {/* Sidebar guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Priority guide */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority Guide</div>
            {PRIORITIES.map(p => (
              <div key={p.value} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0, marginTop: 4 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: p.color }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', marginBottom: 10 }}>💡 Tips for a great report</div>
            {[
              'Be specific about the location',
              'Mention how long the issue has existed',
              'Describe the impact on residents',
              'Add tags to help others find it',
              'Use the neighborhood field for better filtering'
            ].map((tip, i) => (
              <div key={i} style={{ fontSize: 12, color: '#1e40af', marginBottom: 6, paddingLeft: 12, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0 }}>·</span>
                {tip}
              </div>
            ))}
          </div>

          {/* Sign-in prompt */}
          {!user && (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Track your report</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                Sign in to track your report's status, earn badges, and get notified of updates.
              </div>
              <Link to="/login" style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
                Sign in →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
