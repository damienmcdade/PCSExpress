/*
 * Service-worker bootstrap.
 *
 * Three responsibilities in priority order:
 *
 *   1. Kill switch. If localStorage `pcs_sw_disabled === "1"`,
 *      unregister every SW for this origin and bail. Lets us turn the
 *      whole PWA layer off without a deploy if something misbehaves.
 *
 *   2. Legacy cleanup. Any SW whose script URL does NOT end in
 *      /pcs-sw.js (i.e. the old SW that caused the stale-bundle
 *      incident, or the self-destructing kill-switch SWs we shipped
 *      at /sw.js, /service-worker.js, /registerSW.js) gets
 *      unregistered + caches cleared + page reloaded once via a
 *      sessionStorage flag so the reload picks up real network
 *      assets without an SW intercepting.
 *
 *   3. PWA registration. Once any legacy SW is gone (or there
 *      never was one), register /pcs-sw.js. It implements
 *      network-first navigation + cache-first assets so a stale
 *      bundle can never wedge the app again.
 */
(function () {
  if (!('serviceWorker' in navigator)) return;

  var KILL_FLAG_KEY     = 'pcs_sw_disabled';
  var RELOAD_FLAG_KEY   = 'pcs_sw_killswitch_reloaded';
  var NEW_SW_PATH       = '/pcs-sw.js';

  function killAll() {
    return navigator.serviceWorker.getRegistrations().then(function (regs) {
      return Promise.all(regs.map(function (r) { return r.unregister(); }));
    }).then(function () {
      if (window.caches && caches.keys) {
        return caches.keys().then(function (keys) {
          return Promise.all(keys.map(function (k) { return caches.delete(k); }));
        });
      }
    }).catch(function () {});
  }

  var killSwitchOn = false;
  try { killSwitchOn = localStorage.getItem(KILL_FLAG_KEY) === '1'; } catch (e) {}

  if (killSwitchOn) {
    killAll();
    return;
  }

  navigator.serviceWorker.getRegistrations().then(function (regs) {
    var legacy = regs.filter(function (r) {
      var url = r.active && r.active.scriptURL;
      return url && !url.endsWith(NEW_SW_PATH);
    });
    var hasNew = regs.some(function (r) {
      var url = r.active && r.active.scriptURL;
      return url && url.endsWith(NEW_SW_PATH);
    });

    if (legacy.length > 0) {
      Promise.all(legacy.map(function (r) { return r.unregister(); }))
        .then(function () {
          if (window.caches && caches.keys) {
            return caches.keys().then(function (keys) {
              return Promise.all(keys.map(function (k) { return caches.delete(k); }));
            });
          }
        })
        .then(function () {
          if (!sessionStorage.getItem(RELOAD_FLAG_KEY)) {
            sessionStorage.setItem(RELOAD_FLAG_KEY, '1');
            window.location.reload();
          }
        })
        .catch(function () {});
      return;
    }

    if (!hasNew) {
      navigator.serviceWorker.register(NEW_SW_PATH, { scope: '/' }).catch(function () {});
    }
  }).catch(function () {});
})();
