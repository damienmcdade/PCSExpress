# PCS Express — Whole-Application Audit & Fixes

**Date:** 2026-06-06
**Scope:** Entire application — App.jsx, all `src/components/`, `src/lib/`, `src/security/`, `src/config/`, `src/i18n/`, `src/hooks/`, the full backend (`server/`, `api/`), plus accessibility.
**Method:** Six parallel specialist audits (App correctness, calculators, component robustness, backend security, support code, accessibility), each finding **verified against the actual code before fixing** (one agent claim — "malformed BAH rows" — was checked and proven a false positive, not fixed). Functional/e2e + pen-test re-run after fixes.

Baseline before fixes: eslint clean, 228 node + 112 vitest green, build clean.

## Fixes applied

### Frontend correctness
- **`App.jsx`** — In-Processing checklist reminders fired with a generic "PCS task" label because `key.split('-')` mis-parses the hyphenated phase name. Now splits on the **last** hyphen.
- **`App.jsx`** — home notification badge/panel anchored on `departingDate` only; now uses `reportNLTDate || departingDate`, matching every other countdown surface (latent: profiles with only the report date showed no alerts).
- **`App.jsx`** — `?go=transition` deep-link fell back to Home (missing from the allow-list); added `transition`.
- **`HomeLocatorTab.jsx`** (P1 crash) — OCONUS housing section did `oh.resources.map(...)` unguarded; a malformed `/api/market-stats` payload white-screened the tab. Guarded with `Array.isArray`.
- **`AIAssistantChip.jsx`** — an aborted/timed-out stream left an orphaned empty assistant bubble above the fallback answer; the fallback now replaces the trailing empty bubble.
- **`ReligiousServicesModule.jsx`** — hardened `service.mass.map` against a future malformed curated entry.

### Calculators (display correctness; dollar figures were already correct)
- **`PPMFinancialEstimator.jsx`** — Profit Meter showed a negative percent (e.g. "−46%") next to a clamped bar; a net loss now reads "**Net loss**" consistently with the red bar/amount.
- **`MoveStrategyModule.jsx`** — relabeled "break-even weight" → "**minimum** break-even weight" and noted that net cash peaks near the weight allowance then declines (the curve is non-monotonic above the cap).

### Backend (security / robustness)
- **`server/index.js`** (P1 DoS) — the global hourly AI budget counted *attempts* (incremented in the rate-limit middleware, before validation), so zero-cost malformed requests could exhaust it and 429 every real user. Split into a read-only `aiGlobalCapReached()` (early 429) and `aiGlobalConsume()` called **only immediately before the billed Anthropic call**, on both `/api/ai` and `/api/jtr-assistant` (matches the Vercel twin).
- **`server/index.js`** — `/api/jtr-assistant` now runs the same `containsLikelyPii` filter as `/api/ai` (PII parity before forwarding to the LLM).
- **`server/index.js`** — both streaming proxies now abort the upstream Anthropic generation on client disconnect (`AbortController` + `req.on('close')`), stopping a token/socket leak under dropped SSE clients; the jtr stream also emits a terminal `event: error`.
- **`server/lib/pushStore.js`** (P1) — Postgres TLS was `rejectUnauthorized: false` for the public-proxy host (MITM-able). Now `pgSslConfig()` does **full certificate verification when a CA bundle (`PGSSL_CA` / `DATABASE_CA_CERT`) or `PGSSL_REJECT_UNAUTHORIZED=true` is set**, defaulting to the prior behavior so no deployment breaks. Set the env var to enable verify-full.
- **`server/package.json`** — was stale (Express `^4`, missing `pg`/`web-push`); synced to the real runtime deps so a standalone `npm ci` in `server/` can't silently install the wrong stack.

### Accessibility (Section 508 / WCAG 2.1 AA)
- **`BAHCalculatorTab.jsx`** (BLOCKER) — duty-station picker options were non-focusable `<div onClick>`, making the core BAH flow unusable by keyboard/AT. Converted to `<button role="option">` inside a `role="listbox"` (verified: 80 focusable button options).
- **`App.jsx`** — hamburger `aria-controls="pcs-nav-drawer"` pointed at a nonexistent id; added the id to the drawer.
- **`NavigationModule.jsx`** — route-planner selects had no accessible name; added `htmlFor`/`id` + `aria-label`.
- **`App.jsx`** — onboarding child-age inputs were unlabeled; added `aria-label`.

## Verified clean / intentionally not changed
- **BAH/OHA/LQA/PPM math** — re-verified by executing the functions; no defects. The two "extra element" BAH rows were **checked and have exactly 24 pairs** (false positive).
- **i18n runtime** (`useAppLanguageRuntime.js`) — two *latent, converges-today* fragilities (original-text capture on a lazy route first seen in a non-English language; observer-loop-if-non-deterministic). **Not changed** — the fixes are risky on working, complex translation code for an edge that doesn't reproduce; flagged for a dedicated pass.
- **Per-instance AI cap** — documented limitation (needs a shared store for true fleet-wide enforcement); not a new defect.
- Crypto store, SecurityExtensions, escapeHtml, mapEmbedUrl, focus trap, reminders, error reporter — audited, clean.

## Post-fix verification
- eslint clean; `node --check` on server files OK; build clean; **228 node + 112 vitest green**.
- Functional crawl (all 7 nav tabs + Transition sub-tabs + notification flow): **0 console errors, 0 page errors**; Priority Alerts card renders; BAH picker confirmed keyboard-accessible.
- Pen-test (separate pass) confirmed the new code honors the no-PII contract and the live API is hardened.
