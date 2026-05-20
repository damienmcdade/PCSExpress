/*
 * Holistic Health — unified well-being category for PCS Express.
 *
 * Four pillars: Medical Care (primary / urgent / specialty / hospitals /
 * preventive / dental / vision / pharmacy), Behavioral Health &
 * Counseling, Spiritual Care, and Fitness (gym + on-the-road habits +
 * diet/meal tips while traveling).
 *
 * Every resource link points to an OFFICIAL .mil / .gov / TRICARE
 * regional contractor / FEHB plan source. No third-party POI scrapes,
 * no fabricated provider names. Locator deep links are constructed
 * from the gaining-installation ZIP (when available) so the user lands
 * directly on TRICARE Find-a-Doctor or the regional contractor's
 * provider search pre-filtered for their location.
 *
 * Branch / component tailoring:
 *   - Active Duty / Reserve / Guard (Title 10): TRICARE Prime + MTF first
 *   - DoD Civilian: FEHB (OPM) + GS + EAP first; TRICARE absent
 *   - Coast Guard: USPHS + TRICARE; CG-specific MTF callouts
 *   - OCONUS: TRICARE Overseas Program (TOP) + International SOS
 */
import { useMemo, useState } from 'react';

// TRICARE region routing. AK and HI fall in West; territories and OCONUS
// route to the TRICARE Overseas Program (TOP). DoD Civilians (FEHB) don't
// have regions but the data shape is symmetric for the renderer.
const TRICARE_REGION_BY_STATE = {
  AL: 'East', CT: 'East', DC: 'East', DE: 'East', FL: 'East', GA: 'East',
  IL: 'East', IN: 'East', KY: 'East', MA: 'East', MD: 'East', ME: 'East',
  MI: 'East', NC: 'East', NH: 'East', NJ: 'East', NY: 'East', OH: 'East',
  PA: 'East', RI: 'East', SC: 'East', TN: 'East', VA: 'East', VT: 'East',
  WI: 'East', WV: 'East',
  AK: 'West', AR: 'West', AZ: 'West', CA: 'West', CO: 'West', HI: 'West',
  IA: 'West', ID: 'West', KS: 'West', LA: 'West', MN: 'West', MO: 'West',
  MS: 'West', MT: 'West', ND: 'West', NE: 'West', NM: 'West', NV: 'West',
  OK: 'West', OR: 'West', SD: 'West', TX: 'West', UT: 'West', WA: 'West',
  WY: 'West',
};

// Regional TRICARE contractor canonical URLs. The deep paths (e.g.,
// /content/hnfs/home/tw/bene/findaprovider.html) returned 404 after
// the 2025 TriWest contract takeover restructured the site, so we
// now point at the contractor landing pages — each opens a search
// form the user can fill out without an extra redirect-to-broken-link.
const REGIONAL_CONTRACTOR = {
  East: {
    name: 'Humana Military (TRICARE East)',
    findCare: 'https://www.humanamilitary.com/beneficiary/',
    enroll: 'https://www.humanamilitary.com/beneficiary/',
    site: 'https://www.humanamilitary.com/',
  },
  West: {
    name: 'TriWest Healthcare Alliance (TRICARE West)',
    findCare: 'https://tricare.mil/west',
    enroll: 'https://tricare.mil/west',
    site: 'https://tricare.mil/west',
  },
  Overseas: {
    name: 'International SOS (TRICARE Overseas Program)',
    findCare: 'https://www.tricare-overseas.com/',
    enroll: 'https://www.tricare-overseas.com/',
    site: 'https://www.tricare-overseas.com/',
  },
};

function isOconusFromProfile(profile) {
  const stateField = String(profile?.gainingState || '').toUpperCase().trim();
  if (stateField && !TRICARE_REGION_BY_STATE[stateField] && !['PR','GU','VI','MP','AS','DC'].includes(stateField)) {
    return true;
  }
  const g = String(profile?.gainingInstallation || '').toLowerCase();
  return ['korea','germany','japan','italy','uk','okinawa','guam','bahrain','spain','belgium','kuwait','humphreys','daegu','yongsan','ramstein','kaiserslautern','wiesbaden','grafenwoehr','vilseck','baumholder','stuttgart','torii','kadena','misawa','camp zama','yokosuka','sasebo','naples','vicenza','aviano','sigonella','rota','moron','incirlik','lemonier','andersen','butler'].some(kw => g.includes(kw));
}

function pickRegion(profile) {
  if (isOconusFromProfile(profile)) return 'Overseas';
  const st = String(profile?.gainingState || profile?.state || '').toUpperCase().trim();
  return TRICARE_REGION_BY_STATE[st] || 'East';
}

function buildZipFindCareUrl(_profile, _fallback) {
  // TRICARE's find-a-doctor canonical URL is `tricare.mil/findadoctor`
  // (all lowercase). The previously-used `?zip=` query param was not
  // honored by the site and many users saw a 404 / soft-404. The
  // ZIP-pre-fill no longer adds value, so we route every user to the
  // canonical landing page where they can pick their region and
  // search by ZIP via the proper form.
  return 'https://tricare.mil/findadoctor';
}

function ResourceCard({ item, theme }) {
  if (!item || !item.url) return null;
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${theme.primary || '#244247'}`, borderRadius: 12, padding: 14, marginBottom: 10, textDecoration: 'none', color: '#0D1821' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>{item.name}</div>
        {item.badge && (
          <span style={{ background: item.badgeBg || '#E3F2FD', color: item.badgeColor || '#0D3B66', fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>{item.badge}</span>
        )}
      </div>
      <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.55, marginTop: 4 }}>{item.desc}</div>
      {item.source && (
        <div style={{ fontSize: 10, fontWeight: 700, color: theme.primary || '#244247', marginTop: 8 }}>{item.source} →</div>
      )}
    </a>
  );
}

function EmergencyBanner({ theme: _theme }) {
  return (
    <div style={{ background: '#7F1D1D', borderRadius: 12, padding: 14, marginBottom: 14, color: '#FFF', borderLeft: `4px solid #FECACA` }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: '#FECACA', letterSpacing: '.14em', marginBottom: 4 }}>LIFE-THREATENING EMERGENCY</div>
      <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 6 }}>Call 911 (CONUS) or local emergency services (OCONUS) immediately.</div>
      <div style={{ fontSize: 11, lineHeight: 1.55, color: 'rgba(255,255,255,0.88)' }}>
        TRICARE covers emergency care at the nearest ER without prior authorization. Notify your regional contractor within 24 hours of admission to maintain benefits.
      </div>
    </div>
  );
}

function CrisisBanner({ theme }) {
  return (
    <div style={{ background: '#0D3B66', borderRadius: 12, padding: 14, marginBottom: 14, color: '#FFF', borderLeft: `4px solid ${theme.accent || '#C99A3D'}` }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent || '#FFD580', letterSpacing: '.14em', marginBottom: 4 }}>24/7 CRISIS SUPPORT</div>
      <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 6 }}>Military Crisis Line — call 988 and press 1, text 838255, or chat online.</div>
      <div style={{ fontSize: 11, lineHeight: 1.55, color: 'rgba(255,255,255,0.85)' }}>
        Free, confidential support for service members, veterans, and family members. The Brandon Act allows service members to request mental health care without justification through the chain of command.
      </div>
    </div>
  );
}

export default function MedicalReadinessTab({ theme, profile }) {
  const [tab, setTab] = useState('medical');
  const colors = {
    primary: theme.primary || '#244247',
    accent: theme.accent || '#C99A3D',
  };
  const isCivilian = profile?.component === 'DoD Civilian';
  const region = useMemo(() => pickRegion(profile), [profile]);
  const contractor = REGIONAL_CONTRACTOR[region];
  const branch = profile?.branch || 'Army';
  const installation = String(profile?.gainingInstallation || '').split(',')[0].trim() || 'the gaining installation';
  const findCareUrl = useMemo(() => buildZipFindCareUrl(profile, contractor.findCare), [profile, contractor]);

  const subTabs = [
    { id: 'medical',    label: 'Medical Care' },
    { id: 'behavioral', label: 'Behavioral Health' },
    { id: 'spiritual',  label: 'Spiritual Care' },
    { id: 'fitness',    label: 'Fitness' },
  ];

  // ───── EMERGENCY / HOSPITAL / URGENT / DENTAL / VISION / PHARMACY /
  // READINESS resource bundles. These were 7 separate sub-tabs before
  // the Holistic Health redesign collapsed them into one Medical Care
  // section with internal headers. Keeping them as named arrays makes
  // the render below easier to follow.
  const RES_BUNDLE = {
    emergency: isCivilian
      ? [
          { name: 'Find an ER on FEHB plan provider directory', desc: 'Search your enrolled FEHB plan\'s provider list for nearest in-network emergency departments.', url: 'https://www.opm.gov/healthcare-insurance/healthcare/plan-information/plans/', source: 'OPM.gov', badge: 'CIVILIAN' },
          { name: 'CMS Hospital Compare', desc: 'Official Medicare hospital quality and ER ratings for every hospital in the U.S.', url: 'https://www.medicare.gov/care-compare/?providerType=Hospital', source: 'medicare.gov' },
          { name: 'Employee Assistance Program (EAP) — 24/7 nurse line', desc: 'Federal EAP includes a 24/7 nurse triage line for civilians and household members.', url: 'https://www.opm.gov/policy-data-oversight/worklife/employee-assistance-programs/', source: 'OPM.gov' },
          { name: `Google Maps — ER near ${installation}`, desc: 'Locate the nearest emergency rooms with hours, ratings, and driving directions.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`emergency room near ${installation}`)}`, source: 'maps.google.com' },
        ]
      : [
          { name: 'TRICARE Emergency Care Coverage', desc: 'Official TRICARE rules: emergency care is covered at any ER without prior authorization. Notify the regional contractor within 24 hours of admission.', url: 'https://www.tricare.mil/CoveredServices/IsItCovered/EmergencyCare', source: 'tricare.mil', badge: 'TRICARE' },
          { name: 'Find a Doctor / Hospital near you', desc: `${contractor.name} provider directory — search ER and hospital networks by ZIP. ${region === 'Overseas' ? 'Outside the U.S., contact International SOS for assistance before seeking non-emergency care.' : ''}`, url: findCareUrl, source: 'tricare.mil', badge: region },
          { name: `${region === 'Overseas' ? 'International SOS' : contractor.name} — Find Care`, desc: `Official ${contractor.name} provider search. ${region === 'Overseas' ? 'Routes overseas beneficiaries to in-network host-nation providers.' : 'Routes beneficiaries to in-network ER, hospital, and urgent-care providers.'}`, url: contractor.findCare, source: contractor.name },
          { name: `Google Maps — ER near ${installation}`, desc: 'Open Google Maps for the nearest civilian emergency rooms with hours, ratings, and driving directions.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`emergency room near ${installation}`)}`, source: 'maps.google.com' },
        ],
    hospital: isCivilian
      ? [
          { name: 'FEHB Plan Hospital Directory', desc: 'Search your enrolled FEHB plan for in-network hospitals.', url: 'https://www.opm.gov/healthcare-insurance/healthcare/plan-information/plans/', source: 'OPM.gov', badge: 'FEHB' },
          { name: 'CMS Hospital Compare', desc: 'Official Medicare hospital quality ratings, readmissions, complications, and patient experience.', url: 'https://www.medicare.gov/care-compare/?providerType=Hospital', source: 'medicare.gov' },
          { name: 'Department of Veterans Affairs medical centers', desc: 'For civilians who are also veterans, VA medical centers may provide complementary care.', url: 'https://www.va.gov/find-locations/', source: 'va.gov', badge: 'VETERAN' },
          { name: `Google Maps — hospital near ${installation}`, desc: 'Locate civilian hospitals near the gaining installation with hours and ratings.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`hospital near ${installation}`)}`, source: 'maps.google.com' },
        ]
      : [
          { name: 'MTF (Military Treatment Facility) Locator', desc: 'Official TRICARE directory of every military hospital and clinic worldwide. Filter by branch, region, and service line.', url: 'https://tricare.mil/mtf', source: 'tricare.mil', badge: 'MTF' },
          { name: 'TRICARE Find a Doctor — Hospital', desc: `${contractor.name} hospital network search by ZIP. Active duty must obtain referral for non-emergency hospital care.`, url: findCareUrl, source: 'tricare.mil', badge: region },
          { name: 'MHS GENESIS Patient Portal', desc: 'Official Military Health System patient portal: book appointments, message care teams, review medical records.', url: 'https://patient.mhsgenesis.health.mil/', source: 'health.mil' },
          { name: `Defense Health Agency — Hospitals & Clinics`, desc: 'Authoritative list of DHA-managed military hospitals and clinics worldwide.', url: 'https://www.tricare.mil/mtf', source: 'tricare.mil' },
          { name: `Google Maps — hospital near ${installation}`, desc: 'Civilian hospitals near the gaining installation, useful for after-hours or specialty care not available at the MTF.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`hospital near ${installation}`)}`, source: 'maps.google.com' },
        ],
    urgent: isCivilian
      ? [
          { name: 'FEHB Plan Urgent Care Network', desc: 'Search your enrolled FEHB plan for in-network urgent-care clinics.', url: 'https://www.opm.gov/healthcare-insurance/healthcare/plan-information/plans/', source: 'OPM.gov', badge: 'FEHB' },
          { name: `Google Maps — urgent care near ${installation}`, desc: 'Locate civilian urgent-care clinics near the gaining installation.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`urgent care near ${installation}`)}`, source: 'maps.google.com' },
        ]
      : [
          { name: 'TRICARE Urgent Care — Active Duty', desc: 'Active duty: urgent care without referral at network civilian urgent-care clinics. Notify PCM after the visit if not seen at MTF.', url: 'https://www.tricare.mil/CoveredServices/IsItCovered/UrgentCare', source: 'tricare.mil', badge: 'TRICARE' },
          { name: 'TRICARE Nurse Advice Line — 1-800-TRICARE', desc: '24/7 nurse advice line (1-800-874-2273, option 1). Helps decide ER vs urgent care vs PCM.', url: 'https://tricare.mil/nal', source: 'tricare.mil' },
          { name: `${contractor.name} — Urgent Care Search`, desc: `Official ${contractor.name} urgent-care network search by ZIP.`, url: contractor.findCare, source: contractor.name },
          { name: `Google Maps — urgent care near ${installation}`, desc: 'Civilian urgent-care clinics near the gaining installation.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`urgent care near ${installation}`)}`, source: 'maps.google.com' },
        ],
    // Behavioral Health absorbs the former "Mental Readiness" tab.
    // Crisis line first, then policy + non-medical counseling, then
    // covered medical care, then peer / self-help resources, then
    // local discovery.
    behavioral: [
      { name: 'Military Crisis Line — 988 then 1', desc: '24/7 confidential crisis support for service members, veterans, and family. Call 988 then press 1, text 838255, or chat online.', url: 'https://www.veteranscrisisline.net/', source: 'veteranscrisisline.net', badge: 'CRISIS', badgeBg: '#FECACA', badgeColor: '#7F1D1D' },
      { name: 'The Brandon Act', desc: 'Official guidance: service members may request a mental-health evaluation through the chain of command without explaining why.', url: 'https://health.mil/brandonact', source: 'health.mil', badge: 'POLICY' },
      ...(isCivilian
        ? [{ name: 'Federal EAP — Counseling and Crisis Support', desc: 'Free confidential short-term counseling for civilians and household members; available 24/7.', url: 'https://www.opm.gov/policy-data-oversight/worklife/employee-assistance-programs/', source: 'OPM.gov', badge: 'CIVILIAN' }]
        : [{ name: 'Military OneSource Non-Medical Counseling', desc: 'Free, confidential, short-term non-medical counseling for service members and immediate family. Does NOT enter the medical record.', url: 'https://www.militaryonesource.mil/benefits/confidential-counseling/', source: 'militaryonesource.mil', badge: 'CONFIDENTIAL' }]),
      { name: 'Military & Family Life Counseling (MFLC)', desc: 'Free in-person or virtual non-medical counseling embedded at installations and schools.', url: 'https://www.militaryonesource.mil/programs/military-family-life-counseling/', source: 'militaryonesource.mil' },
      { name: 'TRICARE Mental Health Care', desc: 'Authoritative TRICARE information on covered mental-health services, including therapy, psychiatry, and substance-use treatment.', url: 'https://www.tricare.mil/mentalhealth', source: 'tricare.mil', badge: isCivilian ? 'REFERENCE' : 'TRICARE' },
      { name: 'Vet Center Locator', desc: 'Community-based counseling for combat veterans, family bereavement, and military sexual trauma. Confidential, no medical record.', url: 'https://www.va.gov/find-locations/?facilityType=vet_center', source: 'va.gov' },
      { name: 'inTransition Coaching', desc: 'Free confidential mental-health transition coaching for service members between providers, locations, or active/reserve status.', url: 'https://www.health.mil/Military-Health-Topics/Mental-Health/inTransition', source: 'health.mil' },
      { name: 'VA PTSD Coach', desc: 'Free VA self-help mobile app for managing trauma symptoms, coping skills, and support referrals.', url: 'https://mobile.va.gov/app/ptsd-coach', source: 'mobile.va.gov' },
      { name: 'VA Mindfulness Coach', desc: 'Free VA app teaching mindfulness for daily stress and resilience.', url: 'https://mobile.va.gov/app/mindfulness-coach', source: 'mobile.va.gov' },
      { name: 'Moving Forward', desc: 'Free VA problem-solving and resilience training, especially for transitions and PCS stress.', url: 'https://www.veterantraining.va.gov/movingforward/', source: 'veterantraining.va.gov' },
      { name: `${branch} Behavioral Health Resources`, desc: `Branch-specific behavioral health pointer for ${branch} members and dependents.`, url: 'https://www.health.mil/Military-Health-Topics/Mental-Health', source: 'health.mil' },
      { name: `Google Maps — therapists & counselors near ${installation}`, desc: 'Real local therapists, psychiatrists, and counseling clinics around your gaining installation with photos, hours, ratings, and directions.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`therapist counseling psychiatrist near ${installation}`)}`, source: 'maps.google.com' },
      { name: `Google Maps — mental health support near ${installation}`, desc: 'Local mental-health support groups, drop-in counseling centers, and community mental-health clinics around the gaining installation.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`mental health support clinic near ${installation}`)}`, source: 'maps.google.com' },
    ],
    dental: isCivilian
      ? [
          { name: 'FEDVIP Dental Plans', desc: 'Federal Employees Dental and Vision Insurance Program — official OPM enrollment portal for civilians and family.', url: 'https://www.benefeds.gov/', source: 'benefeds.gov', badge: 'FEDVIP' },
          { name: 'FEDVIP Plan Comparison', desc: 'Compare FEDVIP dental plans on benefits, premiums, and provider networks.', url: 'https://www.opm.gov/healthcare-insurance/dental-vision/', source: 'OPM.gov' },
          { name: `Google Maps — dentists near ${installation}`, desc: 'Real local dental offices around your gaining installation with photos, hours, ratings, and directions.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`dentist near ${installation}`)}`, source: 'maps.google.com' },
        ]
      : [
          { name: 'Active Duty Dental Program (ADDP)', desc: 'United Concordia administers ADDP for active duty members. Network civilian dentists for non-MTF care.', url: 'https://addp-ucci.com/', source: 'addp-ucci.com', badge: 'ADDP' },
          { name: 'TRICARE Dental Program (TDP)', desc: 'TRICARE family dental coverage administered by United Concordia for family members of active duty and select Reserve/Guard.', url: 'https://www.tricare.mil/CoveredServices/Dental/TDP', source: 'tricare.mil', badge: 'TDP' },
          { name: 'FEDVIP — Retirees and select cohorts', desc: 'FEDVIP dental for retirees and select active eligibility groups; administered through BENEFEDS.', url: 'https://www.benefeds.gov/', source: 'benefeds.gov' },
          { name: `Google Maps — dentists near ${installation}`, desc: 'Real local dental offices around your gaining installation with photos, hours, ratings, and directions.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`dentist near ${installation}`)}`, source: 'maps.google.com' },
        ],
    vision: isCivilian
      ? [
          { name: 'FEDVIP Vision Plans', desc: 'Official OPM/BENEFEDS portal for federal civilian vision coverage and provider directories.', url: 'https://www.benefeds.gov/', source: 'benefeds.gov', badge: 'FEDVIP' },
          { name: 'FEHB Plan Vision Benefits', desc: 'Some FEHB plans include vision coverage in addition to FEDVIP. Check your plan brochure.', url: 'https://www.opm.gov/healthcare-insurance/healthcare/plan-information/plans/', source: 'OPM.gov' },
          { name: `Google Maps — optometrists near ${installation}`, desc: 'Real local optometrists, ophthalmologists, and eyewear shops around your gaining installation.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`optometrist eye doctor near ${installation}`)}`, source: 'maps.google.com' },
        ]
      : [
          { name: 'TRICARE Vision Care', desc: 'Official TRICARE coverage rules for routine and medically-necessary vision care.', url: 'https://www.tricare.mil/CoveredServices/IsItCovered/Vision', source: 'tricare.mil', badge: 'TRICARE' },
          { name: 'FEDVIP Vision — Retirees and select cohorts', desc: 'FEDVIP vision plans for retirees and eligible groups not covered by TRICARE routine vision.', url: 'https://www.benefeds.gov/', source: 'benefeds.gov' },
          { name: `Google Maps — optometrists near ${installation}`, desc: 'Real local optometrists, ophthalmologists, and eyewear shops around your gaining installation.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`optometrist eye doctor near ${installation}`)}`, source: 'maps.google.com' },
        ],
    pharmacy: isCivilian
      ? [
          { name: 'FEHB Pharmacy Benefits', desc: 'Pharmacy coverage flows through your enrolled FEHB plan. Check the plan brochure for in-network pharmacies and mail-order options.', url: 'https://www.opm.gov/healthcare-insurance/healthcare/plan-information/plans/', source: 'OPM.gov' },
          { name: `Google Maps — pharmacy near ${installation}`, desc: 'Locate retail pharmacies near the gaining installation.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`pharmacy near ${installation}`)}`, source: 'maps.google.com' },
        ]
      : [
          { name: 'TRICARE Pharmacy — Express Scripts', desc: 'Official TRICARE pharmacy benefit. Find a pharmacy, refill prescriptions, use mail-order delivery.', url: 'https://tricare.mil/CoveredServices/Pharmacy', source: 'tricare.mil', badge: 'ESI' },
          { name: 'Find a Network Pharmacy', desc: 'TRICARE-network retail pharmacy search by ZIP, plus military pharmacy locations.', url: 'https://militaryrx.express-scripts.com/find-pharmacy', source: 'express-scripts.com' },
          { name: 'MHS GENESIS — Refill Prescriptions', desc: 'Refill MTF pharmacy prescriptions through the MHS GENESIS patient portal.', url: 'https://patient.mhsgenesis.health.mil/', source: 'health.mil' },
          { name: `Google Maps — pharmacy near ${installation}`, desc: 'Civilian retail pharmacies near the gaining installation.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`pharmacy near ${installation}`)}`, source: 'maps.google.com' },
        ],
    readiness: isCivilian
      ? [
          { name: 'OPM Wellness Programs', desc: 'Worksite wellness, biometric screenings, and Federal Occupational Health resources for civilian employees.', url: 'https://www.opm.gov/policy-data-oversight/worklife/wellness/', source: 'OPM.gov', badge: 'CIVILIAN' },
          { name: 'Federal Occupational Health (FOH)', desc: 'Pre-employment exams, fit-for-duty assessments, and occupational medical exams for federal civilians.', url: 'https://foh.psc.gov/', source: 'foh.psc.gov' },
          { name: 'CDC Travel Vaccinations', desc: 'Authoritative CDC guidance on travel vaccines and pre-trip preparation for OCONUS PCS.', url: 'https://wwwnc.cdc.gov/travel', source: 'cdc.gov' },
          { name: `Google Maps — travel clinics near ${installation}`, desc: 'Local travel-medicine clinics and immunization providers around your gaining installation. Useful for yellow fever, typhoid, and other pre-departure vaccinations not stocked at the MTF.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`travel clinic immunization near ${installation}`)}`, source: 'maps.google.com' },
        ]
      : [
          { name: 'Periodic Health Assessment (PHA)', desc: 'Annual readiness physical exam. Required for active duty and most Reserve/Guard. Documented in MHS GENESIS.', url: 'https://www.health.mil/Military-Health-Topics/Health-Readiness/Periodic-Health-Assessment', source: 'health.mil', badge: 'PHA' },
          { name: 'Individual Medical Readiness (IMR)', desc: 'Authoritative DHA medical-readiness program. Tracks dental class, immunizations, lab work, deployment-limiting conditions.', url: 'https://www.health.mil/Military-Health-Topics/Health-Readiness', source: 'health.mil' },
          { name: 'Travel Vaccinations & Anthrax', desc: 'Service-required immunizations including yellow fever, typhoid, smallpox, and anthrax for designated AOR deployments.', url: 'https://www.health.mil/Military-Health-Topics/Health-Readiness/Immunization-Healthcare', source: 'health.mil' },
          { name: 'Reserve / Guard Health Readiness', desc: 'Specific Reserve/Guard medical-readiness rules including TRICARE Reserve Select access and pre-mobilization health screening.', url: 'https://www.health.mil/Military-Health-Topics/Health-Readiness/Reserve-Health-Readiness-Program', source: 'health.mil', badge: 'RESERVE/NG' },
          { name: `Google Maps — travel clinics near ${installation}`, desc: 'Local travel-medicine clinics for vaccines not stocked at the MTF (yellow fever, typhoid, Japanese encephalitis, etc.).', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`travel clinic immunization near ${installation}`)}`, source: 'maps.google.com' },
        ],
  };

  // Holistic Health sections. Medical Care concatenates the seven
  // legacy bundles with section headers; Behavioral Health is a flat
  // list of crisis + policy + counseling + therapy + reference links;
  // Spiritual Care lists chaplaincy / pastoral care available in
  // medical settings; Fitness has its own three-section layout.
  const RESOURCES = {
    medical: [
      { _section: 'Emergency Care',          items: RES_BUNDLE.emergency },
      { _section: 'Hospital / MTF',          items: RES_BUNDLE.hospital  },
      { _section: 'Urgent Care',             items: RES_BUNDLE.urgent    },
      { _section: 'Dental',                  items: RES_BUNDLE.dental    },
      { _section: 'Vision',                  items: RES_BUNDLE.vision    },
      { _section: 'Pharmacy',                items: RES_BUNDLE.pharmacy  },
      { _section: 'Preventive Care & Readiness', items: RES_BUNDLE.readiness },
    ],
    behavioral: [
      { _section: 'Behavioral Health & Counseling', items: RES_BUNDLE.behavioral },
    ],
    spiritual: [
      { _section: 'Chaplaincy & Pastoral Care', items: [
        { name: `Contact the ${installation} Installation Chaplain`, desc: 'Reach the duty chaplain at your gaining installation 24/7. Chaplains visit MTF inpatients, support family in critical-care settings, and provide free, confidential pastoral counseling for service members and dependents of all faith backgrounds (or none).', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`installation chaplain office near ${installation}`)}`, source: 'maps.google.com', badge: 'INSTALLATION' },
        { name: 'MTF Pastoral Care', desc: 'Most military treatment facilities have a Pastoral Care office that coordinates chaplain visits for inpatients, surgery candidates, and family members during critical or end-of-life care. Ask the MTF charge nurse to contact Pastoral Care.', url: 'https://www.health.mil/Military-Health-Topics/Mental-Health/Chaplaincy', source: 'health.mil', badge: 'MTF' },
        { name: 'Army Chaplain Corps', desc: 'Official U.S. Army Chaplain Corps directory and worldwide-locator information.', url: 'https://www.army.mil/chaplaincorps/', source: 'army.mil' },
        { name: 'Navy Chaplain Corps', desc: 'Official U.S. Navy Chaplain Corps reference — also serves Marine Corps and Coast Guard.', url: 'https://www.navy.mil/Resources/Navy-Chaplain-Corps/', source: 'navy.mil' },
        { name: 'Air Force Chaplain Corps', desc: 'Official U.S. Air Force Chaplain Corps reference — also serves Space Force.', url: 'https://www.af.mil/About-Us/Fact-Sheets/Display/Article/104584/chaplain-corps/', source: 'af.mil' },
      ]},
      { _section: 'Faith-Based Counseling & Support', items: [
        { name: 'Military Chaplaincy — Confidential Counseling', desc: 'Conversations with a military chaplain are privileged. Chaplains do not document or report what you share — useful when seeking spiritual support around grief, marriage, deployment, or moral injury without it entering your medical record.', url: 'https://www.health.mil/Military-Health-Topics/Mental-Health/Chaplaincy', source: 'health.mil', badge: 'CONFIDENTIAL' },
        { name: 'VA Chaplain Service', desc: 'For veterans and family members receiving VA care, the VA Chaplain Service provides pastoral support at VA medical centers and hospice settings.', url: 'https://www.patientcare.va.gov/chaplain/', source: 'va.gov', badge: 'VETERAN' },
        { name: 'Stephen Ministries / parish-based grief care', desc: 'Many local congregations near military communities offer trained lay grief, marriage, and chronic-illness pastoral companions. The installation chaplain office can refer you to vetted local options.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`parish pastoral grief support near ${installation}`)}`, source: 'maps.google.com' },
      ]},
    ],
    fitness: [
      { _section: 'On-Base Gym & Fitness Facilities', items: [
        { name: `MWR Fitness Center at ${installation}`, desc: 'Free access for service members, retirees, and accompanying family at the installation MWR / Force Fitness Instructor / Air Force Personnel Center fitness centers. Hours vary by base — call ahead or check the installation MWR site.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`MWR fitness center gym ${installation}`)}`, source: 'maps.google.com', badge: 'INSTALLATION' },
        { name: 'Air Force / Space Force Fit-to-Fight Gyms', desc: 'AFI 36-2905 / AFFMP — every AF base offers a fitness assessment cell and 24/7 gym access. Look for the Fitness Assessment Cell at the main FAC.', url: 'https://www.afpc.af.mil/Career-Management/Fitness-Program/', source: 'af.mil' },
        { name: 'Army H2F (Holistic Health & Fitness) Centers', desc: 'Army Holistic Health and Fitness facilities at brigade combat teams — strength, conditioning, nutrition coaching, performance physical therapy.', url: 'https://www.army.mil/h2f/', source: 'army.mil' },
        { name: `Off-base gyms near ${installation}`, desc: 'Civilian fitness chains and CrossFit boxes near the gaining installation — often offer military discount memberships.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`gym fitness near ${installation}`)}`, source: 'maps.google.com' },
      ]},
      { _section: 'Staying Fit During PCS Travel', items: [
        { name: 'Military OneSource — Fitness & Health', desc: 'Official Military OneSource health and fitness toolkit. Includes packable workout routines, mental-health connection between exercise and resilience, and travel-day fitness tips.', url: 'https://www.militaryonesource.mil/health-wellness/fitness-and-nutrition/', source: 'militaryonesource.mil', badge: 'FREE' },
        { name: 'Operation Supplement Safety (OPSS)', desc: 'Official DoD database of supplement safety for service members. Useful before adding any caffeine / energy / pre-workout supplement during a high-stress move.', url: 'https://www.opss.org/', source: 'opss.org' },
        { name: 'Hotel-room workout routines', desc: 'Bodyweight circuits you can do in a 6 ft × 6 ft space: 100 burpees, 5×20 push-ups, 5×30-second planks, walking lunges, hip bridges. No equipment, 20–30 minutes. Maintains baseline conditioning through a 10–14-day TLE / TLA stay.', url: 'https://www.armyfit.com/', source: 'armyfit.com' },
        { name: 'PCS travel days — movement basics', desc: 'Get up every 90 minutes on long drives or flights to walk, stretch hips and calves, and hydrate. Sleep deprivation + sitting + dehydration on a PCS week is the most common combination behind soft-tissue injuries during in-processing PT.', url: 'https://www.health.mil/Military-Health-Topics/Total-Force-Fitness', source: 'health.mil' },
      ]},
      { _section: 'Diet & Meal Tips for Traveling', items: [
        { name: 'Performance Triad — Nutrition', desc: 'Army Performance Triad (Sleep • Activity • Nutrition) — free official guide to fueling during high-stress periods including PCS. Sample meal plans for active duty and family members.', url: 'https://armyhealth.com/performance-triad/', source: 'armyhealth.com', badge: 'FREE' },
        { name: 'MyPlate.gov — federal nutrition basics', desc: 'USDA MyPlate — simple plate-portion model that works at hotel breakfast bars, gas-station stops, and base DFAC chow lines.', url: 'https://www.myplate.gov/', source: 'myplate.gov' },
        { name: 'TRICARE Nutrition Counseling', desc: 'TRICARE-covered medical nutrition therapy with a Registered Dietitian, available before, during, and after the PCS for diabetes, weight management, and high cholesterol.', url: 'https://www.tricare.mil/CoveredServices/IsItCovered/NutritionCounseling', source: 'tricare.mil', badge: isCivilian ? 'REFERENCE' : 'TRICARE' },
        { name: 'Cooler & cold-pack meal planning for the drive', desc: 'Pre-pack hard-boiled eggs, nut butter sandwiches, fruit, carrots, hummus, and refillable water bottles for the first 24–48 hours of POV travel. Avoids the gas-station calorie spiral that derails fitness scores in the weeks after PCS.', url: 'https://www.militaryonesource.mil/health-wellness/fitness-and-nutrition/healthy-eating/', source: 'militaryonesource.mil' },
        { name: `Grocery stores & farmers markets near ${installation}`, desc: 'Stock up at the commissary or local grocery within the first 48 hours of arrival to reset away from travel food and restart cooking at home.', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`grocery commissary farmers market near ${installation}`)}`, source: 'maps.google.com' },
      ]},
    ],
  };

  // Each tab's data is now an array of `{_section, items}` blocks. We
  // still hoist Google-Maps "FACILITY LOCATOR" entries to the top of
  // each section's item list so users see the "where can I go" answer
  // first, then policy / reference / contractor cards.
  const sections = RESOURCES[tab] || [];
  const decorate = (raw) => {
    const locators = raw
      .filter(i => i.source === 'maps.google.com')
      .map(i => ({ ...i, badge: i.badge || 'FACILITY LOCATOR', badgeBg: i.badgeBg || '#E3F2FD', badgeColor: i.badgeColor || '#0D3B66' }));
    const others = raw.filter(i => i.source !== 'maps.google.com');
    return [...locators, ...others];
  };
  // The Emergency banner now lives on the Medical tab (since ER care
  // is the highest-acuity item in that pillar). The Crisis banner
  // lives on Behavioral Health.
  const showEmergencyBanner = tab === 'medical';
  const showCrisisBanner = tab === 'behavioral';

  return (
    <div>
      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 16px 8px', borderBottom: '1px solid #E0E6EE' }}>
        {subTabs.map(s => (
          <button key={s.id} onClick={() => setTab(s.id)}
            className={`pcs-tab ${tab === s.id ? 'is-active' : ''}`}
            style={{ flexShrink: 0, padding: '7px 13px', borderRadius: 999, border: `1.5px solid ${tab === s.id ? colors.primary : '#E0E6EE'}`, background: tab === s.id ? colors.primary : '#FFF', color: tab === s.id ? '#FFF' : '#56697C', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {showEmergencyBanner && <EmergencyBanner theme={theme} />}
        {showCrisisBanner && <CrisisBanner theme={theme} />}

        {/* Header context */}
        <div style={{ background: theme.secondary || '#1A3A5C', borderRadius: 12, padding: 14, marginBottom: 14, borderLeft: `3px solid ${colors.accent}` }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: colors.accent, letterSpacing: '.14em', marginBottom: 4 }}>HOLISTIC HEALTH</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#FFF', marginBottom: 5 }}>
            {subTabs.find(s => s.id === tab)?.label} — {isCivilian ? 'DoD Civilian (FEHB)' : `${branch} ${region === 'Overseas' ? 'OCONUS' : 'CONUS'}`}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 1.55 }}>
            {isCivilian
              ? 'Civilian employees access medical care through the Federal Employees Health Benefits (FEHB) program and the Employee Assistance Program (EAP). FEHB enrollment may be changed within 60 days of a PCS as a qualifying life event.'
              : `Resources are tailored to ${region === 'Overseas' ? 'overseas beneficiaries through the TRICARE Overseas Program' : `the ${contractor.name} region`}. Coverage details may change — verify with your regional contractor and the gaining MTF.`}
          </div>
        </div>

        {/* Sectioned resource cards. Each section gets a clear header
            so the Medical Care pillar (7 sub-categories) and the
            Fitness pillar (3 sub-categories) stay scannable in a
            single tab. */}
        {sections.map((sec, sIdx) => (
          <section key={sec._section || sIdx} aria-label={sec._section} style={{ marginBottom: 16 }}>
            {sec._section && (
              <div style={{ fontSize: 11, fontWeight: 900, color: colors.primary, letterSpacing: '.10em', marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${colors.primary}30` }}>
                {String(sec._section).toUpperCase()}
              </div>
            )}
            {decorate(sec.items || []).map(item => <ResourceCard key={item.name} item={item} theme={theme} />)}
          </section>
        ))}

        {/* Regional contractor footer */}
        {!isCivilian && (
          <div style={{ background: '#F8FAFF', border: '1px solid #C7D7F5', borderRadius: 12, padding: 12, marginTop: 12, fontSize: 11, color: '#1A3A5C', lineHeight: 1.6 }}>
            <strong>Your TRICARE region:</strong> {region === 'Overseas' ? 'Overseas (TRICARE Overseas Program)' : region} — administered by <a href={contractor.site} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, fontWeight: 800 }}>{contractor.name}</a>. Always verify region eligibility on <a href="https://www.tricare.mil/Plans/Eligibility/RegionsOfTRICARE" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, fontWeight: 800 }}>tricare.mil</a>.
          </div>
        )}
        {isCivilian && (
          <div style={{ background: '#F8FAFF', border: '1px solid #C7D7F5', borderRadius: 12, padding: 12, marginTop: 12, fontSize: 11, color: '#1A3A5C', lineHeight: 1.6 }}>
            <strong>FEHB Open Season:</strong> compare plans on <a href="https://www.opm.gov/healthcare-insurance/healthcare/plan-information/" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, fontWeight: 800 }}>OPM.gov</a>. A PCS is a qualifying life event allowing plan changes within 60 days.
          </div>
        )}
      </div>
    </div>
  );
}
