/*
 * Web Push subscription store.
 *
 * Two interchangeable backends behind one async interface:
 *   - PgBackend     — durable Postgres table (Railway Postgres). Survives
 *                     deploys and works across replicas.
 *   - MemoryBackend — process-local Map. Used when DATABASE_URL is unset,
 *                     or as an automatic fallback if Postgres init fails so
 *                     push never hard-breaks on a DB hiccup.
 *
 * The backend is chosen ONCE at construction; `ready` resolves to it and
 * every method awaits that. Callers don't know or care which backend is
 * live. Stored shape matches what web-push needs verbatim:
 *   { endpoint, keys: { p256dh, auth } }
 *
 * No PII is stored — only the browser-issued endpoint URL + the p256dh/auth
 * crypto keys. Same metadata-only contract as the in-memory baseline.
 */
import pg from 'pg';

// Cap retained subscriptions. On Postgres this is a soft trim (oldest
// beyond the cap are dropped on each upsert); in memory it evicts the
// oldest insertion. 10k is well beyond expected volume and just bounds
// unbounded growth from spam that slipped past the subscribe rate limit.
const SUB_MAX = 10_000;

// Railway's private network (postgres.railway.internal) and localhost
// don't use TLS; any other host (e.g. the public proxy URL) does. pg
// throws if you offer SSL to a server that doesn't support it, so detect.
function needsSsl(url) {
  try {
    const h = new URL(url).hostname;
    return !(h.endsWith('.railway.internal') || h === 'localhost' || h === '127.0.0.1');
  } catch { return false; }
}

// TLS config for the pg pool. Internal/local hosts use no TLS. For external
// (public-proxy) hosts, verify the server certificate when the operator
// provides a CA bundle (PGSSL_CA / DATABASE_CA_CERT) or opts in via
// PGSSL_REJECT_UNAUTHORIZED=true — preventing a MITM on the DB connection.
// Defaults to the prior non-verifying behavior so deployments without a
// configured CA keep working (the Railway proxy presents a cert whose chain
// isn't in the system store), but full verification is now one env var away.
function pgSslConfig(url) {
  if (!needsSsl(url)) return false;
  const ca = process.env.PGSSL_CA || process.env.DATABASE_CA_CERT || '';
  if (ca) return { rejectUnauthorized: true, ca };
  if (String(process.env.PGSSL_REJECT_UNAUTHORIZED).toLowerCase() === 'true') {
    return { rejectUnauthorized: true };
  }
  return { rejectUnauthorized: false };
}

class MemoryBackend {
  constructor() { this.kind = 'memory'; this.map = new Map(); }
  async upsert(sub) {
    // Map iteration is insertion order, so .keys().next() is the oldest.
    if (!this.map.has(sub.endpoint) && this.map.size >= SUB_MAX) {
      const oldest = this.map.keys().next().value;
      if (oldest) this.map.delete(oldest);
    }
    this.map.set(sub.endpoint, { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } });
  }
  async remove(endpoint) { this.map.delete(endpoint); }
  async get(endpoint) { return this.map.get(endpoint) || null; }
  async all() { return Array.from(this.map.values()); }
  async size() { return this.map.size; }
  async close() {}
}

class PgBackend {
  constructor(pool) { this.kind = 'postgres'; this.pool = pool; }

  static async create(url) {
    const pool = new pg.Pool({
      connectionString: url,
      ssl: pgSslConfig(url),
      max: 4,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    // A pool 'error' on an idle client (e.g. Postgres restarts) would
    // otherwise crash the process via an unhandled 'error' event.
    pool.on('error', err => console.error(`[push-store] idle pg client error: ${err.message}`));
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        endpoint   TEXT PRIMARY KEY,
        p256dh     TEXT NOT NULL,
        auth       TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
    return new PgBackend(pool);
  }

  async upsert(sub) {
    await this.pool.query(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth) VALUES ($1, $2, $3)
       ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
      [sub.endpoint, sub.keys.p256dh, sub.keys.auth]);
    // Soft cap: drop anything older than the newest SUB_MAX rows.
    await this.pool.query(
      `DELETE FROM push_subscriptions WHERE endpoint IN (
         SELECT endpoint FROM push_subscriptions ORDER BY created_at DESC OFFSET $1)`,
      [SUB_MAX]);
  }
  async remove(endpoint) { await this.pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]); }
  async get(endpoint) {
    const r = await this.pool.query('SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    const row = r.rows[0];
    return row ? { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } } : null;
  }
  async all() {
    const r = await this.pool.query('SELECT endpoint, p256dh, auth FROM push_subscriptions');
    return r.rows.map(row => ({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }));
  }
  async size() { const r = await this.pool.query('SELECT COUNT(*)::int AS n FROM push_subscriptions'); return r.rows[0].n; }
  async close() { await this.pool.end(); }
}

export function createPushStore({ databaseUrl } = {}) {
  const ready = (async () => {
    if (databaseUrl) {
      try {
        const be = await PgBackend.create(databaseUrl);
        console.log('[push-store] backend=postgres (durable)');
        return be;
      } catch (err) {
        console.error(`[push-store] Postgres init failed (${err.message}); falling back to in-memory`);
      }
    } else {
      console.log('[push-store] backend=memory (no DATABASE_URL set)');
    }
    return new MemoryBackend();
  })();

  const op = name => async (...args) => (await ready)[name](...args);
  return {
    ready,
    backendKind: async () => (await ready).kind,
    upsert: op('upsert'),
    remove: op('remove'),
    get: op('get'),
    all: op('all'),
    size: op('size'),
    close: op('close'),
  };
}
