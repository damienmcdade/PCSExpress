/*
 * Purpose: PPM financial estimate calculations for PCS Express.
 * Third-party dependencies: none.
 */

export const PPM_PAYGRADES = [
  'E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-6', 'E-7', 'E-8', 'E-9',
  'W-1', 'W-2', 'W-3', 'W-4', 'W-5',
  'O-1', 'O-2', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10',
];

// PPM_CONFIG — inputs to the PPM/DITY estimator. Two distinct categories of values live here:
//
//   (1) JTR-mandated entitlement rates  (incentiveRate, federalTaxWithholdingRate)
//       — set by regulation; only change when the JTR / IRS publish a new rule.
//   (2) Market planning estimates       (fuel, truck rental, labor, GCC components)
//       — national-average inputs used to project out-of-pocket cost. These drift
//         month-to-month and should be refreshed against published averages each
//         year. Versioned separately in dataVersions.js under `ppm_config` so a
//         market refresh doesn't appear to imply the entitlement formula changed.
//
// Source labels below use "as of YYYY-MM" for the planning estimates so a reader
// can tell at a glance how stale a value is. Each value cites its authority:
// entitlement rates cite the regulation (DTR Part IV / IRS); the GCC model is
// calibrated to the published ~$0.00075/lb-mile factor and a worked real-world
// example; market inputs cite the EIA series or are flagged as commercial
// composites with no single authoritative table. Refresh annually.
export const PPM_CONFIG = Object.freeze({
  // Personally Procured Move incentive rate — fraction of the Government
  // Constructive Cost paid to the member. DoD raised this from 95% to
  // 100% of the GCC in 2021, and 100% remains the standing rate. A
  // TEMPORARY 130% rate applied only to moves between 15 May and 30 Sep
  // 2025 (MAP 42-25(R)) and has expired; moves after 30 Sep 2025 are back
  // to 100%. Verify with your PPSO before relying on any other rate.
  // Source: DTR 4500.9-R Part IV (Best Value / 100% GCC); USTRANSCOM PPM
  // guidance; PDTATAC MAP 42-25(R) & MAP 47-25(I). Effective 2026-05.
  incentiveRate: 1.0,
  // Federal income-tax withholding applied to the PPM incentive payment.
  // 22% is the IRS supplemental-wage flat rate (IRC §3402(g); IRS Pub 15-T)
  // for supplemental wages up to $1M. Actual liability varies by filing
  // status / total income.
  // Source: IRS Publication 15-T (supplemental wages), as of 2026-05.
  federalTaxWithholdingRate: 0.22,
  // National-average retail REGULAR GASOLINE price used to project the
  // rental-truck fuel cost. Consumer one-way box trucks (U-Haul, Budget,
  // most Penske consumer rentals) run on gasoline, so the regular-gasoline
  // series is the representative input — not diesel. Planning estimate;
  // DOES NOT affect the JTR incentive payment.
  // Source: U.S. EIA, U.S. Regular All Formulations Retail Gasoline Prices,
  // weekly national average = $4.475/gal for the week ending 2026-05-25.
  // https://www.eia.gov/petroleum/gasdiesel/ (series EMM_EPMR_PTE_NUS_DPG)
  fuelPricePerGallon: 4.48,
  // Assumed fuel economy for a loaded 16–26ft gasoline rental box truck.
  // Held conservatively low (loaded large trucks fall well under the ~10
  // mpg empty figure rental fleets cite) so the projected fuel cost is not
  // understated. Planning estimate, as of 2026-05.
  truckMilesPerGallon: 8,
  // ── Member out-of-pocket EXPENSE estimates ───────────────────────────
  // These project the member's costs to net against the incentive. They
  // are commercial-market figures (one-way truck rental, supplies, labor)
  // for which NO single authoritative public table exists — they are
  // composites of national U-Haul / Penske / Budget one-way quotes and
  // industry move-cost surveys. Refresh annually; verify your own quotes.
  // Composite snapshot as of 2026-05.
  truckDailyRate: 84,            // per-day one-way mid/large box truck
  truckPerMileRate: 0.89,        // per-mile one-way add-on
  packingSupplies: 275,          // boxes, tape, paper, mattress bags
  insuranceAndEquipment: 195,    // damage coverage + dollies/pads rental
  laborRatePerHundredLbs: 18,    // day-labor / loading-helper services per cwt
  // ── Government Constructive Cost (GCC) model coefficients ─────────────
  // The exact GCC is the Government's "Best Value" cost from the Global
  // Household Goods Contract (GHC) rate table, which is NOT publicly
  // published (DTR 4500.9-R Part IV, Ch 403). The GCC is driven by weight,
  // distance, and origin/destination, so these four constants approximate
  // that tariff as: fixed admin/drayage + per-cwt accessorials (pack /
  // load / unload, distance-independent) + a small distance term + the
  // weight×distance line-haul (the dominant term).
  //
  // Calibration: published guidance pins the all-in factor at ≈ $0.00075
  // per pound-mile, and a worked real example (E-6, 8,500 lb, 2,775 mi)
  // gives a GCC of ≈ $17,700. With these coefficients the model returns
  // ≈ $17,760 for that case (within ~0.3%) while still attributing the
  // weight-heavy accessorial cost that the single per-pound-mile factor
  // under-counts on short moves. NOT a substitute for an official DPS /
  // PPPO estimate — refresh against the current methodology annually.
  // Source: USTRANSCOM/DTR Part IV GHC "Best Value" methodology;
  // published PPM per-pound-mile factor (~$0.00075). As of 2026-05.
  gccBaseHandling: 350,
  gccDistanceRatePerMile: 0.30,
  gccWeightRatePerHundredLbs: 50,
  gccWeightDistanceRate: 0.052,
});

export const HHG_WEIGHT_ALLOWANCE_WITH_DEPENDENTS_LBS = Object.freeze({
  'E-1': 8000,
  'E-2': 8000,
  'E-3': 8000,
  'E-4': 8000,
  'E-5': 9000,
  'E-6': 11000,
  'E-7': 13000,
  'E-8': 14000,
  'E-9': 15000,
  'W-1': 12000,
  'W-2': 13500,
  'W-3': 14500,
  'W-4': 17000,
  'W-5': 17500,
  'O-1': 12000,
  'O-2': 13500,
  'O-3': 14500,
  'O-4': 17000,
  'O-5': 17500,
  'O-6': 18000,
  'O-7': 18000,
  'O-8': 18000,
  'O-9': 18000,
  'O-10': 18000,
});

// JTR Table 5-37 HHG weight allowances for a member WITHOUT dependents.
// These are materially lower than the with-dependents caps (e.g. E-5
// 7,000 vs 9,000), so applying the with-dependents table to a single
// member overstates the reimbursable weight and the PPM incentive.
// Selected by dependency status via getAuthorizedWeightAllowance().
export const HHG_WEIGHT_ALLOWANCE_WITHOUT_DEPENDENTS_LBS = Object.freeze({
  'E-1': 5000,
  'E-2': 5000,
  'E-3': 5000,
  'E-4': 7000,
  'E-5': 7000,
  'E-6': 8000,
  'E-7': 11000,
  'E-8': 12000,
  'E-9': 13000,
  'W-1': 10000,
  'W-2': 12500,
  'W-3': 13000,
  'W-4': 14000,
  'W-5': 16000,
  'O-1': 10000,
  'O-2': 12500,
  'O-3': 13000,
  'O-4': 14000,
  'O-5': 16000,
  'O-6': 18000,
  'O-7': 18000,
  'O-8': 18000,
  'O-9': 18000,
  'O-10': 18000,
});

const toNumber = (value, fallback = 0) => {
  // Strip thousands separators and surrounding whitespace so free-text
  // fields like "7,500" parse instead of silently collapsing to the
  // fallback (Number("7,500") is NaN). Mirrors MoveBudgetTracker.parseNum.
  const n = typeof value === 'string' ? Number(value.replace(/[,\s]/g, '')) : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function getAuthorizedWeightAllowance(rank = 'E-5', withDependents = true) {
  const table = withDependents
    ? HHG_WEIGHT_ALLOWANCE_WITH_DEPENDENTS_LBS
    : HHG_WEIGHT_ALLOWANCE_WITHOUT_DEPENDENTS_LBS;
  return table[rank] || table['E-5'];
}

export function calculateGovernmentConstructiveCost(input = {}, config = PPM_CONFIG) {
  const rank = input.rank || 'E-5';
  // Default to with-dependents when the caller doesn't specify, so existing
  // callers/reference tests are unchanged; the UI passes the member's real
  // dependency status (input.withDependents === false → lower single-member cap).
  const withDependents = input.withDependents !== false;
  const distanceMiles = clamp(toNumber(input.distanceMiles, 0), 0, 12000);
  const estimatedWeightLbs = clamp(toNumber(input.estimatedWeightLbs ?? input.actualWeightLbs, 0), 0, 24000);
  // DoD civilians don't have a rank-tied JTR allowance — the FTR (§302-7)
  // gives a flat weight allowance regardless of pay plan. When the caller
  // passes an explicit override (e.g. the civilian 18,000 lb FTR allowance),
  // use it instead of the military rank table so the reimbursable weight
  // isn't silently capped at the E-5 baseline the UI falls back to for math.
  // Backward-compatible: military callers/reference tests pass no override.
  const authorizedWeightLbs = input.authorizedWeightLbsOverride != null
    ? clamp(toNumber(input.authorizedWeightLbsOverride, 0), 0, 24000)
    : getAuthorizedWeightAllowance(rank, withDependents);
  const reimbursableWeightLbs = Math.min(estimatedWeightLbs, authorizedWeightLbs);
  const excessWeightLbs = Math.max(estimatedWeightLbs - authorizedWeightLbs, 0);
  const hundredWeight = reimbursableWeightLbs / 100;
  const distanceBandFactor = distanceMiles > 1500 ? 1.08 : distanceMiles > 750 ? 1.04 : 1;

  // GCC depends ONLY on weight, distance, and origin/destination — NOT on the
  // member's years of service. A prior `serviceComplexity` multiplier tied to
  // YOS had no JTR basis, silently inflated the incentive (up to ~4% at 20
  // YOS), and broke the calibration the example values are pinned to.
  const baseHandling = config.gccBaseHandling;
  const distanceComponent = distanceMiles * config.gccDistanceRatePerMile * distanceBandFactor;
  const weightComponent = hundredWeight * config.gccWeightRatePerHundredLbs;
  const weightDistanceComponent = hundredWeight * distanceMiles * config.gccWeightDistanceRate;
  const governmentConstructiveCost = baseHandling + distanceComponent + weightComponent + weightDistanceComponent;

  return {
    rank,
    distanceMiles,
    estimatedWeightLbs,
    authorizedWeightLbs,
    reimbursableWeightLbs,
    excessWeightLbs,
    governmentConstructiveCost,
  };
}

export function estimateRentalTruckAndFuelCosts(input = {}, config = PPM_CONFIG) {
  const distanceMiles = clamp(toNumber(input.distanceMiles, 0), 0, 12000);
  const estimatedWeightLbs = clamp(toNumber(input.estimatedWeightLbs ?? input.actualWeightLbs, 0), 0, 24000);
  const travelDays = Math.max(1, Math.ceil(distanceMiles / 420));
  const fuelCost = (distanceMiles / config.truckMilesPerGallon) * config.fuelPricePerGallon;
  const truckRental = travelDays * config.truckDailyRate + distanceMiles * config.truckPerMileRate;
  const loadingLabor = (estimatedWeightLbs / 100) * config.laborRatePerHundredLbs;
  const rentalTruckAndFuelCost = truckRental + fuelCost + loadingLabor + config.packingSupplies + config.insuranceAndEquipment;

  return {
    travelDays,
    fuelCost,
    truckRental,
    loadingLabor,
    packingSupplies: config.packingSupplies,
    insuranceAndEquipment: config.insuranceAndEquipment,
    rentalTruckAndFuelCost,
  };
}

export function calculatePPMEstimate(input = {}, config = PPM_CONFIG) {
  const gcc = calculateGovernmentConstructiveCost(input, config);
  const expenses = estimateRentalTruckAndFuelCosts(input, config);
  const grossIncentive = gcc.governmentConstructiveCost * config.incentiveRate;
  const estimatedTaxWithholding = grossIncentive * config.federalTaxWithholdingRate;
  const netIncentiveAfterTaxes = grossIncentive - estimatedTaxWithholding;
  const estimatedCashInPocket = netIncentiveAfterTaxes - expenses.rentalTruckAndFuelCost;
  const profitMeterPercent = clamp(Math.round((estimatedCashInPocket / Math.max(netIncentiveAfterTaxes, 1)) * 100), -100, 100);

  return {
    ...gcc,
    ...expenses,
    incentiveRate: config.incentiveRate,
    federalTaxWithholdingRate: config.federalTaxWithholdingRate,
    grossIncentive,
    estimatedTaxWithholding,
    netIncentiveAfterTaxes,
    estimatedCashInPocket,
    profitMeterPercent,
  };
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value || 0));
}
