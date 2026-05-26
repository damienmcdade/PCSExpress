/*
 * AppShellFooter — persistent footer rendered once in the global app shell.
 * Visible on every tab so the independence disclaimer can't be skipped by
 * users who bypass the landing page (deep links / mobile launch into last
 * tab / returning users). The build stamp lives here too so version info
 * is consistent across every tab instead of only on Home.
 *
 * Disclaimer text comes from src/config/disclaimer.js so it stays
 * byte-for-byte identical with the LandingPage, ComplianceAttestation, and
 * App.jsx Help-Hub copies.
 */
import { INDEPENDENCE_DISCLAIMER, NOT_ADVICE_DISCLAIMER } from '../config/disclaimer';

export default function AppShellFooter() {
  const buildSha = import.meta.env.VITE_BUILD_SHA || 'unknown';
  const buildTime = (import.meta.env.VITE_BUILD_TIME || '').slice(0, 16).replace('T', ' ');
  return (
    <div
      role="contentinfo"
      aria-label="App-wide disclaimer and build info"
      style={{
        // Inline content; deliberately not position:fixed so it scrolls
        // with each tab and never overlaps the iOS bottom tab bar.
        padding: '12px 16px calc(16px + env(safe-area-inset-bottom))',
        marginTop: 'auto',
        background: '#F7FAFC',
        borderTop: '1px solid #E0E6EE',
        textAlign: 'center',
        fontSize: 10,
        lineHeight: 1.5,
        color: '#56697C',
      }}
    >
      <div style={{ fontWeight: 700, color: '#324050' }}>
        {INDEPENDENCE_DISCLAIMER}
      </div>
      <div style={{ marginTop: 4, color: '#56697C' }}>
        {NOT_ADVICE_DISCLAIMER}
      </div>
      {/* Persistent legal links — visible on every tab so returning users
          who bypass the landing page can still reach Privacy / Terms /
          Accessibility from anywhere in the app. */}
      <nav
        aria-label="Legal"
        style={{
          marginTop: 8,
          display: 'flex',
          gap: 14,
          justifyContent: 'center',
          flexWrap: 'wrap',
          fontSize: 10,
        }}
      >
        <a href="/privacy.html" style={{ color: '#324050', textDecoration: 'underline', fontWeight: 600 }}>Privacy</a>
        <a href="/terms.html" style={{ color: '#324050', textDecoration: 'underline', fontWeight: 600 }}>Terms</a>
        <a href="/accessibility.html" style={{ color: '#324050', textDecoration: 'underline', fontWeight: 600 }}>Accessibility</a>
        <a href="/.well-known/security.txt" style={{ color: '#324050', textDecoration: 'underline', fontWeight: 600 }}>Security</a>
      </nav>
      <div
        title="Deployment version"
        style={{
          marginTop: 6,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 9,
          letterSpacing: '.06em',
          opacity: 0.6,
          userSelect: 'all',
        }}
      >
        build · {buildSha} · {buildTime}
      </div>
    </div>
  );
}
