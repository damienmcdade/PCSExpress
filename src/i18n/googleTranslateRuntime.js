/*
 * Google Translate Website Translator runtime — cookie-first variant.
 *
 * Why cookie-first:
 *   Google's Website Translator (translate.google.com/translate_a/
 *   element.js) reads a `googtrans=/auto/<targetLang>` cookie at boot.
 *   When the cookie is set BEFORE the script loads, the widget
 *   auto-translates the page during its first DOM walk — no need to
 *   wait for the hidden <select> to mount, no race with React renders.
 *   The previous implementation tried to programmatically change the
 *   select value after mount; on slow mounts (mobile, throttled CPU)
 *   the change event fired before the select was attached, leaving
 *   the page un-translated and the user seeing English.
 *
 * Privacy / DoD considerations:
 *   - The widget sends rendered DOM text to Google's translation
 *     servers only when the user has selected a non-English language.
 *   - Onboarding profile data never leaves the device; localStorage
 *     keys (pcs_*) stay on the client.
 *   - The googtrans cookie is set on the current host only (no
 *     domain attribute on localhost so the browser scopes it).
 */

const GOOGLE_SUPPORTED_LANGS = new Set([
  // Curated dictionary + Google Translate fallback
  'es', 'de', 'fr', 'ko', 'ja', 'tl', 'ar', 'zh', 'it', 'pt', 'vi',
  // African / additional locales — Google-Translate-only coverage
  'sw', 'ha', 'yo', 'am', 'zu', 'ig', 'so', 'af',
]);

const WIDGET_HIDE_CSS = `
  /* Hide every visible surface of the Google Website Translator
     widget while keeping its translation engine running underneath. */
  body { top: 0 !important; position: static !important; }
  .goog-te-banner-frame.skiptranslate,
  .goog-te-banner-frame,
  iframe.skiptranslate,
  .goog-te-gadget,
  .goog-te-balloon-frame,
  .goog-tooltip,
  .goog-tooltip:hover,
  #goog-gt-tt,
  .goog-text-highlight {
    display: none !important;
    visibility: hidden !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  /* Prevent the highlight ring Google injects around translated text. */
  font[style*="background"] {
    background: transparent !important;
    box-shadow: none !important;
  }
  /* The body sometimes gets shifted by inline style top:40px when the
     widget injects its banner — keep it pinned to the top. */
  body[style*="top"] { top: 0 !important; }
`;

let widgetInitialized = false;
let activeLang = null;

function setGoogTransCookie(targetLang) {
  // Format: googtrans=/<source>/<target>. Setting /auto/<lang> tells
  // the widget to auto-detect source (we know it's English, but auto
  // is safer for mixed-content pages) and translate to <lang>.
  const value = `/auto/${targetLang}`;
  // Path=/ so every route under the app receives the cookie. We
  // intentionally do NOT set Domain on localhost (browser scoping).
  const isLocalHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(window.location.hostname);
  const domainAttr = isLocalHost ? '' : `domain=${window.location.hostname};`;
  document.cookie = `googtrans=${value}; path=/; ${domainAttr} samesite=lax`;
  // Also set the bare-domain variant for production hosts (e.g.,
  // pcsexpress.app needs both .pcsexpress.app and pcsexpress.app).
  if (!isLocalHost && window.location.hostname.split('.').length >= 2) {
    document.cookie = `googtrans=${value}; path=/; domain=.${window.location.hostname}; samesite=lax`;
  }
}

function clearGoogTransCookie() {
  const expire = 'Thu, 01 Jan 1970 00:00:00 UTC';
  document.cookie = `googtrans=; path=/; expires=${expire};`;
  if (!/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(window.location.hostname)) {
    document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; expires=${expire};`;
    document.cookie = `googtrans=; path=/; domain=.${window.location.hostname}; expires=${expire};`;
  }
}

function ensureHideStyle() {
  if (document.getElementById('pcs-gtranslate-hide')) return;
  const style = document.createElement('style');
  style.id = 'pcs-gtranslate-hide';
  style.textContent = WIDGET_HIDE_CSS;
  document.head.appendChild(style);
}

function ensureHostElement() {
  if (document.getElementById('google_translate_element')) return;
  const host = document.createElement('div');
  host.id = 'google_translate_element';
  host.setAttribute('aria-hidden', 'true');
  host.style.position = 'absolute';
  host.style.left = '-9999px';
  host.style.top = '-9999px';
  host.style.width = '1px';
  host.style.height = '1px';
  host.style.overflow = 'hidden';
  document.body.appendChild(host);
}

function installInitCallback() {
  window.googleTranslateElementInit = function googleTranslateElementInit() {
    if (typeof window.google === 'undefined' || !window.google.translate) return;
    try {
      // eslint-disable-next-line no-new
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: Array.from(GOOGLE_SUPPORTED_LANGS).join(','),
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
          multilanguagePage: true,
        },
        'google_translate_element'
      );
    } catch (err) {
      console.warn('[google-translate] init failed', err);
    }
  };
}

function loadGoogleTranslateScript() {
  if (document.getElementById('pcs-gtranslate-script')) return;
  const script = document.createElement('script');
  script.id = 'pcs-gtranslate-script';
  // Explicit https URL — the protocol-less variant 502s behind some
  // corporate proxies. No crossOrigin attribute — Google does not
  // serve CORS headers for the element.js endpoint and requesting
  // CORS causes the script to be rejected on most browsers.
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  script.onerror = (err) => console.warn('[google-translate] script load failed', err);
  document.head.appendChild(script);
}

function forceWidgetReTranslate(targetLang) {
  // After the script is loaded, if the user changes language at
  // runtime, the cookie won't be re-read automatically. We re-trigger
  // the select element's change event so Google Translate retranslates
  // the page to the new language.
  setTimeout(() => {
    const select = document.querySelector('select.goog-te-combo');
    if (!select) return;
    select.value = targetLang;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, 200);
}

/**
 * Apply the Google Website Translator to the entire page, targeting
 * `lang`. Safe to call repeatedly — the script is loaded once and the
 * widget is re-pointed when the language changes.
 *
 * Cookie-first: sets googtrans=/auto/<lang> before loading the script
 * so the widget picks up the language on its first DOM walk. After the
 * first load, language changes are propagated via the hidden <select>.
 *
 * @param {string} lang  ISO 639-1 code from the onboarding language
 *                        picker. 'en' or unsupported codes are no-ops.
 */
export function applyGoogleTranslateLanguage(lang) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // English / unsupported / null → clear translation
  if (!lang || lang === 'en' || !GOOGLE_SUPPORTED_LANGS.has(lang)) {
    if (widgetInitialized && activeLang) {
      clearGoogTransCookie();
      // The widget caches its target — reload is the only fully
      // reliable way to revert to the source language. Skip when the
      // page has just loaded (activeLang null) so we don't loop.
      window.location.reload();
    }
    activeLang = null;
    return;
  }

  if (activeLang === lang && widgetInitialized) return;

  ensureHideStyle();
  ensureHostElement();

  // Always update the cookie so subsequent navigations / hard reloads
  // pick up the latest target language.
  setGoogTransCookie(lang);

  if (!widgetInitialized) {
    widgetInitialized = true;
    activeLang = lang;

    // First-time opt-in to translation. Server CSP defaults to strict
    // (no 'unsafe-eval') and only relaxes when the googtrans cookie is
    // present on the request. Since the cookie was just set client-
    // side, the CURRENT response was sent under strict CSP — meaning
    // Google's element.js would fail to eval inside this page. We
    // must reload so the next response carries the relaxed CSP. Skip
    // the reload when the cookie was already present on initial load
    // (returning user) — in that case the strict-vs-relaxed switch
    // already happened upstream and the script can load normally.
    if (!hadTranslateCookieAtBoot()) {
      window.location.reload();
      return;
    }

    installInitCallback();
    loadGoogleTranslateScript();
    return;
  }

  // Widget already mounted — change target via the hidden select.
  activeLang = lang;
  forceWidgetReTranslate(lang);
}

// Records the cookie state at module-load time so applyGoogleTranslate
// Language can distinguish "user just picked a non-English language for
// the first time" (needs reload to get relaxed CSP) from "cookie was
// already set on initial request" (CSP already relaxed, no reload).
const _hadTranslateCookieAtBoot = (() => {
  if (typeof document === 'undefined') return false;
  return /(?:^|;\s*)googtrans=\/[^/]+\/(es|de|fr|ko|ja|tl|ar|zh|it|pt|vi|sw|ha|yo|am|zu|ig|so|af)\b/.test(document.cookie || '');
})();
function hadTranslateCookieAtBoot() {
  return _hadTranslateCookieAtBoot;
}

/**
 * Tear down the Google Translate widget and revert to the original
 * untranslated DOM. Used when a user resets their profile.
 */
export function resetGoogleTranslate() {
  clearGoogTransCookie();
  activeLang = null;
  widgetInitialized = false;
}
