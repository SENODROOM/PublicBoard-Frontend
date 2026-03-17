/**
 * Sanitize HTML strings before rendering them with dangerouslySetInnerHTML.
 * Uses DOMPurify when available (browser), falls back to plain-text escaping (SSR/tests).
 *
 * Usage:
 *   <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(untrustedString) }} />
 *
 * Plain-text fields (issue titles, names, tags) should never use dangerouslySetInnerHTML
 * at all — React's default JSX escaping is sufficient.  This utility is only for fields
 * that legitimately store rich text (announcement bodies rendered in AdminAnnouncements).
 */

let purify = null;

function getPurify() {
  if (purify) return purify;
  if (typeof window !== 'undefined' && window.DOMPurify) {
    purify = window.DOMPurify;
  } else {
    try {
      // eslint-disable-next-line import/no-extraneous-dependencies
      const DOMPurify = require('dompurify');
      purify = DOMPurify;
    } catch (_) {
      purify = null;
    }
  }
  return purify;
}

/** Safe HTML — strips all script/event-handler attributes. */
export function sanitizeHtml(dirty) {
  if (!dirty) return '';
  const dp = getPurify();
  if (dp) {
    return dp.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      FORCE_BODY: true,
    });
  }
  // Fallback: escape everything — no rich text rendered but also no XSS
  return dirty
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Escape a string for safe insertion into plain text contexts.
 * React JSX escapes automatically, so you only need this when building
 * strings that are later passed to innerHTML / document.write.
 */
export function escapeText(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
