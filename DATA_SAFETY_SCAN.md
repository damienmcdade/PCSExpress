# PCS Express Public Data Safety Scan

Purpose: document the public-data guardrails used for the Unit Information and Base Map updates.

Controls added:
- Unit Information displays public-only data and blocks operational-tempo details from the UI.
- Unknown units and bases use user-entered names plus Google public-source lookup links instead of storing unverified sensitive content.
- Base Map displays public support facilities only and excludes restricted areas, internal layouts, force-protection details, and operational data.
- A repeatable scan script checks source content for classified, CUI, operational, or sensitive-data indicators.

Run:

```sh
node scripts/public-data-scan.mjs
```

Output:
- `public-data-scan-report.json`

Review note: this scan is a static safety screen, not a government classification review. Official release authority remains with the content owner.
