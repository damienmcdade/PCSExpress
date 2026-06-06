/*
 * Transition Community — helps a separating/retiring member or DoD civilian
 * find social groups, clubs, and veteran circles where they're relocating.
 * A location search bar tailors every resource to the entered city/state,
 * and bubble category sub-tabs separate the groups by type (veteran orgs,
 * motorcycle/biker clubs, car clubs, sports & outdoors, social & hobby,
 * family & spouse).
 *
 * Sources are official VA / chartered-VSO references plus location-aware
 * searches against public community platforms (RallyPoint, Meetup, Facebook
 * groups, Nextdoor). Location-aware links inject the user's entered area; no
 * fabricated groups are listed.
 *
 * Third-party dependencies: React only.
 */

import { useEffect, useState } from 'react';
import { secureLocalStore } from '../security/SecurityExtensions';
import TabBar from './TabBar';
import LocationAutocomplete from './LocationAutocomplete';

const STORAGE_KEY = 'pcs_community_location';

const enc = (s) => encodeURIComponent(String(s || '').trim());
// Build a "topic near location" query; falls back to just the topic when no
// location is entered yet.
const q = (topic, loc) => enc(loc ? `${topic} ${loc}` : topic);

// Each link: { name, desc, build(loc) -> url, official? }
const CATEGORIES = [
  {
    id: 'veteran-orgs', label: 'Veteran Orgs',
    blurb: 'Chartered Veterans Service Organizations and veteran networks near your new home.',
    links: [
      { name: 'VA — Find VA locations near you', official: true, desc: 'Official VA facility, Vet Center, and clinic locator for your new area.', build: (loc) => `https://www.va.gov/find-locations/?location=${enc(loc)}` },
      { name: 'VFW — Find a Post', official: true, desc: 'Locate the nearest Veterans of Foreign Wars post for camaraderie and benefits help.', build: (loc) => `https://www.vfw.org/find-a-post?q=${enc(loc)}` },
      { name: 'The American Legion — Find a Post', official: true, desc: 'Find your local American Legion post (and the Legion Riders / Auxiliary).', build: () => 'https://www.legion.org/posts' },
      { name: 'DAV — Find a Chapter', official: true, desc: 'Disabled American Veterans local chapters — claims help, rides to care, and community.', build: () => 'https://www.dav.org/find-your-local-office/' },
      { name: 'RallyPoint — military & veteran network', desc: 'Connect with other veterans by location, unit, and MOS; find local groups and events.', build: (loc) => `https://www.rallypoint.com/search?q=${q('veterans', loc)}` },
      { name: 'Facebook — veteran groups near you', desc: 'Search public Facebook groups for veterans in your area.', build: (loc) => `https://www.facebook.com/search/groups/?q=${q('veterans', loc)}` },
    ],
  },
  {
    id: 'motorcycle', label: 'Biker Clubs',
    blurb: 'Veteran-friendly motorcycle clubs and riding groups.',
    links: [
      { name: 'Combat Veterans Motorcycle Association (CVMA)', official: true, desc: 'Find a CVMA chapter — combat veterans who ride and support veteran causes.', build: () => 'https://www.combatvet.us/chapter-locator/' },
      { name: 'American Legion Riders', official: true, desc: 'Legion Riders chapters operate out of American Legion posts nationwide.', build: () => 'https://www.legion.org/riders' },
      { name: 'Patriot Guard Riders', official: true, desc: 'Stand for fallen service members and veterans; state-based ride groups.', build: () => 'https://www.patriotguard.org/' },
      { name: 'Meetup — motorcycle groups near you', desc: 'Local motorcycle and riding Meetups in your area.', build: (loc) => `https://www.meetup.com/find/?keywords=${q('motorcycle club', loc)}` },
      { name: 'Facebook — veteran motorcycle clubs', desc: 'Search public Facebook groups for veteran motorcycle clubs in your area.', build: (loc) => `https://www.facebook.com/search/groups/?q=${q('veteran motorcycle club', loc)}` },
    ],
  },
  {
    id: 'auto', label: 'Car Clubs',
    blurb: 'Car clubs, Cars & Coffee meetups, and automotive enthusiast groups.',
    links: [
      { name: 'Meetup — car & automotive groups', desc: 'Local car clubs and automotive Meetups near you.', build: (loc) => `https://www.meetup.com/find/?keywords=${q('car club', loc)}` },
      { name: 'Facebook — car clubs near you', desc: 'Search public Facebook groups for car clubs and enthusiasts in your area.', build: (loc) => `https://www.facebook.com/search/groups/?q=${q('car club', loc)}` },
      { name: 'Cars & Coffee near you', desc: 'Find local Cars & Coffee meetups (weekend enthusiast gatherings).', build: (loc) => `https://www.google.com/search?q=${q('cars and coffee', loc)}` },
      { name: 'Veterans car clubs', desc: 'Search for veteran-focused car and truck clubs in your area.', build: (loc) => `https://www.facebook.com/search/groups/?q=${q('veterans car club', loc)}` },
    ],
  },
  {
    id: 'sports', label: 'Sports & Outdoors',
    blurb: 'Veteran fitness, team sports, and outdoor-adventure communities.',
    links: [
      { name: 'Team Red, White & Blue (Team RWB)', official: true, desc: 'Veteran health & community through physical and social activity — find your local chapter/events.', build: () => 'https://www.teamrwb.org/' },
      { name: 'Wounded Warrior Project — Connect', official: true, desc: 'Adaptive sports, group activities, and peer connection for post-9/11 veterans.', build: () => 'https://www.woundedwarriorproject.org/programs/community' },
      { name: 'VA Adaptive Sports & Recreation', official: true, desc: 'Official VA adaptive sports programs and local opportunities.', build: () => 'https://department.va.gov/veteran-sports/' },
      { name: 'Meetup — hiking & outdoors near you', desc: 'Local hiking, running, and outdoor Meetups in your area.', build: (loc) => `https://www.meetup.com/find/?keywords=${q('hiking outdoors', loc)}` },
      { name: 'Facebook — veteran fitness groups', desc: 'Search public Facebook groups for veteran fitness and sports in your area.', build: (loc) => `https://www.facebook.com/search/groups/?q=${q('veteran fitness', loc)}` },
    ],
  },
  {
    id: 'social', label: 'Social & Hobby',
    blurb: 'General social circles, hobby groups, and neighbor networks.',
    links: [
      { name: 'Meetup — groups near you', desc: 'Browse every kind of local interest group (gaming, books, photography, food, professional).', build: (loc) => `https://www.meetup.com/find/?keywords=${q('', loc) || 'social'}` },
      { name: 'Facebook — local groups', desc: 'Search public Facebook groups for your new city or neighborhood.', build: (loc) => `https://www.facebook.com/search/groups/?q=${q('community', loc)}` },
      { name: 'Nextdoor — your neighborhood', desc: 'Neighbor-to-neighbor network for local recommendations, events, and groups.', build: () => 'https://nextdoor.com/' },
      { name: 'Military OneSource — community connections', official: true, desc: 'Official transition and community resources, available up to 365 days after separation.', build: () => 'https://www.militaryonesource.mil/' },
    ],
  },
  {
    id: 'family', label: 'Family & Spouse',
    blurb: 'Spouse networks and family community resources for the move.',
    links: [
      { name: 'Military Spouse Employment Partnership (MSEP)', official: true, desc: 'Spouse-friendly employers and networking as you relocate.', build: () => 'https://msepjobs.militaryonesource.mil/msep/' },
      { name: 'Blue Star Families', official: true, desc: 'Local chapters and community programs for military and veteran families.', build: () => 'https://bluestarfam.org/' },
      { name: 'Facebook — military spouse groups near you', desc: 'Search public Facebook groups for military/veteran spouses in your area.', build: (loc) => `https://www.facebook.com/search/groups/?q=${q('military spouse', loc)}` },
      { name: 'Meetup — family & parenting groups', desc: 'Local family, parenting, and kids-activity Meetups.', build: (loc) => `https://www.meetup.com/find/?keywords=${q('family parents', loc)}` },
    ],
  },
];

export default function TransitionCommunityModule({ theme, profile }) {
  // Seed the location from the gaining installation's city when available so
  // the user gets relevant results immediately; they can override it.
  const seed = String(profile?.gainingInstallation || '').trim();
  const [location, setLocation] = useState('');
  const [cat, setCat] = useState(CATEGORIES[0].id);

  useEffect(() => {
    let mounted = true;
    secureLocalStore.get(STORAGE_KEY, null).then(v => {
      if (!mounted) return;
      if (typeof v === 'string' && v) setLocation(v);
      else if (seed) setLocation(seed);
    });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loc = location.trim();
  const active = CATEGORIES.find(c => c.id === cat) || CATEGORIES[0];

  const onLocationChange = (v) => {
    setLocation(v);
    secureLocalStore.set(STORAGE_KEY, v);
  };

  return (
    <div className="pet-page">
      <div className="pet-header">
        <div>
          <div className="assistance-kicker">Community</div>
          <h2>Find Your People</h2>
          <p>Social groups, clubs, and veteran circles where you're relocating. Enter your destination and the links below tailor to that area — pulled from VA / VSO sources and public community platforms.</p>
        </div>
      </div>

      {/* Location search bar — tailors every link below. */}
      <section aria-label="Relocation location" style={{ background: '#F4F7FB', border: '1px solid #DCE4EE', borderRadius: 14, padding: 14, marginBottom: 16 }}>
        <label htmlFor="community-location" style={{ display: 'block', fontSize: 10, fontWeight: 900, color: theme.primary, letterSpacing: '.1em', marginBottom: 6 }}>
          WHERE ARE YOU MOVING?
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <LocationAutocomplete
            id="community-location"
            value={location}
            onChange={(v) => onLocationChange(v)}
            placeholder="City, ST (e.g. Austin, TX)"
            ariaLabel="Destination city and state"
            theme={theme}
          />
          {loc && (
            <button
              type="button"
              onClick={() => onLocationChange('')}
              aria-label="Clear destination"
              style={{ border: '1px solid #D4DCE8', borderRadius: 999, background: '#FFF', color: '#43526B', fontSize: 12, fontWeight: 700, padding: '9px 14px', cursor: 'pointer' }}
            >
              Clear
            </button>
          )}
        </div>
        <div style={{ fontSize: 11, color: loc ? '#176B6B' : '#56697C', fontWeight: loc ? 700 : 400, marginTop: 6 }}>
          {loc ? `✓ Tailoring groups to ${loc}` : 'Enter a location to tailor the search links to your destination.'}
        </div>
      </section>

      {/* Category sub-tabs — bubble pills matching the rest of the app. */}
      <TabBar ariaLabel="Community categories">
        {CATEGORIES.map(c => {
          const isActive = c.id === cat;
          return (
            <button
              key={c.id}
              id={`community-tab-${c.id}`}
              role="tab"
              aria-selected={isActive}
              data-active={isActive || undefined}
              onClick={() => setCat(c.id)}
              className={`pcs-tab ${isActive ? 'is-active' : ''}`}
              style={{
                borderRadius: 999,
                padding: '8px 15px',
                border: `1.5px solid ${isActive ? theme.primary : '#D4DCE8'}`,
                background: isActive ? theme.primary : '#FFF',
                color: isActive ? '#FFF' : '#43526B',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {c.label}
            </button>
          );
        })}
      </TabBar>

      <div role="tabpanel" id={`community-panel-${active.id}`} aria-labelledby={`community-tab-${active.id}`} style={{ marginTop: 12 }}>
        <p style={{ fontSize: 12, color: '#43526B', margin: '0 0 12px' }}>{active.blurb}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {active.links.map(link => (
            <a
              key={link.name}
              href={link.build(loc)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.name} (opens in a new tab)`}
              style={{ display: 'block', textDecoration: 'none', background: '#FFFFFF', border: '1px solid #E2E8F1', borderRadius: 12, padding: 13 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: theme.primary }}>{link.name} →</span>
                {link.official && (
                  <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '.06em', color: '#1B5E20', background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 5, padding: '1px 6px' }}>OFFICIAL</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#43526B', lineHeight: 1.5 }}>{link.desc}</div>
            </a>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 11, color: '#6B7A90', lineHeight: 1.5, marginTop: 16 }}>
        Group listings open external searches on VA/VSO sites and public platforms (RallyPoint, Meetup, Facebook, Nextdoor). PCS Express doesn't vet individual groups — confirm details on the official source.
      </p>
    </div>
  );
}
