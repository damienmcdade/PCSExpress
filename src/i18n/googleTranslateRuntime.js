/*
 * Google Translate Website Translator runtime.
 *
 * Augments the dictionary-based useAppLanguageRuntime by loading the
 * Google Website Translator script (translate.google.com/translate_a/
 * element.js) which walks the DOM and translates any text not already
 * localized by the in-app dictionary. The Google widget UI is hidden;
 * only the translation engine is used.
 *
 * Why this approach:
 *   - No Google Cloud Translation API key / billing required
 *   - Coverage across every UI string regardless of where it lives
 *     (inline JSX, dynamic content, third-party component text)
 *   - Plays well with the existing runtime — dictionary strings are
 *     translated first, then Google fills in the gaps
 *
 * Privacy / DoD considerations:
 *   - The widget sends page text to Google's translation servers.
 *     Only happens when the user explicitly selects a non-English
 *     preferred language during onboarding.
 *   - The widget is opt-in and never activates for users who keep the
 *     default 'en' selection.
 *   - The app never sends PII to Google — onboarding profile data
 *     (name, paygrade, installation, etc.) is stored in localStorage
 *     only; Google translates only what is rendered to the DOM and
 *     even then only when the user has chosen translation.
 *
 * Server CSP extensions (server/index.js) admit these origins so the
 * widget can load:
 *   script-src    translate.google.com translate.googleapis.com
 *                 www.gstatic.com www.google.com
 *   connect-src   translate.googleapis.com translate-pa.googleapis.com
 *   img-src       www.gstatic.com translate.google.com
 *   style-src     fonts.googleapis.com
 *   font-src      fonts.gstatic.com
 *   frame-src     www.google.com translate.google.com
 */

const GOOGLE_SUPPORTED_LANGS = new Set([
  'es', 'de', 'fr', 'ko', 'ja', 'tl', 'ar', 'zh', 'it', 'pt', 'vi',
]);

const WIDGET_HIDE_CSS = `
  /* Hide every visible surface of the Google Website Translator
     widget while keeping its translation engine running underneath. */
  body { top: 0 !important; }
  .goog-te-banner-frame.skiptranslate,
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
`;

let widgetInitialized = false;
let activeLang = null;

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

function installInitCallback(targetLang) {
  // The Google Translate element script invokes window.googleTranslateElementInit
  // when it finishes loading.
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
      // Once the element is mounted, programmatically select the
      // user's preferred language by setting the hidden select value
      // and firing a change event.
      setTimeout(() => triggerLanguageSelect(targetLang), 350);
    } catch (err) {
      console.warn('[google-translate] init failed', err);
    }
  };
}

function triggerLanguageSelect(targetLang) {
  if (!targetLang || targetLang === 'en') return;
  const select = document.querySelector('select.goog-te-combo');
  if (!select) {
    // Widget hasn't mounted yet — retry once.
    setTimeout(() => triggerLanguageSelect(targetLang), 500);
    return;
  }
  select.value = targetLang;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function loadGoogleTranslateScript() {
  if (document.getElementById('pcs-gtranslate-script')) return;
  const script = document.createElement('script');
  script.id = 'pcs-gtranslate-script';
  script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.defer = true;
  script.crossOrigin = 'anonymous';
  document.body.appendChild(script);
}

function clearGoogleTranslation() {
  // Resetting to the original language requires the widget. We
  // programmatically trigger a language change back to 'en' which
  // Google interprets as "show original". For users who switch from a
  // non-English language back to English mid-session.
  const select = document.querySelector('select.goog-te-combo');
  if (select) {
    select.value = '';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

/**
 * Apply the Google Website Translator to the entire page, targeting
 * `lang`. Safe to call repeatedly — the script is loaded once and the
 * widget is re-pointed when the language changes.
 *
 * @param {string} lang  ISO 639-1 code from the onboarding language
 *                        picker. 'en' or unsupported codes are no-ops.
 */
export function applyGoogleTranslateLanguage(lang) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!lang || lang === 'en' || !GOOGLE_SUPPORTED_LANGS.has(lang)) {
    if (widgetInitialized && activeLang && activeLang !== lang) {
      clearGoogleTranslation();
      activeLang = null;
    }
    return;
  }
  if (activeLang === lang && widgetInitialized) return;
  activeLang = lang;

  ensureHideStyle();
  ensureHostElement();
  installInitCallback(lang);

  if (widgetInitialized) {
    // Widget already loaded — just re-target.
    triggerLanguageSelect(lang);
    return;
  }
  widgetInitialized = true;
  loadGoogleTranslateScript();
}

/**
 * Tear down the Google Translate widget and revert to the original
 * untranslated DOM. Used when a user resets their profile.
 */
export function resetGoogleTranslate() {
  clearGoogleTranslation();
  activeLang = null;
}
