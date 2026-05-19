import { useEffect, useState } from 'react'
import { apiUrl } from '../config/apiConfig'

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
      url: 'https://installations.militaryonesource.mil/',
      phone: '1-800-342-9647',
    }
  }
  if (b.includes('marine')) {
    return {
      name: 'Marine Corps Family Services (MCCS)',
      branch: 'Marine Corps',
      description: 'Family support, counseling, financial readiness, and deployment readiness services.',
      url: 'https://installations.militaryonesource.mil/',
      phone: '1-800-336-4592',
    }
  }
  if (b.includes('air force') || b.includes('space force')) {
    const isSpace = b.includes('space force')
    return {
      name: 'Airman & Family Readiness Center (AFRC)',
      branch: isSpace ? 'Space Force' : 'Air Force',
      description: 'Financial counseling, deployment support, family advocacy, employment assistance, and relocation services.',
      url: 'https://installations.militaryonesource.mil/',
      phone: '1-800-342-9647',
    }
  }
  if (b.includes('coast guard')) {
    return {
      name: 'Work-Life Programs (CG)',
      branch: 'Coast Guard',
      description: 'Work-life balance, family counseling, financial readiness, and support for CG families.',
      url: 'https://www.dcms.uscg.mil/Our-Organization/Assistant-Commandant-for-Human-Resources-CG-1/Health-Safety-and-Work-Life-CG-11/',
      phone: '1-800-342-9647',
    }
  }
  return {
    name: 'Army Community Service (ACS)',
    branch: 'Army',
    description: 'Financial counseling, deployment support, family advocacy, employment readiness, and relocation assistance.',
    url: 'https://installations.militaryonesource.mil/',
    phone: '(Installation ACS) - find via MilitaryINSTALLATIONS',
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
  'Fort Belvoir': [
    { id: 1, name: 'Belvoir Chapel – Catholic', denomination: 'Catholic', address: 'Belvoir Rd, Fort Belvoir, VA 22060', phone: '(703) 805-2113', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM', 'Daily 12:05 PM'], onBase: true, community_reviews: ['Large parish, very organized RCIA and family ministries', 'Chaplain team handles a diverse joint-service congregation well'] },
    { id: 2, name: 'Belvoir Chapel – Protestant', denomination: 'Protestant', address: 'Belvoir Rd, Fort Belvoir, VA 22060', phone: '(703) 805-2113', mass: ['Sunday 10:00 AM Contemporary', 'Sunday 11:30 AM Traditional', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Two distinct service styles serve the joint NCR community', 'Strong youth and young adult ministry programs'] },
    { id: 3, name: 'Belvoir Chapel – Jewish Services', denomination: 'Jewish', address: 'Belvoir Rd, Fort Belvoir, VA 22060', phone: '(703) 805-2113', mass: ['Friday Shabbat 7:00 PM', 'High Holiday services coordinated annually'], onBase: true, community_reviews: ['Jewish Welfare Board representation is strong', 'Annual Seder is a notable community event'] },
  ],
  'Fort Meade': [
    { id: 1, name: 'Argonne Hills Chapel – Catholic', denomination: 'Catholic', address: '7100 Rockenbach Rd, Fort Meade, MD 20755', phone: '(301) 677-6703', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM', 'Daily 12:05 PM'], onBase: true, community_reviews: ['Diverse joint-service congregation reflecting NSA/Cyber Command tenants', 'Chaplain team is responsive to mission-area schedules'] },
    { id: 2, name: 'Argonne Hills Chapel – Protestant', denomination: 'Protestant', address: '7100 Rockenbach Rd, Fort Meade, MD 20755', phone: '(301) 677-6703', mass: ['Sunday 10:00 AM', 'Wednesday 6:00 PM'], onBase: true, community_reviews: ['Strong family programs', 'Newcomer outreach is active'] },
  ],
  'MCB Quantico': [
    { id: 1, name: 'Liversedge Hall Chapel – Catholic', denomination: 'Catholic', address: 'MCB Quantico, VA 22134', phone: '(703) 784-2261', mass: ['Sunday 8:30 AM & 11:00 AM', 'Saturday Vigil 5:00 PM', 'Daily 11:30 AM'], onBase: true, community_reviews: ['Historic chapel; deeply connected to Marine officer training pipeline', 'Strong Knights of Columbus presence on post'] },
    { id: 2, name: 'Memorial Chapel – Protestant', denomination: 'Protestant', address: 'MCB Quantico, VA 22134', phone: '(703) 784-2261', mass: ['Sunday 10:00 AM Traditional', 'Sunday 11:30 AM Contemporary'], onBase: true, community_reviews: ['Memorial Chapel is well-known for OCS/TBS graduations', 'Two service styles fit different unit schedules'] },
  ],
  'Eglin AFB': [
    { id: 1, name: 'Eglin Chapel 2 – Catholic', denomination: 'Catholic', address: '101 W Van Matre Ave, Eglin AFB, FL 32542', phone: '(850) 882-2111', mass: ['Sunday 8:30 AM & 11:00 AM', 'Saturday Vigil 5:00 PM', 'Daily 11:30 AM'], onBase: true, community_reviews: ['Excellent chaplain corps; large active Catholic community', 'Strong sacramental preparation programs'] },
    { id: 2, name: 'Eglin Chapel 1 – Protestant', denomination: 'Protestant', address: '101 W Van Matre Ave, Eglin AFB, FL 32542', phone: '(850) 882-2111', mass: ['Sunday 9:00 AM Contemporary', 'Sunday 11:00 AM Traditional', 'Wednesday 6:00 PM'], onBase: true, community_reviews: ['Multiple service styles', 'Active family ministry and youth programs'] },
  ],
  'MacDill AFB': [
    { id: 1, name: 'MacDill Chapel – Catholic', denomination: 'Catholic', address: '7345 Bayshore Blvd, Tampa, FL 33621', phone: '(813) 828-3621', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM', 'Daily 11:30 AM'], onBase: true, community_reviews: ['Active joint-service congregation (CENTCOM/SOCOM)', 'Strong daily Mass attendance'] },
    { id: 2, name: 'MacDill Chapel – Protestant', denomination: 'Protestant', address: '7345 Bayshore Blvd, Tampa, FL 33621', phone: '(813) 828-3621', mass: ['Sunday 10:00 AM', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Welcoming joint community', 'Active deployment family support'] },
  ],
  'Wright-Patterson AFB': [
    { id: 1, name: 'WPAFB Chapel 2 – Catholic', denomination: 'Catholic', address: 'Wright-Patterson AFB, OH 45433', phone: '(937) 257-7682', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM', 'Daily 11:30 AM'], onBase: true, community_reviews: ['Strong Catholic community including AFIT students', 'Active religious education for kids'] },
    { id: 2, name: 'WPAFB Chapel 1 – Protestant', denomination: 'Protestant', address: 'Wright-Patterson AFB, OH 45433', phone: '(937) 257-7682', mass: ['Sunday 10:00 AM Contemporary', 'Sunday 11:30 AM Traditional', 'Wednesday 6:00 PM'], onBase: true, community_reviews: ['Excellent music ministry', 'Active outreach to PCS families'] },
  ],
  'NAS Pensacola': [
    { id: 1, name: 'NAS Pensacola Chapel – Catholic', denomination: 'Catholic', address: 'NAS Pensacola, FL 32508', phone: '(850) 452-2341', mass: ['Sunday 8:30 AM & 11:00 AM', 'Saturday Vigil 5:00 PM', 'Daily 11:30 AM'], onBase: true, community_reviews: ['Historic chapel near the Cradle of Naval Aviation', 'Active community supporting flight training students'] },
    { id: 2, name: 'NAS Pensacola Chapel – Protestant', denomination: 'Protestant', address: 'NAS Pensacola, FL 32508', phone: '(850) 452-2341', mass: ['Sunday 10:00 AM', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Welcoming to student aviators and families', 'Strong chaplain support during deployment workups'] },
  ],
  'Fort Knox': [
    { id: 1, name: 'Fort Knox Memorial Chapel – Catholic', denomination: 'Catholic', address: 'Knox Ave, Fort Knox, KY 40121', phone: '(502) 624-3464', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Historic chapel architecture', 'Active community supporting Cadet Summer Training in summer months'] },
    { id: 2, name: 'Fort Knox Memorial Chapel – Protestant', denomination: 'Protestant', address: 'Knox Ave, Fort Knox, KY 40121', phone: '(502) 624-3464', mass: ['Sunday 10:00 AM', 'Wednesday 6:00 PM'], onBase: true, community_reviews: ['Strong family ministries', 'Active newcomer outreach'] },
  ],
  'Fort Jackson': [
    { id: 1, name: 'Fort Jackson Main Post Chapel – Catholic', denomination: 'Catholic', address: '4477 Magruder Ave, Fort Jackson, SC 29207', phone: '(803) 751-4061', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM', 'Daily 11:30 AM'], onBase: true, community_reviews: ['High-tempo trainee chapel — many Sunday Mass attendees are new recruits', 'Strong religious support during BCT cycles'] },
    { id: 2, name: 'Fort Jackson Main Post Chapel – Protestant', denomination: 'Protestant', address: '4477 Magruder Ave, Fort Jackson, SC 29207', phone: '(803) 751-4061', mass: ['Sunday 10:00 AM', 'Wednesday 6:00 PM'], onBase: true, community_reviews: ['Energetic services with strong trainee participation', 'Active permanent party family ministry'] },
  ],
  'Fort Sill': [
    { id: 1, name: 'Fort Sill Main Post Chapel – Catholic', denomination: 'Catholic', address: 'Sherman St, Fort Sill, OK 73503', phone: '(580) 442-4842', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Active trainee Mass attendance', 'Strong permanent party Catholic community'] },
    { id: 2, name: 'Fort Sill Main Post Chapel – Protestant', denomination: 'Protestant', address: 'Sherman St, Fort Sill, OK 73503', phone: '(580) 442-4842', mass: ['Sunday 10:00 AM', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Family-oriented services', 'Wednesday programs include youth group'] },
  ],
  'USAG Stuttgart': [
    { id: 1, name: 'Patch Barracks Chapel – Catholic', denomination: 'Catholic', address: 'Patch Barracks, Stuttgart, Germany', phone: 'DSN 596-2987', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Diverse multinational congregation including EUCOM tenants', 'Active religious education program'] },
    { id: 2, name: 'Patch Barracks Chapel – Protestant', denomination: 'Protestant', address: 'Patch Barracks, Stuttgart, Germany', phone: 'DSN 596-2987', mass: ['Sunday 10:00 AM', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Active community across NATO commands', 'Strong family programs'] },
  ],
  'USAG Wiesbaden': [
    { id: 1, name: 'Wiesbaden Chapel – Catholic', denomination: 'Catholic', address: 'Hainerberg Housing Area, Wiesbaden, Germany', phone: 'DSN 548-9800', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Welcoming community with strong family programs', 'Active sacramental preparation'] },
    { id: 2, name: 'Wiesbaden Chapel – Protestant', denomination: 'Protestant', address: 'Hainerberg Housing Area, Wiesbaden, Germany', phone: 'DSN 548-9800', mass: ['Sunday 10:00 AM', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Active community supporting USAREUR-AF', 'Strong family ministries'] },
  ],
  'USAG Bavaria': [
    { id: 1, name: 'Vilseck Chapel – Catholic', denomination: 'Catholic', address: 'Rose Barracks, Vilseck, Germany', phone: 'DSN 476-2762', mass: ['Sunday 9:30 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Active in this rural Bavarian community', 'Small but devoted congregation'] },
    { id: 2, name: 'Tower Barracks Chapel – Protestant', denomination: 'Protestant', address: 'Tower Barracks, Grafenwoehr, Germany', phone: 'DSN 475-7011', mass: ['Sunday 10:00 AM', 'Wednesday 6:00 PM'], onBase: true, community_reviews: ['Strong community supporting rotational unit families', 'Active during training brigade rotations'] },
  ],
  'USAG Italy': [
    { id: 1, name: 'Vicenza Chapel – Catholic', denomination: 'Catholic', address: 'Caserma Ederle, Vicenza, Italy', phone: 'CIV +39 0444-71-7000', mass: ['Sunday 10:00 AM', 'Saturday Vigil 5:00 PM', 'Daily 11:30 AM'], onBase: true, community_reviews: ['Catholic community here is unique — strong ties with Italian parishes too', 'Beautiful chapel setting'] },
    { id: 2, name: 'Vicenza Chapel – Protestant', denomination: 'Protestant', address: 'Caserma Ederle, Vicenza, Italy', phone: 'CIV +39 0444-71-7000', mass: ['Sunday 11:00 AM', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Smaller but active congregation', 'Strong family programs'] },
  ],
  'Yokota AB': [
    { id: 1, name: 'Yokota Chapel – Catholic', denomination: 'Catholic', address: 'Bldg 315, Yokota AB, Fussa, Japan', phone: 'DSN 225-7777', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Active community supporting USFJ headquarters families', 'Chaplain is outstanding'] },
    { id: 2, name: 'Yokota Chapel – Protestant', denomination: 'Protestant', address: 'Bldg 315, Yokota AB, Fussa, Japan', phone: 'DSN 225-7777', mass: ['Sunday 10:00 AM', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Active children and youth programs', 'Welcoming to families new to Japan'] },
  ],
  'Hill AFB': [
    { id: 1, name: 'Hill AFB Chapel – Catholic', denomination: 'Catholic', address: 'Hill AFB, UT 84056', phone: '(801) 777-2106', mass: ['Sunday 9:00 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Small but active congregation', 'Welcoming to PCS families'] },
    { id: 2, name: 'Hill AFB Chapel – Protestant', denomination: 'Protestant', address: 'Hill AFB, UT 84056', phone: '(801) 777-2106', mass: ['Sunday 10:00 AM', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Active community with strong family programs', 'Newcomer outreach is steady'] },
  ],
  'Nellis AFB': [
    { id: 1, name: 'Nellis Chapel – Catholic', denomination: 'Catholic', address: 'Nellis AFB, NV 89191', phone: '(702) 652-2061', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Active joint-service congregation', 'Strong sacramental life'] },
    { id: 2, name: 'Nellis Chapel – Protestant', denomination: 'Protestant', address: 'Nellis AFB, NV 89191', phone: '(702) 652-2061', mass: ['Sunday 10:00 AM Contemporary', 'Sunday 11:30 AM Traditional', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Two services styles fit different schedules', 'Active family ministries'] },
  ],
  'Patrick SFB': [
    { id: 1, name: 'Patrick SFB Chapel – Catholic', denomination: 'Catholic', address: 'Patrick SFB, FL 32925', phone: '(321) 494-4073', mass: ['Sunday 9:00 AM', 'Saturday Vigil 4:30 PM'], onBase: true, community_reviews: ['Beach community feel', 'Welcoming to Space Coast families'] },
    { id: 2, name: 'Patrick SFB Chapel – Protestant', denomination: 'Protestant', address: 'Patrick SFB, FL 32925', phone: '(321) 494-4073', mass: ['Sunday 10:30 AM'], onBase: true, community_reviews: ['Family-friendly services', 'Active in the Space Force / 45th SW community'] },
  ],
  'Schofield Barracks': [
    { id: 1, name: 'Schofield Barracks Main Post Chapel – Catholic', denomination: 'Catholic', address: 'Schofield Barracks, HI 96857', phone: '(808) 655-9307', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM', 'Daily 11:30 AM'], onBase: true, community_reviews: ['Active Catholic community across the 25th ID footprint', 'Multilingual services available'] },
    { id: 2, name: 'Schofield Barracks Main Post Chapel – Protestant', denomination: 'Protestant', address: 'Schofield Barracks, HI 96857', phone: '(808) 655-9307', mass: ['Sunday 10:00 AM', 'Sunday 11:30 AM Gospel', 'Wednesday 6:00 PM'], onBase: true, community_reviews: ['Multiple service styles', 'Gospel service is a highlight'] },
    { id: 3, name: 'Schofield Barracks Buddhist Services', denomination: 'Buddhist', address: 'Schofield Barracks, HI 96857', phone: '(808) 655-9307', mass: ['Sunday 1:00 PM Dharma Talk'], onBase: true, community_reviews: ['Unique dedicated Buddhist services on a major Army post', 'Welcoming to all interested in meditation'] },
  ],
  'Joint Base Pearl Harbor-Hickam': [
    { id: 1, name: 'JBPHH Chapel – Catholic', denomination: 'Catholic', address: 'JBPHH, HI 96860', phone: '(808) 473-3971', mass: ['Sunday 8:30 AM & 11:00 AM', 'Saturday Vigil 5:00 PM', 'Daily 11:30 AM'], onBase: true, community_reviews: ['Joint Navy/Air Force community', 'Historic location near the USS Arizona Memorial area'] },
    { id: 2, name: 'JBPHH Chapel – Protestant', denomination: 'Protestant', address: 'JBPHH, HI 96860', phone: '(808) 473-3971', mass: ['Sunday 10:00 AM', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Active joint-service congregation', 'Strong deployment family support'] },
  ],
  'Naval Station Pearl Harbor': [
    { id: 1, name: 'NS Pearl Harbor Chapel – Catholic', denomination: 'Catholic', address: 'JBPHH, HI 96860', phone: '(808) 473-3971', mass: ['Sunday 8:30 AM & 11:00 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Historic location with strong Navy tradition', 'Active deployment family support'] },
    { id: 2, name: 'NS Pearl Harbor Chapel – Protestant', denomination: 'Protestant', address: 'JBPHH, HI 96860', phone: '(808) 473-3971', mass: ['Sunday 10:00 AM', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Active joint Navy/USCG community', 'Family programs include underway family support'] },
  ],
  'MCB Hawaii': [
    { id: 1, name: 'MCB Hawaii Chapel – Catholic', denomination: 'Catholic', address: 'MCB Hawaii Kaneohe Bay, HI 96863', phone: '(808) 257-3552', mass: ['Sunday 9:30 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Windward side community feel', 'Active family ministries'] },
    { id: 2, name: 'MCB Hawaii Chapel – Protestant', denomination: 'Protestant', address: 'MCB Hawaii Kaneohe Bay, HI 96863', phone: '(808) 257-3552', mass: ['Sunday 11:00 AM', 'Wednesday 6:00 PM'], onBase: true, community_reviews: ['Active Marine and Navy families community', 'Beautiful chapel setting'] },
  ],
  'NS San Diego': [
    { id: 1, name: 'NS San Diego Chapel – Catholic', denomination: 'Catholic', address: '32nd St, San Diego, CA 92136', phone: '(619) 556-7233', mass: ['Sunday 9:00 AM & 11:00 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Active joint-service Catholic community', 'Strong deployment family support for Pacific Fleet'] },
    { id: 2, name: 'NS San Diego Chapel – Protestant', denomination: 'Protestant', address: '32nd St, San Diego, CA 92136', phone: '(619) 556-7233', mass: ['Sunday 10:00 AM', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Active Navy community', 'Strong family ministries'] },
  ],
  'MCAS Miramar': [
    { id: 1, name: 'MCAS Miramar Chapel – Catholic', denomination: 'Catholic', address: 'MCAS Miramar, CA 92145', phone: '(858) 577-1448', mass: ['Sunday 9:00 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Active Marine aviation community', 'Strong family programs'] },
    { id: 2, name: 'MCAS Miramar Chapel – Protestant', denomination: 'Protestant', address: 'MCAS Miramar, CA 92145', phone: '(858) 577-1448', mass: ['Sunday 10:30 AM', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Welcoming community', 'Active deployment family support'] },
  ],
  'NAS Whidbey Island': [
    { id: 1, name: 'NAS Whidbey Chapel – Catholic', denomination: 'Catholic', address: 'NAS Whidbey Island, WA 98278', phone: '(360) 257-2126', mass: ['Sunday 9:30 AM', 'Saturday Vigil 5:00 PM'], onBase: true, community_reviews: ['Tight-knit island community', 'Active deployment family support'] },
    { id: 2, name: 'NAS Whidbey Chapel – Protestant', denomination: 'Protestant', address: 'NAS Whidbey Island, WA 98278', phone: '(360) 257-2126', mass: ['Sunday 10:30 AM', 'Wednesday 6:30 PM'], onBase: true, community_reviews: ['Strong small-town feel', 'Active children\'s ministry'] },
  ],
};

const ONLINE_RESOURCES = [
  { name: 'MilitaryINSTALLATIONS', branches: ['ALL'], url: 'https://installations.militaryonesource.mil/', description: 'Find installation chaplain offices, support centers, contacts, and public installation resources.' },
  { name: 'Army Chaplain Corps', branches: ['Army'], url: 'https://www.army.mil/chaplaincorps/', description: 'Official U.S. Army Chaplain Corps public information.' },
  { name: 'Navy Chaplain Corps', branches: ['Navy', 'Marine Corps', 'Coast Guard'], url: 'https://www.navy.mil/Resources/Navy-Chaplain-Corps/', description: 'Official Navy Chaplain Corps public information for Navy, Marine Corps, and Coast Guard support.' },
  { name: 'Air Force Chaplain Corps', branches: ['Air Force', 'Space Force'], url: 'https://www.af.mil/About-Us/Fact-Sheets/Display/Article/104584/chaplain-corps/', description: 'Official Air Force Chaplain Corps public information for Air Force and Space Force support.' },
  { name: 'Military OneSource Counseling', branches: ['ALL'], url: 'https://www.militaryonesource.mil/benefits/confidential-counseling/', description: 'Official confidential non-medical counseling information for eligible military families.' },
]

function ReligiousServicesModule({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('counseling')

  // Live places of worship from OSM Overpass (no API key required).
  // Falls through to the curated/static lists below when empty.
  const [liveServices, setLiveServices] = useState({ status: 'idle', services: [], reason: '' })
  useEffect(() => {
    if (activeTab !== 'services') return
    const inst = (profile?.gainingInstallation || '').split(',')[0].trim()
    if (!inst) {
      setLiveServices({ status: 'no-input', services: [], reason: 'no-installation' })
      return
    }
    let cancelled = false
    setLiveServices(s => ({ ...s, status: 'loading' }))
    const params = new URLSearchParams({ address: inst, radiusMiles: '25' })
    if (profile?.language) params.set('lang', profile.language)
    fetch(apiUrl(`/api/religious-services?${params.toString()}`), { headers: { Accept: 'application/json' } })
      .then(r => r.ok ? r.json() : { services: [], fallback: true })
      .then(data => {
        if (cancelled) return
        setLiveServices({
          status: 'ready',
          services: Array.isArray(data?.services) ? data.services : [],
          reason: data?.reason || '',
        })
      })
      .catch(err => {
        if (cancelled) return
        setLiveServices({ status: 'ready', services: [], reason: `network-${err?.message || 'error'}` })
      })
    return () => { cancelled = true }
  }, [activeTab, profile?.gainingInstallation])

  // STRICT preference filter (per user direction): only surface OSM
  // places of worship that genuinely match the religiousPreference
  // chosen during onboarding. Cards that don't pertain are removed
  // entirely, even if that means an empty section.
  //
  // OSM tags churches with religion= (broad) and optionally
  // denomination= (narrow). For Protestant we only match
  // denomination values that are recognizably Protestant (baptist,
  // methodist, etc.); generic religion=christian with no
  // denomination is NOT counted as Protestant. For Catholic we
  // require denomination=catholic explicitly.
  //
  // Lists below are lowercase to match OSM's tag values.
  const PROTESTANT_DENOMS = new Set([
    'protestant', 'baptist', 'methodist', 'presbyterian', 'lutheran',
    'episcopal', 'episcopalian', 'anglican', 'pentecostal', 'evangelical',
    'non-denominational', 'nondenominational', 'congregational',
    'reformed', 'mennonite', 'quaker', 'adventist', 'seventh-day-adventist',
    'church-of-christ', 'disciples-of-christ', 'assemblies-of-god', 'foursquare',
    'nazarene', 'methodist-episcopal', 'african-methodist-episcopal',
    'southern-baptist', 'free-methodist', 'wesleyan', 'church-of-the-brethren',
    'moravian',
  ])
  // Matchers run against three possible card-shape fields:
  //   - religion     (OSM-derived live cards carry this)
  //   - denomination (curated + synthetic Google-Maps category cards)
  //   - categoryId   (synthetic Google-Maps cards; same value as
  //                   denomination but kept for the renderer)
  // The previous version only inspected `religion` for Buddhist /
  // Hindu / Sikh users, so the synthetic OCONUS cards (which lack
  // a `religion` field) were filtered out entirely and the user saw
  // an empty Spiritual Readiness tab.
  const m = (s) => `${s.religion || ''} ${s.denomination || ''} ${s.categoryId || ''}`.toLowerCase()
  const PREF_TO_MATCHER = {
    Catholic:   (s) => /\bcatholic\b/.test(m(s)),
    Protestant: (s) => PROTESTANT_DENOMS.has(String(s.denomination || '').toLowerCase())
                    || PROTESTANT_DENOMS.has(String(s.categoryId   || '').toLowerCase())
                    || /\bprotestant\b|\bbaptist\b|\bmethodist\b|\blds\b|latter[- ]?day|\borthodox\b|\bchapel\b/.test(m(s)),
    Christian:  (s) => /christian|catholic|protestant|baptist|methodist|lutheran|presbyterian|episcopal|pentecostal|evangelical|adventist|lds|latter[- ]?day|\borthodox\b|\bchapel\b/.test(m(s)),
    Jewish:     (s) => /\bjewish\b|synagogue|orthodox-jewish|reform|conservative|hasidic|chabad/.test(m(s)),
    Muslim:     (s) => /\b(islamic|muslim|mosque|sunni|shia)\b/.test(m(s)),
    Islamic:    (s) => /\b(islamic|muslim|mosque|sunni|shia)\b/.test(m(s)),
    Buddhist:   (s) => /\bbuddhist\b|buddhist temple/.test(m(s)),
    Hindu:      (s) => /\bhindu\b|hindu temple/.test(m(s)),
    Sikh:       (s) => /\bsikh\b|gurdwara/.test(m(s)),
  }
  const prefRaw = String(profile?.religiousPreference || '').trim()
  const matcher = PREF_TO_MATCHER[prefRaw]
  const filteredLive = !matcher ? liveServices.services : liveServices.services.filter(matcher)

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
  const spiritualBranch = branchSupport.branch || profile?.branch || 'Army'
  const services = getServices()
  const instName = (profile?.gainingInstallation || '').split(',')[0].trim() || 'your installation'

  const TABS = [
    { id: 'counseling', label: 'Counseling', icon: '🤝' },
    { id: 'services', label: 'Services', icon: '⛪' },
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
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`pcs-tab ${activeTab === t.id ? 'is-active' : ''}`} style={tabBtn(t)}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── SERVICES TAB ── */}
      {activeTab === 'services' && (
        // Flex + order so the live OSM section visually renders
        // AFTER the curated installation chapel data, without
        // restructuring the JSX. Curated content (overseas chapel,
        // INSTALLATION_CHAPELS-by-denomination, online resources)
        // gets order 1; the live OSM places-of-worship grid gets
        // order 2.
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ order: 2 }} aria-label="Live places of worship">
          {/* Live nearby places of worship */}
          {liveServices.status === 'loading' && (
            <div style={{ background: '#F4F7F7', border: '1px solid #E0E6EE', borderRadius: 10, padding: 10, marginBottom: 14, fontSize: 11, color: '#56697C' }}>
              Loading Google Maps cards for nearby places of worship...
            </div>
          )}
          {liveServices.status === 'ready' && liveServices.services.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: theme.primary, marginBottom: 8, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                Nearby places of worship · {liveServices.services.length}
              </div>
              {matcher && (
                <div style={{ fontSize: 10, color: '#56697C', marginBottom: 10 }}>
                  Filtered to {prefRaw} based on your onboarding preference. Change your religious preference in onboarding to see other faiths.
                </div>
              )}
              <div data-dynamic-card="google" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                {filteredLive.slice(0, 24).map(s => (
                  <a
                    key={s.id}
                    href={s.website || s.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${s.name} information (${s.distanceMiles} miles away)`}
                    style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${theme.primary}`, borderRadius: 10, padding: 12, textDecoration: 'none', color: '#0D1821', display: 'block', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, flex: 1 }}>{s.name}</div>
                      <span style={{ background: '#FFF8E1', color: '#6D4C00', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>{s.distanceMiles} mi</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                      <span style={{ background: '#EAF4FF', color: '#0D3B66', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>{s.religion}</span>
                      {s.denomination && <span style={{ background: '#F3F4F6', color: '#243447', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{s.denomination}</span>}
                    </div>
                    {s.address && <div style={{ fontSize: 11, color: '#56697C', marginBottom: 4 }}>{s.address}</div>}
                    <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginBottom: 8 }}>{s.description}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                      <span className="card-cta" style={{ '--cta-color': theme.primary }}>Open {s.website ? 'website' : 'map view'}</span>
                      {s.phone && <span className="card-cta card-cta--ghost" style={{ fontSize: 10 }}>{s.phone}</span>}
                    </div>
                  </a>
                ))}
              </div>
              <div style={{ fontSize: 10, color: '#56697C', lineHeight: 1.5, marginTop: 6 }}>
                Google Maps category cards within 25 miles of your installation. Confirm service times, accessibility, and on-base access policies directly with each congregation. The curated chapel listings below show official on-installation chapel programs.
              </div>
            </section>
          )}
          {liveServices.status === 'ready' && liveServices.services.length === 0 && liveServices.reason && (
            <div style={{ background: '#EAF4FF', border: '1px solid #B9D9F6', borderRadius: 10, padding: 10, marginBottom: 14, fontSize: 11, color: '#0D3B66', lineHeight: 1.5 }}>
              Map search did not return nearby places of worship right now. The curated installation chapel listings below remain available.
            </div>
          )}
          </div>

          <div style={{ order: 1 }} aria-label="Official installation chapel data">

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
                  No chapel data on file for {instName}
                </div>
                <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.6, marginBottom: 16 }}>
                  We don't have local chapel listings for this installation yet. Use the resources below to locate your installation chaplain, or reach out directly.
                </div>
                <a
                  href="https://installations.militaryonesource.mil/"
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
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 12, letterSpacing: 0.5 }}>
                ONLINE RESOURCES
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {ONLINE_RESOURCES.filter(res => res.url && (res.branches?.includes('ALL') || res.branches?.includes(spiritualBranch))).map((res, idx) => (
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
