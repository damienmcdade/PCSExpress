/*
 * Installation search-location resolver + official-source card builders.
 *
 * Extracted from App.jsx (Phase: perf Tier 1b PR-A) into a leaf module so
 * the tab components that share these helpers — SchoolsTab,
 * VeteranBusinessesTab, EducationBenefitsTab — can each be code-split into
 * their own lazy chunks without creating a circular import back into
 * App.jsx. This module depends only on static data (vetBizCities), never
 * on App.jsx, so it stays a safe leaf.
 *
 * Pure functions, no React. Behavior is byte-for-byte identical to the
 * originals; this was a move, not a rewrite.
 */
import { VET_BIZ_CITY } from '../data/vetBizCities';

// Placeholder kept for parity with the original App.jsx local: the real
// base lookup lives in BaseMapModule; here it's an empty array so the
// resolver's optional map-base branch is a no-op (falls back to alias).
const ALL_BASES = [];

export function getInstallationSearchLocation(installation) {
  const base = (installation || '').split(',')[0].trim();
  if (!base) return 'military installation';
  const alias = {
    'Fort Bragg': 'Fort Liberty',
    'Fort Hood': 'Fort Cavazos',
    'Fort Gordon': 'Fort Eisenhower',
    'Fort Lee': 'Fort Gregg-Adams',
    'Fort Rucker': 'Fort Novosel',
    'Camp Lejeune': 'Marine Corps Base Camp Lejeune',
    'Marine Corps Base Quantico': 'MCB Quantico',
  }[base] || base;
  if (VET_BIZ_CITY[base]) return VET_BIZ_CITY[base];
  if (VET_BIZ_CITY[alias]) return VET_BIZ_CITY[alias];
  const mapBase = ALL_BASES.find(b => b.name === base || b.name === alias || base.includes(b.name) || b.name.includes(base));
  return mapBase ? `${mapBase.name} ${mapBase.state}` : alias;
}

export function googleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function officialSchoolSearchUrl(name, city) {
  return googleSearchUrl(`${name} ${city || ''} official school site:nces.ed.gov OR site:dodea.edu OR site:.edu`);
}

export function officialCollegeCards(installation) {
  const loc = getInstallationSearchLocation(installation);
  return [
    { name: 'VA GI Bill Comparison Tool', desc: 'Official VA tool for comparing GI Bill-approved colleges, caution flags, benefits, and veteran indicators.', url: 'https://www.va.gov/gi-bill-comparison-tool/' },
    { name: `NCES College Navigator near ${loc}`, desc: 'Official Department of Education college search and institutional data.', url: googleSearchUrl(`${loc} colleges site:nces.ed.gov/collegenavigator`) },
    { name: 'DoD MOU Participating Institutions', desc: 'Official DoD voluntary education institution participation source.', url: 'https://www.dodmou.com/' },
    { name: `Official admissions search near ${loc}`, desc: 'Google search restricted toward official college and admissions pages for the selected gaining area.', url: googleSearchUrl(`${loc} college admissions official site:.edu`) },
  ];
}

export function officialSchoolCards(installation) {
  const loc = getInstallationSearchLocation(installation);
  return [
    { name: `NCES K-12 school search near ${loc}`, desc: 'Official National Center for Education Statistics public/private school search.', url: 'https://nces.ed.gov/ccd/schoolsearch/' },
    { name: 'DoDEA Find Your School', desc: 'Official DoDEA school finder for installations with DoDEA schools.', url: 'https://www.dodea.edu/find-your-school' },
    { name: 'School Liaison Program', desc: 'Official Military OneSource school liaison support for military-connected children.', url: 'https://www.militaryonesource.mil/benefits/school-liaison-program/' },
    { name: `Official school web search for ${loc}`, desc: 'Google search focused on official public school, DoDEA, district, and education agency sources.', url: googleSearchUrl(`${loc} schools military family official site:.gov OR site:dodea.edu`) },
  ];
}

export function veteranBusinessBubbleLinks(installation) {
  const loc = getInstallationSearchLocation(installation);
  return [
    { category: 'All', label: 'SBA veteran resources', url: 'https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses', desc: 'Official SBA overview for veteran-owned businesses, training, funding, and contracting.' },
    { category: 'Search', label: 'SBA business search', url: 'https://search.certifications.sba.gov/', desc: `Official SBA Small Business Search. Use ${loc}, VOSB, SDVOSB, and service keywords to find public certified-firm records.` },
    { category: 'Food', label: 'Food service firms', url: 'https://search.certifications.sba.gov/', desc: `Official SBA search path for food-service, restaurant, catering, cafe, and dining-related veteran-owned firms near ${loc}.` },
    { category: 'Home Services', label: 'Home service firms', url: 'https://search.certifications.sba.gov/', desc: `Official SBA search path for construction, repair, moving, real estate, maintenance, and home-service firms near ${loc}.` },
    { category: 'Certification', label: 'SBA VetCert', url: 'https://veterans.certify.sba.gov/', desc: 'Official SBA certification portal and small business search for certified VOSB and SDVOSB firms.' },
    { category: 'Contracting', label: 'Federal contracting', url: 'https://www.sba.gov/federal-contracting/contracting-assistance-programs/veteran-contracting-assistance-programs', desc: 'Official SBA contracting assistance guidance for veteran-owned small businesses.' },
    { category: 'Counseling', label: 'VBOC counseling', url: 'https://www.sba.gov/local-assistance/resource-partners/veterans-business-outreach-center-vboc-program', desc: 'Official SBA Veterans Business Outreach Center locator for free counseling, training, and mentorship.' },
    { category: 'VA OSDBU', label: 'VA OSDBU', url: 'https://www.va.gov/osdbu/index.asp', desc: 'Official VA small and veteran business program information.' },
    { category: 'SAM.gov', label: 'SAM.gov entities', url: 'https://sam.gov/entity-information', desc: 'Official federal entity information search for businesses registered to work with the government.' },
  ];
}

export function veteranBusinessDiscoveryCards(installation) {
  const loc = getInstallationSearchLocation(installation);
  return [
    { name: 'SBA Veteran-Owned Business Resources', category: 'All', desc: 'Official SBA support for veteran entrepreneurship, including training, funding, and federal contracting resources.', url: 'https://www.sba.gov/business-guide/grow-your-business/veteran-owned-businesses', icon: 'SBA' },
    { name: `SBA Small Business Search for ${loc}`, category: 'Search', desc: 'Official SBA search portal for certified public small-business records. Search by location, VOSB or SDVOSB status, keywords, and NAICS terms.', url: 'https://search.certifications.sba.gov/', icon: 'SBA' },
    { name: `SAM.gov Entity Information for ${loc}`, category: 'Search', desc: 'Official SAM.gov entity search for public registration and active entity records. Use the gaining location and business keywords, then verify active status.', url: 'https://sam.gov/entity-information', icon: 'SAM' },
    { name: `Food and restaurant firms near ${loc}`, category: 'Food', desc: 'Use the official SBA Small Business Search with terms such as food service, restaurant, catering, cafe, dining, and the gaining installation area.', url: 'https://search.certifications.sba.gov/', icon: 'FOOD' },
    { name: `Food-service entity verification for ${loc}`, category: 'Food', desc: 'Use SAM.gov Entity Information to verify public entity records for food-service, catering, and dining businesses before relying on a listing.', url: 'https://sam.gov/entity-information', icon: 'SAM' },
    { name: `Home service firms near ${loc}`, category: 'Home Services', desc: 'Use the official SBA Small Business Search with terms such as construction, repair, moving, real estate, maintenance, cleaning, and the gaining installation area.', url: 'https://search.certifications.sba.gov/', icon: 'HOME' },
    { name: `Home-service entity verification for ${loc}`, category: 'Home Services', desc: 'Use SAM.gov Entity Information to verify public entity records for repair, moving, construction, and home-service businesses.', url: 'https://sam.gov/entity-information', icon: 'SAM' },
    { name: 'SBA VetCert and Small Business Search', category: 'Certification', desc: 'Official SBA portal for VetCert certification and discovery of certified veteran-owned firms.', url: 'https://veterans.certify.sba.gov/', icon: 'VOSB' },
    { name: 'SBA Veteran Contracting Assistance', category: 'Contracting', desc: 'Official SBA guidance for veteran-owned small businesses pursuing federal contract awards and set-aside opportunities.', url: 'https://www.sba.gov/federal-contracting/contracting-assistance-programs/veteran-contracting-assistance-programs', icon: 'CONTRACT' },
    { name: 'Veterans Business Outreach Centers', category: 'Counseling', desc: 'Official SBA locator for free VBOC business counseling, training, workshops, and mentorship.', url: 'https://www.sba.gov/local-assistance/resource-partners/veterans-business-outreach-center-vboc-program', icon: 'VBOC' },
    { name: 'VA OSDBU Veteran Business Resources', category: 'VA OSDBU', desc: 'Official VA Office of Small and Disadvantaged Business Utilization information for procurement-ready small and veteran businesses.', url: 'https://www.va.gov/osdbu/index.asp', icon: 'VA' },
  ].filter(card => card.url);
}
