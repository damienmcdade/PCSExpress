import { useState } from 'react'

const OVERSEAS_KEYWORDS = [
  'Humphreys', 'Kadena', 'Yokota', 'Ramstein', 'Stuttgart',
  'Germany', 'Japan', 'Korea', 'Italy', 'Spain', 'Okinawa',
]

const OVERSEAS_CHAPEL_INFO = [
  {
    keyword: 'Humphreys',
    name: 'Camp Humphreys Main Chapel',
    phone: 'DSN 754-6073 / +82-31-690-6073',
    hours: 'Mon–Fri 0800–1700 KST',
    services: ['Sunday Protestant 09:00', 'Sunday Catholic 11:00', 'Friday Islamic 12:30'],
    notes: 'Korea Garrison chapel supports all denominations. Contact UMT for additional times.',
  },
  {
    keyword: 'Kadena',
    name: 'Kadena Chapel (Bldg 103)',
    phone: 'DSN 634-1601 / +81-98-934-1601',
    hours: 'Mon–Fri 0730–1630 JST',
    services: ['Sunday Protestant 10:00', 'Sunday Catholic 08:00 & 11:30', 'Various weekday services'],
    notes: 'Okinawa chapels serve USAF, USA, and joint personnel on the island.',
  },
  {
    keyword: 'Yokota',
    name: 'Yokota AB Chapel',
    phone: 'DSN 225-7777 / +81-42-552-2511',
    hours: 'Mon–Fri 0800–1700 JST',
    services: ['Sunday Protestant 09:00', 'Sunday Catholic 11:00', 'Jewish/Shabbat by request'],
    notes: 'Located in Building 315. All services open to DoD cardholders.',
  },
  {
    keyword: 'Ramstein',
    name: 'Ramstein AB Chapel Center',
    phone: 'DSN 480-1110 / +49-6371-47-1110',
    hours: 'Mon–Fri 0730–1630 CET',
    services: ['Sunday Protestant 09:00', 'Sunday Catholic 11:00', 'Wednesday Midweek 18:00'],
    notes: 'Largest USAF chapel in Europe. Community Bible Study and youth programs available.',
  },
  {
    keyword: 'Stuttgart',
    name: 'Stuttgart Military Community Chapel',
    phone: 'DSN 596-2601',
    hours: 'Mon–Fri 0800–1700 CET',
    services: ['Sunday Protestant 10:00', 'Sunday Catholic 08:30', 'Friday Islamic prayers'],
    notes: 'Serves EUCOM and AFRICOM personnel across Patch, Kelley, and Robinson Barracks.',
  },
]

function getOverseasInfo(gainingInstallation) {
  if (!gainingInstallation) return null
  for (const item of OVERSEAS_CHAPEL_INFO) {
    if (gainingInstallation.includes(item.keyword)) return item
  }
  const isOverseas = OVERSEAS_KEYWORDS.some((kw) => gainingInstallation.includes(kw))
  if (isOverseas) {
    return {
      name: 'Installation Chapel',
      phone: 'Contact installation UMT / Chaplain Corps',
      hours: 'Contact your gaining installation for hours',
      services: ['Contact Unit Ministry Team (UMT) upon arrival'],
      notes: 'All overseas installations provide multi-denomination chapel services. Contact your gaining unit chaplain for current schedule.',
    }
  }
  return null
}

function getBranchSupportCenter(branch) {
  const b = (branch || '').toLowerCase()
  if (b.includes('navy')) {
    return {
      name: 'Fleet & Family Support Center (FFSC)',
      branch: 'Navy',
      description: 'Financial counseling, deployment support, family advocacy, and transition assistance.',
      url: 'https://www.cnic.navy.mil/ffsp',
      phone: '1-800-342-9647',
    }
  }
  if (b.includes('marine')) {
    return {
      name: 'Marine Corps Family Services (MCCS)',
      branch: 'Marine Corps',
      description: 'Family support, counseling, financial readiness, and deployment readiness services.',
      url: 'https://www.usmc-mccs.org',
      phone: '1-800-336-4592',
    }
  }
  if (b.includes('air force') || b.includes('space force')) {
    const isSpace = b.includes('space force')
    return {
      name: 'Airman & Family Readiness Center (AFRC)',
      branch: isSpace ? 'Space Force' : 'Air Force',
      description: 'Financial counseling, deployment support, family advocacy, employment assistance, and relocation services.',
      url: 'https://www.afpc.af.mil',
      phone: '1-800-342-9647',
    }
  }
  if (b.includes('coast guard')) {
    return {
      name: 'Work-Life Programs (CG)',
      branch: 'Coast Guard',
      description: 'Work-life balance, family counseling, financial readiness, and support for CG families.',
      url: 'https://www.dcms.uscg.mil',
      phone: '1-800-342-9647',
    }
  }
  return {
    name: 'Army Community Service (ACS)',
    branch: 'Army',
    description: 'Financial counseling, deployment support, family advocacy, employment readiness, and relocation assistance.',
    url: 'https://www.armymwr.com/acs',
    phone: '(Installation ACS) – find via MilitaryINSTALLATIONS',
  }
}

const RELIGIOUS_SERVICES = {
  'Fort Liberty': [
    { id: 1, name: 'Fort Liberty Main Post Chapel – Catholic', denomination: 'Catholic', address: '2175 Reilly Rd, Fort Liberty, NC 28310', phone: '(910) 396-5000', mass: ['Sunday 9:00 AM', 'Saturday Vigil 5:00 PM', 'Weekday 12:00 PM (Mon/Wed/Fri)'], onBase: true, community_reviews: ['Great chaplain community – always welcoming to new arrivals', 'Saturday vigil is well-attended and very family-friendly'] },
    { id: 2, name: 'Fort Liberty Main Post Chapel – Protestant', denomination: 'Protestant', address: '2175 Reilly Rd, Fort Liberty, NC 28310', phone: '(910) 396-5000', mass: ['Sunday 11:00 AM', 'Sunday Contemporary 9:00 AM', 'Wednesday Bible Study 6:00 PM'], onBase: true, community_reviews: ['Contemporary Sunday service is great for families with young kids', 'Chaplain team is very responsive – reached out same week we arrived'] },
    { id: 3, name: 'Fort Liberty Chapel – Jewish Services', denomination: 'Jewish', address: '2175 Reilly Rd, Fort Liberty, NC 28310', phone: '(910) 396-5000', mass: ['Friday Shabbat 6:00 PM', 'Saturday Morning Service 9:30 AM'], onBase: true, community_reviews: ['Small but very tight-knit community', 'Shabbat services are consistently held – a great touchstone on PCS'] },
    { id: 4, name: 'Fort Liberty Chapel – Islamic Services', denomination: 'Islamic', address: '2175 Reilly Rd, Fort Liberty, NC 28310', phone: '(910) 396-5000', mass: ["Friday Jumu'ah 1:00 PM", 'Daily Salah times posted at chapel'], onBase: true, community_reviews: ["Jumu'ah is well-organized with a knowledgeable khateeb", 'Muslim community here is welcoming and active'] },
    { id: 5, name: 'Fayetteville Community Church', denomination: 'Protestant', address: '500 Raeford Rd, Fayetteville, NC 28305', phone: '(910) 484-3191', mass: ['Sunday 9:00 AM & 11:00 AM'], onBase: false, community_reviews: ['Very military-friendly congregation', 'Strong outreach to newcomers – expect a warm welcome'] },
    { id: 6, name: 'Islamic Center of Fayetteville', denomination: 'Islamic', address: '1000 Ireland Dr, Fayetteville, NC 28304', phone: '(910) 867-1866', mass: ['Daily prayers', "Friday Jumu'ah 1:30 PM"], onBase: false, community_reviews: ['Large, active congregation serving the Fort Liberty community', 'Classes and youth programs available on weekends'] },
  ],
  'Fort Bragg': [
    { id: 1, name: 'Fort Bragg Main Post Chapel – Catholic', denomination: 'Catholic', address: '2175 Reilly Rd, Fort Bragg, NC 28310', phone: '(910) 396-5000', mass: ['Sunday 9:00 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Excellent chaplain team', 'Welcoming to PCS families'] },
    { id: 2, name: 'Fort Bragg Main Post Chapel – Protestant', denomination: 'Protestant', address: '2175 Reilly Rd, Fort Bragg, NC 28310', phone: '(910) 396-5000', mass: ['Sunday 11:00 AM', 'Wednesday 6:00 PM'], onBase: true, community_reviews: ['Consistent services and strong community', 'Great Wednesday family night programs'] },
  ],
  'Camp Humphreys': [
    { id: 1, name: 'Camp Humphreys Main Chapel – Catholic', denomination: 'Catholic', address: 'Bldg 685, Camp Humphreys, Korea', phone: 'DSN 754-6073', mass: ['Sunday 10:00 AM', 'Saturday 5:00 PM'], onBase: true, community_reviews: ['Small chapel community but very supportive of newcomers', 'Chaplain goes above and beyond for the Catholic community'] },
    { id: 2, name: 'Camp Humphreys Main Chapel – Protestant', denomination: 'Protestant', address: 'Bldg 685, Camp Humphreys, Korea', phone: 'DSN 754-6073', mass: ['Sunday 9:00 AM & 11:00 AM', 'Wednesday 6:00 PM'], onBase: true, community_reviews: ['Very active congregation for an OCONUS post', 'Services are bilingual-friendly; Korean spouses feel included'] },
    { id: 3, name: 'Camp Humphreys Chapel – Islamic', denomination: 'Islamic', address: 'Bldg 685, Camp Humphreys, Korea', phone: 'DSN 754-6073', mass: ["Friday Jumu'ah 12:30 PM", 'Contact UMT for prayer room access'], onBase: true, community_reviews: ['Prayer space is clean and accessible 24/7', 'Chaplain coordinates with local Korean Muslim community'] },
  ],
  'Fort Campbell': [
    { id: 1, name: 'Fort Campbell Main Post Chapel – Catholic', denomination: 'Catholic', address: '1 Screaming Eagle Blvd, Fort Campbell, KY 42223', phone: '(270) 798-5541', mass: ['Sunday 8:00 AM & 10:00 AM', 'Saturday Vigil 4:30 PM', 'Daily 12:05 PM'], onBase: true, community_reviews: ['Strong daily Mass attendance', 'Chaplain team is very approachable and involved in the community'] },
    { id: 2, name: 'Fort Campbell Main Post Chapel – Protestant', denomination: 'Protestant', address: '1 Screaming Eagle Blvd, Fort Campbell, KY 42223', phone: '(270) 798-5541', mass: ['Sunday 9:30 AM Contemporary', 'Sunday 11:00 AM Traditional', 'Thursday Bible Study 6:30 PM'], onBase: true, community_reviews: ['Two service styles so everyone finds a fit', 'Very family-oriented – great nursery support'] },
    { id: 3, name: 'Fort Campbell Chapel – Islamic', denomination: 'Islamic', address: '1 Screaming Eagle Blvd, Fort Campbell, KY 42223', phone: '(270) 798-5541', mass: ["Friday Jumu'ah 1:00 PM", 'Daily prayer space available'], onBase: true, community_reviews: ['Dedicated prayer space is well-maintained', 'Friday service attendance is steady and growing'] },
  ],
  'Joint Base Lewis-McChord': [
    { id: 1, name: 'JBLM Main Post Chapel – Catholic', denomination: 'Catholic', address: 'Bldg 2140 Santa Fe Dr, JBLM, WA 98433', phone: '(253) 967-6815', mass: ['Sunday 9:00 AM & 11:30 AM', 'Saturday Vigil 5:00 PM', 'Weekday 12:00 PM'], onBase: true, community_reviews: ['Large, well-resourced parish', 'Confessions are offered before every Mass – great for busy schedules'] },
    { id: 2, name: 'JBLM Main Post Chapel – Protestant', denomination: 'Protestant', address: 'Bldg 2140 Santa Fe Dr, JBLM, WA 98433', phone: '(253) 967-6815', mass: ['Sunday 10:00 AM', 'Sunday 11:30 AM Contemporary', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['One of the larger military chapel congregations on the West Coast', 'Contemporary service has a great worship band'] },
    { id: 3, name: 'JBLM Chapel – Buddhist Services', denomination: 'Buddhist', address: 'Bldg 2140 Santa Fe Dr, JBLM, WA 98433', phone: '(253) 967-6815', mass: ['Sunday Dharma 10:00 AM', 'Thursday Meditation 6:00 PM'], onBase: true, community_reviews: ['Unique to have a dedicated Buddhist group on post', 'Meditation sessions are open to all – not just Buddhists'] },
  ],
  'Fort Hood': [
    { id: 1, name: 'Fort Hood Regimental Chapel – Catholic', denomination: 'Catholic', address: '761 Clarke Rd, Fort Hood, TX 76544', phone: '(254) 287-1110', mass: ['Sunday 8:30 AM & 11:00 AM', 'Saturday Vigil 5:00 PM', 'Daily 12:05 PM'], onBase: true, community_reviews: ['Very active parish with strong Family Life programs', 'Daily Mass is a great way to start the day'] },
    { id: 2, name: 'Fort Hood Regimental Chapel – Protestant', denomination: 'Protestant', address: '761 Clarke Rd, Fort Hood, TX 76544', phone: '(254) 287-1110', mass: ['Sunday 9:00 AM & 11:00 AM', 'Wednesday Evening 6:00 PM'], onBase: true, community_reviews: ['Multiple chapels across post – find one near your unit area', 'Wednesday services include a potluck dinner – very social'] },
  ],
  'Fort Cavazos': [
    { id: 1, name: 'Fort Cavazos Main Chapel – Catholic', denomination: 'Catholic', address: '761 Clarke Rd, Fort Cavazos, TX 76544', phone: '(254) 287-1110', mass: ['Sunday 8:30 AM & 11:00 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Well-maintained chapel with a dedicated chaplain staff', 'Good community of Catholic families here'] },
    { id: 2, name: 'Fort Cavazos Main Chapel – Protestant', denomination: 'Protestant', address: '761 Clarke Rd, Fort Cavazos, TX 76544', phone: '(254) 287-1110', mass: ['Sunday 9:00 AM & 11:00 AM', 'Wednesday 6:00 PM'], onBase: true, community_reviews: ['Great chapel team that reaches out to newcomers', 'Wednesday evenings are a community staple'] },
  ],
  'Fort Carson': [
    { id: 1, name: 'Fort Carson Main Post Chapel – Catholic', denomination: 'Catholic', address: '1800 Ricker Ave, Fort Carson, CO 80913', phone: '(719) 526-5541', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM', 'Daily 12:00 PM'], onBase: true, community_reviews: ['Beautiful chapel setting with mountain views nearby', 'Strong sense of community – they track newcomers and follow up'] },
    { id: 2, name: 'Fort Carson Main Post Chapel – Protestant', denomination: 'Protestant', address: '1800 Ricker Ave, Fort Carson, CO 80913', phone: '(719) 526-5541', mass: ['Sunday 10:00 AM Contemporary', 'Sunday 11:30 AM Traditional', 'Thursday 6:30 PM Bible Study'], onBase: true, community_reviews: ['Outdoor-focused congregation – regular hiking and camping fellowship', 'Traditional and contemporary options give flexibility'] },
    { id: 3, name: 'Fort Carson Chapel – Islamic', denomination: 'Islamic', address: '1800 Ricker Ave, Fort Carson, CO 80913', phone: '(719) 526-5541', mass: ["Friday Jumu'ah 1:00 PM", 'Prayer room open daily'], onBase: true, community_reviews: ['Prayer room is clean and accessible', 'Small but welcoming Muslim community on post'] },
  ],
  'Naval Station Norfolk': [
    { id: 1, name: 'NS Norfolk Main Chapel – Catholic', denomination: 'Catholic', address: '9079 Hampton Blvd, Norfolk, VA 23511', phone: '(757) 444-7823', mass: ['Sunday 9:30 AM & 11:30 AM', 'Saturday Vigil 5:00 PM', 'Daily 12:05 PM'], onBase: true, community_reviews: ['Largest Navy chapel on the East Coast – extensive programs', 'Daily Mass community is very tight-knit and supportive of deployments'] },
    { id: 2, name: 'NS Norfolk Main Chapel – Protestant', denomination: 'Protestant', address: '9079 Hampton Blvd, Norfolk, VA 23511', phone: '(757) 444-7823', mass: ['Sunday 9:00 AM', 'Sunday 11:00 AM Gospel', 'Wednesday 6:00 PM'], onBase: true, community_reviews: ['Gospel service is a highlight – powerful worship experience', 'Multiple chaplains on staff so someone is always available'] },
    { id: 3, name: 'NS Norfolk Chapel – Jewish Services', denomination: 'Jewish', address: '9079 Hampton Blvd, Norfolk, VA 23511', phone: '(757) 444-7823', mass: ['Friday Shabbat 6:30 PM', 'High Holiday services coordinated annually'], onBase: true, community_reviews: ['Active Jewish Welfare Board group coordinates holiday services', 'Well-attended Friday Shabbat services'] },
  ],
  'Marine Corps Base Camp Lejeune': [
    { id: 1, name: 'Camp Lejeune Main Side Chapel – Catholic', denomination: 'Catholic', address: '100 Stone St, Camp Lejeune, NC 28547', phone: '(910) 451-5531', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM', 'Daily 12:10 PM (Mon–Fri)'], onBase: true, community_reviews: ['Strong military Catholic community with active ministry programs', 'Chaplains are great with deployment families'] },
    { id: 2, name: 'Camp Lejeune Main Side Chapel – Protestant', denomination: 'Protestant', address: '100 Stone St, Camp Lejeune, NC 28547', phone: '(910) 451-5531', mass: ['Sunday 10:30 AM', 'Wednesday 6:30 PM Bible Study'], onBase: true, community_reviews: ['Very welcoming to new Marines and their families', 'Wednesday service childcare is provided – parents appreciated'] },
    { id: 3, name: 'Camp Lejeune Chapel – Islamic', denomination: 'Islamic', address: '100 Stone St, Camp Lejeune, NC 28547', phone: '(910) 451-5531', mass: ["Friday Jumu'ah 1:00 PM", 'Daily prayer area accessible'], onBase: true, community_reviews: ['Clean dedicated space', 'Friday service is well-attended by both base and local community members'] },
  ],
  'Camp Pendleton': [
    { id: 1, name: 'Camp Pendleton Main Chapel – Catholic', denomination: 'Catholic', address: 'Vandegrift Blvd, Camp Pendleton, CA 92055', phone: '(760) 725-6503', mass: ['Sunday 8:30 AM & 10:30 AM', 'Saturday Vigil 5:00 PM', 'Daily 12:05 PM'], onBase: true, community_reviews: ['Beautiful chapel, very active congregation', 'Great support groups for deployed Marine families'] },
    { id: 2, name: 'Camp Pendleton Main Chapel – Protestant', denomination: 'Protestant', address: 'Vandegrift Blvd, Camp Pendleton, CA 92055', phone: '(760) 725-6503', mass: ['Sunday 9:30 AM Contemporary', 'Sunday 11:00 AM Traditional', 'Thursday 6:00 PM'], onBase: true, community_reviews: ['Multiple chapel locations across this large base', 'Chaplains are very visible in the community and unit areas'] },
    { id: 3, name: 'Camp Pendleton Chapel – Buddhist', denomination: 'Buddhist', address: 'Vandegrift Blvd, Camp Pendleton, CA 92055', phone: '(760) 725-6503', mass: ['Sunday 2:00 PM Dharma Talk', 'Weekly meditation sessions – contact chapel'], onBase: true, community_reviews: ['Growing Buddhist community at Pendleton', 'Meditation sessions attract Marines seeking stress relief as well'] },
  ],
  'Ramstein Air Base': [
    { id: 1, name: 'Ramstein AB Chapel Center – Catholic', denomination: 'Catholic', address: 'Bldg 101, Ramstein-Miesenbach, Germany', phone: 'DSN 480-1110', mass: ['Sunday 8:00 AM & 10:00 AM', 'Saturday Vigil 5:00 PM', 'Daily 12:05 PM'], onBase: true, community_reviews: ['Largest USAF chapel in Europe – outstanding facilities', 'Very active community with multiple ministry groups'] },
    { id: 2, name: 'Ramstein AB Chapel Center – Protestant', denomination: 'Protestant', address: 'Bldg 101, Ramstein-Miesenbach, Germany', phone: 'DSN 480-1110', mass: ['Sunday 9:00 AM Contemporary', 'Sunday 11:00 AM Traditional', 'Wednesday 18:00'], onBase: true, community_reviews: ['Community Bible Study is extremely popular', 'Youth programs are well-organized for dependent children'] },
  ],
  'Kadena Air Base': [
    { id: 1, name: 'Kadena Chapel – Catholic', denomination: 'Catholic', address: 'Bldg 103, Kadena AB, Okinawa, Japan', phone: 'DSN 634-1601', mass: ['Sunday 8:00 AM & 11:30 AM', 'Saturday Vigil 5:00 PM', 'Weekday 12:05 PM'], onBase: true, community_reviews: ['Great chapel community on Okinawa', 'Helpful for newcomers navigating life on a Japanese island'] },
    { id: 2, name: 'Kadena Chapel – Protestant', denomination: 'Protestant', address: 'Bldg 103, Kadena AB, Okinawa, Japan', phone: 'DSN 634-1601', mass: ['Sunday 10:00 AM', 'Sunday 11:30 AM', 'Wednesday 18:30'], onBase: true, community_reviews: ['Multiple service times accommodate various shift schedules', 'Active couples and singles ministries'] },
  ],
  'Yokota Air Base': [
    { id: 1, name: 'Yokota AB Chapel – Catholic', denomination: 'Catholic', address: 'Bldg 315, Yokota AB, Fussa, Japan', phone: 'DSN 225-7777', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Cozy chapel with an intimate community feel', 'Chaplain is outstanding – very present and pastoral'] },
    { id: 2, name: 'Yokota AB Chapel – Protestant', denomination: 'Protestant', address: 'Bldg 315, Yokota AB, Fussa, Japan', phone: 'DSN 225-7777', mass: ['Sunday 10:00 AM', 'Wednesday 18:30'], onBase: true, community_reviews: ['Active children and youth programs', 'Friendly community – great for families new to Japan'] },
  ],
  'Fort Bliss': [
    { id: 1, name: 'Fort Bliss Main Post Chapel – Catholic', denomination: 'Catholic', address: '101 Pershing Rd, Fort Bliss, TX 79916', phone: '(915) 568-2106', mass: ['Sunday 8:30 AM & 10:30 AM', 'Saturday Vigil 5:00 PM', 'Daily 12:00 PM'], onBase: true, community_reviews: ['Bilingual (English/Spanish) Mass available on Sundays – great for Hispanic families', 'Strong Catholic community with many active lay ministers'] },
    { id: 2, name: 'Fort Bliss Main Post Chapel – Protestant', denomination: 'Protestant', address: '101 Pershing Rd, Fort Bliss, TX 79916', phone: '(915) 568-2106', mass: ['Sunday 10:00 AM', 'Wednesday 6:30 PM Bible Study'], onBase: true, community_reviews: ['Welcoming congregation right by the main gate', 'Bible study draws a solid mid-week crowd'] },
  ],
  'Fort Stewart': [
    { id: 1, name: 'Fort Stewart Main Post Chapel – Catholic', denomination: 'Catholic', address: 'Wilson Ave, Fort Stewart, GA 31314', phone: '(912) 767-8239', mass: ['Sunday 10:30 AM', 'Saturday Vigil 5:00 PM', 'Daily 12:05 PM (Mon–Fri)'], onBase: true, community_reviews: ['Solid parish community', 'Chaplain is very active with deployment support programs'] },
    { id: 2, name: 'Fort Stewart Main Post Chapel – Protestant', denomination: 'Protestant', address: 'Wilson Ave, Fort Stewart, GA 31314', phone: '(912) 767-8239', mass: ['Sunday 9:30 AM Contemporary', 'Sunday 11:00 AM Traditional', 'Thursday 6:30 PM'], onBase: true, community_reviews: ['Great worship team at contemporary service', 'Thursday evenings include family dinner – very welcoming'] },
  ],
  'Fort Sam Houston': [
    { id: 1, name: 'Fort Sam Houston Chapel – Catholic', denomination: 'Catholic', address: '1400 E Grayson St, JBSA-Fort Sam Houston, TX 78234', phone: '(210) 221-2337', mass: ['Sunday 9:00 AM & 11:15 AM', 'Saturday Vigil 5:00 PM', 'Daily 12:05 PM'], onBase: true, community_reviews: ['Historic chapel on one of the oldest posts in the Army', 'Large, diverse congregation reflecting the medical community here'] },
    { id: 2, name: 'Fort Sam Houston Chapel – Protestant', denomination: 'Protestant', address: '1400 E Grayson St, JBSA-Fort Sam Houston, TX 78234', phone: '(210) 221-2337', mass: ['Sunday 10:00 AM', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Strong community ties with San Antonio churches', 'Very supportive of medical training students'] },
  ],
  'Fort Drum': [
    { id: 1, name: 'Fort Drum Main Post Chapel – Catholic', denomination: 'Catholic', address: '10550 Arnold Way, Fort Drum, NY 13602', phone: '(315) 772-5542', mass: ['Sunday 9:30 AM & 11:00 AM', 'Saturday Vigil 4:00 PM', 'Daily 12:05 PM'], onBase: true, community_reviews: ['Warm community that really supports families during long winter deployments', 'Chaplain team is outstanding'] },
    { id: 2, name: 'Fort Drum Main Post Chapel – Protestant', denomination: 'Protestant', address: '10550 Arnold Way, Fort Drum, NY 13602', phone: '(315) 772-5542', mass: ['Sunday 10:00 AM', 'Wednesday 6:00 PM'], onBase: true, community_reviews: ['Small-town feel makes for a tight community', 'Wednesday services are well-attended even in the harsh winters'] },
  ],
}

const ONLINE_RESOURCES = [
  { name: 'Military Installations', url: 'https://www.militaryinstallations.dod.mil', description: 'Find your installation chaplain office and local faith resources' },
  { name: 'Chapel Locator (Army)', url: 'https://www.chapel.army.mil', description: 'Army chapel services, times, and chaplain contacts worldwide' },
  { name: 'Navy Chaplain Corps', url: 'https://www.navy.mil/NavyData/People/Fields/chaplains/', description: 'Fleet chaplain services and spiritual care resources' },
  { name: 'USMC Chaplain Directory', url: 'https://www.marines.mil/News/Publications/MCPEL/Marine-Corps-Orders/Article/899309/', description: 'Marine Corps chaplain directory and unit ministry teams' },
  { name: 'Chaplain Alliance', url: 'https://www.chaplainalliance.org', description: 'Multi-denomination chaplain resources and endorsing agency contacts' },
  { name: 'Military OneSource – Faith', url: 'https://www.militaryonesource.mil/recreation-travel-shopping/recreation/spiritual-fitness/', description: 'Spiritual fitness tools and faith-based support for all branches' },
]

function ReligiousServicesModule({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('services')

  const getServices = () => {
    const baseKey = (profile?.gainingInstallation || '').split(',')[0].trim()
    return RELIGIOUS_SERVICES[baseKey] || []
  }

  const getServicesByDenomination = (denom) =>
    getServices().filter((s) => s.denomination === denom)

  const filterDenom = profile?.filterDenomination
  const showAll = profile?.showAll !== false && !filterDenom

  const denominationsToShow = showAll
    ? ['Catholic', 'Protestant', 'Jewish', 'Islamic', 'Buddhist', 'Multi-faith Community']
    : filterDenom
    ? [filterDenom, 'Multi-faith Community']
    : ['Catholic', 'Protestant', 'Jewish', 'Islamic', 'Buddhist', 'Multi-faith Community']

  const overseas = (() => {
    if (!showAll) return null
    const gi = profile?.gainingInstallation || ''
    return getOverseasInfo(gi)
  })()

  const branchSupport = getBranchSupportCenter(profile?.branch)
  const services = getServices()
  const instName = (profile?.gainingInstallation || '').split(',')[0].trim() || 'your installation'

  const TABS = [
    { id: 'services', label: 'Services', icon: '⛪' },
    { id: 'counseling', label: 'Counseling', icon: '🤝' },
  ]

  const tabBtn = (t) => ({
    padding: '8px 16px',
    borderRadius: 20,
    border: `1.5px solid ${activeTab === t.id ? theme.primary : '#E0E6EE'}`,
    background: activeTab === t.id ? theme.primary : '#FFFFFF',
    color: activeTab === t.id ? '#FFFFFF' : '#56697C',
    fontSize: 11,
    cursor: 'pointer',
    fontWeight: activeTab === t.id ? 800 : 500,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  })

  const card = (extra = {}) => ({
    background: '#FFFFFF',
    border: '1px solid #E0E6EE',
    borderRadius: 12,
    padding: '14px',
    marginBottom: 12,
    ...extra,
  })

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ color: theme.primary, marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 800 }}>
        Faith &amp; Spiritual Resources
      </h2>

      {/* TAB BAR */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabBtn(t)}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── SERVICES TAB ── */}
      {activeTab === 'services' && (
        <div>
          {/* Denomination filter banner */}
          {filterDenom && (
            <div style={{
              background: `${theme.primary}15`,
              border: `1px solid ${theme.primary}40`,
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 12,
              color: theme.primary,
              fontWeight: 700,
            }}>
              Showing: {filterDenom} services + multi-faith community
            </div>
          )}

          {/* Overseas chapel section */}
          {overseas && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 10, letterSpacing: 0.5 }}>
                OVERSEAS INSTALLATION CHAPEL
              </div>
              <div style={{ ...card(), borderLeft: '4px solid #1565C0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 6 }}>
                  {overseas.name}
                </div>
                <div style={{ fontSize: 11, color: '#34495E', lineHeight: 1.6, marginBottom: 8 }}>
                  <div>Phone: {overseas.phone}</div>
                  <div>Hours: {overseas.hours}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#56697C', marginBottom: 6, letterSpacing: 0.4 }}>
                  SERVICES
                </div>
                {overseas.services.map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#34495E', marginBottom: 3 }}>· {s}</div>
                ))}
                {overseas.notes && (
                  <div style={{
                    background: '#E3F2FD',
                    borderRadius: 8,
                    padding: '8px 10px',
                    marginTop: 10,
                    fontSize: 10,
                    color: '#1565C0',
                    lineHeight: 1.5,
                  }}>
                    {overseas.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Standard services by denomination */}
          {denominationsToShow.map((denom) => {
            const svcList = getServicesByDenomination(denom)
            if (svcList.length === 0) return null
            return (
              <div key={denom} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 10, letterSpacing: 0.5 }}>
                  {denom.toUpperCase()}
                </div>
                {svcList.map((service) => (
                  <div
                    key={service.id}
                    style={{
                      ...card(),
                      borderLeft: `3px solid ${service.onBase ? '#4CAF50' : theme.primary}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{service.name}</div>
                        <div style={{ fontSize: 10, color: '#56697C', marginTop: 2 }}>
                          {service.onBase ? (
                            <span><span style={{ marginRight: 4 }}>🏢</span>On Base</span>
                          ) : (
                            <span><span style={{ marginRight: 4 }}>🏛️</span>Community</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#34495E', marginBottom: 8, lineHeight: 1.6 }}>
                      <div><span style={{ marginRight: 4 }}>📍</span>{service.address}</div>
                      <div><span style={{ marginRight: 4 }}>📞</span>{service.phone}</div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#56697C', marginBottom: 6, letterSpacing: 0.4 }}>
                      SERVICE TIMES
                    </div>
                    {service.mass.map((time, idx) => (
                      <div key={idx} style={{ fontSize: 10, color: '#34495E', marginBottom: 3 }}>
                        · {time}
                      </div>
                    ))}
                    {service.community_reviews && service.community_reviews.length > 0 && (
                      <div style={{ marginTop: 10, borderTop: '1px solid #F0F0F0', paddingTop: 8 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#56697C', marginBottom: 5, letterSpacing: 0.4 }}>
                          COMMUNITY NOTES
                        </div>
                        {service.community_reviews.map((review, ri) => (
                          <div key={ri} style={{ fontSize: 10, color: '#5A6A78', fontStyle: 'italic', lineHeight: 1.5, marginBottom: ri < service.community_reviews.length - 1 ? 4 : 0 }}>
                            "{review}"
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          })}

          {/* Empty state – no data and no overseas info */}
          {services.length === 0 && !overseas && (
            <div>
              <div style={{
                background: '#F7F9FC',
                border: '1.5px dashed #C5D0DC',
                borderRadius: 14,
                padding: '22px 18px',
                textAlign: 'center',
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>⛪</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0D1821', marginBottom: 6 }}>
                  Public chapel lookup for {instName}
                </div>
                <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.6, marginBottom: 16 }}>
                  Local chapel listings are not stored for this installation yet, so PCS Express opens official installation and public search resources instead of leaving this category empty.
                </div>
                <a
                  href="https://www.militaryinstallations.dod.mil"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: theme.primary,
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: 12,
                    textDecoration: 'none',
                  }}
                >
                  Contact Installation Chaplain
                </a>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(`${instName} installation chapel chaplain official`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: '#F0F4F8',
                    color: theme.primary,
                    fontWeight: 700,
                    fontSize: 12,
                    textDecoration: 'none',
                    marginLeft: 8,
                  }}
                >
                  Search Public Chapel Listings
                </a>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 12, letterSpacing: 0.5 }}>
                ONLINE RESOURCES
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {ONLINE_RESOURCES.map((res, idx) => (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      background: '#FFFFFF',
                      border: `1px solid ${theme.primary}30`,
                      borderTop: `3px solid ${theme.primary}`,
                      borderRadius: 10,
                      padding: '12px 10px',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: theme.primary, marginBottom: 5 }}>
                      {res.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#56697C', lineHeight: 1.5 }}>
                      {res.description}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── COUNSELING TAB ── */}
      {activeTab === 'counseling' && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 10, letterSpacing: 0.5 }}>
            YOUR BRANCH SUPPORT CENTER
          </div>
          <div style={{ ...card(), borderLeft: `4px solid ${theme.primary}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>
              {branchSupport.name}
            </div>
            <div style={{
              display: 'inline-block',
              background: `${theme.primary}15`,
              color: theme.primary,
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 10,
              marginBottom: 8,
            }}>
              {branchSupport.branch}
            </div>
            <div style={{ fontSize: 11, color: '#34495E', marginBottom: 10, lineHeight: 1.6 }}>
              {branchSupport.description}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href={branchSupport.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: 8,
                  background: theme.primary,
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 11,
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Visit Website
              </a>
              {branchSupport.phone && (
                <button
                  onClick={() => window.open(`tel:${branchSupport.phone}`)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: 8,
                    background: '#E3F2FD',
                    color: '#1565C0',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ marginRight: 4 }}>📞</span>Call
                </button>
              )}
            </div>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 10, marginTop: 4, letterSpacing: 0.5 }}>
            CONFIDENTIAL COUNSELING
          </div>
          <div style={{ ...card(), borderLeft: '4px solid #4CAF50', background: '#F1F8E9' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1B5E20', marginBottom: 4 }}>
              Military Family Life Counseling (MFLC)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {['Free', 'Confidential', 'Non-Reportable', 'No Referral Needed'].map((tag) => (
                <div key={tag} style={{
                  background: '#C8E6C9',
                  color: '#1B5E20',
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 10,
                  letterSpacing: 0.3,
                }}>
                  {tag.toUpperCase()}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#34495E', marginBottom: 10, lineHeight: 1.6 }}>
              Short-term, solution-focused counseling for service members and families. Addresses stress, relationships, deployment, grief, and personal challenges. No documentation in military records.
            </div>
            <button
              onClick={() => window.open('tel:800-342-9647')}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                background: '#4CAF50',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <span style={{ marginRight: 6 }}>📞</span>Call MFLC: 800-342-9647
            </button>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 10, marginTop: 4, letterSpacing: 0.5 }}>
            ADDITIONAL RESOURCES
          </div>

          {[
            {
              name: 'Military Chaplain Services',
              description: 'Free, confidential spiritual counseling for all service members and their families. Chaplains serve all faiths and no-faith service members.',
              availability: '24/7 Emergency available',
              phone: '(800) 273-8255',
              accent: theme.primary,
            },
            {
              name: 'Military OneSource',
              description: 'Free counseling sessions (up to 12 non-medical), financial counseling, legal referrals, and specialty consultations for service members and families.',
              availability: '24/7',
              phone: '(800) 342-9647',
              accent: theme.secondary || theme.primary,
            },
            {
              name: 'Faith & Family Support',
              description: 'Spiritual counseling for military families during PCS, deployment, and reintegration. Available at most installations.',
              availability: 'Mon–Fri 8:00 AM – 5:00 PM',
              phone: '(910) 396-5000',
              accent: '#7B1FA2',
            },
          ].map((resource, idx) => (
            <div key={idx} style={{ ...card(), borderLeft: `3px solid ${resource.accent}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 6 }}>
                {resource.name}
              </div>
              <div style={{ fontSize: 11, color: '#34495E', marginBottom: 8, lineHeight: 1.5 }}>
                {resource.description}
              </div>
              <div style={{
                background: '#F5F5F5',
                padding: '7px 10px',
                borderRadius: 6,
                marginBottom: 10,
                fontSize: 10,
                color: '#56697C',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span>🕐</span>
                {resource.availability}
              </div>
              <button
                onClick={() => window.open(`tel:${resource.phone}`)}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: 8,
                  background: resource.accent,
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                <span style={{ marginRight: 6 }}>📞</span>Call: {resource.phone}
              </button>
            </div>
          ))}

          <div style={{
            background: `${theme.primary}10`,
            border: `1px solid ${theme.primary}30`,
            borderRadius: 12,
            padding: '14px',
            marginTop: 8,
            fontSize: 11,
            color: theme.primary,
            lineHeight: 1.8,
          }}>
            <strong>All services are:</strong>
            <div style={{ marginTop: 6 }}>
              Confidential · Non-judgmental · Free for all service members and families · Available 24/7 for emergencies
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReligiousServicesModule
