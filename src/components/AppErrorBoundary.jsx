/*
 * AppErrorBoundary — top-level error boundary for PCS Express.
 *
 * Wraps the entire App tree so any uncaught render-time exception
 * surfaces in a recoverable UI rather than a blank white screen.
 * Two escape hatches:
 *
 *   - Soft reload: clears the in-memory demo session and reloads,
 *     preserving the user's encrypted local profile + checklist.
 *
 *   - Clear local state and reload: nuclear option. Wipes every
 *     pcs_* localStorage key + sessionStorage, then hard-reloads.
 *     Preserves the IndexedDB AES key so re-onboarding doesn't
 *     trigger a re-encryption migration.
 *
 * Extracted from App.jsx in Phase 15.2. No behavior change; just a
 * pure module move so the boundary is easier to reason about and
 * unit-test independently of the monolithic shell.
 */
import { Component } from 'react';

function clearSessionDemoProfile() {
  try { sessionStorage.removeItem('pcs_demo_profile'); } catch {}
}

function recoverWithoutDeletingProgress() {
  clearSessionDemoProfile();
  window.location.reload();
}

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '', errorStack: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: String(error?.message || error || 'Unknown error'),
      errorStack: String(error?.stack || ''),
    };
  }

  componentDidCatch(error, info) {
    console.error('PCS Express startup error', error, info);
  }

  resetAppState = () => {
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith('pcs_') || k === 'translations_saved') {
          try { localStorage.removeItem(k); } catch {}
        }
      }
    } catch {}
    try { sessionStorage.clear(); } catch {}
    try { window.location.replace(window.location.pathname); } catch { window.location.reload(); }
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    const detail = (this.state.errorMessage || '').slice(0, 500);
    const stack = (this.state.errorStack || '').split('\n').slice(0, 6).join('\n');
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#F0F4F8', fontFamily: 'system-ui' }}>
        <div style={{ maxWidth: 520, width: '100%', background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 14, padding: 18, boxShadow: '0 8px 28px rgba(13,24,33,0.12)' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 8 }}>PCS Express needs to reload this screen</div>
          <div style={{ fontSize: 12, color: '#56697C', lineHeight: 1.6, marginBottom: 10 }}>
            PCS Express hit a screen error. Try the soft reload first — it preserves your PCS profile and checklist progress. If the screen still won't load after that, use "Clear local state and reload" to wipe local storage and start fresh.
          </div>
          {detail && (
            <details style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 11, color: '#7A4A00' }}>
              <summary style={{ fontWeight: 800, cursor: 'pointer' }}>Error detail</summary>
              <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', marginTop: 6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{detail}</div>
              {stack && <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', marginTop: 6, opacity: 0.85, whiteSpace: 'pre-wrap', fontSize: 10 }}>{stack}</div>}
            </details>
          )}
          <button onClick={recoverWithoutDeletingProgress} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none', background: '#1565C0', color: '#FFFFFF', fontSize: 13, fontWeight: 900, cursor: 'pointer', marginBottom: 8 }}>
            Soft reload (keep progress)
          </button>
          <button onClick={this.resetAppState} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #C62828', background: '#FFFFFF', color: '#C62828', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            Clear local state and reload
          </button>
        </div>
      </div>
    );
  }
}
