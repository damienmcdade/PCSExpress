/*
 * Apple App Store Review Guideline 5.1.2(i) — third-party AI data sharing.
 *
 * Updated 2025-11-13 and effective immediately: before the FIRST transmission
 * of a user's personal data to a third-party AI, an app must clearly disclose
 * the sharing, NAME the provider, explain what the provider does with the data,
 * and obtain EXPLICIT consent — revocable afterwards.
 *
 * PCS Express sends user-typed text to Anthropic (Claude), with an automatic
 * failover to OpenAI when Anthropic cannot serve at all. Both the Translation
 * tab (/api/ai) and the AI Assistant (/api/jtr-assistant) do this.
 *
 * WHY THE GATE IS ENFORCED ON THE SERVER, NOT JUST IN THE UI: a client-only
 * check still lets a stale tab, a replayed request, or a direct POST reach the
 * provider. The server refuses to transmit unless consent is recorded.
 *
 * WHY THIS MODULE IS SHARED: PCS Express has FOUR handlers that call an AI
 * provider — api/ai.js and api/jtr-assistant.js (Vercel, which serve the web
 * app) and the /api/ai + /api/jtr-assistant routes in server/index.js
 * (Railway). src/config/apiConfig.js routes every Capacitor (iOS/Android) API
 * call straight to the Railway origin, bypassing Vercel entirely, so guarding
 * only the Vercel pair would leave the SHIPPED App Store app ungated. All four
 * import this file, and so does the React client, so the header name and
 * version cannot drift between them.
 *
 * All four surfaces are ESM (package.json has "type": "module"; the Vercel
 * functions use `export default handler`, server/index.js uses `import`), so a
 * single ESM module serves every caller.
 */

/**
 * Request header the client sends once consent is recorded.
 *
 * A cookie alone is NOT sufficient here. The Capacitor WebView origin is
 * capacitor://localhost (iOS) / https://localhost (Android) while the API
 * lives on https://pcsexpress-production.up.railway.app — a cross-origin
 * request, and the Express CORS policy sets `credentials: false`, so the
 * browser never attaches cookies to it. The header is therefore the primary
 * carrier on native; the cookie is a same-origin fallback for the web app.
 *
 * The header must also be listed in the Express CORS `allowedHeaders` or the
 * preflight fails and EVERY native AI call breaks — see server/index.js.
 */
export const AI_CONSENT_HEADER = 'x-ai-consent'

/** Same-origin (web) fallback carrier for the same signal. */
export const AI_CONSENT_COOKIE = 'pcs_ai_consent'

/**
 * Disclosure version the client records and sends. Bump ONLY when the
 * disclosure text materially changes; the client re-prompts when the stored
 * version is older than this one.
 */
export const AI_CONSENT_VERSION = '1'

/**
 * The providers named in the disclosure. Keep in exact sync with the consent
 * sheet copy in src/components/AIConsentSheet.jsx.
 *
 * Anthropic is primary. OpenAI is reached ONLY through the failover branch in
 * all four handlers (Anthropic 5xx/529, or a 400 whose body mentions
 * credit/billing/balance/quota), and only when OPENAI_API_KEY is configured.
 */
export const AI_PROVIDERS = ['Anthropic (Claude)', 'OpenAI']

/** Message returned with the 451 so a non-JS caller still sees the reason. */
export const AI_CONSENT_REQUIRED_MESSAGE =
  'Before PCS Express can use its AI assistants, you need to agree to your question being sent to Anthropic (Claude), or to OpenAI when Anthropic is unavailable. Open the AI Assistant or the Translation tab and tap Agree, or manage this under Security & data handling.'

/**
 * Read the recorded consent value out of a request.
 *
 * Deliberately LENIENT about the version: any recorded numeric version counts
 * as consent. A shipped iOS/Android binary carries whatever AI_CONSENT_VERSION
 * it was built with, and the server deploys independently of the App Store — a
 * strict equality check would 451 every already-installed app the moment the
 * version is bumped, with no way for that binary to record the newer value.
 * Re-prompting on a materially changed disclosure is the CLIENT's job (it
 * compares its own stored version against its own constant) and ships with the
 * new binary. What matters here is that consent was explicitly given.
 */
export function hasAiConsent(req) {
  const headers = req?.headers || {}
  const headerValue = headers[AI_CONSENT_HEADER]
  const fromHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue
  if (isConsentValue(fromHeader)) return true

  const cookieHeader = headers.cookie
  if (typeof cookieHeader === 'string' && cookieHeader) {
    const match = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${AI_CONSENT_COOKIE}=([^;]*)`),
    )
    if (match && isConsentValue(decodeURIComponent(match[1] || ''))) return true
  }
  return false
}

function isConsentValue(value) {
  return typeof value === 'string' && /^[0-9]{1,4}$/.test(value.trim())
}

/**
 * Body for the refusal. 451 (Unavailable For Legal Reasons) with a
 * machine-readable `needsAiConsent` marker so the client can raise the consent
 * sheet and retry, rather than showing a generic failure. `providers` lets the
 * client name the same providers the server would actually have contacted.
 */
export function aiConsentRequiredBody() {
  return {
    error: AI_CONSENT_REQUIRED_MESSAGE,
    needsAiConsent: true,
    providers: AI_PROVIDERS,
  }
}

/** HTTP status for the refusal. Exported so all four handlers agree. */
export const AI_CONSENT_STATUS = 451

/**
 * Native shell origins. The Capacitor WebView runs on these, never on the
 * app's public domain.
 */
const NATIVE_ORIGINS = new Set(['capacitor://localhost', 'https://localhost'])

/**
 * Is this a SHIPPED binary that predates the consent client?
 *
 * PCS Express bundles its `dist` into the binary (no `server.url`), so the
 * JavaScript inside App Store build 1.5.0 (13) is frozen at 2026-07-28 and has
 * no knowledge of the consent header — while the server it talks to deploys
 * independently and now requires one.
 *
 * The consequence of not special-casing this: every existing user's Translation
 * and AI Assistant returns a bare failure, and because the consent sheet also
 * lives in the un-shippable bundle, there is NO action the user can take to
 * grant consent. An unbreakable loop that no server deploy can clear.
 *
 * This does NOT weaken the guideline. A legacy client is still refused — no
 * text is transmitted to any provider. It only changes the SHAPE of the refusal
 * so the old UI can render an explanation ("update the app") instead of
 * "API error", because 5.1.2(i) is about not transmitting, not about which
 * status code the refusal carries.
 */
export function isLegacyNativeClient(req) {
  if (hasAiConsent(req)) return false
  const origin = req?.headers?.origin
  return typeof origin === 'string' && NATIVE_ORIGINS.has(origin)
}

/** What to tell a user whose installed build cannot ask for consent. */
export const LEGACY_CLIENT_MESSAGE =
  "Update PCS Express from the App Store to use the AI assistants. This version can't ask your permission to send your question to our AI providers, so it hasn't been sent. Everything else in the app works as normal."
