/*
 * Purpose: Additive browser safety, local persistence, and audit helpers for PCS Express.
 * Third-party dependencies: browser localStorage; no npm dependencies.
 */

const AUDIT_KEY = 'pcs_audit_log';

function isLegacySecureEnvelope(value) {
  return !!(value && typeof value === 'object' && value.alg === 'AES-256-GCM' && value.iv && value.data);
}

export function readLegacyJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return isLegacySecureEnvelope(parsed) ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export const secureLocalStore = {
  async get(key, fallback = null) {
    return readLegacyJson(key, fallback);
  },

  async set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('pcs-local-sync', { detail: { key } }));
      return true;
    } catch {
      window.dispatchEvent(new CustomEvent('pcs-local-storage-error', { detail: { key } }));
      return false;
    }
  },
};

export class AuditLogger {
  static record(action, details = {}) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      action,
      details,
      timestamp: new Date().toISOString(),
      deviceMode: navigator.onLine ? 'online' : 'comms-dark-ready',
    };

    try {
      secureLocalStore.get(AUDIT_KEY, []).then(current => {
        const safeCurrent = Array.isArray(current) ? current : [];
        secureLocalStore.set(AUDIT_KEY, [entry, ...safeCurrent].slice(0, 250));
      });
      window.dispatchEvent(new CustomEvent('pcs-audit-log', { detail: entry }));
    } catch {}
    return entry;
  }

  static list() {
    return readLegacyJson(AUDIT_KEY, []);
  }
}
