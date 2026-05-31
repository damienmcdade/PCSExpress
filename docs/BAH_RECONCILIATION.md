# BAH Rate Table — Authoritative Reconciliation (2026)

`src/lib/bahCalculator.js` `MHA_RATES` was reconciled on **2026-05-31** to the
**official DTMO 2026 BAH full-rate tables** (effective 1 Jan 2026). Prior to
this, the hand-entered table was wrong for 106 of 109 MHAs (off by hundreds of
dollars in both directions — e.g. Fort Carson E-5 w/dep was $1,998 vs the
official $2,358).

## Authoritative source

DTMO publishes the complete rate tables (all MHAs × all grades). The direct
`travel.dod.mil/Portals/119/...` PDFs are bot-blocked, but military.com mirrors
the official tables verbatim:

- With dependents:    `https://www.military.com/sites/default/files/2025-12/2026%20BAH%20Rates%20With%20Dependents.pdf`
- Without dependents: `https://www.military.com/sites/default/files/2025-12/2026%20BAH%20Rates%20Without%20Dependents.pdf`

Each row is: `MHA_CODE  MHA_NAME  E01 E02 … E09  W01 … W05  O01E O02E O03E  O01 … O07`.

## Column mapping (DTMO → app `BAH_PAY_GRADES`)

- E-1..E-9 → E01..E09, W-1..W-5 → W01..W05, O-1..O-7 → O01..O07 (direct).
- O-8/O-9/O-10 → O07 (BAH caps at O-7; the app flattens these, matching DTMO).
- DTMO's prior-enlisted columns (O01E/O02E/O03E) are not used by the app.

## MHA mapping notes

The app keys `MHA_RATES` by city/county name; DTMO keys by code/installation
name. 89 mapped automatically by token overlap; the rest were mapped manually.
Three required correction after verification (token matching picked the wrong
MHA for installations in remote parts of a county / shared metro areas):

- `Pensacola, FL` → **FL064 PENSACOLA** (not FL056 EGLIN)
- `Jacksonville, NC` → **NC178 CAMP LEJEUNE** (not NC177 MOREHEAD/CHERRY PT)
- `San Bernardino County, CA` → **CA028 BARSTOW/FORT IRWIN** (not CA031 SAN BERNARDINO)

Two app MHAs have **no row** in the published CONUS table and remain prior
estimates (flagged in `ESTIMATED_MHA_KEYS`):
- `San Juan, PR` (Fort Buchanan) — Puerto Rico isn't in the CONUS table.
- `Bowie County, TX` (Red River Army Depot / Texarkana) — no matching DTMO MHA.

Known residual: a few app MHA keys group multiple installations that actually
sit in different MHAs (e.g. Eglin/Hurlburt grouped under Pensacola, MCAS Cherry
Point under Camp Lejeune). The namesake installation is correct; splitting the
secondary ones would require restructuring `INSTALLATION_MHA_MAP` (future work).

## Verification

After applying: 60/60 spot-checks across 10 installations × 6 grades matched the
official tables exactly; 0 `withDep < noDep` anomalies across 3,936 rate cells;
the 5 `bahReferenceValues.test.mjs` cases pass against the official values.

## To update for a future year

Re-fetch the two PDFs, re-parse (each data row = code + name + 24 integers),
re-apply the column + MHA mappings above, then re-run the verification.
