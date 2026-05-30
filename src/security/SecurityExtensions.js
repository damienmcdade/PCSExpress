/*
 * Purpose: Local persistence, audit, and AES-256-GCM-backed secure storage
 * for PCS Express.
 *
 * Encryption flow:
 *   - secureLocalStore.set(key, value) JSON-encodes the value, wraps it
 *     in an AES-256-GCM envelope via cryptoStore.encryptJSON(), and
 *     writes the stringified envelope to localStorage.
 *   - secureLocalStore.get(key, fallback) reads the string, parses it,
 *     detects whether it's an encrypted envelope or legacy plain JSON,
 *     decrypts via cryptoStore.decryptJSON() if needed, and returns the
 *     deserialized value.
 *   - Legacy plain-JSON values are upgraded transparently: get() returns
 *     them as-is, and the next set() re-writes them encrypted.
 *
 * Fallback: on browsers without window.crypto.subtle (insecure context,
 * very old environment), encryption is skipped and we behave like the
 * old plain-JSON store. encryptionAvailable() reports this to callers
 * so the UI can warn instead of silently making a false promise.
 */

import {
  encryptJSON,
  decryptJSON,
  isSecureEnvelope,
  encryptionAvailable,
  closeCryptoStoreDB,
} from './cryptoStore.js';

// Re-export closeCryptoStoreDB so consumers don't need a second
// dynamic-import path against cryptoStore.js. Vite warned that the
// mixed static + dynamic import of cryptoStore could produce
// duplicate module evaluation; routing everything through this one
// file resolves the warning and any minifier-introduced TDZ on
// cryptoStore's module-level `let` bindings.
export { closeCryptoStoreDB };

const AUDIT_KEY = 'pcs_audit_log';
export const LAST_LOCAL_SAVE_KEY = 'pcs_last_local_save_at';
const MAX_LOCAL_VALUE_BYTES = 1_500_000; // ciphertext + base64 overhead is ~1.35x source

function safeSerialize(value) {
  const serialized = JSON.stringify(value);
  if (serialized.length > MAX_LOCAL_VALUE_BYTES) {
    throw new Error('Local storage value exceeds PCS Express safety limit');
  }
  return serialized;
}

// Read raw JSON (envelope OR plain) without decryption. Used by legacy
// synchronous call sites that can't await a Promise. Plain JSON is
// returned as-is; envelopes are returned as the envelope object — callers
// using readLegacyJson directly should expect to upgrade to secureLocalStore.
export function readLegacyJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    // If we hit an envelope synchronously, we cannot decrypt without await.
    // Return fallback and let the async path pick it up. Better silent miss
    // than crashing the legacy synchronous code path.
    if (isSecureEnvelope(parsed)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export { encryptionAvailable };

export const secureLocalStore = {
  async get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      let parsed;
      try { parsed = JSON.parse(raw); } catch { return fallback; }
      if (isSecureEnvelope(parsed)) {
        if (!encryptionAvailable()) {
          // Envelope present but we cannot decrypt — surface the failure.
          window.dispatchEvent(new CustomEvent('pcs-local-storage-error', { detail: { key, reason: 'crypto-unavailable' } }));
          return fallback;
        }
        try {
          return await decryptJSON(parsed);
        } catch (e) {
          window.dispatchEvent(new CustomEvent('pcs-local-storage-error', { detail: { key, reason: 'decrypt-failed' } }));
          return fallback;
        }
      }
      // Legacy plain JSON — return as-is; the next set() will encrypt.
      return parsed;
    } catch {
      return fallback;
    }
  },

  async set(key, value) {
    try {
      let payload;
      if (encryptionAvailable()) {
        try {
          const envelope = await encryptJSON(value);
          payload = safeSerialize(envelope);
        } catch (e) {
          // Encryption is available but failed unexpectedly. Do NOT fall
          // back to plaintext: persisting PII in the clear while the app
          // reports "encrypted at rest" is worse than dropping the write.
          // Surface the failure and refuse to persist so the caller can
          // retry or warn the user.
          window.dispatchEvent(new CustomEvent('pcs-local-storage-error', { detail: { key, reason: 'encrypt-failed' } }));
          return false;
        }
      } else {
        payload = safeSerialize(value);
      }
      localStorage.setItem(key, payload);
      if (key !== LAST_LOCAL_SAVE_KEY) {
        const stamp = JSON.stringify(new Date().toISOString());
        localStorage.setItem(LAST_LOCAL_SAVE_KEY, stamp);
      }
      window.dispatchEvent(new CustomEvent('pcs-local-sync', { detail: { key, encrypted: encryptionAvailable() } }));
      return true;
    } catch {
      window.dispatchEvent(new CustomEvent('pcs-local-storage-error', { detail: { key, reason: 'write-failed' } }));
      return false;
    }
  },
};

export class AuditLogger {
  // Serialize writes through a single promise chain so back-to-back
  // record() calls don't race on read-modify-write. Without this, two
  // record() invocations in the same tick both read the pre-write log,
  // both prepend their entry, both write — and the second write
  // clobbers the first. The chain guarantees prior persistence
  // finishes before the next read starts. The chain catches and
  // swallows errors so one failed write never poisons the queue.
  static _writeQueue = Promise.resolve();

  static record(action, details = {}) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      action,
      details,
      timestamp: new Date().toISOString(),
      deviceMode: navigator.onLine ? 'online' : 'comms-dark-ready',
    };
    AuditLogger._writeQueue = AuditLogger._writeQueue.then(async () => {
      try {
        const current = await secureLocalStore.get(AUDIT_KEY, []);
        const safeCurrent = Array.isArray(current) ? current : [];
        await secureLocalStore.set(AUDIT_KEY, [entry, ...safeCurrent].slice(0, 250));
      } catch {}
    });
    try { window.dispatchEvent(new CustomEvent('pcs-audit-log', { detail: entry })); } catch {}
    return entry;
  }

  static async list() {
    // Wait for any in-flight write so list() always reflects the most
    // recent record() call from the caller's perspective.
    await AuditLogger._writeQueue;
    return (await secureLocalStore.get(AUDIT_KEY, []));
  }
}
