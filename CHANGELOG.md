# Changelog

All notable changes to PCS Express. Dates are the release date. The
`package.json` version is the source of truth; native `versionName` (iOS
`MARKETING_VERSION`, Android `versionName`) should track the same number,
while native build numbers (`CFBundleVersion` / `versionCode`) increment per
store submission.

## [1.1.8] — 2026-05-31

### Performance — Tier 0 (interaction latency / INP)
Measured prod under 4× CPU throttle showed TBT ≈484ms with a 365ms startup
long task; the dominant felt sluggishness was interaction lag from the
7,939-line `App.jsx` (50 `useState`, 0 memoization) re-rendering on every
keystroke/toggle.
- **SchoolsTab: killed the O(n²) per-render work.** `enrichedLive` called
  `fuzzyCuratedRating` (a linear `schools.find`) per live school — ~7,200 string
  searches on *every* render (incl. each keystroke). Hoisted the pure helpers
  (`gradeForAge`, `gradeMatchesAge`, `fuzzyCuratedRating`) to module scope and
  wrapped `schools`, `agesFromProfile`, `enrichedLive`, `liveK12`, `liveDaycare`,
  and `filteredSchools` in `useMemo` with correct deps.
- **ChecklistTab: memoized `getTailoredChecklist`** so toggling a checkbox no
  longer re-tailors the entire branch checklist.
- **DutyStationDirectory: `useDeferredValue`** on the installation search so the
  input stays responsive while the up-to-100-item list re-filters at low priority.
- Memoized lazy-data reads include a `HEAVY.*` dep so they correctly refresh when
  the lazy `app-data` chunk loads (the store is subscribed only at the App level).

Note: broad `React.memo` tab-wrapping was intentionally **not** done — `HEAVY`
data is subscribed only at the App level, so memoizing tabs with stable props
would make them skip the data-load re-render (stale UI). That needs
`useHeavyData()` moved into consumers first (a Tier 1 item).

## [1.1.7] — 2026-05-31

### Added — push follow-ups
- **Durable subscription store (Railway Postgres).** New `server/lib/pushStore.js`
  with two interchangeable backends behind one async interface: Postgres (when
  `DATABASE_URL` is set — survives deploys, works across replicas) and an
  in-memory Map (the no-DB default *and* the automatic fallback if Postgres
  init fails, so push never hard-breaks on a DB hiccup). Self-caps at 10k,
  prunes 404/410 (gone) subscriptions, upserts on re-subscribe. The
  `push-subscribe`/`push-unsubscribe`/dispatch paths are now async over the
  store. Boot logs `[push-store] backend=postgres|memory`. Adds `pg` dependency;
  8 new unit tests for the memory backend (Postgres backend verified against the
  live Railway DB).
- **Push-reminders UI toggle.** The header-bell notifications dropdown now opens
  even with no pending alerts and includes a **Push reminders** Enable/Disable
  toggle (`src/App.jsx`) wired to `enablePushNotifications()` /
  `disablePushNotifications()`. Auto-hides when the browser can't do push or the
  server has no VAPID key.
- **Scheduled + on-demand broadcast.** `.github/workflows/push-broadcast.yml`
  calls `/api/push-dispatch` weekly (Mondays 15:00 UTC) and via manual
  `workflow_dispatch` (title/body/tab inputs). Inputs flow through env vars (no
  shell injection) and JSON is built with `jq`. Uses the `PUSH_DISPATCH_KEY`
  repo secret.

### Ops (not code)
- Provisioned **Railway Postgres** and wired `DATABASE_URL` into the PCSExpress
  service (reference var). Set the `PUSH_DISPATCH_KEY` **GitHub Actions secret**
  (same value as the Railway service) so the broadcast workflow is authorized.

## [1.1.6] — 2026-05-31

### Added
- **Web push sender wired end to end.** The client (`src/pushNotifications.js`)
  and service worker (`public/pcs-sw.js`) were already complete; this adds the
  missing server dispatcher. `web-push` is now a dependency, `setVapidDetails`
  is configured at boot (guarded — a half-configured deploy stays in
  subscribe-only mode instead of crashing), and a new authenticated
  `POST /api/push-dispatch` broadcasts a `{ title, body, tab, tag }`
  notification to every stored subscription.
  - **Auth:** requires the `PUSH_DISPATCH_KEY` shared secret via
    `Authorization: Bearer …` or `X-Push-Dispatch-Key` (header, not body, so it
    never lands in body logs), compared in constant time (`secretsMatch`,
    SHA-256 + `timingSafeEqual`). No key configured ⇒ `503` (a fresh deploy
    can't be made to spam users); wrong key ⇒ `403`. Dedicated per-IP rate
    limit (10/min). Exempted from the Origin-on-write CSRF guard since the
    Bearer secret is the stronger guarantee and machine callers send no Origin.
  - **Payload safety:** `buildPushPayload` strips control chars, collapses
    whitespace, length-caps title/body, and slug-restricts `tab` so it can't
    inject path/query/scheme into the `/?go=<tab>` deep link.
  - **Self-healing store:** subscriptions that return `404`/`410` (gone) are
    pruned from the in-memory map; the response reports `sent`/`failed`/`pruned`.
  - 10 new unit tests cover `buildPushPayload` + `secretsMatch`. Docs refreshed
    (`docs/PUSH_SETUP.md`, `.env.example`).

### Ops (not code)
- **`PUSH_DISPATCH_KEY` provisioned** on Railway (alongside the VAPID keypair),
  so `/api/push-dispatch` is live and authorized. Retrieve the value from the
  Railway service Variables to send a broadcast.

## [1.1.5] — 2026-05-31

### Fixed — from end-to-end audit
- **Self-hosted web fonts (Inter + Space Grotesk).** The app loaded its font
  stylesheet from `fonts.googleapis.com`, which intermittently returned
  `503`/`ERR_ABORTED` on production, dropping visitors to the system-font
  fallback. The font CSS and its variable `woff2` files are now served
  same-origin from `/public/fonts`, removing the third-party dependency,
  eliminating the per-visit Google request (consistent with the "data stays on
  device" posture), and adding immutable long-cache headers for the hashed
  `woff2` files. The Google Translate widget's own font hosts remain allowed in
  CSP since that widget still loads them on the non-English opt-in path.
- **Housing-listings fallback no longer logged as an error.** When the optional
  RapidAPI rentals lookup exceeds its 8s wall-clock budget (or aborts), the
  graceful degradation to synthetic search-portal cards was logged via
  `console.error`, polluting error-level logs/alerting for an expected path. It
  now logs at `warn`; genuine upstream failures (DNS/TLS/malformed JSON) stay at
  `error`.

### Ops (not code)
- **Web push VAPID keypair provisioned.** `VAPID_PUBLIC_KEY` /
  `VAPID_PRIVATE_KEY` are now set on the Railway service, so `/api/push-config`
  serves a real key and clients can subscribe (previously returned `null`).

## [1.1.1] — 2026-05-31

### Fixed — from end-to-end audit
- **Per-route request body-size limits are now actually enforced.** A global
  `express.json({limit:'1mb'})` ran before every per-route parser and set
  `req._body`, silently short-circuiting the smaller 4kb/8kb/64kb caps — so the
  AI cost-abuse defense was inert and every endpoint accepted 1 MB. The global
  parser was removed and parsers attached per route; oversized bodies now return
  **413** and malformed JSON returns **400** (previously a misleading 500).
- **PPM estimator labeling contradiction resolved.** The UI prose claimed "95
  percent of GCC" while the code, metric card, and tests used 100% — the screen
  showed both numbers. Prose corrected to 100% (standing Best-Value rate; the
  temporary 130% rate expired 30 Sep 2025).
- **Removed the PPM "years of service" GCC multiplier.** It had no JTR basis,
  inflated the incentive up to ~4% at 20 YOS, and broke the documented ±0.3%
  calibration. The vestigial Years-of-Service input was removed from the UI.
- **Guam OHA note** — ⚠️ this 1.1.1 edit was **incorrect** and is reverted in
  1.1.2: Guam is paid **OHA, not BAH** (only the 50 states get BAH). See 1.1.2.
- **Compliance attestation accuracy.** The NIST 800-171 line (and two module
  comments) claimed `grep 'type="file"' → 0 hits` / "no upload anywhere"; this
  was false given the local-only JSON restore picker. Text now accurately
  describes the client-side-only, never-transmitted restore.

### Changed — hardening
- `.gitignore` now covers `*.jks`/`*.keystore`/`*.p8`/`*.pem`/`key.properties`
  so a signing keystore can't be committed by accident.
- `release.yml` passes `VERCEL_TOKEN` via step `env:` instead of the
  `--token=` CLI flag (keeps it out of the process argument list).

## [1.1.4] — 2026-05-31

### Fixed — from final production e2e audit
- **Backup-restore now rejects oversized files before reading them.**
  `importPersonalDataFromFile` read `file.text()` + `JSON.parse` with no size
  gate — a mistaken or hostile multi-hundred-MB file could OOM the tab. Now caps
  at 5 MB (a real export is a few KB) before any read.
- **Added a per-instance global hourly cap to the Vercel `jtr-assistant`
  function** (the primary web AI endpoint). It previously had only a per-IP
  in-memory limiter and no global cost ceiling. The cap is incremented only just
  before the upstream Anthropic call, so blocked/invalid requests don't burn it.
  NOTE: this is a per-instance backstop, not fleet-wide — the durable fix is a
  Vercel KV/Upstash counter, and the real cost controls remain an **Anthropic
  account spend limit + a Vercel WAF rate-limit** on `/api/jtr-assistant`
  (operator actions; see DEPLOYMENT runbook).

## [1.1.3] — 2026-05-31

### Changed — routing clarity (resolves audit H1)
- **Made the `/api/jtr-assistant` routing explicit.** `vercel.json` now excludes
  `jtr-assistant` from the Railway proxy rewrite via a negative lookahead
  (`/api/((?!jtr-assistant).*)`), so the Vercel serverless function
  (`api/jtr-assistant.js`) owns that path unambiguously instead of relying on
  filesystem-precedence-over-rewrites alone. All other `/api/*` still proxy to
  Railway. Refreshed the function's stale header (Railway is now reliably
  auto-deployed). Behaviour is unchanged; the routing is just robust and
  self-documenting now.
- Confirmed Railway runs a **single instance** (`railway.json` sets no
  `numReplicas`), so the in-memory per-IP + global AI rate caps are accurate as
  shipped. A durable shared store (Vercel KV / Upstash) is only required if
  Railway is scaled to multiple replicas — documented as deferred.

## [1.1.2] — 2026-05-31

### Fixed
- **Corrected the Guam housing-allowance note (reverts a 1.1.1 error).** A 1.1.1
  change wrongly relabeled Guam as "paid BAH, not OHA." The opposite is true:
  Guam is a non-foreign OCONUS U.S. territory and uses **OHA** — only the 50
  states (incl. Alaska/Hawaii) get BAH. The OHA region is correctly categorized;
  the note now states the rule and links the DTMO OHA Rate Lookup. Verified
  2026-05-31 against official .mil benefit sources (myAirForceBenefits /
  myArmyBenefits restating the JTR rule). `docs/REFERENCE_VALUES_TODO.md`
  corrected to match.

### Changed — CI hygiene
- Bumped GitHub Actions off the deprecated Node-20 runtime:
  `actions/checkout` → v5, `actions/setup-node` → v5, `actions/setup-java` → v5,
  `github/codeql-action` → v4 (all SHA-pinned) across `deploy.yml`,
  `release.yml`, `codeql.yml`.
- Dropped the now-meaningless "N YOS" labels from the PPM reference test/doc
  scenarios (years-of-service no longer affects the GCC after the 1.1.1 fix).

## [1.1.0] — 2026-05-31

### Fixed — data accuracy (high impact)
- **BAH rate table reconciled to the authoritative DTMO 2026 source.** The
  hand-entered table was wrong for 106 of 109 MHAs (off by hundreds of
  dollars/month in both directions). All 107 mappable MHAs now hold official
  2026 rates, verified against the published tables; the 2 with no published
  CONUS row stay flagged as estimates. See `docs/BAH_RECONCILIATION.md`.
- **PPM calculator** incentive rate corrected to 100% of GCC, fuel pinned to
  the EIA national gasoline average, and the GCC model calibrated to a published
  reference. **OHA/LQA** honestly relabeled as planning estimates (no
  authoritative bulk source exists).

### Added — production readiness
- Global AI request ceiling (cost backstop), a cached `/api/geocode` proxy
  (OSM-policy-friendly), terminal Express error middleware, `uncaughtException`
  handling, graceful-shutdown timeout, a deep `/api/health?deep=1`, and interim
  client-error capture (`/api/client-error` + global handlers).
- CI now runs lint + the full test suite before build.

### Changed — compliance & trust
- AdSense now loads web-only and consent-gated (off by default; removed from
  native apps) to comply with Google policy + EU/ePrivacy.
- Synthetic community reviews relabeled as editorial summaries (no false
  "verified" badge); school star ratings disclaimed as editorial estimates.
- Privacy notice reconciled with the actual data flows and CSP.
- Accessibility: low-contrast text raised to 4.5:1, form controls given
  accessible names.

### Fixed — correctness & reliability (earlier in this series)
- Multiple encrypted-store data-loss races, a checklist-tab crash, a
  pull-to-refresh stale-closure, i18n rendering Spanish for African locales,
  a service-worker cache-poisoning bug, and assorted dead-link/guard fixes.
- CORS now defaults to the production web origins so the API gate can't
  silently break the web app.

## [1.0.x] — earlier
- Initial public release: PCS planning workflows, calculators (BAH/OHA/LQA/PPM),
  AI assistant, duty-station intelligence, web + iOS + Android (Capacitor).
