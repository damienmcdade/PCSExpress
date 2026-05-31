// OCONUS Bases Database
export const OCONUS_BASES = [
  // Europe
  {
    id: 'ramstein-ab',
    base_name: 'Ramstein Air Base',
    country: 'Germany',
    region: 'Europe',
    status: 'available',
    dod_diem: 128,
    tle_days: 60,
    hhg_allowance: 7500,
    notes: 'Major hub, frequent flights'
  },
  {
    id: 'lakenheath-ab',
    base_name: 'RAF Lakenheath',
    country: 'United Kingdom',
    region: 'Europe',
    status: 'available',
    dod_diem: 145,
    tle_days: 60,
    hhg_allowance: 8000,
    notes: 'Strong support services'
  },
  {
    id: 'lajes-ab',
    base_name: 'Lajes Field',
    country: 'Azores (Portugal)',
    region: 'Europe',
    status: 'available',
    dod_diem: 110,
    tle_days: 30,
    hhg_allowance: 5000,
    notes: 'Strategic location'
  },
  {
    id: 'spangdahlem-ab',
    base_name: 'Spangdahlem Air Base',
    country: 'Germany',
    region: 'Europe',
    status: 'available',
    dod_diem: 128,
    tle_days: 60,
    hhg_allowance: 7000,
    notes: 'Good local services'
  },

  // Pacific
  {
    id: 'kadena-ab',
    base_name: 'Kadena Air Base',
    country: 'Japan',
    region: 'Pacific',
    status: 'available',
    dod_diem: 135,
    tle_days: 90,
    hhg_allowance: 6500,
    notes: 'Largest overseas base'
  },
  {
    id: 'yokota-ab',
    base_name: 'Yokota Air Base',
    country: 'Japan',
    region: 'Pacific',
    status: 'available',
    dod_diem: 135,
    tle_days: 90,
    hhg_allowance: 6500,
    notes: 'Full service base'
  },
  {
    id: 'osan-ab',
    base_name: 'Osan Air Base',
    country: 'South Korea',
    region: 'Pacific',
    status: 'available',
    dod_diem: 125,
    tle_days: 60,
    hhg_allowance: 6000,
    notes: 'Combat support base'
  },
  {
    id: 'clark-ab',
    base_name: 'Clark Air Base',
    country: 'Philippines',
    region: 'Pacific',
    status: 'unavailable',
    dod_diem: 100,
    tle_days: 45,
    hhg_allowance: 5000,
    notes: 'Limited permanent party'
  },

  // Middle East
  {
    id: 'al-dhafra-ab',
    base_name: 'Al Dhafra Air Base',
    country: 'UAE',
    region: 'Middle East',
    status: 'available',
    dod_diem: 180,
    tle_days: 120,
    hhg_allowance: 8500,
    notes: 'Desert post, high allowances'
  },
  {
    id: 'arifjan-ab',
    base_name: 'Camp Arifjan',
    country: 'Kuwait',
    region: 'Middle East',
    status: 'available',
    dod_diem: 175,
    tle_days: 120,
    hhg_allowance: 8000,
    notes: 'Regional hub'
  },
  {
    id: 'qatar-ab',
    base_name: 'Al Udeid Air Base',
    country: 'Qatar',
    region: 'Middle East',
    status: 'available',
    dod_diem: 200,
    tle_days: 120,
    hhg_allowance: 9000,
    notes: 'High cost of living'
  },

  // Africa
  {
    id: 'djibouti-ab',
    base_name: 'Camp Lemonnier',
    country: 'Djibouti',
    region: 'Africa',
    status: 'available',
    dod_diem: 155,
    tle_days: 90,
    hhg_allowance: 7000,
    notes: 'Critical strategic location'
  },

  // Americas
  {
    id: 'howard-ab',
    base_name: 'Howard Air Force Base',
    country: 'Panama',
    region: 'Americas',
    status: 'unavailable',
    dod_diem: 115,
    tle_days: 60,
    hhg_allowance: 6000,
    notes: 'Limited personnel'
  },
  {
    id: 'guantanamo-bay',
    base_name: 'Naval Station Guantanamo Bay',
    country: 'Cuba',
    region: 'Americas',
    status: 'available',
    dod_diem: 140,
    tle_days: 30,
    hhg_allowance: 5500,
    notes: 'Family friendly'
  }
];

export const getDLAEstimate = (base) => {
  return base.dod_diem;
};

export const getTLEEstimate = (base, dependents) => {
  const dailyRate = base.dod_diem * 0.75; // 75% of DLA
  return dailyRate * base.tle_days * (1 + dependents * 0.2);
};

export const getHHGAllowance = (rank, dependents) => {
  const baseAllowance = {
    'E1-E4': 3500,
    'E5-E6': 5000,
    'E7-E8': 6500,
    'E9': 7500,
    'O1-O2': 6000,
    'O3-O4': 8000,
    'O5+': 10000
  };
  
  const base = baseAllowance[rank] || 5000;
  return base * (1 + dependents * 0.15); // 15% per dependent
};
