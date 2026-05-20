/*
 * Purpose: Backward-planned PCS timeline and notification toggles.
 * Third-party dependencies: React.
 */

import { useEffect, useMemo, useState } from 'react';

const TIMELINE_STORAGE_KEY = 'pcs_dynamic_timeline_notifications';

// CONUS PCS milestones — 90-day backward plan from RNLTD.
const MILESTONES_CONUS = [
  { id: 'hhg',       offsetDays: 60, title: 'Schedule HHG Shipment',                       body: 'Confirm pickup windows in DPS and coordinate with PPPO/TMO before peak season dates fill.' },
  { id: 'housing',   offsetDays: 30, title: 'Submit Housing Intent to Vacate',             body: 'Notify privatized housing, landlord, or property manager and confirm SCRA or lease requirements.' },
  { id: 'final-out', offsetDays: 10, title: 'Final Out-Processing / Vehicle Shipping',     body: 'Complete clearing appointments, ship or prepare POV, and keep travel documents accessible.' },
];

// OCONUS PCS milestones — much wider planning window because of pet
// import lead time (Japan 7-8 months, Australia 6-9 months, Hawaii
// FAVN window), country clearance, no-fee passports, and Patriot
// Express booking. Anchored to the same RNLTD/report date.
const MILESTONES_OCONUS = [
  { id: 'pet-import',         offsetDays: 180, title: 'Pet Import Lead Time',                body: 'Country-dependent: Japan needs 180-day FAVN waiting period, Australia 180-day RNATT, UK GB Animal Health Certificate. Start microchip + rabies + titer NOW or pets stay behind.' },
  { id: 'passports',          offsetDays: 120, title: 'No-Fee + Tourist Passports (Family)', body: 'DD 1056 endorsement from gaining command, then no-fee passports for sponsor and dependents through installation passport office. Tourist passports for off-duty travel.' },
  { id: 'overseas-screening', offsetDays:  90, title: 'Overseas / EFMP Family Screening',    body: 'Sponsor and family medical/dental/EFMP overseas screening per branch (OPNAV 1300/16, AF 1466, DA 5888, USMC). Required before country clearance approves.' },
  { id: 'country-clearance',  offsetDays:  60, title: 'Country Clearance + SOFA Stamping',   body: 'Host-nation country clearance through gaining unit S2/Security. Coordinate visa/SOFA stamping. Without clearance you cannot enter the country.' },
  { id: 'hhg',                offsetDays:  45, title: 'Schedule OCONUS HHG + UAB Shipment',  body: 'Two separate DPS shipments: Unaccompanied Baggage (UAB, air-freight, ~10-14 day arrival) and the main HHG (sea-freight, 45-90 days). UAB must carry the essentials.' },
  { id: 'pov',                offsetDays:  30, title: 'POV to Vehicle Processing Center',    body: 'Ship one POV through the OCONUS VPC under JTR. Have title, registration, EFTPS, and a 1/4-tank fuel max. Many bases restrict 2nd POV; verify with PPSO.' },
  { id: 'flight-booking',     offsetDays:  21, title: 'Patriot Express / Commercial Booking',body: 'Book Patriot Express (AMC) or commercial flight via SATO/CTO. Pet space is limited — confirm reservation 21+ days out for summer / school-cycle moves.' },
  { id: 'final-out',          offsetDays:  10, title: 'Final Out-Processing + Travel Pack',  body: 'Clear losing installation, confirm OHA/MIHA / LQA paperwork is queued at gaining housing office, and pack hand-carry documents (passports, orders, medical records, country clearance).' },
];

function selectMilestones(profile) {
  return profile?.isOverseas ? MILESTONES_OCONUS : MILESTONES_CONUS;
}

function readNotificationState() {
  try {
    return JSON.parse(localStorage.getItem(TIMELINE_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeNotificationState(value) {
  try {
    localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(value));
  } catch {}
}

// Date math is performed in UTC. The RNLTD comes in as a YYYY-MM-DD
// string from the profile and is parsed below as a UTC midnight Date,
// so adding/subtracting days and computing "days until due" must also
// use UTC accessors — otherwise OCONUS users in UTC+9 (Japan/Korea) or
// UTC-10 (Hawaii) hit off-by-one errors when the device's local
// midnight straddles UTC midnight.
function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime())) return 'Set RNLTD';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function daysBetween(a, b) {
  const start = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const end   = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((end - start) / 86400000);
}

export default function DynamicTimeline({ theme, profile }) {
  const [enabled, setEnabled] = useState(() => readNotificationState());
  const [permission, setPermission] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'));
  // Parse RNLTD as UTC midnight so it is identical for users in any
  // timezone. `new Date('YYYY-MM-DDT00:00:00Z')` gives us the UTC
  // anchor; same for today's date — collapsing both to UTC midnight
  // avoids off-by-one in OCONUS timezones.
  const rnltDate = useMemo(() => {
    if (!profile?.departingDate) return null;
    return new Date(`${profile.departingDate}T00:00:00Z`);
  }, [profile?.departingDate]);
  const today = useMemo(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }, []);

  useEffect(() => writeNotificationState(enabled), [enabled]);

  // selectMilestones only reads profile?.isOverseas; narrowing the dep
  // array prevents re-running on unrelated profile updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const milestones = useMemo(() => selectMilestones(profile), [profile?.isOverseas]);
  const timeline = useMemo(() => milestones.map(item => {
    const dueDate = rnltDate ? addDays(rnltDate, -item.offsetDays) : null;
    const daysUntilDue = dueDate ? daysBetween(today, dueDate) : null;
    return { ...item, dueDate, daysUntilDue };
  }), [rnltDate, today, milestones]);
  const headerWindow = profile?.isOverseas ? 'DYNAMIC 180-DAY OCONUS TIMELINE' : 'DYNAMIC 90-DAY TIMELINE';

  const toggle = async (id) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #DDD5C2', borderRadius: 16, padding: 14, marginBottom: 18, boxShadow: '0 10px 24px rgba(38,53,31,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 950, color: theme.primary, letterSpacing: '.12em' }}>{headerWindow}</div>
          <div style={{ fontSize: 14, fontWeight: 950, color: '#0D1821', marginTop: 3 }}>Backward-planned from RNLTD</div>
          <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginTop: 3 }}>
            RNLTD/report date: <strong>{formatDate(rnltDate)}</strong>
          </div>
        </div>
        <span style={{ background: permission === 'granted' ? '#E8F5E9' : '#F3F4F6', color: permission === 'granted' ? '#1B5E20' : '#56697C', borderRadius: 999, padding: '5px 9px', fontSize: 10, fontWeight: 900 }}>
          {permission === 'granted' ? 'Push ready' : 'In-app reminders'}
        </span>
      </div>

      <div style={{ display: 'grid', gap: 9 }}>
        {timeline.map(item => {
          const overdue = item.daysUntilDue !== null && item.daysUntilDue < 0;
          const soon = item.daysUntilDue !== null && item.daysUntilDue <= 7 && item.daysUntilDue >= 0;
          return (
            <div key={item.id} style={{ border: `1px solid ${overdue ? '#FFCDD2' : soon ? '#FFE082' : '#E0E6EE'}`, borderLeft: `4px solid ${overdue ? '#C62828' : soon ? '#E65100' : theme.accent}`, borderRadius: 12, padding: 12, background: overdue ? '#FFF5F5' : soon ? '#FFF8E1' : '#F8FAFC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 950, color: '#0D1821' }}>T-Minus {item.offsetDays} Days: {item.title}</div>
                  <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.45, marginTop: 4 }}>{item.body}</div>
                  <div style={{ fontSize: 10, fontWeight: 900, color: overdue ? '#C62828' : theme.primary, marginTop: 6 }}>
                    Due {formatDate(item.dueDate)}{item.daysUntilDue !== null ? ` · ${overdue ? Math.abs(item.daysUntilDue) + ' days overdue' : item.daysUntilDue + ' days left'}` : ''}
                  </div>
                </div>
                <button onClick={() => toggle(item.id)} style={{ width: 48, height: 28, borderRadius: 999, border: 'none', background: enabled[item.id] ? theme.primary : '#CBD5E1', padding: 3, cursor: 'pointer', flexShrink: 0 }}>
                  <span style={{ display: 'block', width: 22, height: 22, borderRadius: '50%', background: '#FFFFFF', transform: enabled[item.id] ? 'translateX(20px)' : 'translateX(0)', transition: 'transform .18s ease' }} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
