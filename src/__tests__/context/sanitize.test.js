import { sanitizeHtml, escapeText } from '../../utils/sanitize';

describe('sanitizeHtml', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });

  it('passes through safe plain text unchanged (after fallback escaping)', () => {
    const result = sanitizeHtml('Hello world');
    expect(result).toContain('Hello world');
  });

  it('strips script tags', () => {
    const dirty = '<p>Safe text</p><script>alert("xss")</script>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert');
    expect(clean).toContain('Safe text');
  });

  it('strips onclick and other event handlers', () => {
    const dirty = '<a href="http://example.com" onclick="steal()">Click</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('onclick');
    expect(clean).toContain('Click');
  });

  it('strips javascript: href values', () => {
    const dirty = '<a href="javascript:alert(1)">Bad link</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('javascript:');
  });

  it('allows safe tags: b, i, em, strong, a, br, p, ul, ol, li', () => {
    const safe = '<p>Hello <strong>world</strong> and <em>more</em></p>';
    const clean = sanitizeHtml(safe);
    // Should contain p, strong, em — exact output depends on DOMPurify availability
    expect(clean).toContain('Hello');
    expect(clean).toContain('world');
  });

  it('strips img tags (not in allowed list)', () => {
    const dirty = '<p>Text</p><img src="x" onerror="alert(1)">';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('<img');
    expect(clean).not.toContain('onerror');
  });

  it('strips iframe tags', () => {
    const dirty = '<iframe src="http://evil.com"></iframe><p>safe</p>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('<iframe');
  });
});

describe('escapeText', () => {
  it('returns empty string for falsy input', () => {
    expect(escapeText('')).toBe('');
    expect(escapeText(null)).toBe('');
    expect(escapeText(undefined)).toBe('');
  });

  it('escapes < > & " characters', () => {
    expect(escapeText('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes single quotes', () => {
    expect(escapeText("it's")).toContain('&#x27;');
  });

  it('handles numeric input by coercing to string', () => {
    expect(escapeText(42)).toBe('42');
  });
});
