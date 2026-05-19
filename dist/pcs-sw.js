/*
 * PCS Express service worker (v1).
 *
 * Strategy is deliberately defensive: we never want to repeat the
 * stale-bundle incident where an old SW served a broken cached
 * index.html and the user couldn't recover.
 *
 *   - /index.html and /  : network-first with cache fallback. Means
 *     a fresh deploy is picked up immediately; cache is only consulted
 *     when offline.
 *   - /assets/*          : cache-first (Vite content-hashes these so a
 *     new build produces new filenames; stale entries just become dead
 *     keys that age out).
 *   - /api/*             : network-only (no caching).
 *   - OSM tiles          : stale-while-revalidate so maps still render
 *     offline once visited.
 *   - everything else    : try network, fall back to cache.
 *
 * Kill-switch contracts:
 *   - localStorage flag `pcs_sw_disabled = "1"` (set from the app
 *     itself via Settings) makes the *next* SW activation a no-op and
 *     unregister-self. The app's registration code also reads this
 *     flag before registering, so flipping it gives a permanent off.
 *   - Bumping CACHE_VERSION below evicts every prior cache on the
 *     next activate.
 */

const CACHE_VERSION = 'pcs-v1';
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const TILE_CACHE  = `${CACHE_VERSION}-tiles`;

const SHELL_URLS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    try { await cache.addAll(SHELL_URLS); } catch (e) { /* best-effort */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !k.startsWith(CACHE_VERSION)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isAsset(url) {
  return url.pathname.startsWith('/assets/');
}
function isApi(url) {
  return url.pathname.startsWith('/api/');
}
function isTile(url) {
  return url.hostname.includes('tile.openstreetmap.org');
}
function isNavigationRequest(req) {
  return req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch { return; }

  // Never intercept API calls. They must always hit network so the
  // app reflects real backend state.
  if (isApi(url)) return;

  // Navigation / HTML requests — network-first, cache fallback.
  if (isNavigationRequest(req) || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith((async () => {
      try {
        const resp = await fetch(req);
        if (resp && resp.ok) {
          const cache = await caches.open(SHELL_CACHE);
          cache.put('/index.html', resp.clone()).catch(() => {});
        }
        return resp;
      } catch {
        const cache = await caches.open(SHELL_CACHE);
        const cached = await cache.match('/index.html');
        if (cached) return cached;
        return new Response('Offline and no cached shell available.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }

  // Versioned, content-hashed assets — cache-first.
  if (isAsset(url) && url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSET_CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const resp = await fetch(req);
        if (resp && resp.ok) cache.put(req, resp.clone()).catch(() => {});
        return resp;
      } catch {
        return new Response('Offline asset unavailable.', { status: 503 });
      }
    })());
    return;
  }

  // OSM map tiles — stale-while-revalidate.
  if (isTile(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(TILE_CACHE);
      const cached = await cache.match(req);
      const networkPromise = fetch(req).then(resp => {
        if (resp && resp.ok) cache.put(req, resp.clone()).catch(() => {});
        return resp;
      }).catch(() => null);
      return cached || (await networkPromise) || new Response('', { status: 504 });
    })());
    return;
  }

  // Everything else (manifest, favicons, etc.) — try network, fall back
  // to whatever shell cache has.
  event.respondWith((async () => {
    try {
      const resp = await fetch(req);
      return resp;
    } catch {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(req);
      return cached || new Response('Offline.', { status: 503 });
    }
  })());
});

// Allow the page to send a `SKIP_WAITING` message to force an update
// without waiting for the next navigation.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
