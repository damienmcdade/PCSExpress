/*
 * Purpose: PPM financial estimate calculations for PCS Express.
 * Third-party dependencies: none.
 */

export const PPM_PAYGRADES = [
  'E-1', 'E-2', 'E-3', 'E-4', 'E-5', 'E-6', 'E-7', 'E-8', 'E-9',
  'W-1', 'W-2', 'W-3', 'W-4', 'W-5',
  'O-1', 'O-2', 'O-3', 'O-4', 'O-5', 'O-6', 'O-7', 'O-8', 'O-9', 'O-10',
];

export const PPM_CONFIG = Object.freeze({
  incentiveRate: 0.95,
  federalTaxWithholdingRate: 0.22,
  fuelPricePerGallon: 3.65,
  truckMilesPerGallon: 8,
  truckDailyRate: 84,
  truckPerMileRate: 0.89,
  packingSupplies: 275,
  insuranceAndEquipment: 195,
  laborRatePerHundredLbs: 18,
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
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export function getAuthorizedWeightAllowance(rank = 'E-5') {
  return HHG_WEIGHT_ALLOWANCE_WITH_DEPENDENTS_LBS[rank] || HHG_WEIGHT_ALLOWANCE_WITH_DEPENDENTS_LBS['E-5'];
}

export function calculateGovernmentConstructiveCost(input = {}, config = PPM_CONFIG) {
  const rank = input.rank || 'E-5';
  const distanceMiles = clamp(toNumber(input.distanceMiles, 0), 0, 12000);
  const estimatedWeightLbs = clamp(toNumber(input.estimatedWeightLbs, 0), 0, 24000);
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
  const estimatedWeightLbs = clamp(toNumber(input.estimatedWeightLbs, 0), 0, 24000);
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
