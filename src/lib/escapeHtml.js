/*
 * HTML-escape a value for safe interpolation into the print/export HTML
 * the app builds for binders, inventory claims, and AI transcripts.
 *
 * Uses `== null` (not `|| ''`) so a legitimate falsy value like the
 * number 0 or false is preserved rather than rendered as an empty cell —
 * an inventory item worth $0, for example, must still print "0".
 */
const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
}
