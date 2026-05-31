/*
 * Compliant AdSense loader. Served from same-origin so the strict CSP
 * (script-src 'self' + googlesyndication) allows it. AdSense is loaded ONLY
 * when BOTH conditions hold:
 *
 *   1) NOT running inside the native Capacitor app. Google AdSense is not
 *      permitted in mobile apps (it gets the account banned and fails store
 *      review); use AdMob for in-app ads.
 *   2) The user has granted ads/cookie consent. There is no Consent
 *      Management Platform (CMP) integrated yet, so this defaults to OFF —
 *      which keeps us compliant with Google's EU User Consent Policy and
 *      ePrivacy (loading AdSense sets Google cookies that require prior
 *      consent in the EEA/UK).
 *
 * To turn ads on: integrate a Google-certified CMP (TCF v2.2), and once the
 * user consents set localStorage 'pcs_ads_consent' = 'granted'. Until then
 * the site serves NO ads (matching the privacy notice).
 */
(function () {
  try {
    var Cap = window.Capacitor;
    var isNative = !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform());
    if (isNative || window.location.protocol === 'capacitor:') return;

    var consent = false;
    try { consent = localStorage.getItem('pcs_ads_consent') === 'granted'; } catch (e) { /* storage blocked */ }
    if (!consent) return;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8731629548430880';
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  } catch (e) { /* never let ad init break the app */ }
})();
