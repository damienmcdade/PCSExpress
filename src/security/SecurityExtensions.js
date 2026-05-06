/*
 * Purpose: Additive browser security, encrypted local persistence, and audit helpers for PCS Express.
 * Third-party dependencies: Web Crypto API, browser localStorage; no npm dependencies.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const AUDIT_KEY = 'pcs_audit_log';
const KEY_DB = 'pcs-express-secure-key-db';
const KEY_STORE = 'keys';
const KEY_ID = 'pcs-express-local-aes-gcm-v2';

function isEncryptedEnvelope(value) {
  return !!(value && typeof value === 'object' && value.alg === 'AES-256-GCM' && value.iv && value.data);
}

function hasCrypto() {
  return typeof crypto !== 'undefined' && crypto.subtle && crypto.getRandomValues;
}

function openKeyDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(KEY_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(KEY_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getStoredCryptoKey() {
  if (!hasCrypto() || typeof indexedDB === 'undefined') return null;
  const db = await openKeyDb();
  try {
    const existing = await new Promise((resolve, reject) => {
      const req = db.transaction(KEY_STORE, 'readonly').objectStore(KEY_STORE).get(KEY_ID);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    if (existing) return existing;
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    await new Promise((resolve, reject) => {
      const req = db.transaction(KEY_STORE, 'readwrite').objectStore(KEY_STORE).put(key, KEY_ID);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return key;
  } finally {
    db.close();
  }
}

async function sha256(input) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input));
  return digest;
}

async function getAesKey() {
  const stored = await getStoredCryptoKey();
  if (stored) return stored;
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
  if (!hasCrypto()) throw new Error('Web Crypto API unavailable');
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

export function readLegacyJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return isEncryptedEnvelope(parsed) ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export const secureLocalStore = {
  async get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? await decryptFromLocalStorage(raw) : fallback;
    } catch {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return isEncryptedEnvelope(parsed) ? fallback : parsed;
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
      window.dispatchEvent(new CustomEvent('pcs-secure-storage-error', { detail: { key } }));
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
      secureLocalStore.get(AUDIT_KEY, []).then(current => secureLocalStore.set(AUDIT_KEY, [entry, ...current].slice(0, 250)));
      window.dispatchEvent(new CustomEvent('pcs-audit-log', { detail: entry }));
    } catch {}
    return entry;
  }

  static list() {
    return readLegacyJson(AUDIT_KEY, []);
  }
}
