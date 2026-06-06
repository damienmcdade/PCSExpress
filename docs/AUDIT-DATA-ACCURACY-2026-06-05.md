# PCS Express — Data-Accuracy Audit vs Official Sources

**Date:** 2026-06-05
**Scope:** All user-facing data values (entitlement rates, weight allowances, per-diem, pet/DLA/MALT, BAH/OHA/LQA policy + rates, statutory citations).
**Method:** Parallel verification against official sources — DTMO/PDTATAC, GSA.gov, IRS.gov, the Joint Travel Regulations (JTR), the Federal Travel Regulation (FTR / eCFR), and the DSSR (State Dept). Plus a full codebase sweep for internal contradictions. **No values were fabricated**; anything unreachable from an authoritative source is marked UNVERIFIED.

---

## 1. Verified against official sources — MATCHES ✅

| Value (app) | Official finding | Source |
|---|---|---|
| MALT PCS POV mileage **$0.205/mi** CY2026 (unchanged from 2025) | Matches PDTATAC **MAP/CAP 73-25(I)**, eff. 2026-01-01 | DTMO Mileage Rates / media.defense.gov |
| PPM incentive **100% of GCC** (temp 130% expired 30 Sep 2025) | Matches; 100% is the standing rate for post-30 Sep 2025 moves (MAP 42-25(R) expired) | JTR ~051502 / PDTATAC |
| PPM tax withholding **22%** (supplemental wage) | Matches 2026 supplemental-wage flat rate | **IRS Pub 15-T (2026)** — verified directly |
| Pet caps **$550 / $2,000 / up to $4,000** (high-risk rabies) | Matches | **JTR par. 050107** / army.mil / DTMO FAQ |
| DLA **+3.8%** CY2026 | Corroborated (all grades +3.8%; partial DLA $1,002.71) | PDTATAC MAP 72-25(I) (primary PDF 403; secondary corroboration) |
| Per-diem **$178/day = $110 lodging + $68 M&IE** FY2026 | Matches — GSA held FY2026 flat at FY2025 | **GSA.gov** FY2026 release — verified directly |
| **HHG weight allowances** — all 24 grades × with/without deps | **All MATCH** the JTR Table of Weight Allowances (formerly Tbl 5-37) | JTR / cross-checked NAVSUP, USCG, Spangdahlem TMO |
| Civilian HHG **18,000 lb** (flat, net) | Correct standard FTR allowance | **41 CFR 302-7.2 (eCFR)** — verified directly |
| Policy: 48 states + DC = BAH; **PR/Guam/USVI = OHA (not BAH)**; AK/HI = BAH | Verified verbatim from the JTR Appendix A definitions | **JTR PDF** (media.defense.gov) |
| OHA = rent ceiling + Utility/Recurring-Maint + MIHA | Verified | DTMO OHA program / JTR par. 100504 |
| Civilian **LQA under DSSR §130** | Verified verbatim (§130 LQA, §131 defs) | **DSSR Master doc** (allowances.state.gov) |

The PR→OHA policy verification independently validates the Fort Buchanan/Puerto Rico `isOCONUS` fix made earlier this session.

## 2. UNVERIFIED — official source not machine-reachable ⚠️

- **BAH dollar rates** (109 MHAs × 24 grades, "effective 1 Jan 2026"). The DTMO BAH/OHA rate lookups return **HTTP 403** to automated fetch on every host (`travel.dod.mil`, `defensetravel.dod.mil`, `militarypay.defense.gov`) and are JS-gated interactive tools. **No official 2026 BAH dollar figure was retrievable.** Third-party mirrors exist but are not authoritative and were not adopted. These remain a **human-verification** item (use the DTMO BAH Rate Lookup interactively). The app already labels `San Juan, PR` and `Bowie County, TX` as estimates (`ESTIMATED_MHA_KEYS`); all others are presented as authoritative and could not be independently confirmed here.
- **OHA / LQA dollar tables** are explicitly labeled in-code as planning estimates (rates change monthly/quarterly) — structure verified, exact dollars not.

## 3. Internal contradictions found & FIXED ✅

| ID | Issue | Fix |
|---|---|---|
| C1 | `CalculatorResultLabel.jsx` comment said PPM uses the "**95%** JTR incentive rate" | → 100% (matches `incentiveRate: 1.0`) |
| C2 | `AIAssistantChip` pet answer omitted the **$4,000** high-risk-rabies tier (had only $550/$2,000) | Added the $4,000 tier + per-move (not per-pet) clarification |
| C3 | `AIAssistantChip` pet citation was **`JTR §053703`** (wrong) | → **`JTR §050107`** (the officially-verified section; matches JTRAssistant) |
| C4 | `AIAssistantChip` DLA said "**or E-4** if without dependents" (wrong basis) | → grade-based, with/without-dependents rate at the member's own rank |
| C5 | National gas price disagreed: PPM **$4.48** (EIA, wk 2026-05-25) vs Budget **$4.10** ("Q1 2026 forecast") | Budget aligned to **$4.48** (same EIA figure/vintage) |
| S1 | OHA tab header read "**2025/2026** Reference Rates" | → "2026 Reference Rates" (matches CY2026 framing everywhere else) |

## 4. Noted (not changed — intentional or low-impact)

- **Travel-day divisor** differs: PPM rental-truck `420 mi/day` vs Budget POV `400 mi/day`. Different contexts (truck vs POV planning), so left as-is; flag if a single convention is desired (JTR PCS travel time is 1 day / 400 mi).
- **`cpiYoY: 0.061`** is labeled both "headline CPI" and used as the restaurant-meals subindex — harmless dual-labeling.
- **USCIS fees** (`ImmigrationModule`) stamped "as of 4/1/2024" — oldest dated values; verify against current USCIS fee schedule on the next data refresh.
- **MEA $1,300**, **FEIE ~$120,000**, **I-864 125% FPG**, **SCRA 6%**, **VA funding fee 1.4–3.6%**, **MyCAA $4,000/$16,000**, **TA $4,500**, **GI Bill book $1,000** — inventoried as user-facing; not independently re-verified this pass (candidates for the next official-source sweep).

## 5. Result

Every PCS **entitlement rate, weight allowance, per-diem, and housing-allowance policy** that could be checked against an official source **MATCHES** (12 categories verified, several read directly off IRS.gov / eCFR / GSA.gov / the JTR / DSSR). Six internal contradictions were corrected. The only genuine gap is the **BAH dollar table**, which DTMO makes un-fetchable to automation — a standing human-verification item, not a known error.

**Verification:** `eslint` clean, `vite build` clean, full test suite green.
