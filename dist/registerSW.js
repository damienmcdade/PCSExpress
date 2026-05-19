// Kill-switch service worker. Replaces a stale SW left behind by an
// earlier deploy of this site. On install it activates immediately, on
// activate it deletes every Cache Storage entry, unregisters itself,
// and reloads every controlled window so the freshly fetched bundle
// runs without any SW interception. Fetch handler is a no-op
// (pass-through to the network) so nothing else gets cached while this
// SW is briefly active during eviction.
self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    try {
      if (self.caches && caches.keys) {
        var keys = await caches.keys();
        await Promise.all(keys.map(function (k) { return caches.delete(k); }));
      }
      if (self.registration && self.registration.unregister) {
        await self.registration.unregister();
      }
      var clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(function (c) {
        try { c.navigate(c.url); } catch (e) {}
      });
    } catch (e) {}
  })());
});

self.addEventListener('fetch', function () {});
