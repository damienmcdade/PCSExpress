/*
 * Minimal client error reporter — interim observability. Posts uncaught
 * errors to the server's /api/client-error so crashes show up in server logs
 * instead of being invisible. This is intentionally tiny and PII-cautious
 * (name + truncated message + coarse location only). Swap the POST target for
 * a real error-tracking SDK (Sentry) DSN when one is provisioned.
 */
import { apiUrl } from '../config/apiConfig';

let _lastSent = 0;

export function reportClientError(name, message, where) {
  try {
    // Throttle to at most one report every 5s to avoid feedback storms.
    const now = Date.now();
    if (now - _lastSent < 5000) return;
    _lastSent = now;
    const body = JSON.stringify({
      name: String(name || 'Error').slice(0, 60),
      message: String(message || '').slice(0, 200),
      where: String(where || (typeof location !== 'undefined' ? location.pathname : '')).slice(0, 100),
    });
    fetch(apiUrl('/api/client-error'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => { /* never let reporting throw */ });
  } catch { /* no-op */ }
}

// Install global handlers once.
export function installGlobalErrorReporting() {
  if (typeof window === 'undefined' || window.__pcsErrReportingInstalled) return;
  window.__pcsErrReportingInstalled = true;
  window.addEventListener('error', (e) => {
    reportClientError(e?.error?.name || 'error', e?.message || e?.error?.message, e?.filename);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e?.reason;
    reportClientError(r?.name || 'unhandledrejection', r?.message || String(r));
  });
}
