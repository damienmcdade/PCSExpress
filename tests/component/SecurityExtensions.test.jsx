/*
 * Intrusive tests for src/security/SecurityExtensions.js.
 *
 * jsdom has no window.crypto.subtle, so encryptionAvailable() reports
 * false and secureLocalStore takes the plain-JSON fallback path. That
 * path is the one that runs in:
 *   - Old / no-https environments where SubtleCrypto isn't exposed.
 *   - Capacitor WebView builds where the runtime momentarily fails.
 *   - Any future operator who screws up the secure-context setup.
 *
 * So testing it is high-value — it's the path users see when the
 * "we encrypt everything" guarantee can't be honored. We verify it
 * still writes data, still surfaces a warning event, still enforces
 * the size cap, and still returns the fallback on corrupt JSON.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Vitest's jsdom in this project doesn't expose localStorage by
// default, so install a Map-backed shim BEFORE importing the module
// under test (SecurityExtensions reads window.localStorage at runtime
// through globals; the shim must be in place first).
function installLocalStorageShim() {
  const store = new Map();
  const shim = {
    get length() { return store.size; },
    key(i) { return Array.from(store.keys())[i] ?? null; },
    getItem(k) { return store.has(String(k)) ? store.get(String(k)) : null; },
    setItem(k, v) { store.set(String(k), String(v)); },
    removeItem(k) { store.delete(String(k)); },
    clear() { store.clear(); },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: shim, configurable: true, writable: true });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: shim, configurable: true, writable: true });
  }
}
installLocalStorageShim();

const {
  secureLocalStore,
  readLegacyJson,
  encryptionAvailable,
  AuditLogger,
  LAST_LOCAL_SAVE_KEY,
} = await import('../../src/security/SecurityExtensions.js');

beforeEach(() => {
  window.localStorage.clear();
});

describe('encryptionAvailable (jsdom: no SubtleCrypto)', () => {
  it('reports false in jsdom because window.crypto.subtle is missing', () => {
    // This assertion documents the runtime — if jsdom ever ships
    // SubtleCrypto out of the box, the rest of this file becomes
    // an encryption-path test instead of a fallback-path test.
    expect(encryptionAvailable()).toBe(false);
  });
});

describe('secureLocalStore.set + get (plain-JSON fallback path)', () => {
  it('round-trips a normal object', async () => {
    await secureLocalStore.set('profile', { branch: 'Army', rank: 'E-5' });
    const out = await secureLocalStore.get('profile');
    expect(out).toEqual({ branch: 'Army', rank: 'E-5' });
  });

  it('round-trips arrays', async () => {
    await secureLocalStore.set('list', [1, 2, 3, { nested: true }]);
    expect(await secureLocalStore.get('list')).toEqual([1, 2, 3, { nested: true }]);
  });

  it('returns the provided fallback when the key is missing', async () => {
    expect(await secureLocalStore.get('no-such-key', 'FALLBACK')).toBe('FALLBACK');
    expect(await secureLocalStore.get('no-such-key', null)).toBeNull();
    expect(await secureLocalStore.get('no-such-key')).toBeNull();
  });

  it('returns fallback when stored value is corrupt JSON', async () => {
    // Hostile/legacy tooling could write garbage to a key; get() must
    // not crash the caller.
    window.localStorage.setItem('corrupt', '{not-valid-json');
    expect(await secureLocalStore.get('corrupt', 'safe')).toBe('safe');
  });

  it('returns fallback when stored value is an empty string', async () => {
    window.localStorage.setItem('empty', '');
    expect(await secureLocalStore.get('empty', 42)).toBe(42);
  });

  it('writes the last-save timestamp on every successful set (except the timestamp key itself)', async () => {
    expect(window.localStorage.getItem(LAST_LOCAL_SAVE_KEY)).toBeNull();
    await secureLocalStore.set('profile', { x: 1 });
    const stamp = JSON.parse(window.localStorage.getItem(LAST_LOCAL_SAVE_KEY));
    expect(typeof stamp).toBe('string');
    expect(stamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('does NOT recurse when set is called with the last-save-key itself', async () => {
    // The implementation guards against an infinite save-stamp loop.
    await secureLocalStore.set(LAST_LOCAL_SAVE_KEY, '"x"');
    // No infinite loop, no second timestamp scribbled to itself.
    expect(window.localStorage.getItem(LAST_LOCAL_SAVE_KEY)).toBeTruthy();
  });

  it('rejects values exceeding the 1.5 MB safety cap (returns false, dispatches error event)', async () => {
    const huge = { blob: 'x'.repeat(2_000_000) };
    let errorEvent = null;
    const handler = (e) => { errorEvent = e; };
    window.addEventListener('pcs-local-storage-error', handler);
    const ok = await secureLocalStore.set('big', huge);
    window.removeEventListener('pcs-local-storage-error', handler);
    expect(ok).toBe(false);
    expect(errorEvent?.detail?.reason).toBe('write-failed');
  });

  it('dispatches pcs-local-sync on successful write', async () => {
    let syncEvent = null;
    const handler = (e) => { syncEvent = e; };
    window.addEventListener('pcs-local-sync', handler);
    await secureLocalStore.set('profile', { x: 1 });
    window.removeEventListener('pcs-local-sync', handler);
    expect(syncEvent?.detail?.key).toBe('profile');
    expect(syncEvent?.detail?.encrypted).toBe(false); // jsdom path
  });

  it('round-trips strings, numbers, booleans, null', async () => {
    await secureLocalStore.set('s', 'hello');
    await secureLocalStore.set('n', 42);
    await secureLocalStore.set('b', true);
    await secureLocalStore.set('z', null);
    expect(await secureLocalStore.get('s')).toBe('hello');
    expect(await secureLocalStore.get('n')).toBe(42);
    expect(await secureLocalStore.get('b')).toBe(true);
    // null stored as JSON null, get returns parsed null.
    // The get() also falls back to `null` for missing keys, so we
    // verify the raw localStorage was written too.
    expect(window.localStorage.getItem('z')).toBe('null');
  });
});

describe('readLegacyJson (synchronous reader)', () => {
  it('returns fallback when key is missing', () => {
    expect(readLegacyJson('no-such', 'FB')).toBe('FB');
  });

  it('returns parsed JSON for legacy plain values', () => {
    window.localStorage.setItem('legacy', JSON.stringify({ x: 1 }));
    expect(readLegacyJson('legacy')).toEqual({ x: 1 });
  });

  it('returns fallback when stored value is corrupt JSON', () => {
    window.localStorage.setItem('corrupt', '{not-valid');
    expect(readLegacyJson('corrupt', 'FB')).toBe('FB');
  });

  it('returns fallback when stored value looks like an envelope (cannot decrypt sync)', () => {
    // Envelope shape: { v: 1, alg: 'AES-256-GCM', iv: '...', data: '...' }
    window.localStorage.setItem('env', JSON.stringify({ v: 1, alg: 'AES-256-GCM', iv: 'AAA', data: 'BBB' }));
    expect(readLegacyJson('env', 'FB')).toBe('FB');
  });
});

describe('AuditLogger', () => {
  it('record() returns a timestamped entry with id + action + details', () => {
    const entry = AuditLogger.record('test_event', { foo: 'bar' });
    expect(entry).toMatchObject({
      action: 'test_event',
      details: { foo: 'bar' },
    });
    expect(typeof entry.id).toBe('string');
    expect(entry.id.length).toBeGreaterThan(8);
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('record() dispatches a pcs-audit-log event with the entry', () => {
    let payload = null;
    const handler = (e) => { payload = e; };
    window.addEventListener('pcs-audit-log', handler);
    AuditLogger.record('open_modal', { which: 'security' });
    window.removeEventListener('pcs-audit-log', handler);
    expect(payload?.detail?.action).toBe('open_modal');
    expect(payload?.detail?.details?.which).toBe('security');
  });

  it('list() returns an array (may be empty)', async () => {
    const out = await AuditLogger.list();
    expect(Array.isArray(out)).toBe(true);
  });

  it('record() persists entries into the audit log over time', async () => {
    AuditLogger.record('e1', {});
    AuditLogger.record('e2', {});
    AuditLogger.record('e3', {});
    // record() is fire-and-forget async; wait for the chain to settle.
    await new Promise(r => setTimeout(r, 10));
    const log = await AuditLogger.list();
    expect(log.length).toBeGreaterThanOrEqual(3);
    // Newest entry first.
    expect(log[0].action).toBe('e3');
  });

  it('record() caps history at 250 entries (oldest dropped)', async () => {
    // Seed 260 entries quickly. Each one re-reads, prepends, and slices
    // to 250 — so the final array is bounded.
    for (let i = 0; i < 260; i++) {
      AuditLogger.record(`evt-${i}`, {});
    }
    // Wait for the async chain to flush.
    await new Promise(r => setTimeout(r, 40));
    const log = await AuditLogger.list();
    expect(log.length).toBeLessThanOrEqual(250);
  });

  it('record() does not throw when details contain circular refs', () => {
    const circular = { name: 'x' };
    circular.self = circular;
    // JSON.stringify(circular) throws. record() must not crash;
    // worst case the entry simply doesn't make it into the log.
    expect(() => AuditLogger.record('weird', circular)).not.toThrow();
  });
});
