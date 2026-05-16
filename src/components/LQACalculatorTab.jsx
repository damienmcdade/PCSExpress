/*
 * LQA / TQSA Reference Calculator — Living Quarters Allowance and
 * Temporary Quarters Subsistence Allowance for DoD Civilians OCONUS.
 *
 * Authoritative sources (public):
 *   DSSR §130  — LQA (annual rent + utility ceiling, by post & family size & grade group)
 *   DSSR §120  — TQSA (per-diem-equivalent for temporary quarters at arrival/departure)
 *   DCPAS LQA Worksheet & Eligibility Guide
 *   DoD Civilian JTR Chapter 5
 *
 * Rates here are REFERENCE estimates derived from published DSSR ceilings.
 * Civilians must verify exact entitlement via aoprals.state.gov/dssr before
 * signing a lease or filing an SF-1190.
 *
 * LQA grade groups (DSSR §134.16):
 *   Group 1 — GS-15 / SES / equivalents (most senior)
 *   Group 2 — GS-13/14 / O-4 to O-6 equivalents
 *   Group 3 — GS-9 to GS-12 / O-1 to O-3 equivalents
 *   Group 4 — GS-1 to GS-8 / WG / enlisted equivalents (most junior)
 *
 * Family size buckets (DSSR §134.16):
 *   1 person | 2 persons | 3-4 persons | 5-6 persons | 7+ persons
 *   The 5-6 and 7+ buckets layer 10% / 20% multipliers on top of the 3-4 base.
 */
import { useState, useMemo } from 'react';

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

const GRADE_GROUPS = [
  { value: 'g1', label: 'Group 1 — GS-15 / SES / O-7+', tier: 1.00 },
  { value: 'g2', label: 'Group 2 — GS-13/14 / O-4 to O-6', tier: 0.92 },
  { value: 'g3', label: 'Group 3 — GS-9 to GS-12 / O-1 to O-3', tier: 0.84 },
  { value: 'g4', label: 'Group 4 — GS-1 to GS-8 / WG / E-grades', tier: 0.78 },
];

// LQA annual ceilings (USD) per post for the GROUP 1 / 1-person baseline.
// Family-size and grade-group adjustments are applied dynamically. Source:
// DSSR §920 country tables (representative FY 2025/2026 ceilings).
//
// Family multipliers (DSSR §134.16):
//   1 person   : 0.90 of the published 2-person ceiling
//   2 persons  : 1.00 (base reference)
//   3-4 persons: 1.10
//   5-6 persons: 1.20
//   7+ persons : 1.30
//
// Group multipliers are applied to the family-adjusted ceiling.
const LQA_POSTS = {
  'Germany (Kaiserslautern / Ramstein)': {
    flag: '🇩🇪',
    country: 'Germany',
    installations: ['Ramstein AB', 'Kaiserslautern', 'Landstuhl', 'Baumholder'],
    baseAnnual: 46800,  // 2-person Group 1 ceiling (USD/year)
    tqsaDailyMax: 220,  // First 30 days, occupant only (USD/day)
    notes: 'Kaiserslautern Military Community (KMC) — largest US civilian + military community in Europe. LQA paid in USD; renew annually via SF-1190.',
  },
  'Germany (Stuttgart)': {
    flag: '🇩🇪',
    country: 'Germany',
    installations: ['USAG Stuttgart', 'Patch Barracks', 'Kelley Barracks'],
    baseAnnual: 52800,
    tqsaDailyMax: 245,
    notes: 'Hosts AFRICOM/EUCOM HQ. Stuttgart housing market is competitive — verify quarterly LQA ceiling before signing a lease.',
  },
  'Germany (Grafenwoehr / Vilseck / Ansbach)': {
    flag: '🇩🇪',
    country: 'Germany',
    installations: ['Grafenwoehr', 'Vilseck', 'Tower Barracks', 'Ansbach'],
    baseAnnual: 42000,
    tqsaDailyMax: 200,
    notes: 'Bavaria training communities. Mix of on-post and host-nation housing. DCPAS LQA worksheet required before lease execution.',
  },
  'South Korea (Camp Humphreys)': {
    flag: '🇰🇷',
    country: 'South Korea',
    installations: ['USAG Humphreys', 'Pyeongtaek'],
    baseAnnual: 36000,
    tqsaDailyMax: 195,
    notes: 'Camp Humphreys — largest US overseas installation. SOFA governs housing. Most civilians use on-post or USFK-managed off-post housing.',
  },
  'South Korea (Seoul / Yongsan)': {
    flag: '🇰🇷',
    country: 'South Korea',
    installations: ['Yongsan Garrison', 'Seoul', 'USAG Yongsan-Casey'],
    baseAnnual: 50400,
    tqsaDailyMax: 240,
    notes: 'Yongsan transition to Camp Humphreys is largely complete; civilian presence in Seoul remains for select missions.',
  },
  'Japan (Tokyo / Yokota)': {
    flag: '🇯🇵',
    country: 'Japan',
    installations: ['Yokota AB', 'Tokyo metro', 'Camp Zama'],
    baseAnnual: 65400,
    tqsaDailyMax: 295,
    notes: 'Tokyo metro is among the highest LQA areas worldwide. Verify quarterly DSSR adjustments; Yen-USD swings drive frequent rate changes.',
  },
  'Japan (Okinawa)': {
    flag: '🇯🇵',
    country: 'Japan',
    installations: ['Kadena AB', 'MCB Camp Butler', 'Torii Station'],
    baseAnnual: 45000,
    tqsaDailyMax: 215,
    notes: 'Okinawa housing market is military-heavy. On-base housing usually preferred; off-base requires base-issued housing referral.',
  },
  'Italy (Vicenza / Aviano)': {
    flag: '🇮🇹',
    country: 'Italy',
    installations: ['Caserma Ederle', 'Aviano AB', 'USAG Italy'],
    baseAnnual: 40800,
    tqsaDailyMax: 200,
    notes: 'Vicenza area is a Status of Forces community with established US civilian presence. LQA tracks local euro rents quarterly.',
  },
  'United Kingdom (RAF Lakenheath / Mildenhall)': {
    flag: '🇬🇧',
    country: 'United Kingdom',
    installations: ['RAF Lakenheath', 'RAF Mildenhall', 'RAF Feltwell'],
    baseAnnual: 55200,
    tqsaDailyMax: 245,
    notes: 'East Anglia (Suffolk) base cluster. Civilian Sponsors of Status (CSO) status affects LQA eligibility; verify with HR before transfer.',
  },
  'Belgium (SHAPE / Brussels)': {
    flag: '🇧🇪',
    country: 'Belgium',
    installations: ['SHAPE', 'Chievres AB', 'Brussels'],
    baseAnnual: 49200,
    tqsaDailyMax: 230,
    notes: 'NATO host-nation. SHAPE community is mostly international; Brussels postings have a higher LQA ceiling reflecting metro rents.',
  },
  'Spain (Rota / Moron)': {
    flag: '🇪🇸',
    country: 'Spain',
    installations: ['NS Rota', 'Moron AB'],
    baseAnnual: 38400,
    tqsaDailyMax: 190,
    notes: 'Naval / Air communities in Andalusia. LQA ceilings track Cadiz/Seville rental markets; relatively stable quarter-to-quarter.',
  },
  'Bahrain (NSA Bahrain)': {
    flag: '🇧🇭',
    country: 'Bahrain',
    installations: ['NSA Bahrain', 'Manama'],
    baseAnnual: 60000,
    tqsaDailyMax: 275,
    notes: 'NAVCENT/5th Fleet HQ. High-cost metro; LQA ceiling reflects compound housing market.',
  },
  'Guam (Andersen / Naval Base Guam)': {
    flag: '🇬🇺',
    country: 'Guam',
    installations: ['Andersen AFB', 'Naval Base Guam'],
    baseAnnual: 42000,
    tqsaDailyMax: 215,
    notes: 'U.S. territory but DSSR / TQSA still apply for federal civilians on overseas tour status.',
  },
};

const POST_KEYS = Object.keys(LQA_POSTS);

const FAMILY_BUCKETS = [
  { value: 1,  label: '1 person',   mult: 0.90 },
  { value: 2,  label: '2 persons',  mult: 1.00 },
  { value: 4,  label: '3–4 persons', mult: 1.10 },
  { value: 6,  label: '5–6 persons', mult: 1.20 },
  { value: 7,  label: '7+ persons', mult: 1.30 },
];

function fmt(n) {
  return n != null ? `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—';
}

// TQSA percentage of daily max by day-range (DSSR §123.2):
//   Days 1-30  — 100% (occupant), 75% each family member 12+, 50% under 12
//   Days 31-60 — 80% occupant, 60% each family member 12+, 40% under 12
//   Days 61-90 — 55% occupant, 40% each family member 12+, 25% under 12
const TQSA_TIERS = [
  { label: 'Days 1-30',  occupant: 1.00, adultDep: 0.75, childDep: 0.50 },
  { label: 'Days 31-60', occupant: 0.80, adultDep: 0.60, childDep: 0.40 },
  { label: 'Days 61-90', occupant: 0.55, adultDep: 0.40, childDep: 0.25 },
];

// Heuristic: guess the LQA post from the gaining installation. Matches
// substring against the installations[] for each post.
function detectPost(gainingInstallation) {
  const g = String(gainingInstallation || '').toLowerCase();
  if (!g) return null;
  for (const [post, data] of Object.entries(LQA_POSTS)) {
    for (const inst of data.installations) {
      if (g.includes(inst.toLowerCase())) return post;
    }
  }
  return null;
}

// Default the grade group from a profile paygrade. GS-15/SES → g1,
// GS-13/14 → g2, GS-9 to 12 → g3, lower → g4.
function detectGroup(paygrade) {
  const p = String(paygrade || '').toUpperCase();
  if (/^GS-15$|^SES/.test(p)) return 'g1';
  if (/^GS-(13|14)$/.test(p)) return 'g2';
  if (/^GS-(9|10|11|12)$/.test(p)) return 'g3';
  if (/^GS-/.test(p) || /^WG-/.test(p) || /^WL-/.test(p) || /^WS-/.test(p)) return 'g4';
  return 'g2';
}

export default function LQACalculatorTab({ theme, profile }) {
  const profileGaining = profile?.gainingInstallation || profile?.gaining || '';
  const autoPost = detectPost(profileGaining);
  const autoGroup = detectGroup(profile?.paygrade);

  const _profileFamilyCount = useMemo(() => {
    const adults = 1 + (profile?.hasDependents ? 1 : 0);
    const kids = Array.isArray(profile?.childAges) ? profile.childAges.filter(a => a !== '' && !isNaN(Number(a))).length : 0;
    return adults + kids;
  }, [profile?.hasDependents, profile?.childAges]);

  const [post, setPost] = useState(autoPost || POST_KEYS[0]);
  const [group, setGroup] = useState(autoGroup);
  const [familySize, setFamilySize] = useState(() => {
    if (_profileFamilyCount >= 7) return 7;
    if (_profileFamilyCount >= 5) return 6;
    if (_profileFamilyCount >= 3) return 4;
    return Math.max(1, _profileFamilyCount);
  });
  const [tqsaAdultDeps, setTqsaAdultDeps] = useState(profile?.hasDependents ? 1 : 0);
  const [tqsaChildDeps, setTqsaChildDeps] = useState(() => {
    return Array.isArray(profile?.childAges) ? profile.childAges.filter(a => a !== '' && !isNaN(Number(a))).length : 0;
  });

  const postData = LQA_POSTS[post];
  const groupTier = GRADE_GROUPS.find(g => g.value === group)?.tier || 1.00;
  const familyMult = FAMILY_BUCKETS.find(b => b.value === familySize)?.mult || 1.00;
  const annualLqa = Math.round((postData?.baseAnnual || 0) * familyMult * groupTier);
  const monthlyLqa = Math.round(annualLqa / 12);
  const tqsaBase = postData?.tqsaDailyMax || 0;

  // TQSA daily totals by tier
  const tqsaRows = TQSA_TIERS.map(tier => {
    const occupant = Math.round(tqsaBase * tier.occupant);
    const adults = Math.round(tqsaBase * tier.adultDep) * tqsaAdultDeps;
    const children = Math.round(tqsaBase * tier.childDep) * tqsaChildDeps;
    const total = occupant + adults + children;
    return { label: tier.label, occupant, adults, children, total };
  });
  const tqsaFirst30Total = tqsaRows[0]?.total * 30 || 0;

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ background: theme.secondary || '#1A3A5C', borderRadius: 18, padding: 16, marginBottom: 14, color: '#FFFFFF', border: `1px solid ${theme.accent || '#C99A3D'}55` }}>
        <div style={{ fontSize: 10, fontWeight: 950, color: theme.accent || '#C99A3D', letterSpacing: '.16em', marginBottom: 6 }}>LQA / TQSA REFERENCE CALCULATOR</div>
        <div style={{ fontSize: 17, fontWeight: 950, marginBottom: 6 }}>Living Quarters & Temporary Quarters Subsistence Allowance (DoD Civilian, OCONUS)</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)' }}>
          LQA is the civilian equivalent of OHA — a <strong style={{ color: theme.accent || '#C99A3D' }}>rent + utility ceiling</strong> set by the Department of State under the DSSR. TQSA covers temporary lodging at arrival/departure. Use the DSSR rate lookup to verify exact entitlement before signing a lease or filing SF-1190.
        </div>
      </div>

      {/* How LQA / TQSA Work */}
      <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: '#1E40AF', marginBottom: 8 }}>How LQA / TQSA Work</div>
        <div style={{ display: 'grid', gap: 6, fontSize: 11, color: '#1E3A8A', lineHeight: 1.55 }}>
          <div>🏠 <strong>LQA Ceiling:</strong> Rent + utilities up to the published annual ceiling for your post, grade group, and family size. Costs above the ceiling come out of pocket.</div>
          <div>📑 <strong>SF-1190:</strong> Filed annually with the gaining DoD HR office to certify rent and utilities for LQA reimbursement.</div>
          <div>🏨 <strong>TQSA:</strong> Per-day allowance for hotel + meals during the temporary-quarters period at arrival (up to 90 days) or departure (up to 30 days), DSSR §123.</div>
          <div>👨‍👩‍👧 <strong>Family Size:</strong> LQA ceilings step up for households of 3-4 / 5-6 / 7+. TQSA pays a tapered percentage for each adult and child dependent.</div>
          <div>💱 <strong>USD-Denominated:</strong> All amounts paid in USD; the Department of State adjusts post ceilings as host-nation rents and exchange rates move.</div>
        </div>
      </div>

      {/* Auto-detected notice */}
      {(autoPost || autoGroup !== 'g2') && (
        <div style={{ background: '#F0FFF4', border: '1px solid #A5D6A7', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#1B5E20' }}>
          {autoPost && <>Post auto-detected from your profile: <strong>{profileGaining}</strong> → <strong>{autoPost}</strong>{autoGroup !== 'g2' ? <>; grade group inferred from <strong>{profile?.paygrade}</strong></> : null}</>}
          {!autoPost && autoGroup !== 'g2' && <>Grade group inferred from <strong>{profile?.paygrade}</strong></>}
        </div>
      )}

      {/* Inputs */}
      <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary || '#244247' }}>
          OVERSEAS POST
          <select value={post} onChange={e => setPost(e.target.value)} style={{ ...fieldStyle, marginTop: 5 }}>
            {POST_KEYS.map(p => (
              <option key={p} value={p}>{LQA_POSTS[p].flag}  {p}</option>
            ))}
          </select>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary || '#244247' }}>
            GRADE GROUP
            <select value={group} onChange={e => setGroup(e.target.value)} style={{ ...fieldStyle, marginTop: 5 }}>
              {GRADE_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 11, fontWeight: 900, color: theme.primary || '#244247' }}>
            FAMILY SIZE
            <select value={familySize} onChange={e => setFamilySize(Number(e.target.value))} style={{ ...fieldStyle, marginTop: 5 }}>
              {FAMILY_BUCKETS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            {_profileFamilyCount > 0 && (
              <div style={{ fontSize: 10, color: '#2E7D32', marginTop: 4, fontWeight: 700 }}>
                ✓ Auto-filled from profile ({_profileFamilyCount} person{_profileFamilyCount > 1 ? 's' : ''})
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Main LQA card */}
      <div style={{ background: theme.primary || '#244247', borderRadius: 18, padding: 20, marginBottom: 14, color: '#FFF', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent || '#C99A3D', letterSpacing: '.12em', marginBottom: 4 }}>ESTIMATED ANNUAL LQA CEILING</div>
        <div style={{ fontSize: 42, fontWeight: 950, lineHeight: 1, letterSpacing: '-1px', marginBottom: 6 }}>{fmt(annualLqa)}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
          {GRADE_GROUPS.find(g => g.value === group)?.label.split(' — ')[0]} · {FAMILY_BUCKETS.find(b => b.value === familySize)?.label} · {post}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>≈ {fmt(monthlyLqa)} / month — reference rate, verify on aoprals.state.gov/dssr</div>
      </div>

      {/* Monthly / annual breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ background: '#FFFFFF', border: '1.5px solid #E0E6EE', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', letterSpacing: '.08em', marginBottom: 4 }}>MONTHLY ALLOWANCE</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0D1821' }}>{fmt(monthlyLqa)}</div>
          <div style={{ fontSize: 10, color: '#56697C', marginTop: 4 }}>Annual ceiling ÷ 12</div>
        </div>
        <div style={{ background: '#FFFFFF', border: '1.5px solid #E0E6EE', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', letterSpacing: '.08em', marginBottom: 4 }}>TQSA — FIRST 30 DAYS</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#2E7D32' }}>{fmt(tqsaFirst30Total)}</div>
          <div style={{ fontSize: 10, color: '#56697C', marginTop: 4 }}>Hotel + meals during arrival period</div>
        </div>
      </div>

      {/* TQSA inputs */}
      <div style={{ background: '#F8FAFF', border: '1px solid #C7D7F5', borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#1A3A5C', letterSpacing: '.08em', marginBottom: 10 }}>TQSA — DAILY ALLOWANCE BY TIER</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#1A3A5C' }}>
            ADULT DEPENDENTS (12+)
            <select value={tqsaAdultDeps} onChange={e => setTqsaAdultDeps(Number(e.target.value))} style={{ ...fieldStyle, marginTop: 5 }}>
              {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#1A3A5C' }}>
            CHILD DEPENDENTS (under 12)
            <select value={tqsaChildDeps} onChange={e => setTqsaChildDeps(Number(e.target.value))} style={{ ...fieldStyle, marginTop: 5 }}>
              {[0,1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {tqsaRows.map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 12px', fontSize: 12 }}>
              <span style={{ color: '#1A3A5C', fontWeight: 700 }}>{r.label}</span>
              <span style={{ color: '#0D1821', fontWeight: 800 }}>
                <span style={{ color: '#56697C', fontWeight: 600 }}>occupant {fmt(r.occupant)}</span>
                {r.adults > 0 && <> · <span style={{ color: '#56697C', fontWeight: 600 }}>adults {fmt(r.adults)}</span></>}
                {r.children > 0 && <> · <span style={{ color: '#56697C', fontWeight: 600 }}>children {fmt(r.children)}</span></>}
                <> · </>
                <strong style={{ color: '#2E7D32' }}>{fmt(r.total)}/day</strong>
              </span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#1A3A5C', marginTop: 8, lineHeight: 1.5 }}>
          DSSR §123 tapers TQSA across three 30-day tiers. Arrival period is up to 90 days; departure period up to 30 days. Receipts required for lodging.
        </div>
      </div>

      {/* Installation list */}
      {postData?.installations && (
        <div style={{ background: '#F8F9FA', borderRadius: 12, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#56697C', marginBottom: 6 }}>INSTALLATIONS IN THIS POST</div>
          <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.7 }}>{postData.installations.join(' · ')}</div>
        </div>
      )}

      {/* Notes */}
      {postData?.notes && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 11, color: '#1E3A8A', lineHeight: 1.6 }}>
          {postData.notes}
        </div>
      )}

      {/* Group comparison */}
      <div style={{ background: '#F8FAFF', border: '1px solid #C7D7F5', borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#1A3A5C', letterSpacing: '.08em', marginBottom: 8 }}>ANNUAL LQA BY GRADE GROUP — {FAMILY_BUCKETS.find(b => b.value === familySize)?.label}</div>
        <div style={{ display: 'grid', gap: 6 }}>
          {GRADE_GROUPS.map(g => {
            const amt = Math.round((postData?.baseAnnual || 0) * familyMult * g.tier);
            return (
              <div key={g.value} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #E0E6EE' }}>
                <span style={{ fontSize: 11, color: g.value === group ? '#1A3A5C' : '#56697C', fontWeight: g.value === group ? 900 : 600 }}>
                  {g.label.split(' — ')[0]} — {g.label.split(' — ')[1]}
                </span>
                <span style={{ fontSize: 13, color: g.value === group ? '#2E7D32' : '#0D1821', fontWeight: g.value === group ? 900 : 700 }}>{fmt(amt)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ background: '#FFF3E0', border: '1px solid #FFB74D', borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 11, color: '#6D4C00', lineHeight: 1.6 }}>
        <strong>Disclaimer:</strong> Rates shown are reference estimates derived from published DSSR ceilings. Department of State updates LQA ceilings quarterly and TQSA per-diem caps periodically. Always verify your exact entitlement on aoprals.state.gov/dssr and through the gaining DoD HR / DCPAS office before signing a lease or filing SF-1190.
      </div>

      {/* Official links */}
      <div style={{ display: 'grid', gap: 8 }}>
        <a href="https://aoprals.state.gov/Web920/dssr.asp" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary || '#244247' }}>
          Official DSSR Rate Lookup (Department of State)
        </a>
        <a href="https://www.dcpas.osd.mil/policy/relocation/lqa" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">
          DCPAS — LQA Worksheet & Eligibility Guide
        </a>
        <a href="https://www.travel.dod.mil/Policy-Regulations/Joint-Travel-Regulations/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">
          DoD JTR Chapter 5 — DoD Civilian Travel
        </a>
        <a href="https://www.gsa.gov/policy-regulations/regulations/federal-travel-regulation-ftr" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">
          GSA Federal Travel Regulation (FTR) Chapter 302
        </a>
      </div>
    </div>
  );
}
