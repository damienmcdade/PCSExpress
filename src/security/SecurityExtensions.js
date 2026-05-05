/*
 * Purpose: Additive browser security, encrypted local persistence, and audit helpers for PCS Express.
 * Third-party dependencies: Web Crypto API, browser localStorage; no npm dependencies.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const AUDIT_KEY = 'pcs_audit_log';

async function sha256(input) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return digest;
}

async function getAesKey() {
  const originSeed = `${window.location.origin}|pcs-express-local-v1`;
  const material = await sha256(originSeed);
  return crypto.subtle.importKey('raw', material, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

function toBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}

export async function encryptForLocalStorage(value) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getAesKey();
  const plaintext = encoder.encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return JSON.stringify({
    alg: 'AES-256-GCM',
    v: 1,
    iv: toBase64(iv),
    data: toBase64(ciphertext),
    savedAt: new Date().toISOString(),
  });
}

export async function decryptFromLocalStorage(payload) {
  if (!payload) return null;
  const parsed = JSON.parse(payload);
  if (parsed?.alg !== 'AES-256-GCM') return parsed;
  const key = await getAesKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(parsed.iv) },
    key,
    fromBase64(parsed.data)
  );
  return JSON.parse(decoder.decode(plaintext));
}

export const secureLocalStore = {
  async get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? await decryptFromLocalStorage(raw) : fallback;
    } catch {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    }
  },

  async set(key, value) {
    try {
      localStorage.setItem(key, await encryptForLocalStorage(value));
      window.dispatchEvent(new CustomEvent('pcs-local-sync', { detail: { key } }));
      return true;
    } catch {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        window.dispatchEvent(new CustomEvent('pcs-local-sync', { detail: { key } }));
        return true;
      } catch {
        return false;
      }
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
      const current = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
      localStorage.setItem(AUDIT_KEY, JSON.stringify([entry, ...current].slice(0, 250)));
      window.dispatchEvent(new CustomEvent('pcs-audit-log', { detail: entry }));
    } catch {}
    return entry;
  }

  static list() {
    try {
      return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    } catch {
      return [];
    }
  }
}
