/*
 * A previous deploy of this site registered a service worker that kept
 * intercepting requests and serving a stale, broken bundle to returning
 * visitors — even after fresh builds shipped. Nothing in the current
 * codebase registers a service worker, so once we evict it the browser
 * will not bring it back. This script runs synchronously on every page
 * load, unregisters every service worker for the origin, clears Cache
 * Storage, and reloads exactly once so the freshly fetched assets are
 * served by the network. On a clean browser this is a no-op.
 */
(function () {
  try {
    if (!('serviceWorker' in navigator)) return;
    var RELOAD_FLAG = 'pcs_sw_killswitch_reloaded';

    navigator.serviceWorker.getRegistrations().then(function (regs) {
      if (!regs || regs.length === 0) return;
      Promise.all(regs.map(function (r) { return r.unregister(); }))
        .then(function () {
          if (window.caches && caches.keys) {
            return caches.keys().then(function (keys) {
              return Promise.all(keys.map(function (k) { return caches.delete(k); }));
            });
          }
        })
        .then(function () {
          if (!sessionStorage.getItem(RELOAD_FLAG)) {
            sessionStorage.setItem(RELOAD_FLAG, '1');
            window.location.reload();
          }
        })
        .catch(function () {});
    }).catch(function () {});
  } catch (e) {}
})();
