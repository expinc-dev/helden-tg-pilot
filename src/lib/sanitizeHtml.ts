import DOMPurify from 'dompurify'

// Html blocks are trainer-authored markup — untrusted content: sanitize
// before any dangerouslySetInnerHTML. USE_PROFILES: { html: true } keeps the
// default HTML allow-list while dropping SVG/MathML foreignObject tricks;
// scripts/event handlers/iframes never survive.
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}
