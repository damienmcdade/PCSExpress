/*
 * Purpose: Household-goods (HHG) weight-estimation reference data + pure,
 * React-free helper functions for the Move Strategy module of PCS Express.
 * Third-party dependencies: none.
 *
 * ── Weight-data source / convention ────────────────────────────────────
 * Per-item average weights follow the long-standing move.mil / DoD-DPS
 * "Weight Estimator" convention used across the moving industry (the same
 * per-article averages published by the Defense Personal Property System
 * move.mil weight estimator and mirrored by AMSA/major van-line estimator
 * worksheets — e.g. ~7 lb per cubic foot for boxed/loose goods). These are
 * INDUSTRY-AVERAGE PLANNING WEIGHTS for a typical, moderately-furnished
 * article — not a guarantee for any specific item. Heavy custom furniture,
 * dense hardwood, or stone-topped pieces can weigh materially more, so the
 * estimate is intentionally conservative and rounded.
 *
 * ROOM_AVERAGE_LBS (1,000 lb) is the official move.mil rule of thumb:
 * "estimate roughly 1,000 lbs for each fully-furnished room." It powers the
 * Quick estimate mode; the itemized mode sums the per-article table.
 *
 * NONE of these figures are an entitlement or an official scale weight. The
 * binding shipment weight comes from the certified DD Form 619 / weight
 * tickets and your TMO/PPPO. Refresh against the current move.mil estimator
 * if the published averages change.
 */

// Official move.mil rule of thumb: ~1,000 lbs per fully-furnished room.
export const ROOM_AVERAGE_LBS = 1000;

// Per-item planning weights (lbs), grouped by room. Conservative
// industry/DoD averages — see header for the source convention.
export const ROOMS = Object.freeze([
  {
    id: 'living-room',
    name: 'Living Room',
    items: [
      { id: 'sofa', name: 'Sofa (3-seat)', lbs: 100 },
      { id: 'loveseat', name: 'Loveseat', lbs: 70 },
      { id: 'recliner', name: 'Recliner / armchair', lbs: 60 },
      { id: 'coffee-table', name: 'Coffee table', lbs: 45 },
      { id: 'end-table', name: 'End / side table', lbs: 25 },
      { id: 'tv-55', name: 'TV, 55 in', lbs: 40 },
      { id: 'tv-stand', name: 'TV stand / media console', lbs: 70 },
      { id: 'bookshelf', name: 'Bookshelf', lbs: 60 },
      { id: 'area-rug', name: 'Area rug (large)', lbs: 40 },
      { id: 'floor-lamp', name: 'Floor lamp', lbs: 15 },
    ],
  },
  {
    id: 'family-room',
    name: 'Family Room',
    items: [
      { id: 'sectional', name: 'Sectional sofa', lbs: 180 },
      { id: 'ottoman', name: 'Ottoman', lbs: 30 },
      { id: 'tv-65', name: 'TV, 65 in', lbs: 55 },
      { id: 'gaming-console-cab', name: 'Game / media cabinet', lbs: 75 },
      { id: 'piano-upright', name: 'Upright piano', lbs: 400 },
      { id: 'exercise-bike', name: 'Exercise bike', lbs: 90 },
    ],
  },
  {
    id: 'dining-room',
    name: 'Dining Room',
    items: [
      { id: 'dining-table', name: 'Dining table', lbs: 120 },
      { id: 'dining-chair', name: 'Dining chair', lbs: 15 },
      { id: 'china-hutch', name: 'China hutch / buffet', lbs: 150 },
      { id: 'bar-cart', name: 'Bar cart / sideboard', lbs: 50 },
      { id: 'dish-pack', name: 'Dish-pack box (china/glass)', lbs: 50 },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    items: [
      { id: 'refrigerator', name: 'Refrigerator', lbs: 250 },
      { id: 'range', name: 'Range / stove', lbs: 150 },
      { id: 'dishwasher', name: 'Dishwasher (portable)', lbs: 90 },
      { id: 'microwave', name: 'Microwave', lbs: 35 },
      { id: 'kitchen-table', name: 'Kitchen table (small)', lbs: 70 },
      { id: 'kitchen-chair', name: 'Kitchen chair / stool', lbs: 12 },
      { id: 'small-appliance', name: 'Small-appliance box', lbs: 40 },
      { id: 'pots-box', name: 'Pots & pans box', lbs: 45 },
    ],
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    items: [
      { id: 'king-set', name: 'King mattress + box spring', lbs: 180 },
      { id: 'queen-set', name: 'Queen mattress + box spring', lbs: 140 },
      { id: 'full-set', name: 'Full mattress + box spring', lbs: 120 },
      { id: 'twin-set', name: 'Twin mattress + box spring', lbs: 80 },
      { id: 'bed-frame', name: 'Bed frame / headboard', lbs: 90 },
      { id: 'dresser', name: 'Dresser', lbs: 120 },
      { id: 'nightstand', name: 'Nightstand', lbs: 30 },
      { id: 'wardrobe', name: 'Wardrobe / armoire', lbs: 175 },
      { id: 'wardrobe-box', name: 'Wardrobe box (hanging clothes)', lbs: 55 },
      { id: 'linen-box', name: 'Linens / clothing box', lbs: 35 },
    ],
  },
  {
    id: 'nursery',
    name: 'Nursery',
    items: [
      { id: 'crib', name: 'Crib', lbs: 50 },
      { id: 'changing-table', name: 'Changing table', lbs: 60 },
      { id: 'glider', name: 'Glider / rocker', lbs: 55 },
      { id: 'toy-box', name: 'Toy box', lbs: 35 },
      { id: 'stroller', name: 'Stroller', lbs: 25 },
    ],
  },
  {
    id: 'office',
    name: 'Office',
    items: [
      { id: 'desk', name: 'Desk', lbs: 80 },
      { id: 'office-chair', name: 'Office chair', lbs: 35 },
      { id: 'file-cabinet', name: 'File cabinet', lbs: 90 },
      { id: 'office-bookshelf', name: 'Bookshelf', lbs: 60 },
      { id: 'book-box', name: 'Book box (1.5 cu ft)', lbs: 40 },
      { id: 'printer', name: 'Printer', lbs: 30 },
    ],
  },
  {
    id: 'garage',
    name: 'Garage',
    items: [
      { id: 'washer', name: 'Washer', lbs: 160 },
      { id: 'dryer', name: 'Dryer', lbs: 125 },
      { id: 'workbench', name: 'Workbench', lbs: 150 },
      { id: 'tool-chest', name: 'Tool chest (rolling)', lbs: 200 },
      { id: 'bicycle', name: 'Bicycle', lbs: 30 },
      { id: 'treadmill', name: 'Treadmill', lbs: 200 },
      { id: 'riding-mower', name: 'Riding mower', lbs: 400 },
      { id: 'push-mower', name: 'Push mower', lbs: 70 },
      { id: 'shop-vac', name: 'Shop vac / power tools box', lbs: 50 },
    ],
  },
  {
    id: 'basement',
    name: 'Basement',
    items: [
      { id: 'deep-freezer', name: 'Chest / deep freezer', lbs: 175 },
      { id: 'storage-shelf', name: 'Storage shelving unit', lbs: 80 },
      { id: 'pool-table', name: 'Pool table', lbs: 700 },
      { id: 'weight-set', name: 'Weight set / rack', lbs: 300 },
      { id: 'storage-tote', name: 'Storage tote (full)', lbs: 35 },
    ],
  },
  {
    id: 'outdoor-patio',
    name: 'Outdoor / Patio',
    items: [
      { id: 'patio-table', name: 'Patio table', lbs: 80 },
      { id: 'patio-chair', name: 'Patio chair', lbs: 20 },
      { id: 'grill', name: 'Grill', lbs: 90 },
      { id: 'patio-set', name: 'Outdoor sofa / sectional', lbs: 130 },
      { id: 'planter', name: 'Planter (large, empty)', lbs: 30 },
      { id: 'garden-tools', name: 'Garden tools box', lbs: 45 },
    ],
  },
  {
    id: 'storage',
    name: 'Storage',
    items: [
      { id: 'med-box', name: 'Standard medium box', lbs: 35 },
      { id: 'lg-box', name: 'Large box', lbs: 45 },
      { id: 'book-box-storage', name: 'Book box (1.5 cu ft)', lbs: 40 },
      { id: 'holiday-tote', name: 'Holiday / seasonal tote', lbs: 35 },
      { id: 'luggage', name: 'Suitcase (packed)', lbs: 40 },
    ],
  },
]);

// Flatten the table to a fast id -> lbs map for the itemized summer.
export const ITEM_WEIGHT_BY_ID = Object.freeze(
  ROOMS.reduce((acc, room) => {
    for (const item of room.items) acc[item.id] = item.lbs;
    return acc;
  }, {}),
);

const toInt = (value, fallback = 0) => {
  const n = typeof value === 'string' ? Number(value.replace(/[,\s]/g, '')) : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/*
 * Quick-mode estimate: total = sum of per-room "fully furnished room"
 * counts × ROOM_AVERAGE_LBS. `roomCounts` is a map of any key -> count
 * (e.g. { 'living-room': 1, bedroom: 3 }). Negative/garbage counts are
 * clamped to 0. Returns a non-negative integer.
 */
export function quickEstimate(roomCounts = {}, roomAverageLbs = ROOM_AVERAGE_LBS) {
  const totalRooms = Object.values(roomCounts || {}).reduce((sum, raw) => {
    const n = Math.max(0, Math.floor(toInt(raw, 0)));
    return sum + n;
  }, 0);
  return totalRooms * roomAverageLbs;
}

/*
 * Itemized-mode estimate: total = sum(qty × per-item avg lbs).
 * `selections` is a map of itemId -> quantity. Unknown ids and
 * negative/garbage quantities contribute 0. Returns a non-negative integer.
 */
export function sumItemizedWeight(selections = {}, weightById = ITEM_WEIGHT_BY_ID) {
  return Object.entries(selections || {}).reduce((sum, [id, rawQty]) => {
    const lbs = weightById[id];
    if (!lbs) return sum;
    const qty = Math.max(0, Math.floor(toInt(rawQty, 0)));
    return sum + qty * lbs;
  }, 0);
}

/*
 * Excess weight over the authorized HHG allowance. Both inputs are
 * coerced to numbers; the result is clamped at 0 (never negative).
 */
export function excessWeight(estimatedWeightLbs, authorizedWeightLbs) {
  const est = Math.max(0, toInt(estimatedWeightLbs, 0));
  const auth = Math.max(0, toInt(authorizedWeightLbs, 0));
  return Math.max(0, est - auth);
}

/*
 * Cost of moving a `pct` (0..1) fraction of the shipment via PPM.
 * Pure weight-scaling helper so the Partial-PPM scenario weight is
 * unit-testable without React. Returns a non-negative integer lbs.
 */
export function partialMoveWeight(estimatedWeightLbs, pct) {
  const est = Math.max(0, toInt(estimatedWeightLbs, 0));
  const fraction = Math.min(1, Math.max(0, Number(pct)));
  if (!Number.isFinite(fraction)) return 0;
  return Math.round(est * fraction);
}

// Highest-cap paygrade in the shared HHG allowance tables (18,000 lb for
// both dependency states). We evaluate the GCC under this rank purely to
// read the weight-driven cost UNCAPPED up to 18,000 lb — see note below.
const UNCAPPED_GCC_RANK = 'O-6';
// Top of the GHC model's calibrated weight range; the shared GCC clamps to
// this anyway, so we mirror it here to keep the excess estimate in band.
const MAX_MODELED_WEIGHT_LBS = 18000;

/*
 * Government bill for EXCESS weight, using the caller-supplied GCC
 * function (we inject calculateGovernmentConstructiveCost so this stays
 * React-free and reuses the SAME coefficients as the rest of the app —
 * no money-math is re-implemented here).
 *
 * IMPORTANT: the shared calculateGovernmentConstructiveCost clamps weight to
 * the member's authorized cap (reimbursableWeightLbs = min(weight, cap)), so
 * calling it at the member's own rank with the full weight returns the SAME
 * GCC as the capped weight — the difference would always be $0. To price the
 * excess we evaluate the GCC UNCAPPED by forcing the highest-cap rank
 * (O-6, 18,000 lb), then take GCC(full) − GCC(authorized). That difference is
 * exactly the line-haul + per-cwt accessorial cost the SAME coefficients
 * assign to the weight above the member's cap. Returns >= 0.
 *
 *   gccFn:  ({ rank, withDependents, distanceMiles, estimatedWeightLbs }) =>
 *             { governmentConstructiveCost }
 */
export function estimateExcessGovernmentBill(gccFn, { withDependents, distanceMiles, estimatedWeightLbs, authorizedWeightLbs }) {
  if (typeof gccFn !== 'function') return 0;
  const est = Math.min(MAX_MODELED_WEIGHT_LBS, Math.max(0, toInt(estimatedWeightLbs, 0)));
  const auth = Math.max(0, toInt(authorizedWeightLbs, 0));
  if (est <= auth) return 0;
  // Evaluate uncapped (O-6 cap = 18,000) so the full weight is not clamped.
  const full = gccFn({ rank: UNCAPPED_GCC_RANK, withDependents, distanceMiles, estimatedWeightLbs: est });
  const capped = gccFn({ rank: UNCAPPED_GCC_RANK, withDependents, distanceMiles, estimatedWeightLbs: auth });
  const fullCost = Number(full?.governmentConstructiveCost) || 0;
  const cappedCost = Number(capped?.governmentConstructiveCost) || 0;
  return Math.max(0, fullCost - cappedCost);
}

/*
 * Approximate the Full-PPM break-even weight: the shipment weight at which
 * estimatedCashInPocket crosses $0. We scan weights with the injected
 * ppmFn (calculatePPMEstimate) and return the first weight where cash
 * flips sign. Returns { weight, alwaysPositive, alwaysNegative }.
 *
 *   ppmFn: ({ rank, withDependents, distanceMiles, estimatedWeightLbs }) =>
 *            { estimatedCashInPocket }
 */
export function findPpmBreakEvenWeight(ppmFn, { rank, withDependents, distanceMiles, maxWeightLbs = 18000, step = 250 }) {
  if (typeof ppmFn !== 'function') return { weight: null, alwaysPositive: false, alwaysNegative: false };
  const cashAt = (w) => Number(ppmFn({ rank, withDependents, distanceMiles, estimatedWeightLbs: w })?.estimatedCashInPocket) || 0;
  let prevSign = Math.sign(cashAt(0));
  for (let w = step; w <= maxWeightLbs; w += step) {
    const sign = Math.sign(cashAt(w));
    if (sign !== prevSign && sign !== 0) {
      return { weight: w, alwaysPositive: false, alwaysNegative: false };
    }
    prevSign = sign;
  }
  // No crossing in range — report which side it sits on at the top weight.
  const topPositive = cashAt(maxWeightLbs) >= 0;
  return { weight: null, alwaysPositive: topPositive, alwaysNegative: !topPositive };
}
