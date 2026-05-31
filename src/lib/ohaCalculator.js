/*
 * OHA Calculator — Overseas Housing Allowance reference data + math.
 * OHA is a rent-cap allowance (not flat-rate like BAH). Members pay rent and
 * are reimbursed up to the OHA cap for their grade / location / dependency
 * status, plus a separate utility allowance and one-time MIHA.
 *
 * This module mirrors the shape of src/lib/bahCalculator.js: a hardcoded
 * rate table plus pure lookup functions. The OHACalculatorTab component
 * imports from here so the math can be unit-tested independently of JSX.
 *
 * Source / freshness: see DATA_VERSIONS.oha in src/config/dataVersions.js
 * (OHA rates publish quarterly; values here pin to a specific quarterly drop).
 */

// Pay grade ordering used by the OHA table. Includes the O-#E variants for
// officers with prior enlisted service, since DTMO publishes those rows
// separately for OHA. Distinct from BAH_PAY_GRADES (which omits the E rows).
export const OHA_PAY_GRADES = [
  'E-1','E-2','E-3','E-4','E-5','E-6','E-7','E-8','E-9',
  'W-1','W-2','W-3','W-4','W-5',
  'O-1','O-1E','O-2','O-2E','O-3','O-3E','O-4','O-5','O-6','O-7','O-8','O-9','O-10',
];

// Representative OHA monthly rent caps (USD) — PLANNING ESTIMATES, not
// authoritative. Unlike BAH (which was reconciled to DTMO's published bulk
// table — see docs/BAH_RECONCILIATION.md), OHA is NOT published as a
// verifiable bulk file: rates are set per specific locality and change
// monthly/quarterly with rent surveys + exchange rates, and the only
// authoritative source is DTMO's interactive OHA Rate Lookup (which blocks
// scraping). These values approximate the regional ceiling for planning; the
// UI surfaces them as estimates and links the official lookup. See
// docs/REFERENCE_VALUES_TODO.md.
// Values shown are rent caps — you may receive up to this amount if your
// actual rent equals or exceeds it.
// W/ DEPS = with at least one dependent; W/O DEPS = without dependents.
export const OHA_REGIONS = {
  'Germany (Kaiserslautern / Ramstein)': {
    flag: '🇩🇪',
    installations: ['Ramstein AB','Kaiserslautern','Landstuhl','Baumholder'],
    rates: {
      'E-1': [870, 720], 'E-2': [870, 720], 'E-3': [970, 800], 'E-4': [1050, 870],
      'E-5': [1290, 1050], 'E-6': [1500, 1220], 'E-7': [1690, 1380], 'E-8': [1900, 1540], 'E-9': [2090, 1700],
      'W-1': [1640, 1340], 'W-2': [1780, 1450], 'W-3': [1950, 1590], 'W-4': [2110, 1720], 'W-5': [2260, 1840],
      'O-1': [1560, 1260], 'O-1E': [1640, 1340], 'O-2': [1730, 1410], 'O-2E': [1820, 1480],
      'O-3': [2020, 1640], 'O-3E': [2110, 1720], 'O-4': [2290, 1870], 'O-5': [2540, 2070],
      'O-6': [2890, 2360], 'O-7': [3200, 2610], 'O-8': [3550, 2890], 'O-9': [3900, 3180], 'O-10': [4270, 3480],
    },
    miha: { moving: 1800, onetime: 750 },
    utilityRate: 280,
    notes: 'Kaiserslautern Military Community (KMC) encompasses Ramstein AB, Sembach, Vogelweh, Kapaun. KMC is the largest US military community in Europe.',
  },
  'Germany (Stuttgart)': {
    flag: '🇩🇪',
    installations: ['USAG Stuttgart','Patch Barracks','Kelley Barracks','Robinson Barracks'],
    rates: {
      'E-1': [960, 790], 'E-2': [960, 790], 'E-3': [1060, 880], 'E-4': [1160, 960],
      'E-5': [1420, 1160], 'E-6': [1650, 1350], 'E-7': [1860, 1520], 'E-8': [2090, 1710], 'E-9': [2300, 1880],
      'W-1': [1810, 1480], 'W-2': [1960, 1600], 'W-3': [2150, 1760], 'W-4': [2330, 1900], 'W-5': [2500, 2040],
      'O-1': [1720, 1410], 'O-1E': [1810, 1480], 'O-2': [1910, 1560], 'O-2E': [2010, 1640],
      'O-3': [2230, 1820], 'O-3E': [2330, 1900], 'O-4': [2530, 2060], 'O-5': [2810, 2290],
      'O-6': [3190, 2600], 'O-7': [3540, 2890], 'O-8': [3920, 3200], 'O-9': [4310, 3520], 'O-10': [4720, 3850],
    },
    miha: { moving: 1900, onetime: 800 },
    utilityRate: 310,
    notes: 'USAG Stuttgart hosts AFRICOM and EUCOM HQ. Housing market is competitive; apply early through the housing office.',
  },
  'Germany (Grafenwoehr / Vilseck / Ansbach)': {
    flag: '🇩🇪',
    installations: ['Grafenwoehr','Vilseck','Tower Barracks','Ansbach','Katterbach Kaserne'],
    rates: {
      'E-1': [780, 640], 'E-2': [780, 640], 'E-3': [870, 720], 'E-4': [950, 780],
      'E-5': [1160, 940], 'E-6': [1350, 1100], 'E-7': [1520, 1240], 'E-8': [1710, 1390], 'E-9': [1880, 1530],
      'W-1': [1470, 1200], 'W-2': [1600, 1300], 'W-3': [1750, 1430], 'W-4': [1900, 1550], 'W-5': [2040, 1660],
      'O-1': [1390, 1140], 'O-1E': [1470, 1200], 'O-2': [1640, 1340], 'O-2E': [1720, 1400],
      'O-3': [1910, 1560], 'O-3E': [2000, 1640], 'O-4': [2170, 1770], 'O-5': [2410, 1960],
      'O-6': [2740, 2240], 'O-7': [3040, 2480], 'O-8': [3370, 2750], 'O-9': [3700, 3020], 'O-10': [4060, 3310],
    },
    miha: { moving: 1600, onetime: 700 },
    utilityRate: 260,
    notes: 'Grafenwoehr / Vilseck are primary armored training areas. Most soldiers live in on-post housing or nearby German communities.',
  },
  'South Korea (Camp Humphreys)': {
    flag: '🇰🇷',
    installations: ['USAG Humphreys','Camp Humphreys','Pyeongtaek'],
    rates: {
      'E-1': [680, 560], 'E-2': [680, 560], 'E-3': [760, 620], 'E-4': [830, 680],
      'E-5': [1010, 820], 'E-6': [1170, 950], 'E-7': [1320, 1070], 'E-8': [1480, 1210], 'E-9': [1630, 1330],
      'W-1': [1280, 1040], 'W-2': [1380, 1130], 'W-3': [1520, 1240], 'W-4': [1650, 1340], 'W-5': [1770, 1440],
      'O-1': [1200, 980], 'O-1E': [1280, 1040], 'O-2': [1420, 1160], 'O-2E': [1500, 1220],
      'O-3': [1660, 1350], 'O-3E': [1750, 1420], 'O-4': [1890, 1540], 'O-5': [2100, 1710],
      'O-6': [2390, 1950], 'O-7': [2650, 2160], 'O-8': [2940, 2400], 'O-9': [3230, 2630], 'O-10': [3540, 2890],
    },
    miha: { moving: 1200, onetime: 500 },
    utilityRate: 180,
    notes: 'Camp Humphreys (USAG Humphreys) is the largest US overseas military installation. Most families live on-post. SOFA governs housing rights.',
  },
  'South Korea (Osan AB)': {
    flag: '🇰🇷',
    installations: ['Osan AB','Camp Osan','51st FW'],
    rates: {
      'E-1': [640, 520], 'E-2': [640, 520], 'E-3': [710, 580], 'E-4': [780, 640],
      'E-5': [950, 770], 'E-6': [1100, 900], 'E-7': [1240, 1010], 'E-8': [1390, 1130], 'E-9': [1530, 1250],
      'W-1': [1200, 980], 'W-2': [1300, 1060], 'W-3': [1430, 1160], 'W-4': [1550, 1260], 'W-5': [1660, 1360],
      'O-1': [1130, 920], 'O-1E': [1200, 980], 'O-2': [1340, 1090], 'O-2E': [1410, 1150],
      'O-3': [1560, 1270], 'O-3E': [1640, 1340], 'O-4': [1780, 1450], 'O-5': [1970, 1610],
      'O-6': [2240, 1830], 'O-7': [2490, 2030], 'O-8': [2760, 2250], 'O-9': [3030, 2470], 'O-10': [3320, 2710],
    },
    miha: { moving: 1100, onetime: 480 },
    utilityRate: 170,
    notes: 'Osan AB is the primary USAF installation in South Korea. Limited off-post housing; most airmen live in on-post quarters.',
  },
  'Japan (Yokosuka / Yokohama)': {
    flag: '🇯🇵',
    installations: ['Naval Station Yokosuka','Camp Zama','Yokohama NAF','Sagamihara'],
    rates: {
      'E-1': [840, 690], 'E-2': [840, 690], 'E-3': [930, 760], 'E-4': [1020, 840],
      'E-5': [1250, 1010], 'E-6': [1450, 1180], 'E-7': [1630, 1330], 'E-8': [1830, 1490], 'E-9': [2020, 1640],
      'W-1': [1570, 1280], 'W-2': [1710, 1390], 'W-3': [1870, 1530], 'W-4': [2030, 1650], 'W-5': [2180, 1780],
      'O-1': [1490, 1210], 'O-1E': [1570, 1280], 'O-2': [1760, 1430], 'O-2E': [1840, 1500],
      'O-3': [2050, 1670], 'O-3E': [2130, 1740], 'O-4': [2310, 1880], 'O-5': [2570, 2090],
      'O-6': [2920, 2380], 'O-7': [3240, 2640], 'O-8': [3590, 2930], 'O-9': [3950, 3220], 'O-10': [4330, 3530],
    },
    miha: { moving: 1600, onetime: 700 },
    utilityRate: 240,
    notes: 'NS Yokosuka is the largest US naval installation in the Pacific. Yokohama NAF serves the Camp Zama Army community.',
  },
  'Japan (Okinawa — Kadena / Camp Foster)': {
    flag: '🇯🇵',
    installations: ['Kadena AB','Camp Foster','Camp Butler','MCB Butler','MCAS Futenma','Torii Station','Camp Courtney','Camp Hansen','Camp Schwab'],
    rates: {
      'E-1': [770, 630], 'E-2': [770, 630], 'E-3': [860, 700], 'E-4': [940, 770],
      'E-5': [1140, 930], 'E-6': [1330, 1080], 'E-7': [1490, 1220], 'E-8': [1680, 1370], 'E-9': [1850, 1510],
      'W-1': [1440, 1170], 'W-2': [1560, 1270], 'W-3': [1710, 1400], 'W-4': [1860, 1510], 'W-5': [1990, 1620],
      'O-1': [1370, 1110], 'O-1E': [1440, 1170], 'O-2': [1610, 1310], 'O-2E': [1690, 1380],
      'O-3': [1880, 1530], 'O-3E': [1960, 1600], 'O-4': [2120, 1730], 'O-5': [2360, 1920],
      'O-6': [2680, 2190], 'O-7': [2980, 2430], 'O-8': [3300, 2690], 'O-9': [3630, 2960], 'O-10': [3970, 3240],
    },
    miha: { moving: 1400, onetime: 600 },
    utilityRate: 210,
    notes: 'Okinawa hosts the largest concentration of US forces in Japan. Off-post housing is plentiful but requires coordination with the housing office and landlord agreements.',
  },
  'Japan (Misawa / Yokota)': {
    flag: '🇯🇵',
    installations: ['Misawa AB','Yokota AB','Atsugi NAF','Iwakuni MCAS','MCAS Iwakuni'],
    rates: {
      'E-1': [720, 590], 'E-2': [720, 590], 'E-3': [800, 650], 'E-4': [880, 720],
      'E-5': [1070, 870], 'E-6': [1240, 1010], 'E-7': [1400, 1140], 'E-8': [1570, 1280], 'E-9': [1730, 1410],
      'W-1': [1350, 1100], 'W-2': [1470, 1200], 'W-3': [1610, 1310], 'W-4': [1740, 1420], 'W-5': [1870, 1530],
      'O-1': [1280, 1040], 'O-1E': [1350, 1100], 'O-2': [1510, 1230], 'O-2E': [1590, 1300],
      'O-3': [1760, 1440], 'O-3E': [1840, 1500], 'O-4': [2000, 1630], 'O-5': [2220, 1810],
      'O-6': [2520, 2060], 'O-7': [2800, 2280], 'O-8': [3100, 2530], 'O-9': [3410, 2780], 'O-10': [3730, 3040],
    },
    miha: { moving: 1300, onetime: 560 },
    utilityRate: 195,
    notes: 'Misawa and Yokota are primary USAF installations on Honshu. Yokota hosts USFJ HQ and 374 AW.',
  },
  'Italy (Vicenza / Naples)': {
    flag: '🇮🇹',
    installations: ['Caserma Ederle (Vicenza)','Del Din (Vicenza)','NSA Naples','Camp Darby'],
    rates: {
      'E-1': [900, 740], 'E-2': [900, 740], 'E-3': [1000, 820], 'E-4': [1100, 900],
      'E-5': [1340, 1090], 'E-6': [1560, 1270], 'E-7': [1750, 1430], 'E-8': [1970, 1610], 'E-9': [2170, 1770],
      'W-1': [1700, 1380], 'W-2': [1840, 1500], 'W-3': [2020, 1650], 'W-4': [2190, 1790], 'W-5': [2350, 1920],
      'O-1': [1610, 1320], 'O-1E': [1700, 1380], 'O-2': [1890, 1540], 'O-2E': [1990, 1620],
      'O-3': [2210, 1800], 'O-3E': [2320, 1890], 'O-4': [2510, 2050], 'O-5': [2790, 2270],
      'O-6': [3170, 2590], 'O-7': [3520, 2870], 'O-8': [3900, 3180], 'O-9': [4290, 3500], 'O-10': [4700, 3830],
    },
    miha: { moving: 1700, onetime: 730 },
    utilityRate: 290,
    notes: 'Vicenza is the home of SETAF-AF and 173rd Airborne. NSA Naples (Capodichino) supports 6th Fleet HQ. Italian housing market is competitive.',
  },
  'Spain (Rota)': {
    flag: '🇪🇸',
    installations: ['Naval Station Rota','NS Rota','Morón AB'],
    rates: {
      'E-1': [820, 670], 'E-2': [820, 670], 'E-3': [910, 750], 'E-4': [1000, 820],
      'E-5': [1220, 990], 'E-6': [1420, 1150], 'E-7': [1590, 1300], 'E-8': [1790, 1460], 'E-9': [1970, 1610],
      'W-1': [1540, 1260], 'W-2': [1680, 1370], 'W-3': [1840, 1500], 'W-4': [1990, 1620], 'W-5': [2140, 1740],
      'O-1': [1460, 1190], 'O-1E': [1540, 1260], 'O-2': [1720, 1400], 'O-2E': [1810, 1470],
      'O-3': [2010, 1640], 'O-3E': [2100, 1710], 'O-4': [2280, 1860], 'O-5': [2530, 2060],
      'O-6': [2880, 2350], 'O-7': [3200, 2610], 'O-8': [3550, 2890], 'O-9': [3900, 3180], 'O-10': [4280, 3490],
    },
    miha: { moving: 1500, onetime: 640 },
    utilityRate: 230,
    notes: 'NS Rota is the premier US naval facility in southern Europe. Most families live in the nearby Spanish towns of El Puerto de Santa María and Jerez.',
  },
  'Bahrain (NSA Bahrain)': {
    flag: '🇧🇭',
    installations: ['NSA Bahrain','5th Fleet HQ','NAVCENT','Manama'],
    rates: {
      'E-1': [1050, 860], 'E-2': [1050, 860], 'E-3': [1160, 950], 'E-4': [1280, 1050],
      'E-5': [1560, 1270], 'E-6': [1810, 1480], 'E-7': [2030, 1660], 'E-8': [2290, 1870], 'E-9': [2520, 2060],
      'W-1': [1970, 1610], 'W-2': [2140, 1750], 'W-3': [2340, 1910], 'W-4': [2540, 2070], 'W-5': [2730, 2230],
      'O-1': [1860, 1520], 'O-1E': [1970, 1610], 'O-2': [2200, 1790], 'O-2E': [2310, 1890],
      'O-3': [2560, 2090], 'O-3E': [2690, 2190], 'O-4': [2920, 2380], 'O-5': [3240, 2640],
      'O-6': [3680, 3000], 'O-7': [4090, 3340], 'O-8': [4540, 3700], 'O-9': [4990, 4070], 'O-10': [5470, 4460],
    },
    miha: { moving: 2000, onetime: 850 },
    utilityRate: 320,
    notes: 'NSA Bahrain hosts NAVCENT and 5th Fleet. Housing market is premium. Most senior families live in compound or villa housing.',
  },
  'Guam (Andersen AFB / NS Guam)': {
    flag: '🇬🇺',
    installations: ['Andersen AFB','Naval Base Guam','JRM Guam','Naval Station Guam'],
    rates: {
      'E-1': [1100, 900], 'E-2': [1100, 900], 'E-3': [1220, 1000], 'E-4': [1340, 1100],
      'E-5': [1640, 1330], 'E-6': [1900, 1550], 'E-7': [2140, 1740], 'E-8': [2400, 1960], 'E-9': [2650, 2160],
      'W-1': [2070, 1690], 'W-2': [2250, 1840], 'W-3': [2460, 2010], 'W-4': [2670, 2180], 'W-5': [2870, 2340],
      'O-1': [1960, 1600], 'O-1E': [2070, 1690], 'O-2': [2310, 1890], 'O-2E': [2430, 1980],
      'O-3': [2690, 2200], 'O-3E': [2830, 2310], 'O-4': [3070, 2500], 'O-5': [3410, 2780],
      'O-6': [3880, 3160], 'O-7': [4300, 3510], 'O-8': [4770, 3890], 'O-9': [5250, 4280], 'O-10': [5750, 4690],
    },
    miha: { moving: 2100, onetime: 900 },
    utilityRate: 380,
    notes: 'Guam uses OHA (not BAH) as a non-foreign OCONUS location. High housing costs and limited inventory. Apply early — wait lists are common.',
  },
};

export const OHA_REGION_KEYS = Object.keys(OHA_REGIONS);

export function formatCurrencyOHA(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

// Heuristic: guess the OHA region from a gaining-installation string. Keyword
// match against installation aliases. Returns '' when no region recognized.
export function detectOHARegion(installationName) {
  if (!installationName) return '';
  const name = installationName.toLowerCase();
  if (name.includes('humphreys') || name.includes('daegu') || name.includes('yongsan') || name.includes('walker') || name.includes('casey')) return 'South Korea (Camp Humphreys)';
  if (name.includes('osan')) return 'South Korea (Osan AB)';
  if (name.includes('yokosuka') || name.includes('zama') || name.includes('sagamihara') || name.includes('yokohama')) return 'Japan (Yokosuka / Yokohama)';
  if (name.includes('okinawa') || name.includes('kadena') || name.includes('foster') || name.includes('butler') || name.includes('futenma') || name.includes('torii') || name.includes('courtney') || name.includes('hansen') || name.includes('schwab')) return 'Japan (Okinawa — Kadena / Camp Foster)';
  if (name.includes('misawa') || name.includes('yokota') || name.includes('atsugi') || name.includes('iwakuni')) return 'Japan (Misawa / Yokota)';
  if (name.includes('ramstein') || name.includes('kaiserslautern') || name.includes('landstuhl') || name.includes('baumholder')) return 'Germany (Kaiserslautern / Ramstein)';
  if (name.includes('stuttgart') || name.includes('patch') || name.includes('kelley') || name.includes('robinson')) return 'Germany (Stuttgart)';
  if (name.includes('grafenwoehr') || name.includes('vilseck') || name.includes('ansbach') || name.includes('katterbach') || name.includes('tower barracks')) return 'Germany (Grafenwoehr / Vilseck / Ansbach)';
  if (name.includes('wiesbaden') || name.includes('spangdahlem') || name.includes('baumholder') || name.includes('germany')) return 'Germany (Kaiserslautern / Ramstein)';
  if (name.includes('vicenza') || name.includes('naples') || name.includes('aviano') || name.includes('sigonella') || name.includes('italy')) return 'Italy (Vicenza / Naples)';
  if (name.includes('rota') || name.includes('moron') || name.includes('spain')) return 'Spain (Rota)';
  if (name.includes('bahrain') || name.includes('navcent') || name.includes('manama')) return 'Bahrain (NSA Bahrain)';
  if (name.includes('guam') || name.includes('andersen')) return 'Guam (Andersen AFB / NS Guam)';
  return '';
}

// Returns the [withDeps, withoutDeps] rate pair for a region+grade, or null
// if either key is unknown. Components can derive the with/without rent cap.
export function getOHAGradeRates(region, payGrade) {
  const regionData = OHA_REGIONS[region];
  if (!regionData) return null;
  return regionData.rates[payGrade] || null;
}

// Scalar OHA rent cap for (region, grade, withDeps). Mirrors getBAHRate().
export function getOHARate(region, payGrade, withDeps) {
  const pair = getOHAGradeRates(region, payGrade);
  if (!pair) return null;
  return withDeps ? pair[0] : pair[1];
}
