/*
 * BAH Entitlement Calculator — 2026 DoD rate tables.
 * Pay grade E-1 through O-10, dependency status, duty station lookup.
 */
import { useState, useMemo } from 'react';
import DataFreshnessFooter from './DataFreshnessFooter';
import { CalculatorResultLabel, PlanningAidDisclaimer } from './CalculatorResultLabel';
import {
  BAH_PAY_GRADES,
  getBAHRate,
  getMHAForInstallation,
  isOCONUS,
  isEstimatedMHA,
  formatCurrencyBAH,
  INSTALLATION_MHA_MAP,
} from '../lib/bahCalculator';
import CopyableText from './CopyableText';

const fieldStyle = {
  width: '100%',
  border: '1px solid #D8DEE7',
  borderRadius: 12,
  padding: '11px 12px',
  fontSize: 14,
  color: '#111827',
  background: '#FFFFFF',
  boxSizing: 'border-box',
  appearance: 'auto',
};

// All installations from the main app list for the duty station picker
const ALL_INSTALLATIONS = [
  'Anniston Army Depot','Fort Novosel','Redstone Arsenal','Fort Huachuca','Yuma Proving Ground',
  'Pine Bluff Arsenal','Camp Parks','Fort Hunter Liggett','Fort Irwin','Presidio of Monterey (DLI)',
  'Fort Carson','USAG Miami','Fort Moore','Fort Benning','Fort Eisenhower','Fort Gordon',
  'Fort Stewart','Hunter Army Airfield','Rock Island Arsenal','Fort Leavenworth','Fort Riley',
  'Fort Campbell','Fort Knox','Fort Johnson','Fort Polk','Aberdeen Proving Ground',
  'Fort Detrick','Fort Meade','Fort George G. Meade','Natick Soldier Systems Center',
  'Detroit Arsenal','Fort Leonard Wood','Picatinny Arsenal','White Sands Missile Range',
  'Fort Drum','Fort Hamilton','West Point (USMA)','Fort Liberty','Fort Bragg','Pope Army Airfield',
  'Fort Sill','Carlisle Barracks','Tobyhanna Army Depot','Fort Buchanan','Fort Jackson',
  'Fort Bliss','Fort Cavazos','Fort Hood','Fort Sam Houston','Red River Army Depot',
  'Dugway Proving Ground','Fort Belvoir','Fort Gregg-Adams','Fort Lee','Fort Myer (JBM-HH)',
  'Fort McCoy','Schofield Barracks','Fort Shafter','Fort Richardson','Fort Wainwright','Fort Greely',
  'USAG Humphreys','Camp Humphreys','USAG Daegu',
  // Navy
  'Naval Station Norfolk','NAS Oceana','NS Portsmouth','NS Norfolk','NS Mayport','NAS Jacksonville',
  'NAS Pensacola','NS Pensacola','NS Great Lakes','NAS Whidbey Island','NS Bremerton',
  'NAS North Island','NS San Diego','NAS Lemoore','NS Everett','Naval Station Pearl Harbor',
  'NS Pearl Harbor','NAS Barbers Point','NS Guantanamo Bay','NS Rota',
  // Marine Corps
  'MCB Camp Lejeune','Camp Lejeune','MCAS Cherry Point','MCB Camp Pendleton','Camp Pendleton CA',
  'MCAS Miramar','MCB Quantico','MCAS Quantico','Marine Corps Base Quantico',
  'MCAS Beaufort','MCB Hawaii','MCAS Kaneohe Bay','MCAS Iwakuni','MCAS Futenma','MCB Butler',
  // Air Force / Space Force
  'Langley AFB','Eglin AFB','Tyndall AFB','Hurlburt Field','Keesler AFB','Maxwell AFB',
  'Gunter Annex','Robins AFB','Moody AFB','Shaw AFB','Seymour Johnson AFB','Pope AFB',
  'Wright-Patterson AFB','Scott AFB','MacDill AFB','Patrick SFB','Cape Canaveral SFS',
  'Peterson SFB','Schriever SFB','Buckley SFB','F.E. Warren AFB','Ellsworth AFB',
  'Malmstrom AFB','Minot AFB','Grand Forks AFB','Offutt AFB','Whiteman AFB','Barksdale AFB',
  'Sheppard AFB','Dyess AFB','Goodfellow AFB','Laughlin AFB','Lackland AFB','Randolph AFB',
  'Joint Base San Antonio','Hill AFB','Mountain Home AFB','Kirtland AFB','Holloman AFB',
  'Cannon AFB','Nellis AFB','Creech AFB','Travis AFB','Beale AFB','Edwards AFB',
  'Vandenberg SFB','March ARB','Luke AFB','Davis-Monthan AFB','Fairchild AFB','McChord AFB',
  'Joint Base Lewis-McChord','Elmendorf AFB','Eielson AFB','Hickam AFB',
  // Coast Guard
  'USCG Base Alameda','USCG Base Boston','USCG Base Cape Cod','USCG Base Charleston',
  'USCG Base Cleveland','USCG Base Elizabeth City','USCG Base Honolulu','USCG Base Miami',
  'USCG Base New Orleans','USCG Base Portsmouth','USCG Base Seattle',
  'USCG Training Center Cape May','USCG Training Center Yorktown',
].sort((a, b) => a.localeCompare(b));

// Remove duplicates
const DUTY_STATION_OPTIONS = [...new Set(ALL_INSTALLATIONS)].sort((a, b) => a.localeCompare(b));

function RateCard({ label, value, note, highlight }) {
  return (
    <div style={{
      background: highlight ? '#E8F5E9' : '#FFFFFF',
      border: `1.5px solid ${highlight ? '#A5D6A7' : '#E0E6EE'}`,
      borderRadius: 14,
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 950, color: highlight ? '#2E7D32' : '#0D1821', lineHeight: 1.1 }}>{value}</div>
      {note && <div style={{ fontSize: 11, color: '#56697C', marginTop: 6, lineHeight: 1.45 }}>{note}</div>}
    </div>
  );
}

export default function BAHCalculatorTab({ theme, profile }) {
  // Determine default duty station from profile gaining installation
  const profileGaining = profile?.gainingInstallation || profile?.gaining || '';

  const [payGrade, setPayGrade] = useState(profile?.paygrade || 'E-5');
  // Auto-derive initial dependent count from onboarding profile:
  //   spouse (hasDependents) + each child in childAges.
  // BAH only distinguishes "with deps" vs "without deps" for the rate
  // calculation, but the dropdown is shown in the UI so we default it
  // to the user's actual dependent count for transparency.
  const _initialDeps = useMemo(() => {
    const fromProfile = (profile?.hasDependents ? 1 : 0) + (Array.isArray(profile?.childAges) ? profile.childAges.filter(a => a !== '' && !isNaN(Number(a))).length : 0);
    return String(Math.min(fromProfile, 4));
  }, [profile?.hasDependents, profile?.childAges]);
  const [dependents, setDependents] = useState(_initialDeps);
  const _depsAutoFilled = dependents === _initialDeps && _initialDeps !== '0';
  const [dutyStation, setDutyStation] = useState(profileGaining);
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const numDeps = parseInt(dependents, 10) || 0;
  const withDeps = numDeps > 0;

  const oconus = dutyStation ? isOCONUS(dutyStation) : false;
  const mha = dutyStation ? getMHAForInstallation(dutyStation) : null;
  const mhaIsEstimate = mha ? isEstimatedMHA(mha) : false;

  const withRate = useMemo(() => getBAHRate(dutyStation, payGrade, true), [dutyStation, payGrade]);
  const withoutRate = useMemo(() => getBAHRate(dutyStation, payGrade, false), [dutyStation, payGrade]);
  const userRate = useMemo(() => getBAHRate(dutyStation, payGrade, withDeps), [dutyStation, payGrade, withDeps]);

  const filteredStations = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return DUTY_STATION_OPTIONS;
    return DUTY_STATION_OPTIONS.filter(s => s.toLowerCase().includes(q));
  }, [search]);

  const knownRate = withRate !== null;

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ background: theme.secondary, borderRadius: 18, padding: 16, marginBottom: 14, color: '#FFFFFF', border: `1px solid ${theme.accent}55` }}>
        <div style={{ fontSize: 10, fontWeight: 950, color: theme.accent, letterSpacing: '.16em', marginBottom: 6 }}>BAH ENTITLEMENT CALCULATOR</div>
        <div style={{ fontSize: 17, fontWeight: 950, marginBottom: 6 }}>Basic Allowance for Housing — 2026 Rates</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)' }}>
          Calculates your monthly BAH by pay grade, dependency status, and duty station. Rates are effective 1 January 2026 per DTMO published tables. BAH does not increase based on number of dependents — only whether you have at least one.
        </div>
      </div>

      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary }}>
          PAY GRADE
          <select value={payGrade} onChange={e => setPayGrade(e.target.value)} style={{ ...fieldStyle, marginTop: 5 }}>
            {BAH_PAY_GRADES.map(pg => <option key={pg} value={pg}>{pg}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary }}>
          DEPENDENTS
          <select value={dependents} onChange={e => setDependents(e.target.value)} style={{ ...fieldStyle, marginTop: 5 }}>
            <option value="0">0 — No dependents</option>
            <option value="1">1 dependent</option>
            <option value="2">2 dependents</option>
            <option value="3">3 dependents</option>
            <option value="4">4+ dependents</option>
          </select>
          {_depsAutoFilled && (
            <div style={{ fontSize: 10, color: '#2E7D32', marginTop: 4, fontWeight: 700 }}>
              ✓ Auto-filled from profile{(profile?.hasDependents || (profile?.childAges?.length > 0)) ? ` (${profile.hasDependents ? 'spouse' : ''}${profile.hasDependents && profile.childAges?.length > 0 ? ' + ' : ''}${profile.childAges?.length > 0 ? `${profile.childAges.length} child${profile.childAges.length > 1 ? 'ren' : ''}` : ''})` : ''}
            </div>
          )}
        </label>
      </div>

      {/* Duty Station Picker */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: theme.primary, marginBottom: 5 }}>GAINING DUTY STATION</div>
        {profileGaining && !showPicker && dutyStation === profileGaining && (
          <div style={{ fontSize: 11, color: '#56697C', marginBottom: 6 }}>
            Auto-filled from your profile: <strong>{profileGaining}</strong>
            <button onClick={() => setShowPicker(true)} style={{ marginLeft: 10, fontSize: 11, color: theme.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}>Change</button>
          </div>
        )}
        {(!profileGaining || showPicker || dutyStation !== profileGaining) && (
          <div>
            <input
              placeholder="Search duty station..."
              value={search || dutyStation}
              onChange={e => { setSearch(e.target.value); setShowPicker(true); }}
              onFocus={() => setShowPicker(true)}
              style={{ ...fieldStyle, marginBottom: 6 }}
            />
            {showPicker && (
              <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                {filteredStations.slice(0, 80).map(s => (
                  <div
                    key={s}
                    onClick={() => { setDutyStation(s); setSearch(''); setShowPicker(false); }}
                    style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #F3F4F6', background: s === dutyStation ? '#EEF5FF' : '#FFF', color: '#111827', fontWeight: s === dutyStation ? 700 : 400 }}
                  >
                    {s}
                    {INSTALLATION_MHA_MAP[s] && <span style={{ fontSize: 10, color: '#888', marginLeft: 8 }}>({INSTALLATION_MHA_MAP[s]})</span>}
                  </div>
                ))}
                {filteredStations.length === 0 && (
                  <div style={{ padding: 14, color: '#888', fontSize: 12 }}>No matching installations found</div>
                )}
              </div>
            )}
          </div>
        )}
        {dutyStation && !showPicker && (
          <div style={{ background: '#F0F4FF', border: '1px solid #C7D7F5', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#1A3A5C', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>{dutyStation}</strong>{mha && <span style={{ color: '#56697C', fontWeight: 400 }}> · MHA: {mha}</span>}</span>
            <button onClick={() => { setShowPicker(true); setSearch(''); }} style={{ background: 'none', border: 'none', color: theme.primary, fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>Change</button>
          </div>
        )}
      </div>

      {/* Results */}
      {!dutyStation && (
        <div style={{ background: '#F8F9FA', borderRadius: 14, padding: 20, textAlign: 'center', color: '#56697C', fontSize: 13 }}>
          Select a duty station above to calculate your BAH entitlement.
        </div>
      )}

      {dutyStation && oconus && (
        <div style={{ background: '#FFF3E0', border: '1.5px solid #FFB74D', borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#E65100', marginBottom: 4 }}>OCONUS Assignment — OHA Applies (not BAH)</div>
          <div style={{ fontSize: 12, color: '#6D4C00', lineHeight: 1.6, marginBottom: 12 }}>
            <strong>{dutyStation}</strong> is overseas. Members assigned OCONUS receive <strong>Overseas Housing Allowance (OHA)</strong>, <strong>Move-In Housing Allowance (MIHA)</strong>, and a <strong>Utility / Recurring Maintenance Allowance</strong> — not BAH. Civilians receive <strong>Living Quarters Allowance (LQA)</strong> under DSSR §130. Rates depend on the specific city/locality, pay grade, and dependency status; look them up at DTMO and confirm with the gaining housing office.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
            {[
              { name: 'DTMO — OHA rate lookup',                  url: 'https://www.defensetravel.dod.mil/site/oha.cfm',                          who: 'Military', desc: 'Look up the current OHA rent ceiling and utility/recurring maintenance allowance for your specific overseas locality.' },
              { name: 'DTMO — MIHA overview',                    url: 'https://www.travel.dod.mil/Allowances/Overseas-Housing-Allowance/',       who: 'Military', desc: 'Move-In Housing Allowance components: MIHA-Rent, MIHA-Security, MIHA-Miscellaneous — one-time payments for OCONUS move-in.' },
              { name: 'DTMO — COLA lookup',                      url: 'https://www.travel.dod.mil/Allowances/Cost-of-Living-Allowance/',         who: 'Military', desc: 'Cost-of-Living Allowance (COLA) for high-cost OCONUS localities. Paid in addition to OHA/MIHA. Adjusted twice per month.' },
              { name: 'DSSR §130 — Living Quarters Allowance',   url: 'https://allowances.state.gov/Default.asp',         who: 'DoD Civilian', desc: 'Department of State Standardized Regulations §130 — LQA eligibility, rate tables, and computation rules for U.S. government civilians overseas.' },
              { name: 'DSSR §123 — TQSA',                        url: 'https://allowances.state.gov/Default.asp',         who: 'DoD Civilian', desc: 'Temporary Quarters Subsistence Allowance — up to 90 days of overseas temporary lodging while you search for permanent quarters. Verify the exact subsection against the current DSSR before citing.' },
              { name: 'HOMES.mil — Gaining Housing Office',      url: 'https://www.homes.mil',                                                   who: 'All',          desc: 'DoD Housing Office portal — start here to confirm on-base wait time and OHA-eligible off-base options at your gaining installation.' },
              { name: 'AHRN.com — Off-base rentals',              url: 'https://www.ahrn.com',                                                    who: 'All',          desc: 'DoD-sponsored Automated Housing Referral Network — pre-screened off-base rentals with military-friendly lease language.' },
            ].map(r => (
              <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: '#FFFFFF', border: '1px solid #FFE0B2', borderRadius: 10, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0D1821' }}>{r.name}</div>
                  <span style={{ fontSize: 9, fontWeight: 900, background: '#FFE0B2', color: '#6D4C00', padding: '2px 6px', borderRadius: 8, whiteSpace: 'nowrap' }}>{r.who}</span>
                </div>
                <div style={{ fontSize: 10, color: '#56697C', lineHeight: 1.5 }}>{r.desc}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {dutyStation && !oconus && knownRate && (
        <>
          {/* Your Rate Highlight */}
          <div style={{ background: theme.primary, borderRadius: 18, padding: 20, marginBottom: 14, color: '#FFF', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: theme.accent, letterSpacing: '.12em', marginBottom: 4 }}>YOUR ESTIMATED MONTHLY BAH</div>
            <CopyableText value={formatCurrencyBAH(userRate)} ariaLabel="Copy BAH rate" style={{ display: 'inline-block', color: '#FFFFFF', padding: '0 4px' }}>
              <span style={{ fontSize: 42, fontWeight: 950, lineHeight: 1, letterSpacing: '-1px', display: 'inline-block', marginBottom: 6 }}>{formatCurrencyBAH(userRate)}</span>
            </CopyableText>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
              {payGrade} · {withDeps ? `${numDeps} dependent${numDeps > 1 ? 's' : ''}` : 'no dependents'} · {mha}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>2026 DoD rate effective 1 Jan 2026</div>
            <CalculatorResultLabel
              tier={mhaIsEstimate ? 'estimate' : 'official'}
              note={mhaIsEstimate ? 'This MHA is not from the official DTMO 2026 table — verify the exact rate at the DTMO BAH Rate Lookup.' : null}
            />
          </div>

          {/* Side-by-side comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <RateCard
              label="With Dependents"
              value={formatCurrencyBAH(withRate)}
              note={`+${formatCurrencyBAH(withRate - withoutRate)}/mo vs. w/o dependents`}
              highlight={withDeps}
            />
            <RateCard
              label="Without Dependents"
              value={formatCurrencyBAH(withoutRate)}
              note="Single/no-dependent rate"
              highlight={!withDeps}
            />
          </div>

          {/* Annual projection */}
          <div style={{ background: '#F8FAFF', border: '1px solid #C7D7F5', borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#1A3A5C', letterSpacing: '.08em', marginBottom: 8 }}>ANNUAL PROJECTION</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: '#56697C' }}>Monthly BAH</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0D1821' }}>{formatCurrencyBAH(userRate)}</div>
              </div>
              <div style={{ fontSize: 20, color: '#C0CCDA' }}>×</div>
              <div>
                <div style={{ fontSize: 11, color: '#56697C' }}>Months</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0D1821' }}>12</div>
              </div>
              <div style={{ fontSize: 20, color: '#C0CCDA' }}>=</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#56697C' }}>Annual BAH</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#2E7D32' }}>{formatCurrencyBAH(userRate * 12)}</div>
              </div>
            </div>
          </div>

          {/* Key facts */}
          <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 14, padding: 14, fontSize: 11, color: '#6D4C00', lineHeight: 1.7, marginBottom: 14 }}>
            <strong>BAH Key Facts:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 16 }}>
              <li>BAH is non-taxable; it does not count toward gross income</li>
              <li>Rate does not increase beyond 1 dependent — only with/without matters</li>
              <li>BAH is paid to offset off-post housing costs; on-post residents typically do not receive BAH (allotted to housing office)</li>
              <li>Rates update each 1 January based on local median rental surveys</li>
              <li>Promote-in-place: promotion never reduces your BAH rate (rate protection)</li>
              <li>PCS transfer: BAH switches to new duty station rate at new report date</li>
            </ul>
          </div>
        </>
      )}

      {dutyStation && !oconus && !knownRate && (
        <div style={{ background: '#FFF3E0', border: '1px solid #FFB74D', borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#E65100', marginBottom: 4 }}>Rate Table Not Found for This Location</div>
          <div style={{ fontSize: 12, color: '#6D4C00', lineHeight: 1.6 }}>
            Rates for <strong>{dutyStation}</strong> are not in the local table. Use the official DTMO BAH Rate Lookup for an exact figure — it covers all 300 Military Housing Areas by ZIP code.
          </div>
        </div>
      )}

      {/* Official links */}
      <div style={{ display: 'grid', gap: 8 }}>
        <a href="https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/BAH-Rate-Lookup/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary }}>
          Official DTMO BAH Rate Lookup (All ZIP Codes)
        </a>
        <a href="https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">
          DTMO BAH Policy & Regulations
        </a>
      </div>

      <div style={{ marginTop: 12, background: '#F3F4F6', borderRadius: 12, padding: 12, fontSize: 10, color: '#888', lineHeight: 1.6 }}>
        Planning tool only. Rates shown are 2026 DTMO published tables for selected MHAs. Verify exact entitlement with your unit S1/finance office or the official DTMO rate lookup tool before making housing decisions.
      </div>

      <PlanningAidDisclaimer />
      <DataFreshnessFooter versionKey="bah" />
    </div>
  );
}
