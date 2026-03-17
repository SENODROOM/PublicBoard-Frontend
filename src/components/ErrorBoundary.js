import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        maxWidth: 560, margin: '80px auto', padding: '0 24px',
        fontFamily: 'var(--font-mono)', textAlign: 'center'
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 64, color: 'var(--ink)', lineHeight: 1, marginBottom: 16
        }}>
          Oops
        </div>
        <p style={{ fontSize: 15, color: '#555', marginBottom: 24, lineHeight: 1.7 }}>
          Something went wrong on this page. The error has been logged.
        </p>
        {process.env.NODE_ENV === 'development' && this.state.error && (
          <pre style={{
            background: '#fef2f2', border: '1.5px solid var(--red)',
            padding: '12px 16px', fontSize: 11, color: 'var(--red)',
            textAlign: 'left', overflowX: 'auto', marginBottom: 24,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word'
          }}>
            {this.state.error.toString()}
          </pre>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
          <a className="btn" href="/">← Go Home</a>
        </div>
      </div>
    );
  }
}
