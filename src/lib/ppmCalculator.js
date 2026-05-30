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
// can tell at a glance how stale a value is. A `TODO: verify source` marker means
// the value is in the code but the canonical authority and date have not been
// confirmed by a human against an official published table — these need a
// reviewer pass before this module ships to a finance-decision flow.
export const PPM_CONFIG = Object.freeze({
  // Personally Procured Move incentive rate — fraction of the Government
  // Constructive Cost paid to the member. JTR §050302 (2026): 95% conservative
  // planning rate. (A temporary 130% incentive was authorized for select moves
  // in 2025–2026; verify with your PPSO before relying on a different rate.)
  // Source: JTR §050302, effective 2026-01.
  incentiveRate: 0.95,
  // Federal income-tax withholding applied to the PPM incentive payment.
  // 22% is the IRS supplemental-wage flat rate (IRC §3402(g); IRS Pub 15-T).
  // Actual liability varies by filing status / total income.
  // Source: IRS Publication 15-T (supplemental wages), as of 2026-01.
  federalTaxWithholdingRate: 0.22,
  // National-average retail diesel price used to project rental-truck fuel cost.
  // Planning estimate — DOES NOT affect the JTR incentive payment.
  // Source: U.S. EIA Weekly Retail Gasoline/Diesel Prices (national average).
  // TODO: verify source — confirm exact EIA series & snapshot date used.
  // as of 2026-01.
  fuelPricePerGallon: 3.65,
  // Assumed fuel economy for a typical 16–26ft rental box truck under load.
  // Planning estimate based on published rental-fleet specs.
  // TODO: verify source — pin to a specific rental class & snapshot date.
  // as of 2026-01.
  truckMilesPerGallon: 8,
  // Per-day rental rate (one-way truck, mid-size box). Planning estimate.
  // Source: National-average one-way truck rental quote (U-Haul / Penske / Budget composite).
  // TODO: verify source — replace with a defensible composite snapshot & date.
  // as of 2026-01.
  truckDailyRate: 84,
  // Per-mile add-on for one-way truck rentals. Planning estimate.
  // Source: National-average one-way per-mile add-on (U-Haul / Penske / Budget composite).
  // TODO: verify source — replace with a defensible composite snapshot & date.
  // as of 2026-01.
  truckPerMileRate: 0.89,
  // Flat allowance for packing supplies (boxes, tape, paper). Planning estimate.
  // TODO: verify source — pin to a national-average move-supplies kit & date.
  // as of 2026-01.
  packingSupplies: 275,
  // Flat allowance for insurance + equipment rental (dollies, pads, etc.).
  // Planning estimate.
  // TODO: verify source — pin to a defensible insurance/rental-add-on figure & date.
  // as of 2026-01.
  insuranceAndEquipment: 195,
  // Loading / unloading labor rate per 100 lb of household goods.
  // Planning estimate intended to capture day-labor or helper services.
  // TODO: verify source — confirm against a published industry survey & date.
  // as of 2026-01.
  laborRatePerHundredLbs: 18,
  // ── Government Constructive Cost (GCC) model coefficients ─────────────────
  // The JTR mandates the formula and uses DTMO-published tariff inputs; these
  // four constants are a compact approximation of that tariff suitable for
  // planning estimates. They are NOT a substitute for an official DPS / PPPO
  // estimate. Refresh annually against the current DTMO PPM Worksheet.
  // Source: DTMO PPM Worksheet methodology + JTR §050302 (approximated).
  // TODO: verify source — confirm each coefficient against the current DTMO
  // tariff publication and document the snapshot date.
  // as of 2026-01.
  gccBaseHandling: 525,
  gccDistanceRatePerMile: 0.78,
  gccWeightRatePerHundredLbs: 38,
  gccWeightDistanceRate: 0.046,
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

const toNumber = (value, fallback = 0) => {
  // Strip thousands separators and surrounding whitespace so free-text
  // fields like "7,500" parse instead of silently collapsing to the
  // fallback (Number("7,500") is NaN). Mirrors MoveBudgetTracker.parseNum.
  const n = typeof value === 'string' ? Number(value.replace(/[,\s]/g, '')) : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function getAuthorizedWeightAllowance(rank = 'E-5') {
  return HHG_WEIGHT_ALLOWANCE_WITH_DEPENDENTS_LBS[rank] || HHG_WEIGHT_ALLOWANCE_WITH_DEPENDENTS_LBS['E-5'];
}

export function calculateGovernmentConstructiveCost(input = {}, config = PPM_CONFIG) {
  const rank = input.rank || 'E-5';
  const distanceMiles = clamp(toNumber(input.distanceMiles, 0), 0, 12000);
  const estimatedWeightLbs = clamp(toNumber(input.estimatedWeightLbs ?? input.actualWeightLbs, 0), 0, 24000);
  const yearsOfService = clamp(toNumber(input.yearsOfService, 0), 0, 40);
  const authorizedWeightLbs = getAuthorizedWeightAllowance(rank);
  const reimbursableWeightLbs = Math.min(estimatedWeightLbs, authorizedWeightLbs);
  const excessWeightLbs = Math.max(estimatedWeightLbs - authorizedWeightLbs, 0);
  const hundredWeight = reimbursableWeightLbs / 100;
  const distanceBandFactor = distanceMiles > 1500 ? 1.08 : distanceMiles > 750 ? 1.04 : 1;
  const serviceComplexity = 1 + Math.min(yearsOfService, 20) * 0.0025;

  const baseHandling = config.gccBaseHandling;
  const distanceComponent = distanceMiles * config.gccDistanceRatePerMile * distanceBandFactor;
  const weightComponent = hundredWeight * config.gccWeightRatePerHundredLbs;
  const weightDistanceComponent = hundredWeight * distanceMiles * config.gccWeightDistanceRate * serviceComplexity;
  const governmentConstructiveCost = baseHandling + distanceComponent + weightComponent + weightDistanceComponent;

  return {
    rank,
    yearsOfService,
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
