# Reference Values — Hand-Verification TODO

This checklist tracks every locked reference-value test case across PCS Express
calculators. Each row is a single scenario whose expected dollar amount must be
filled in by a human after cross-checking against the authoritative published
source. Until filled in, the test is **skipped** (visible in the test runner
output as "skip", neither passing nor failing).

## How to verify a row

1. Open the **Source** URL for the row.
2. Look up the case using the inputs in the row.
3. Snapshot the **published date** (and quarter for OHA — rates rotate Jan / Apr / Jul / Oct).
4. Open the matching test file, replace `expected: null` with the verified dollar amount.
5. Run `npm test` — the row's test should now PASS (no longer skipped).
6. Tick the row's `Verified` column below, fill in the date you verified, and add a one-line note (e.g. URL fragment, screenshot file name, or zip code you used).

When the underlying official table is republished (annual or quarterly), the
verification should be re-done and the date updated. Failing to do so does not
break the test — the test will still pass against the previously-pinned value —
but the row is stale and the date column is your warning flag.

---

## BAH — `tests/unit/bahReferenceValues.test.mjs`

Source: <https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/BAH-Rate-Lookup/>

| # | Scenario | Inputs | Expected | Verified on | Notes |
|---|---|---|---|---|---|
| 1 | Fort Liberty, E-5, with dependents      | `getBAHRate('Fort Liberty', 'E-5', true)`               | _TODO_ | _TODO_ | _TODO_ |
| 2 | Fort Liberty, E-5, no dependents        | `getBAHRate('Fort Liberty', 'E-5', false)`              | _TODO_ | _TODO_ | _TODO_ |
| 3 | Naval Station Norfolk, E-7, with deps   | `getBAHRate('Naval Station Norfolk', 'E-7', true)`      | _TODO_ | _TODO_ | _TODO_ |
| 4 | JBLM, O-3, with dependents              | `getBAHRate('Joint Base Lewis-McChord', 'O-3', true)`   | _TODO_ | _TODO_ | _TODO_ |
| 5 | Fort Carson, E-4, no dependents         | `getBAHRate('Fort Carson', 'E-4', false)`               | _TODO_ | _TODO_ | _TODO_ |

## OHA — `tests/unit/ohaReferenceValues.test.mjs`

Source: <https://www.travel.dod.mil/Allowances/Overseas-Housing-Allowance/OHA-Rate-Lookup/>
Note: OHA rates publish on a **quarterly** cycle (Jan / Apr / Jul / Oct).
Snapshot the quarter you verify against and re-run when DTMO rotates.

| # | Scenario | Inputs | Expected | Verified on | Notes |
|---|---|---|---|---|---|
| 1 | Kaiserslautern / Ramstein, E-5, with deps  | `getOHARate('Germany (Kaiserslautern / Ramstein)', 'E-5', true)` | _TODO_ | _TODO_ | _TODO_ |
| 2 | Camp Humphreys, E-7, with deps             | `getOHARate('South Korea (Camp Humphreys)', 'E-7', true)`        | _TODO_ | _TODO_ | _TODO_ |
| 3 | Okinawa (Kadena / Foster), O-4, with deps  | `getOHARate('Japan (Okinawa — Kadena / Camp Foster)', 'O-4', true)` | _TODO_ | _TODO_ | _TODO_ |
| 4 | NSA Bahrain, E-6, no dependents            | `getOHARate('Bahrain (NSA Bahrain)', 'E-6', false)`              | _TODO_ | _TODO_ | _TODO_ |
| 5 | Guam (Andersen / NS Guam), O-3, with deps  | `getOHARate('Guam (Andersen AFB / NS Guam)', 'O-3', true)`       | _TODO_ | _TODO_ | _TODO_ |

## LQA — `tests/unit/lqaReferenceValues.test.mjs`

Source: <https://aoprals.state.gov/Web920/dssr.asp> (DSSR §920 country tables)
Note: LQA ceilings publish on an **annual** cycle (DSSR section 920) with
intermittent off-cycle adjustments.

| # | Scenario | Inputs | Expected | Verified on | Notes |
|---|---|---|---|---|---|
| 1 | Stuttgart, Group 2, 3-4 person          | `calculateAnnualLQA({ post: 'Germany (Stuttgart)', group: 'g2', familySize: 4 })`             | _TODO_ | _TODO_ | _TODO_ |
| 2 | Tokyo / Yokota, Group 1, 2 person       | `calculateAnnualLQA({ post: 'Japan (Tokyo / Yokota)', group: 'g1', familySize: 2 })`          | _TODO_ | _TODO_ | _TODO_ |
| 3 | Okinawa, Group 3, 1 person              | `calculateAnnualLQA({ post: 'Japan (Okinawa)', group: 'g3', familySize: 1 })`                 | _TODO_ | _TODO_ | _TODO_ |
| 4 | RAF Lakenheath, Group 2, 7+ person      | `calculateAnnualLQA({ post: 'United Kingdom (RAF Lakenheath / Mildenhall)', group: 'g2', familySize: 7 })` | _TODO_ | _TODO_ | _TODO_ |
| 5 | Rota, Group 4, 3-4 person               | `calculateAnnualLQA({ post: 'Spain (Rota / Moron)', group: 'g4', familySize: 4 })`            | _TODO_ | _TODO_ | _TODO_ |

## PPM — `tests/unit/ppmReferenceValues.test.mjs`

Source: <https://dps.move.mil/> (official DPS estimator) and JTR §050302.
Note: PPM cases mix JTR-mandated entitlement math with market-input planning
estimates (fuel, truck, labor — see `src/lib/ppmCalculator.js` `PPM_CONFIG`).
When verifying, pin the field listed (e.g. `grossIncentive`) against the DPS
output for the same inputs. Don't pin `estimatedCashInPocket` against DPS —
that one reflects our market inputs and will legitimately drift.

| # | Scenario | Field pinned | Expected | Verified on | Notes |
|---|---|---|---|---|---|
| 1 | E-5 / 6 YOS / 850 mi / 7,500 lb         | `grossIncentive`         | _TODO_ | _TODO_ | _TODO_ |
| 2 | E-5 / 6 YOS / 850 mi / 7,500 lb         | `netIncentiveAfterTaxes` | _TODO_ | _TODO_ | _TODO_ |
| 3 | E-7 / 14 YOS / 1500 mi / 13,000 lb      | `grossIncentive`         | _TODO_ | _TODO_ | _TODO_ |
| 4 | O-3 / 8 YOS / 1200 mi / 12,000 lb       | `grossIncentive`         | _TODO_ | _TODO_ | _TODO_ |
| 5 | E-4 / 3 YOS / 400 mi / 5,000 lb         | `authorizedWeightLbs`    | _TODO_ | _TODO_ | _TODO_ |
