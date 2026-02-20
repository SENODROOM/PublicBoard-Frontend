import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { issuesAPI, donationsAPI } from '../api';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [donationStats, setDonationStats] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);

  useEffect(() => {
    issuesAPI.getStats().then(r => setStats(r.data)).catch(() => {});
    donationsAPI.getStats().then(r => setDonationStats(r.data)).catch(() => {});
    issuesAPI.getAll({ sort: '-createdAt', limit: 3 }).then(r => setRecentIssues(r.data.issues.slice(0, 3))).catch(() => {});
  }, []);

  const categories = [
    { icon: '🏗️', name: 'Infrastructure', desc: 'Roads, streetlights, potholes' },
    { icon: '🚨', name: 'Safety', desc: 'Hazards, security concerns' },
    { icon: '🗑️', name: 'Sanitation', desc: 'Trash, waste management' },
    { icon: '🎯', name: 'Community Resources', desc: 'Shared equipment, supplies' },
    { icon: '🌿', name: 'Environment', desc: 'Parks, pollution, green spaces' },
    { icon: '🚌', name: 'Transportation', desc: 'Public transit, parking' },
  ];

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'var(--ink)',
        borderBottom: '3px solid var(--amber)',
        padding: '80px 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.03) 60px, rgba(255,255,255,0.03) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.03) 60px, rgba(255,255,255,0.03) 61px)',
          pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative' }}>
          <div style={{ maxWidth: 720 }}>
            <div style={{
              display: 'inline-block',
              background: 'var(--amber)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              padding: '4px 12px',
              marginBottom: 24
            }}>Community Issue Tracker</div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(42px, 6vw, 80px)',
              fontWeight: 800,
              color: 'var(--paper)',
              lineHeight: 1.0,
              marginBottom: 24,
              letterSpacing: '-0.03em'
            }}>
              Your Voice.<br />
              <span style={{ color: 'var(--amber)' }}>Your Neighborhood.</span><br />
              Your Board.
            </h1>

            <p style={{
              color: 'var(--cement)',
              fontSize: 16,
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.7,
              maxWidth: 520,
              marginBottom: 36
            }}>
              Report problems, track resolutions, and support your community — all in one transparent platform.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to="/report" className="btn btn-amber btn-lg">Report an Issue</Link>
              <Link to="/dashboard" className="btn btn-lg" style={{ background: 'transparent', color: 'var(--paper)', borderColor: 'var(--cement)' }}>View Dashboard</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      {stats && (
        <section style={{ background: 'var(--amber)', borderBottom: '2px solid var(--ink)' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 0 }}>
              {[
                { num: stats.total, label: 'Total Issues' },
                { num: stats.open, label: 'Open' },
                { num: stats.inProgress, label: 'In Progress' },
                { num: stats.resolved, label: 'Resolved' },
                { num: donationStats ? `$${donationStats.totalRaised.toLocaleString()}` : '...', label: 'Raised' }
              ].map((s, i) => (
                <div key={i} style={{
                  padding: '20px 24px',
                  borderRight: i < 4 ? '2px solid var(--ink)' : 'none',
                  textAlign: 'center'
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{s.num}</div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4, opacity: 0.7 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section style={{ padding: '80px 0', background: 'var(--paper)' }}>
        <div className="container">
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--cement)', marginBottom: 8 }}>
              What can you report?
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>Issue Categories</h2>
          </div>

          <div className="grid-3">
            {categories.map((cat, i) => (
              <Link to={`/dashboard?category=${cat.name}`} key={i}>
                <div style={{
                  padding: '28px 24px',
                  border: '2px solid var(--ink)',
                  background: 'var(--white)',
                  transition: 'all 0.15s',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-3px,-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{cat.icon}</div>
                  <h3 style={{ fontSize: 18, marginBottom: 6 }}>{cat.name}</h3>
                  <p style={{ fontSize: 13, color: '#666' }}>{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Issues */}
      {recentIssues.length > 0 && (
        <section style={{ padding: '60px 0', background: 'var(--surface)', borderTop: '2px solid var(--ink)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
              <h2 style={{ fontSize: 32 }}>Recent Issues</h2>
              <Link to="/dashboard" className="btn btn-sm">View All →</Link>
            </div>
            <div className="grid-3">
              {recentIssues.map(issue => (
                <Link to={`/issues/${issue._id}`} key={issue._id}>
                  <div style={{ padding: 20, background: 'var(--white)', border: '2px solid var(--ink)', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                    <span className={`badge badge-${issue.status === 'Open' ? 'open' : issue.status === 'In Progress' ? 'progress' : issue.status === 'Resolved' ? 'resolved' : 'pending'}`} style={{ marginBottom: 10, display: 'inline-block' }}>{issue.status}</span>
                    <h4 style={{ fontSize: 15, marginBottom: 6 }}>{issue.title}</h4>
                    <p style={{ fontSize: 12, color: '#777' }}>📍 {issue.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Donate */}
      <section style={{ padding: '80px 0', background: 'var(--green)', borderTop: '3px solid var(--ink)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--white)', fontSize: 40, marginBottom: 16 }}>Support Your Community</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Pool resources with neighbors to fund solutions, organize events, and make lasting improvements.
          </p>
          <Link to="/donate" className="btn btn-lg" style={{ background: 'var(--amber)', borderColor: 'var(--ink)' }}>
            Make a Donation
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 0', borderTop: '2px solid var(--ink)' }}>
        <div className="container">
          <h2 style={{ fontSize: 40, marginBottom: 48 }}>How It Works</h2>
          <div className="grid-4">
            {[
              { num: '01', title: 'Report', desc: 'Submit detailed info about your concern — location, category, description.' },
              { num: '02', title: 'Display', desc: 'Your issue goes public on the dashboard, visible to the whole community.' },
              { num: '03', title: 'Update', desc: 'Track progress as reporters and admins update the status in real-time.' },
              { num: '04', title: 'Resolve', desc: 'Celebrate wins! Resolved issues are archived for community records.' },
            ].map((step, i) => (
              <div key={i} style={{ padding: 24, borderLeft: '4px solid var(--amber)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, color: 'var(--cement)', lineHeight: 1, marginBottom: 12 }}>{step.num}</div>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--ink)', color: 'var(--cement)', padding: '32px 0', borderTop: '3px solid var(--amber)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--paper)' }}>PublicBoard</div>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            Community-driven issue tracking & resolution platform
          </div>
        </div>
      </footer>
    </div>
  );
}
