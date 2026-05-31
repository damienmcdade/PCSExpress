# Changelog

All notable changes to PCS Express. Dates are the release date. The
`package.json` version is the source of truth; native `versionName` (iOS
`MARKETING_VERSION`, Android `versionName`) should track the same number,
while native build numbers (`CFBundleVersion` / `versionCode`) increment per
store submission.

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
