# Changelog

All notable changes to PCS Express. Dates are the release date. The
`package.json` version is the source of truth; native `versionName` (iOS
`MARKETING_VERSION`, Android `versionName`) should track the same number,
while native build numbers (`CFBundleVersion` / `versionCode`) increment per
store submission.

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
