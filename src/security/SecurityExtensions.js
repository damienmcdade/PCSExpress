/*
 * Purpose: Additive browser safety, local persistence, and audit helpers for PCS Express.
 * Third-party dependencies: browser localStorage; no npm dependencies.
 */

const AUDIT_KEY = 'pcs_audit_log';
const MAX_LOCAL_VALUE_BYTES = 750_000;

function isLegacySecureEnvelope(value) {
  return !!(value && typeof value === 'object' && value.alg === 'AES-256-GCM' && value.iv && value.data);
}

export function readLegacyJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (isLegacySecureEnvelope(parsed)) {
      localStorage.removeItem(key);
      window.dispatchEvent(new CustomEvent('pcs-local-storage-reset', { detail: { key } }));
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function safeSerialize(value) {
  const serialized = JSON.stringify(value);
  if (serialized.length > MAX_LOCAL_VALUE_BYTES) {
    throw new Error('Local storage value exceeds PCS Express safety limit');
  }
  return serialized;
}

export const secureLocalStore = {
  async get(key, fallback = null) {
    return readLegacyJson(key, fallback);
  },

  async set(key, value) {
    try {
      localStorage.setItem(key, safeSerialize(value));
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
