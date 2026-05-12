/*
 * Purpose: AES-256-GCM encryption for local persistence using the Web Crypto API.
 *
 * Key persistence:
 *   The CryptoKey is generated as a *non-extractable* AES-256-GCM key and
 *   stored in IndexedDB. IndexedDB structured-clone preserves the CryptoKey
 *   without ever exposing the raw key bytes to JS, so it can be retrieved
 *   on the next session without re-deriving from a password. Compromise of
 *   IndexedDB is still possible (XSS reading via the same origin), but the
 *   key bytes cannot be exfiltrated as a string.
 *
 * Envelope format (stored as a JSON string in localStorage):
 *   { v: 1, alg: 'AES-256-GCM', iv: <base64>, data: <base64> }
 *
 * Failure mode: if window.crypto.subtle is unavailable (e.g., insecure
 * context like http://) we fall back to a plain-JSON shim so the app still
 * works — but encryptionAvailable() returns false so the UI can warn.
 */

const DB_NAME = 'pcs-express-crypto';
const DB_VERSION = 1;
const STORE = 'keys';
const KEY_ID = 'pcs-aes-256-v1';

let _keyPromise = null;
let _available = null;

export function encryptionAvailable() {
  if (_available !== null) return _available;
  _available = !!(typeof window !== 'undefined'
    && window.crypto
    && window.crypto.subtle
    && window.indexedDB
    && typeof window.crypto.subtle.encrypt === 'function');
  return _available;
}

// Cache the open IDB connection so we can close it explicitly before
// deleteDatabase() during Reset. Without an explicit close, the delete
// fires onblocked and never actually succeeds — the AES key would
// persist across Reset, defeating the "fresh restart" promise the UI
// makes to users.
let _openDB = null;
function openDB() {
  if (_openDB) return Promise.resolve(_openDB);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => {
      _openDB = req.result;
      // If we ever lose the connection (e.g., user opens app in another
      // tab and that tab calls deleteDatabase), forget the cache.
      _openDB.onclose = () => { _openDB = null; };
      _openDB.onversionchange = () => { try { _openDB?.close(); } catch {} ; _openDB = null; };
      resolve(req.result);
    };
    req.onerror = () => reject(req.error);
  });
}

export function closeCryptoStoreDB() {
  _keyPromise = null;
  if (_openDB) {
    try { _openDB.close(); } catch {}
    _openDB = null;
  }
}

async function readStoredKey() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY_ID);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function writeStoredKey(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(key, KEY_ID);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function ensureKey() {
  if (_keyPromise) return _keyPromise;
  if (!encryptionAvailable()) return Promise.reject(new Error('crypto unavailable'));
  _keyPromise = (async () => {
    let key = await readStoredKey().catch(() => null);
    if (!key) {
      key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false, // non-extractable — key bytes never leave SubtleCrypto
        ['encrypt', 'decrypt']
      );
      await writeStoredKey(key);
    }
    return key;
  })();
  return _keyPromise;
}

function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function isSecureEnvelope(value) {
  return !!(value && typeof value === 'object'
    && value.v === 1 && value.alg === 'AES-256-GCM'
    && typeof value.iv === 'string' && typeof value.data === 'string');
}

export async function encryptJSON(plainValue) {
  if (!encryptionAvailable()) throw new Error('crypto unavailable');
  const key = await ensureKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(plainValue));
  const cipher = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return {
    v: 1,
    alg: 'AES-256-GCM',
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(cipher)),
  };
}

export async function decryptJSON(envelope) {
  if (!isSecureEnvelope(envelope)) throw new Error('not a secure envelope');
  if (!encryptionAvailable()) throw new Error('crypto unavailable');
  const key = await ensureKey();
  const iv = base64ToBytes(envelope.iv);
  const data = base64ToBytes(envelope.data);
  const plain = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return JSON.parse(new TextDecoder().decode(plain));
}

// Test helper: rotate (delete) the stored key. Useful in dev / tests to
// simulate a fresh device. Not exposed in UI.
export async function _resetKeyForTests() {
  _keyPromise = null;
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY_ID);
    tx.oncomplete = () => resolve();
  });
}
