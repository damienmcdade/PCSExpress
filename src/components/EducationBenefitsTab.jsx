/*
 * Education & GI Bill benefits tab + its college/OCONUS data tables,
 * extracted from App.jsx (perf Tier 1b PR-B) into its own lazy() chunk so
 * the ~1,500-line college dataset (INSTALLATION_COLLEGES, OCONUS bundles,
 * COLLEGE_ENROLLMENT_LINKS) no longer ships in the eager index bundle.
 * Verbatim move. Shared helpers come from ../lib/installationSources.
 */
import { useState } from 'react';
import TabBar from './TabBar';
import { getInstallationSearchLocation, officialCollegeCards } from '../lib/installationSources';

const INSTALLATION_COLLEGES = {
  'Fort Liberty': [
    { name: 'Methodist University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Strong nursing, business, and justice studies. Active veteran services office and military scholarships. 5 miles from post.', applyUrl: 'https://www.methodist.edu/admissions/apply/', siteUrl: 'https://www.methodist.edu' },
    { name: 'Fayetteville State University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'HBCU with affordable in-state tuition. Robust veteran services. Strong nursing, social work, and criminal justice programs.', applyUrl: 'https://www.uncfsu.edu/', siteUrl: 'https://www.uncfsu.edu' },
    { name: 'Fayetteville Technical Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: "NC's largest community college with on-post class sections. IT, healthcare, and skilled trades. Tuition Assistance accepted.", applyUrl: 'https://www.faytechcc.edu/', siteUrl: 'https://www.faytechcc.edu' },
    { name: 'Campbell University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Top-ranked liberal arts and professional school near Fort Liberty. Pharmacy, law, and business schools. Military tuition rates.', applyUrl: 'https://www.campbell.edu/admissions/apply/', siteUrl: 'https://www.campbell.edu' },
    { name: 'UNC Pembroke', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'Affordable UNC system university 30 miles from post. Business, education, and public administration programs.', applyUrl: '', siteUrl: 'https://www.uncp.edu' },
  ],
  'Fort Bragg': [
    { name: 'Methodist University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Strong nursing, business, and justice studies. Active veteran services office and military scholarships. 5 miles from post.', applyUrl: 'https://www.methodist.edu/admissions/apply/', siteUrl: 'https://www.methodist.edu' },
    { name: 'Fayetteville Technical Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: "NC's largest community college with on-post class sections. IT, healthcare, and skilled trades. TA accepted.", applyUrl: 'https://www.faytechcc.edu/', siteUrl: 'https://www.faytechcc.edu' },
    { name: 'Campbell University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Pharmacy, law, and business schools. Military tuition rates available.', applyUrl: 'https://www.campbell.edu/admissions/apply/', siteUrl: 'https://www.campbell.edu' },
  ],
  'Fort Campbell': [
    { name: 'Austin Peay State University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Ranked most military-friendly in Tennessee. Located in Clarksville, minutes from the main gate. Online and in-person options. TA accepted.', applyUrl: 'https://www.apsu.edu/admissions/apply/', siteUrl: 'https://www.apsu.edu' },
    { name: 'Volunteer State Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Affordable associate degrees in healthcare, business, and technology. Transfer pathway to Tennessee universities.', applyUrl: 'https://www.volstate.edu/admissions/', siteUrl: 'https://www.volstate.edu' },
    { name: 'Middle Tennessee State University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Over 300 degree programs including aerospace, business, and recording industry. 45 minutes from post.', applyUrl: '', siteUrl: 'https://www.mtsu.edu' },
    { name: 'Nashville State Community College', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'Technical certificates and associate degrees. Strong IT, business, and healthcare programs. TA-eligible.', applyUrl: '', siteUrl: 'https://www.nscc.edu' },
  ],
  'Fort Cavazos': [
    { name: 'Central Texas College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'The premier military-focused community college. On-post classes, flexible schedules, and TA accepted. Serves thousands of Fort Cavazos soldiers annually.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Texas A&M University – Central Texas', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'A&M system university in Killeen designed to serve military families. Evening and online classes. Strong business and computer science.', applyUrl: 'https://www.tamuct.edu/admissions/', siteUrl: 'https://www.tamuct.edu' },
    { name: 'University of Mary Hardin-Baylor', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Belton, TX. Nursing, business, and education programs. Military scholarships and veteran services.', applyUrl: '', siteUrl: 'https://www.umhb.edu' },
    { name: 'Temple College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Workforce-focused associate degrees and certificates. Healthcare, law enforcement, and technology programs. Low tuition.', applyUrl: 'https://www.templejc.edu/apply/', siteUrl: 'https://www.templejc.edu' },
  ],
  'Fort Hood': [
    { name: 'Central Texas College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'The premier military-focused community college on-post. TA accepted. Associates degrees and certificates.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Texas A&M University – Central Texas', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'A&M system university in Killeen designed to serve military families. Evening and online options.', applyUrl: 'https://www.tamuct.edu/admissions/', siteUrl: 'https://www.tamuct.edu' },
    { name: 'Temple College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Affordable associate degrees near Fort Hood. Healthcare, IT, and business.', applyUrl: 'https://www.templejc.edu/apply/', siteUrl: 'https://www.templejc.edu' },
  ],
  'Joint Base Lewis-McChord': [
    { name: 'University of Washington Tacoma', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'UW system campus in Tacoma. Business, engineering, and nursing programs. Active veteran community. 15 minutes from JBLM.', applyUrl: '', siteUrl: 'https://www.tacoma.uw.edu' },
    { name: 'Tacoma Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'High transfer-rate community college near JBLM. Strong IT, business, and healthcare pathways. TA-eligible.', applyUrl: '', siteUrl: 'https://www.tacomacc.edu' },
    { name: 'Pierce College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Two campuses near JBLM. Aviation, business, and computer science. Military welcome center on campus.', applyUrl: 'https://www.pierce.ctc.edu/admissions/', siteUrl: 'https://www.pierce.ctc.edu' },
    { name: 'Pacific Lutheran University', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Liberal arts university in Tacoma. Strong nursing, business, and education programs. Yellow Ribbon certified.', applyUrl: 'https://www.plu.edu/admission/apply/', siteUrl: 'https://www.plu.edu' },
    { name: 'University of Puget Sound', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Highly ranked private liberal arts college. Business, engineering, and occupational therapy. Yellow Ribbon program.', applyUrl: 'https://www.pugetsound.edu/admission/', siteUrl: 'https://www.pugetsound.edu' },
  ],
  'Fort Carson': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus adjacent to Fort Carson. Engineering, nursing, and business. Extensive veteran services and military discounts.', applyUrl: '', siteUrl: 'https://www.uccs.edu' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Culinary arts, automotive technology, and IT. TA accepted.', applyUrl: '', siteUrl: 'https://www.pikespeak.edu' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan — one course at a time. Yellow Ribbon participant.', applyUrl: 'https://www.coloradocollege.edu/admission/', siteUrl: 'https://www.coloradocollege.edu' },
    { name: 'Colorado Technical University', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'Career-focused IT, business, and criminal justice degrees. Flexible online and on-campus in Colorado Springs. Military-friendly.', applyUrl: '', siteUrl: 'https://www.coloradotech.edu' },
  ],
  'Fort Bliss': [
    { name: 'University of Texas at El Paso', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major research university minutes from Fort Bliss. Engineering, nursing, and business programs. Strong veteran support office and military TA.', applyUrl: 'https://www.utep.edu/admissions/', siteUrl: 'https://www.utep.edu' },
    { name: 'El Paso Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Five campuses near Fort Bliss. Affordable workforce training, associate degrees, and transfer prep. TA-eligible.', applyUrl: 'https://www.epcc.edu/Admissions/', siteUrl: 'https://www.epcc.edu' },
    { name: 'New Mexico State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Land-grant research university in Las Cruces, NM (45 min). Engineering, agriculture, and business programs. Military-friendly.', applyUrl: 'https://admissions.nmsu.edu/apply/', siteUrl: 'https://www.nmsu.edu' },
  ],
  'Fort Stewart': [
    { name: 'Georgia Southern University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Large public university in Statesboro, GA. Business, education, engineering, and health sciences. Military discount and veteran services.', applyUrl: 'https://admissions.georgiasouthern.edu/apply/', siteUrl: 'https://www.georgiasouthern.edu' },
    { name: 'Savannah State University', type: 'Public', degree: '4-Year University', rating: 3.4, desc: "Georgia's oldest HBCU in Savannah, 40 miles from post. Business, social work, and marine sciences.", applyUrl: 'https://www.savannahstate.edu/admissions/', siteUrl: 'https://www.savannahstate.edu' },
    { name: 'Coastal Pines Technical College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical certificates and associate degrees in healthcare, IT, and welding near Fort Stewart. TA-eligible.', applyUrl: 'https://www.coastalpines.edu/admissions/', siteUrl: 'https://www.coastalpines.edu' },
    { name: 'College of Coastal Georgia', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Small public university in Brunswick, GA. Nursing, business, and liberal studies. Veteran-friendly with flexible scheduling.', applyUrl: 'https://www.ccga.edu/admissions/apply/', siteUrl: 'https://www.ccga.edu' },
  ],
  'Fort Drum': [
    { name: 'Jefferson Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'SUNY community college in Watertown — the top choice for Fort Drum soldiers. Business, IT, and health programs. TA accepted.', applyUrl: 'https://www.sunyjefferson.edu/admissions/apply/', siteUrl: 'https://www.sunyjefferson.edu' },
    { name: 'SUNY Polytechnic Institute', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'SUNY technology campus. Business, computer science, and nursing programs. Yellow Ribbon participant.', applyUrl: 'https://www.sunypoly.edu/admissions/', siteUrl: 'https://www.sunypoly.edu' },
    { name: 'Clarkson University', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Top-ranked private engineering and business university in Potsdam, NY. STEM-focused. Financial aid and Yellow Ribbon.', applyUrl: '', siteUrl: 'https://www.clarkson.edu' },
  ],
  'Naval Station Norfolk': [
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Top choice for military in Hampton Roads. Dedicated Monarch Military Center. Engineering, business, and education degrees. TA and GI Bill accepted.', applyUrl: 'https://apply.odu.edu/', siteUrl: 'https://www.odu.edu' },
    { name: 'Tidewater Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Five campuses across Hampton Roads. Strong nursing, business, and IT. Transfer partnerships with ODU and Virginia universities.', applyUrl: 'https://www.tcc.edu/admissions/apply/', siteUrl: 'https://www.tcc.edu' },
    { name: 'Norfolk State University', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'HBCU in downtown Norfolk. Mass communications, social work, and technology programs. Veteran-friendly campus.', applyUrl: 'https://www.nsu.edu/admissions/', siteUrl: 'https://www.nsu.edu' },
    { name: 'Regent University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Virginia Beach. Law, business, and communication. Online and on-campus options. Military tuition discount.', applyUrl: 'https://www.regent.edu/admissions/apply/', siteUrl: 'https://www.regent.edu' },
    { name: 'Virginia Wesleyan University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Liberal arts university in Norfolk/Virginia Beach. Small classes and strong veteran services. Yellow Ribbon certified.', applyUrl: '', siteUrl: 'https://www.vwu.edu' },
  ],
  'Marine Corps Base Camp Lejeune': [
    { name: 'Coastal Carolina Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'The primary college for Camp Lejeune Marines. Located in Jacksonville, NC. On-post classes available. TA accepted.', applyUrl: 'https://www.carteret.edu/apply/', siteUrl: 'https://www.carteret.edu' },
    { name: 'University of Mount Olive', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Veteran-friendly private university with a Jacksonville campus near Camp Lejeune. Business, criminal justice, and education.', applyUrl: 'https://www.umo.edu/admissions/apply/', siteUrl: 'https://www.umo.edu' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Top-ranked business, nursing, and engineering programs. 1 hour from Camp Lejeune.', applyUrl: 'https://admissions.ecu.edu/apply/', siteUrl: 'https://www.ecu.edu' },
  ],
  'Camp Pendleton': [
    { name: 'MiraCosta College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'Top-rated community college adjacent to Camp Pendleton. On-post classes, strong veteran services. TA and Post-9/11 GI Bill accepted.', applyUrl: 'https://www.miracosta.edu/admissions/', siteUrl: 'https://www.miracosta.edu' },
    { name: 'California State University San Marcos', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'CSU campus near Camp Pendleton. Business, nursing, and STEM programs. Strong veteran resource center and military scholarships.', applyUrl: 'https://www.csusm.edu/admissions/', siteUrl: 'https://www.csusm.edu' },
    { name: 'Palomar College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Large community college in San Marcos. 200+ degree and certificate programs. Transfer pathway to UC and CSU systems.', applyUrl: 'https://www2.palomar.edu/admissions/', siteUrl: 'https://www.palomar.edu' },
    { name: 'University of San Diego', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Highly ranked private Catholic university. Business, law, and engineering. Yellow Ribbon participant. 35 miles from post.', applyUrl: '', siteUrl: 'https://www.sandiego.edu' },
  ],
  'Fort Sam Houston': [
    { name: 'University of Texas at San Antonio', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major research university in San Antonio. Business, engineering, and health science programs. Active veteran services and military tuition discounts.', applyUrl: '', siteUrl: 'https://www.utsa.edu' },
    { name: "St. Philip's College", type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'HBCU–Hispanic Serving Institution in San Antonio. Healthcare, IT, and culinary arts programs. TA accepted. Low tuition.', applyUrl: '', siteUrl: 'https://www.alamo.edu/spc/' },
    { name: 'Trinity University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Highly ranked private liberal arts university. Business, engineering, and sciences. Yellow Ribbon participant.', applyUrl: '', siteUrl: 'https://www.trinity.edu' },
    { name: 'San Antonio College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Alamo College in downtown San Antonio. Nursing, computer science, and pre-professional programs. Transfer partner with UTSA.', applyUrl: '', siteUrl: 'https://www.alamo.edu/sac/' },
  ],
  'Camp Humphreys': [
    { name: 'University of Maryland Global Campus', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Leading university for OCONUS military members. On-post classes at Camp Humphreys plus fully online options. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College (Overseas)', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-post associate degree and certificate programs. Flexible scheduling for shift workers. TA accepted. Same curriculum as Fort Cavazos.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation, aerospace engineering, and business programs. On-post classes available at major installations.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university designed for military. 190+ programs: intelligence, security management, and emergency management.', applyUrl: '', siteUrl: 'https://www.amu.apus.edu' },
  ],
  'Ramstein Air Base': [
    { name: 'University of Maryland Global Campus Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: "Europe's leading military-focused university. On-base classes at Ramstein and surrounding installations. TA and GI Bill accepted.", applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Only accredited American residential university campus in Europe. Aviation management and aerospace engineering programs.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Alabama-based public university with classes at Ramstein AB. Business, criminal justice, and social science programs.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Kadena Air Base': [
    { name: 'University of Maryland Global Campus Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses available at Kadena AB. Business, cybersecurity, and public safety management. TA and GI Bill.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College (Overseas)', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation science and aerospace engineering with on-base courses. Popular with Air Force members at Kadena.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Yokota Air Base': [
    { name: 'University of Maryland Global Campus Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC at Yokota AB. Business administration, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College (Overseas)', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'On-base associate degrees and certificates. Flexible and TA-eligible. Same high-quality programs as CONUS campuses.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace management degrees available at Yokota. Online with on-base support sessions.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Fort Meade': [
    { name: 'University of Maryland', type: 'Public', degree: '4-Year University', rating: 4.4, desc: 'Flagship state university 15 miles from Fort Meade. Engineering, business, and cybersecurity. Strong research and intelligence programs.', applyUrl: 'https://apply.umd.edu/', siteUrl: 'https://www.umd.edu' },
    { name: 'Anne Arundel Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'AACC in Arnold, MD. Strong IT, cybersecurity, and business programs near Fort Meade and NSA. TA accepted.', applyUrl: 'https://www.aacc.edu/admissions/', siteUrl: 'https://www.aacc.edu' },
    { name: 'Capitol Technology University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'STEM-focused university in Laurel, MD. Cybersecurity, aerospace, and engineering management. Popular with intelligence community.', applyUrl: 'https://www.captechu.edu/admissions/', siteUrl: 'https://www.captechu.edu' },
  ],
  'Schofield Barracks': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university. Business, engineering, and tropical agriculture. 30 minutes from Schofield Barracks.", applyUrl: '', siteUrl: 'https://manoa.hawaii.edu' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in Honolulu and Pearl Harbor campus. Business, nursing, and social sciences. Yellow Ribbon participant.', applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
    { name: 'Leeward Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH community college in Pearl City, close to Schofield. Liberal arts, healthcare, and pre-professional pathways. TA accepted.', applyUrl: '', siteUrl: 'https://www.leeward.hawaii.edu' },
  ],
  // ── CONUS Army (additional) ──────────────────────────────────────────────────
  'Fort Moore': [
    { name: 'Columbus State University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Columbus, GA. Business, education, and health sciences. Strong veteran services and TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'Columbus Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Workforce-focused technical college. Healthcare, IT, and skilled trades. TA accepted. Minutes from Fort Moore.', applyUrl: 'https://www.columbustech.edu/admissions/', siteUrl: 'https://www.columbustech.edu' },
    { name: 'Auburn University at Montgomery', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Auburn system university in Montgomery, AL. Business, education, and liberal arts. Military-friendly campus.', applyUrl: 'https://www.aum.edu/admissions/apply/', siteUrl: 'https://www.aum.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly public university with campus near Fort Moore. Business, criminal justice, and social sciences. TA accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Fort Eisenhower': [
    { name: 'Augusta University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Georgia public research university in Augusta. Medical, nursing, and cybersecurity programs. Strong ties to Fort Eisenhower.', applyUrl: 'https://www.augusta.edu/admissions/apply.php', siteUrl: 'https://www.augusta.edu' },
    { name: 'Augusta Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Technical college with IT, healthcare, and welding programs. TA accepted. Located minutes from Fort Eisenhower.', applyUrl: 'https://www.augustatech.edu/admissions/', siteUrl: 'https://www.augustatech.edu' },
    { name: 'Paine College', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'HBCU in Augusta, GA. Business, education, and humanities. Supportive veteran community and GI Bill accepted.', applyUrl: 'https://www.paine.edu/admissions/', siteUrl: 'https://www.paine.edu' },
    { name: 'University of South Carolina Aiken', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'USC system campus in Aiken, SC. Business, nursing, and education. Veteran-friendly with flexible scheduling.', applyUrl: 'https://www.usca.edu/admissions/apply/', siteUrl: 'https://www.usca.edu' },
  ],
  'Fort Gregg-Adams': [
    { name: 'Virginia State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'HBCU in Petersburg, VA. Business, engineering technology, and education. Active veteran services and TA-eligible.', applyUrl: 'https://www.vsu.edu/admissions/apply/', siteUrl: 'https://www.vsu.edu' },
    { name: 'Richard Bland College', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'William & Mary-affiliated college in Petersburg. Transfer pathways to Virginia universities. Affordable and TA-eligible.', applyUrl: 'https://www.rbc.edu/admissions/apply/', siteUrl: 'https://www.rbc.edu' },
    { name: 'Virginia Commonwealth University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Research university in Richmond. Arts, health sciences, and business. 25 minutes from Fort Gregg-Adams. Yellow Ribbon certified.', applyUrl: 'https://admissions.vcu.edu/apply/', siteUrl: 'https://www.vcu.edu' },
    { name: 'John Tyler Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college near Fort Gregg-Adams. Nursing, IT, and business programs. Transfer partner with VCU and other VA universities.', applyUrl: 'https://www.reynolds.edu/admissions/apply/', siteUrl: 'https://www.reynolds.edu' },
  ],
  'Fort Knox': [
    { name: 'Elizabethtown Community & Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'KCTCS college in Elizabethtown, KY. Healthcare, business, and skilled trades. TA accepted. Closest college to Fort Knox.', applyUrl: '', siteUrl: 'https://elizabethtown.kctcs.edu' },
    { name: 'University of Louisville', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major research university in Louisville, KY. Business, engineering, and health sciences. 45 minutes from Fort Knox. TA and GI Bill.', applyUrl: 'https://admissions.louisville.edu/apply/', siteUrl: 'https://www.louisville.edu' },
    { name: 'Western Kentucky University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Bowling Green. Business, nursing, and criminal justice. Military-friendly campus with veteran services.', applyUrl: 'https://www.wku.edu/admissions/', siteUrl: 'https://www.wku.edu' },
    { name: 'Campbellsville University', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Christian university in Campbellsville, KY. Business, education, and music. Yellow Ribbon participant. Veteran-friendly.', applyUrl: '', siteUrl: 'https://www.campbellsville.edu' },
  ],
  'Fort Jackson': [
    { name: 'University of South Carolina', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Flagship research university in Columbia, SC. Business, engineering, and nursing. 10 minutes from Fort Jackson. TA and GI Bill accepted.', applyUrl: 'https://sc.edu/admissions/undergraduate/apply/', siteUrl: 'https://www.sc.edu' },
    { name: 'Columbia International University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Faith-based university in Columbia. Biblical studies, counseling, and education. Military-friendly with GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.ciu.edu' },
    { name: 'Midlands Technical College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Large technical college near Fort Jackson. Nursing, IT, and business programs. TA-eligible with strong transfer pathways.', applyUrl: 'https://www.midlandstech.edu/admissions/', siteUrl: 'https://www.midlandstech.edu' },
    { name: 'Benedict College', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'HBCU in Columbia, SC. Business, computer science, and social work. Veteran-friendly campus. GI Bill accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Fort Leonard Wood': [
    { name: 'Missouri University of Science & Technology', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Top-ranked engineering and science university in Rolla, MO. STEM-focused with strong research programs. TA and GI Bill accepted.', applyUrl: 'https://apply.mst.edu/', siteUrl: 'https://www.mst.edu' },
    { name: 'University of Central Missouri', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university with military-friendly programs. Business, education, and technology. Flexible online and in-person options.', applyUrl: 'https://www.ucmo.edu/admissions/apply/', siteUrl: 'https://www.ucmo.edu' },
    { name: 'State Fair Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Sedalia, MO. Healthcare, business, and agriculture programs. TA accepted. Affordable tuition.', applyUrl: '', siteUrl: 'https://www.sfccmo.edu' },
    { name: 'Drury University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Private liberal arts university in Springfield, MO. Architecture, business, and communication. Yellow Ribbon participant.', applyUrl: '', siteUrl: 'https://www.drury.edu' },
  ],
  'Fort Wainwright': [
    { name: 'University of Alaska Fairbanks', type: 'Public', degree: '4-Year University', rating: 3.8, desc: "Alaska's flagship research university in Fairbanks. Engineering, natural sciences, and business. Adjacent to Fort Wainwright. TA accepted.", applyUrl: '', siteUrl: 'https://www.uaf.edu' },
    { name: 'UAF Community & Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'UAF branch campus with vocational and technical programs. Healthcare, trades, and business. TA-eligible and flexible scheduling.', applyUrl: '', siteUrl: 'https://ctc.uaf.edu' },
    { name: 'Alaska Bible College', type: 'Private', degree: '4-Year University', rating: 3.4, desc: 'Faith-based college in Palmer, AK. Biblical studies and Christian ministry. GI Bill accepted. Small, supportive campus community.', applyUrl: 'https://www.akbible.edu/admissions/', siteUrl: 'https://www.akbible.edu' },
  ],
  'Fort Novosel': [
    { name: 'Enterprise State Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Enterprise, AL. Business, healthcare, and aviation technology. TA accepted. Closest college to Fort Novosel.', applyUrl: 'https://www.escc.edu/admissions/', siteUrl: 'https://www.escc.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus near Fort Novosel. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
    { name: 'Auburn University at Montgomery', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Auburn system university with strong business and education programs. Active veteran services. 75 miles from Fort Novosel.', applyUrl: 'https://www.aum.edu/admissions/apply/', siteUrl: 'https://www.aum.edu' },
    { name: 'Wallace Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Alabama community college in Dothan. Nursing, business, and skilled trades. TA-eligible with transfer pathways.', applyUrl: 'https://www.wallace.edu/admissions/', siteUrl: 'https://www.wallace.edu' },
  ],
  'Fort Leavenworth': [
    { name: 'University of Kansas', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Flagship Kansas public university in Lawrence. Business, law, and engineering. 30 miles from Fort Leavenworth. TA and GI Bill accepted.', applyUrl: 'https://admissions.ku.edu/apply/', siteUrl: 'https://www.ku.edu' },
    { name: 'Kansas City Kansas Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college near Fort Leavenworth. Business, healthcare, and technology. TA-eligible with transfer pathways.', applyUrl: 'https://www.kckcc.edu/admissions/', siteUrl: 'https://www.kckcc.edu' },
    { name: 'Park University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly private university in Parkville, MO. Business administration and criminal justice. Flexible scheduling and TA accepted.', applyUrl: 'https://www.park.edu/admissions/apply/', siteUrl: 'https://www.park.edu' },
    { name: 'Johnson County Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Large community college in Overland Park, KS. Strong IT, business, and healthcare pathways. TA accepted. Transfer-friendly.', applyUrl: 'https://www.jccc.edu/admissions/apply/', siteUrl: 'https://www.jccc.edu' },
  ],
  'Fort Hamilton': [
    { name: 'Brooklyn College CUNY', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'CUNY campus in Brooklyn, NY. Liberal arts, business, and computer science. Affordable tuition and TA-eligible.', applyUrl: 'https://www.brooklyn.cuny.edu/web/admissions.php', siteUrl: 'https://www.brooklyn.cuny.edu' },
    { name: 'Kingsborough Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'CUNY community college in Brooklyn. Healthcare, business, and culinary arts. TA accepted. Transfer pathway to CUNY four-year schools.', applyUrl: 'https://www.kbcc.cuny.edu/admissions/', siteUrl: 'https://www.kbcc.cuny.edu' },
    { name: 'New York University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'World-renowned private research university in Manhattan. Business, law, and arts. Yellow Ribbon participant. Exceptional career network.', applyUrl: 'https://apply.nyu.edu/', siteUrl: 'https://www.nyu.edu' },
    { name: 'Touro University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Jewish-sponsored independent university in New York. Health sciences, education, and business. Military-friendly with GI Bill accepted.', applyUrl: 'https://www.touro.edu/admissions/', siteUrl: 'https://www.touro.edu' },
  ],
  'West Point': [
    { name: 'SUNY New Paltz', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'SUNY campus in New Paltz, NY. Fine arts, business, and education. Veteran-friendly with transfer pathways. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.newpaltz.edu' },
    { name: 'Marist College', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Private college on the Hudson River in Poughkeepsie. Business, communication, and fashion design. Yellow Ribbon participant.', applyUrl: '', siteUrl: 'https://www.marist.edu' },
    { name: 'Orange County Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'SUNY community college in Middletown, NY. Business, healthcare, and technology programs. TA-eligible and affordable.', applyUrl: 'https://www.sunyorange.edu/admissions/', siteUrl: 'https://www.sunyorange.edu' },
    { name: 'Vassar College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college in Poughkeepsie. Exceptional academics. Yellow Ribbon participant.', applyUrl: 'https://admissions.vassar.edu/apply/', siteUrl: 'https://www.vassar.edu' },
  ],
  'Fort Myer': [
    { name: 'George Mason University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: "Virginia's largest public university in Fairfax. Cybersecurity, engineering, and business. Active veteran services. TA and GI Bill accepted.", applyUrl: 'https://admissions.gmu.edu/apply/', siteUrl: 'https://www2.gmu.edu' },
    { name: 'Northern Virginia Community College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'Largest community college in Virginia. IT, healthcare, and business. TA accepted. Strong transfer pathway to GMU.', applyUrl: 'https://www.nvcc.edu/admissions/', siteUrl: 'https://www.nvcc.edu' },
    { name: 'American University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Prestigious private university in Washington, DC. International studies, law, and public policy. Yellow Ribbon participant.', applyUrl: 'https://www.american.edu/admissions/apply/', siteUrl: 'https://www.american.edu' },
    { name: 'Georgetown University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Elite Jesuit research university in DC. Law, international affairs, and medicine. Yellow Ribbon certified. Exceptional career network.', applyUrl: '', siteUrl: 'https://www.georgetown.edu' },
  ],
  'Fort Richardson': [
    { name: 'University of Alaska Anchorage', type: 'Public', degree: '4-Year University', rating: 3.8, desc: "Alaska's largest university adjacent to Joint Base Elmendorf-Richardson. Nursing, engineering, and business. TA and GI Bill accepted.", applyUrl: 'https://www.uaa.alaska.edu/admissions/', siteUrl: 'https://www.uaa.alaska.edu' },
    { name: 'Alaska Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Small private university in Anchorage. Business, outdoor studies, and liberal arts. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.alaskapacific.edu/admissions/', siteUrl: 'https://www.alaskapacific.edu' },
    { name: 'Charter College', type: 'Private', degree: '2-Year College', rating: 3.4, desc: 'Career-focused college with healthcare, business, and legal programs. Flexible online options for military families. GI Bill accepted.', applyUrl: 'https://www.chartercollege.edu/admissions/', siteUrl: 'https://www.chartercollege.edu' },
  ],
  'Fort Shafter': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university in Honolulu. Business, engineering, and tropical agriculture. TA and GI Bill accepted.", applyUrl: '', siteUrl: 'https://manoa.hawaii.edu' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in downtown Honolulu and Pearl Harbor campus. Business, nursing, and social sciences. Yellow Ribbon participant.', applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
    { name: 'Honolulu Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH community college in Honolulu. Technical and vocational programs including automotive, diesel, and culinary arts. TA accepted.', applyUrl: '', siteUrl: '' },
  ],
  // ── CONUS Navy ───────────────────────────────────────────────────────────────
  'Naval Base San Diego': [
    { name: 'San Diego State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major CSU campus in San Diego. Business, engineering, and public health. Active veteran resource center. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.sdsu.edu' },
    { name: 'UC San Diego', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC research university. Engineering, marine biology, and computer science. Yellow Ribbon certified. World-class faculty.', applyUrl: 'https://admissions.ucsd.edu/apply/', siteUrl: 'https://www.ucsd.edu' },
    { name: 'San Diego City College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in downtown San Diego. Business, IT, and public safety programs. TA-eligible. Strong transfer pathway to SDSU and UC.', applyUrl: '', siteUrl: 'https://www.sdcity.edu' },
    { name: 'Point Loma Nazarene University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Christian liberal arts university overlooking San Diego Bay. Nursing, business, and kinesiology. Yellow Ribbon participant.', applyUrl: '', siteUrl: 'https://www.pointloma.edu' },
  ],
  'Naval Station Mayport': [
    { name: 'University of North Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Jacksonville, FL. Business, nursing, and computing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.unf.edu/admissions/', siteUrl: 'https://www.unf.edu' },
    { name: 'Florida State College at Jacksonville', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'State college in Jacksonville with associate degrees and certificates. Healthcare, IT, and business. TA-eligible.', applyUrl: 'https://www.fscj.edu/admissions/', siteUrl: 'https://www.fscj.edu' },
    { name: 'Jacksonville University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private university in Jacksonville. Nursing, aviation, and marine science programs. Yellow Ribbon participant. Military-friendly.', applyUrl: '', siteUrl: 'https://www.ju.edu' },
    { name: 'Edward Waters University', type: 'Private', degree: '4-Year University', rating: 3.5, desc: 'Historic HBCU in Jacksonville. Business, criminal justice, and mass communications. Veteran-friendly community. GI Bill accepted.', applyUrl: 'https://www.ewu.edu/admissions/', siteUrl: 'https://www.ewu.edu' },
  ],
  'NAS Pensacola': [
    { name: 'University of West Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Pensacola. Business, intelligence studies, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://uwf.edu/admissions/', siteUrl: 'https://uwf.edu' },
    { name: 'Pensacola State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'State college near NAS Pensacola. Nursing, aviation maintenance, and business. TA-eligible. Strong transfer pathway to UWF.', applyUrl: 'https://www.pensacolastate.edu/admissions/', siteUrl: 'https://www.pensacolastate.edu' },
    { name: 'Embry-Riddle Aeronautical University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'World-renowned aviation university in Daytona Beach. Aviation science, aerospace engineering, and flight. Yellow Ribbon participant.', applyUrl: 'https://admissions.erau.edu/apply/', siteUrl: 'https://www.erau.edu' },
    { name: 'University of South Alabama', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Research university in Mobile, AL. Medical, nursing, and engineering programs. 60 miles from NAS Pensacola. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.southalabama.edu' },
  ],
  'Naval Base Kitsap': [
    { name: 'Olympic College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Bremerton adjacent to Naval Base Kitsap. Business, healthcare, and IT. TA accepted. Strong veteran services.', applyUrl: '', siteUrl: 'https://www.olympic.edu' },
    { name: 'University of Washington', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked public research university in Seattle. Engineering, medicine, and business. Yellow Ribbon certified. Exceptional faculty.', applyUrl: '', siteUrl: 'https://www.washington.edu' },
    { name: 'Western Washington University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public university in Bellingham. Business, education, and environmental sciences. Military-friendly campus. TA and GI Bill accepted.', applyUrl: 'https://admissions.wwu.edu/apply/', siteUrl: 'https://www.wwu.edu' },
    { name: 'Pacific Lutheran University', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Lutheran university in Tacoma. Nursing, business, and education programs. Yellow Ribbon participant. Active military community.', applyUrl: 'https://www.plu.edu/admission/apply/', siteUrl: 'https://www.plu.edu' },
  ],
  'NAS Jacksonville': [
    { name: 'University of North Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Jacksonville, FL. Business, nursing, and computing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.unf.edu/admissions/', siteUrl: 'https://www.unf.edu' },
    { name: 'Florida State College at Jacksonville', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'State college in Jacksonville with associate degrees and certificates. Healthcare, IT, and business. TA-eligible.', applyUrl: 'https://www.fscj.edu/admissions/', siteUrl: 'https://www.fscj.edu' },
    { name: 'Jacksonville University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private university in Jacksonville. Nursing, aviation, and marine science programs. Yellow Ribbon participant. Military-friendly.', applyUrl: '', siteUrl: 'https://www.ju.edu' },
    { name: 'Florida Coastal School of Law', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Law school in Jacksonville offering JD and hybrid programs. Veteran-friendly campus. GI Bill and Yellow Ribbon accepted.', applyUrl: '', siteUrl: '' },
  ],
  'Naval Base Ventura County': [
    { name: 'CSU Channel Islands', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'California State campus in Camarillo near NBVC. Business, education, and nursing. TA and GI Bill accepted. Veteran-friendly.', applyUrl: '', siteUrl: 'https://www.csuci.edu' },
    { name: 'Ventura College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Ventura, CA. Business, healthcare, and computer information systems. TA-eligible. Transfer pathways to CSU and UC.', applyUrl: '', siteUrl: 'https://www.venturacollege.edu' },
    { name: 'UC Santa Barbara', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC campus near NBVC. Engineering, business economics, and sciences. Yellow Ribbon certified. World-class research.', applyUrl: '', siteUrl: 'https://www.ucsb.edu' },
    { name: 'Cal Lutheran University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Private Lutheran university in Thousand Oaks. Business, education, and psychology. Yellow Ribbon participant. Military scholarships available.', applyUrl: 'https://www.callutheran.edu/admissions/', siteUrl: 'https://www.callutheran.edu' },
  ],
  'Joint Base Pearl Harbor-Hickam': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university. Business, engineering, and marine sciences. TA and GI Bill accepted. 15 minutes from JBPHH.", applyUrl: '', siteUrl: 'https://manoa.hawaii.edu' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university with Pearl Harbor campus and downtown Honolulu campus. Business, nursing, and military studies. Yellow Ribbon participant.', applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
    { name: 'Leeward Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH system college in Pearl City, adjacent to JBPHH. Business, healthcare, and liberal arts. TA accepted. Strong transfer pathways.', applyUrl: '', siteUrl: 'https://www.leeward.hawaii.edu' },
    { name: 'Chaminade University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Catholic Marianist university in Honolulu. Criminal justice, business, and nursing. Military-friendly. Yellow Ribbon certified.', applyUrl: 'https://www.chaminade.edu/admission/apply/', siteUrl: 'https://www.chaminade.edu' },
  ],
  'NAS Whidbey Island': [
    { name: 'Skagit Valley College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college serving Whidbey Island and Skagit Valley. Business, healthcare, and trades. TA-eligible. Closest college to NAS Whidbey.', applyUrl: 'https://www.skagit.edu/admissions/', siteUrl: 'https://www.skagit.edu' },
    { name: 'Western Washington University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public university in Bellingham, 40 miles from NAS Whidbey. Business, education, and environmental studies. TA and GI Bill accepted.', applyUrl: 'https://admissions.wwu.edu/apply/', siteUrl: 'https://www.wwu.edu' },
    { name: 'UW Bothell', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'University of Washington campus in Bothell. Business, nursing, and computer science. Veteran-friendly with TA and GI Bill accepted.', applyUrl: 'https://www.uwb.edu/admissions/apply/', siteUrl: 'https://www.uwb.edu' },
  ],
  'Naval Station Everett': [
    { name: 'Everett Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Everett, WA. Business, healthcare, and engineering technology. TA accepted. Adjacent to Naval Station Everett.', applyUrl: 'https://www.everettcc.edu/admissions/', siteUrl: 'https://www.everettcc.edu' },
    { name: 'UW Bothell', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'University of Washington campus 20 miles south. Business, nursing, and computer science. TA and GI Bill accepted.', applyUrl: 'https://www.uwb.edu/admissions/apply/', siteUrl: 'https://www.uwb.edu' },
    { name: 'Western Washington University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public university in Bellingham, 30 miles north. Business, education, and environmental studies. Military-friendly campus.', applyUrl: 'https://admissions.wwu.edu/apply/', siteUrl: 'https://www.wwu.edu' },
  ],
  'NAS Corpus Christi': [
    { name: 'Texas A&M University Corpus Christi', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'A&M system university on the island. Business, nursing, and marine sciences. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.tamucc.edu/admissions/', siteUrl: 'https://www.tamucc.edu' },
    { name: 'Del Mar College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Corpus Christi. Healthcare, business, and culinary arts. TA-eligible. Transfer pathways to A&M Corpus Christi.', applyUrl: '', siteUrl: 'https://www.delmar.edu' },
  ],
  'NAS Oceana': [
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public research university in Norfolk, VA. Dedicated military center, engineering, and business. TA and GI Bill accepted.', applyUrl: 'https://apply.odu.edu/', siteUrl: 'https://www.odu.edu' },
    { name: 'Tidewater Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Five campuses across Hampton Roads including Virginia Beach. Nursing, IT, and business. TA-eligible. Transfer partner with ODU.', applyUrl: 'https://www.tcc.edu/admissions/apply/', siteUrl: 'https://www.tcc.edu' },
    { name: 'Regent University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Virginia Beach. Law, business, and communication. Online and on-campus. Military tuition discount.', applyUrl: 'https://www.regent.edu/admissions/apply/', siteUrl: 'https://www.regent.edu' },
    { name: 'Norfolk State University', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'HBCU in downtown Norfolk. Mass communications, social work, and technology. Veteran-friendly campus. GI Bill accepted.', applyUrl: 'https://www.nsu.edu/admissions/', siteUrl: 'https://www.nsu.edu' },
  ],
  // ── CONUS Marine Corps ───────────────────────────────────────────────────────
  'MCAS Cherry Point': [
    { name: 'Craven Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in New Bern, NC. Healthcare, business, and technology. TA accepted. Closest college to MCAS Cherry Point.', applyUrl: 'https://www.cravencc.edu/admissions/', siteUrl: 'https://www.cravencc.edu' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Nursing, business, and engineering. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://admissions.ecu.edu/apply/', siteUrl: 'https://www.ecu.edu' },
    { name: 'UNC Wilmington', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'UNC system campus on the coast. Marine biology, business, and nursing. Military-friendly campus. TA and GI Bill accepted.', applyUrl: 'https://www.uncw.edu/admissions/apply.html', siteUrl: 'https://www.uncw.edu' },
    { name: 'Carteret Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Small community college in Morehead City, NC. Marine technology and business programs. TA-eligible. Coastal focus.', applyUrl: 'https://www.carteret.edu/admissions/', siteUrl: 'https://www.carteret.edu' },
  ],
  'MCAS Miramar': [
    { name: 'San Diego Miramar College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college adjacent to MCAS Miramar. Aviation, business, and IT programs. TA-eligible. Strong transfer pathway.', applyUrl: '', siteUrl: 'https://www.sdmiramar.edu' },
    { name: 'San Diego State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major CSU campus near MCAS Miramar. Business, engineering, and public health. Active veteran resource center. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.sdsu.edu' },
    { name: 'UC San Diego', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC research university. Engineering, marine biology, and computer science. Yellow Ribbon certified.', applyUrl: 'https://admissions.ucsd.edu/apply/', siteUrl: 'https://www.ucsd.edu' },
    { name: 'National University', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Nonprofit private university serving adult learners. Business, education, and IT. Month-by-month enrollment. GI Bill accepted.', applyUrl: 'https://www.nu.edu/admissions/apply/', siteUrl: 'https://www.nu.edu' },
  ],
  'MCB Quantico': [
    { name: 'Northern Virginia Community College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'Largest community college in Virginia with Manassas campus near Quantico. IT, healthcare, and business. TA accepted.', applyUrl: 'https://www.nvcc.edu/admissions/', siteUrl: 'https://www.nvcc.edu' },
    { name: 'George Mason University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: "Virginia's largest public university. Cybersecurity, law, and business. Active veteran services. TA and GI Bill accepted.", applyUrl: 'https://admissions.gmu.edu/apply/', siteUrl: 'https://www2.gmu.edu' },
    { name: 'Virginia Tech', type: 'Public', degree: '4-Year University', rating: 4.4, desc: 'Top-ranked public research university. Engineering, architecture, and business. Yellow Ribbon participant. 75 miles from Quantico.', applyUrl: 'https://admissions.vt.edu/apply.html', siteUrl: 'https://www.vt.edu' },
    { name: 'University of Mary Washington', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public liberal arts university in Fredericksburg. Business, computer science, and education. 15 miles from MCB Quantico.', applyUrl: '', siteUrl: 'https://www.umw.edu' },
  ],
  'MCAS New River': [
    { name: 'Coastal Carolina Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Primary college for Jacksonville, NC military community. On-post classes available. TA accepted. Healthcare and IT programs.', applyUrl: 'https://www.carteret.edu/apply/', siteUrl: 'https://www.carteret.edu' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville. Nursing, business, and engineering. 1 hour from MCAS New River. TA and GI Bill accepted.', applyUrl: 'https://admissions.ecu.edu/apply/', siteUrl: 'https://www.ecu.edu' },
    { name: 'University of Mount Olive', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Veteran-friendly private university with Jacksonville campus near MCAS New River. Business, criminal justice, and education.', applyUrl: 'https://www.umo.edu/admissions/apply/', siteUrl: 'https://www.umo.edu' },
  ],
  'MCB Hawaii Kaneohe Bay': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: "Hawaii's flagship research university. Business, engineering, and marine sciences. TA and GI Bill accepted. 20 minutes from MCB Hawaii.", applyUrl: '', siteUrl: 'https://manoa.hawaii.edu' },
    { name: 'Windward Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UH community college in Kaneohe, adjacent to MCB Hawaii. Liberal arts, science, and healthcare pathways. TA accepted.', applyUrl: '', siteUrl: 'https://www.windward.hawaii.edu' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in Honolulu. Business, nursing, and social sciences. Yellow Ribbon participant. GI Bill accepted.', applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
  ],
  'MCAS Yuma': [
    { name: 'Arizona Western College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Yuma adjacent to MCAS Yuma. Business, healthcare, and technology. TA-eligible. Closest college to base.', applyUrl: 'https://www.azwestern.edu/admissions/', siteUrl: 'https://www.azwestern.edu' },
    { name: 'Northern Arizona University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Flagstaff with online programs accessible from Yuma. Business, education, and engineering. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://nau.edu' },
    { name: 'Arizona State University Online', type: 'Public', degree: '4-Year University', rating: 4.0, desc: '#1 US News innovation university with fully online programs. Business, engineering, and computer science. Excellent military support and TA eligible.', applyUrl: 'https://asuonline.asu.edu/online-degree-programs/', siteUrl: 'https://asuonline.asu.edu' },
  ],
  'MCAS Beaufort': [
    { name: 'Technical College of the Lowcountry', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical college in Beaufort, SC. Healthcare, business, and technology. TA-eligible. Closest college to MCAS Beaufort.', applyUrl: 'https://www.tcl.edu/admissions/', siteUrl: 'https://www.tcl.edu' },
    { name: 'University of South Carolina Beaufort', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'USC campus in Beaufort. Business, nursing, and liberal arts. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.uscb.edu/admissions/apply/', siteUrl: 'https://www.uscb.edu' },
    { name: 'Coastal Carolina University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Conway, SC. Business, education, and marine science. Military-friendly campus. TA and GI Bill accepted.', applyUrl: 'https://www.coastal.edu/admissions/', siteUrl: 'https://www.coastal.edu' },
  ],
  // ── CONUS Air Force / Space Force ────────────────────────────────────────────
  'Joint Base Langley-Eustis': [
    { name: 'Hampton University', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Historic HBCU in Hampton, VA. Business, nursing, and engineering. Adjacent to JBLE. Yellow Ribbon certified. Strong veteran services.', applyUrl: 'https://www.hamptonu.edu/admission/apply.cfm', siteUrl: 'https://www.hamptonu.edu' },
    { name: 'Thomas Nelson Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Hampton. Business, healthcare, and technology programs. TA-eligible. Transfer pathways to ODU and other VA schools.', applyUrl: '', siteUrl: '' },
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Research university in Norfolk. Engineering, business, and education. Dedicated military center. TA and GI Bill accepted.', applyUrl: 'https://apply.odu.edu/', siteUrl: 'https://www.odu.edu' },
    { name: 'Christopher Newport University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public liberal arts university in Newport News. Business, leadership, and science. Veteran-friendly campus. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.cnu.edu' },
  ],
  'Eglin AFB': [
    { name: 'Northwest Florida State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'State college in Niceville adjacent to Eglin AFB. Business, healthcare, and professional programs. TA-eligible.', applyUrl: 'https://www.nwfsc.edu/admissions/', siteUrl: 'https://www.nwfsc.edu' },
    { name: 'University of West Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Pensacola. Business, intelligence studies, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://uwf.edu/admissions/', siteUrl: 'https://uwf.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus near Eglin AFB. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs with on-base classes at Eglin. Popular with Air Force members. TA and GI Bill accepted.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'MacDill AFB': [
    { name: 'University of Tampa', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Private university in downtown Tampa. Business, nursing, and international business. Yellow Ribbon participant. Minutes from MacDill AFB.', applyUrl: 'https://www.ut.edu/admissions/apply/', siteUrl: 'https://www.ut.edu' },
    { name: 'Hillsborough Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Large community college in Tampa. Healthcare, IT, and business. TA-eligible. Strong transfer pathway to USF and UT.', applyUrl: 'https://www.hccfl.edu/admissions/', siteUrl: 'https://www.hccfl.edu' },
    { name: 'University of South Florida', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Major research university in Tampa. Engineering, medicine, and business. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://admissions.usf.edu/apply/', siteUrl: 'https://www.usf.edu' },
    { name: 'Eckerd College', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Private liberal arts college in St. Petersburg. Marine science, business, and psychology. Yellow Ribbon certified. Waterfront campus.', applyUrl: '', siteUrl: 'https://www.eckerd.edu' },
  ],
  'Tyndall AFB': [
    { name: 'Gulf Coast State College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'State college in Panama City, FL. Business, healthcare, and technology programs. TA-eligible. Closest college to Tyndall AFB.', applyUrl: 'https://www.gulfcoast.edu/admissions/', siteUrl: 'https://www.gulfcoast.edu' },
    { name: 'FSU Panama City', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Florida State University branch campus in Panama City. Business, computer science, and social sciences. TA and GI Bill accepted.', applyUrl: 'https://admissions.fsu.edu/apply/', siteUrl: 'https://www.pc.fsu.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus serving the Tyndall area. Business, criminal justice, and social sciences. TA accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Barksdale AFB': [
    { name: 'Bossier Parish Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college adjacent to Barksdale AFB. Healthcare, business, and technology. TA-eligible. Closest college to base.', applyUrl: 'https://www.bpcc.edu/admissions/', siteUrl: 'https://www.bpcc.edu' },
    { name: 'Louisiana Tech University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Ruston, LA. Engineering, business, and computer science. 30 miles from Barksdale. TA and GI Bill accepted.', applyUrl: 'https://www.latech.edu/admissions/apply/', siteUrl: 'https://www.latech.edu' },
    { name: 'Centenary College', type: 'Private', degree: '4-Year University', rating: 3.9, desc: 'Private liberal arts college in Shreveport. Business, education, and natural sciences. Yellow Ribbon participant. Military-friendly.', applyUrl: '', siteUrl: 'https://www.centenary.edu' },
    { name: 'LSU Shreveport', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'LSU system campus in Shreveport. Business, nursing, and liberal arts. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.lsus.edu' },
  ],
  'Tinker AFB': [
    { name: 'Rose State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Midwest City adjacent to Tinker AFB. IT, aviation maintenance, and healthcare. TA-eligible.', applyUrl: 'https://www.rose.edu/admissions/', siteUrl: 'https://www.rose.edu' },
    { name: 'University of Central Oklahoma', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Edmond, OK. Business, education, and forensic science. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.uco.edu/admissions/apply/', siteUrl: 'https://www.uco.edu' },
    { name: 'Oklahoma State University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Flagship Oklahoma land-grant university. Engineering, business, and agriculture. Strong research programs. TA and GI Bill accepted.', applyUrl: 'https://go.okstate.edu/admissions/apply/', siteUrl: 'https://go.okstate.edu' },
    { name: 'Southern Nazarene University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Christian university in Bethany, OK. Business, education, and nursing. Yellow Ribbon participant. Military-friendly community.', applyUrl: '', siteUrl: 'https://www.snu.edu' },
  ],
  'Offutt AFB': [
    { name: 'Bellevue University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Military-friendly private university adjacent to Offutt AFB. Business, IT, and cybersecurity. TA and GI Bill accepted. Flexible scheduling.', applyUrl: '', siteUrl: 'https://www.bellevue.edu' },
    { name: 'Metropolitan Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Omaha. IT, healthcare, and business. TA-eligible. Strong transfer pathways to UNO and Creighton.', applyUrl: 'https://www.mcckc.edu/enrollment/', siteUrl: 'https://www.mcckc.edu' },
    { name: 'University of Nebraska Omaha', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Omaha. Business, engineering, and information science. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.unomaha.edu/admissions/', siteUrl: 'https://www.unomaha.edu' },
    { name: 'Creighton University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Jesuit research university in Omaha. Medicine, law, and business. Yellow Ribbon participant. Excellent healthcare programs.', applyUrl: 'https://admissions.creighton.edu/apply/', siteUrl: 'https://www.creighton.edu' },
  ],
  'Whiteman AFB': [
    { name: 'University of Central Missouri', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Warrensburg, MO. Business, education, and aviation. Active veteran services. 15 minutes from Whiteman AFB.', applyUrl: 'https://www.ucmo.edu/admissions/apply/', siteUrl: 'https://www.ucmo.edu' },
    { name: 'State Fair Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Sedalia, MO. Healthcare, business, and agriculture. TA-eligible. Affordable and convenient.', applyUrl: '', siteUrl: 'https://www.sfccmo.edu' },
    { name: 'Missouri S&T', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Missouri University of Science & Technology. Top-ranked STEM programs. Engineering and computer science. TA and GI Bill accepted.', applyUrl: 'https://apply.mst.edu/', siteUrl: 'https://www.mst.edu' },
  ],
  'Scott AFB': [
    { name: 'McKendree University', type: 'Private', degree: '4-Year University', rating: 3.9, desc: 'Private university in Lebanon, IL. Business, nursing, and education. Yellow Ribbon participant. Minutes from Scott AFB.', applyUrl: '', siteUrl: 'https://www.mckendree.edu' },
    { name: 'Southwestern Illinois College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college serving metro-east Illinois. Business, healthcare, and technology. TA-eligible. Strong transfer pathways.', applyUrl: 'https://www.swic.edu/admissions/', siteUrl: 'https://www.swic.edu' },
    { name: 'Southern Illinois University Edwardsville', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'SIU campus near Scott AFB. Business, engineering, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.siue.edu/admissions/', siteUrl: 'https://www.siue.edu' },
    { name: 'Lindenwood University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university in St. Charles, MO. Business, communications, and education. Military-friendly with GI Bill accepted.', applyUrl: 'https://www.lindenwood.edu/admissions/apply/', siteUrl: 'https://www.lindenwood.edu' },
  ],
  'Wright-Patterson AFB': [
    { name: 'Wright State University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university adjacent to Wright-Patterson AFB. Engineering, business, and medicine. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.wright.edu' },
    { name: 'Sinclair Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Dayton. Aviation technology, IT, and healthcare. TA-eligible. Transfer pathways to WSU. Strong military support.', applyUrl: 'https://www.sinclair.edu/admissions/', siteUrl: 'https://www.sinclair.edu' },
    { name: 'University of Dayton', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Catholic research university in Dayton. Engineering, law, and business. Yellow Ribbon participant. Close to Wright-Patterson.', applyUrl: 'https://udayton.edu/admission/apply/', siteUrl: 'https://www.udayton.edu' },
    { name: 'Air Force Institute of Technology', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Graduate school of engineering and management on Wright-Patterson AFB. STEM graduate degrees exclusively for military. Free for eligible service members.', applyUrl: 'https://www.afit.edu/admissions/', siteUrl: 'https://www.afit.edu' },
  ],
  'Joint Base Andrews': [
    { name: 'University of Maryland', type: 'Public', degree: '4-Year University', rating: 4.4, desc: 'Flagship state university 15 miles from Andrews. Engineering, business, and cybersecurity. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://apply.umd.edu/', siteUrl: 'https://www.umd.edu' },
    { name: "Prince George's Community College", type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college near Joint Base Andrews. Healthcare, IT, and business. TA-eligible. Transfer pathways to UMD and other MD schools.', applyUrl: '', siteUrl: 'https://www.pgcc.edu' },
    { name: 'American University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Prestigious private university in Washington, DC. International studies, law, and public policy. Yellow Ribbon participant.', applyUrl: 'https://www.american.edu/admissions/apply/', siteUrl: 'https://www.american.edu' },
    { name: 'Bowie State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'HBCU in Bowie, MD. Business, computer science, and education. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.bowiestate.edu' },
  ],
  'Nellis AFB': [
    { name: 'College of Southern Nevada', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Las Vegas. Business, healthcare, and culinary arts. TA-eligible. Closest college to Nellis AFB.', applyUrl: 'https://www.csn.edu/admissions/', siteUrl: 'https://www.csn.edu' },
    { name: 'University of Nevada Las Vegas', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public research university in Las Vegas. Business, hospitality, and engineering. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.unlv.edu' },
    { name: 'Nevada State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Public university in Henderson, NV. Business, education, and nursing. Military-friendly with flexible scheduling. TA and GI Bill accepted.', applyUrl: 'https://www.nevadastate.edu/admissions/', siteUrl: 'https://www.nevadastate.edu' },
    { name: 'Touro University Nevada', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private health sciences university in Henderson. Healthcare and business programs. GI Bill accepted. Military-friendly.', applyUrl: 'https://tun.touro.edu/admissions/', siteUrl: 'https://tun.touro.edu' },
  ],
  'Travis AFB': [
    { name: 'Solano Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Fairfield adjacent to Travis AFB. Business, healthcare, and aviation. TA-eligible. Closest college to base.', applyUrl: 'https://www.solano.edu/admissions/', siteUrl: 'https://www.solano.edu' },
    { name: 'UC Davis', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC campus in Davis. Veterinary medicine, engineering, and business. Yellow Ribbon certified. 25 miles from Travis AFB.', applyUrl: 'https://www.ucdavis.edu/admissions/', siteUrl: 'https://www.ucdavis.edu' },
    { name: 'California State University Sacramento', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CSU campus in Sacramento. Business, criminal justice, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.csus.edu/apply/', siteUrl: 'https://www.csus.edu' },
    { name: 'Touro University California', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Health sciences university in Vallejo, near Travis AFB. Osteopathic medicine, pharmacy, and public health. GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.tu.edu' },
  ],
  'Edwards AFB': [
    { name: 'Antelope Valley College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Lancaster, CA near Edwards AFB. Aerospace, business, and healthcare. TA-eligible. Strong aviation programs.', applyUrl: 'https://www.avc.edu/admissions/', siteUrl: 'https://www.avc.edu' },
    { name: 'Cal State San Bernardino', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'CSU campus with business, education, and nursing programs. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.csusb.edu/admissions/', siteUrl: 'https://www.csusb.edu' },
    { name: 'California State University Mojave', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'CSU satellite programs serving the high desert community near Edwards AFB. Business and education. TA and GI Bill accepted.', applyUrl: 'https://www.csub.edu/admissions/', siteUrl: 'https://www.csub.edu' },
  ],
  'Keesler AFB': [
    { name: 'Mississippi Gulf Coast Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Biloxi adjacent to Keesler AFB. IT, healthcare, and business. TA-eligible. Excellent transfer pathways.', applyUrl: '', siteUrl: 'https://www.mgccc.edu' },
    { name: 'University of Southern Mississippi', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public research university in Hattiesburg. Business, nursing, and engineering. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.usm.edu/admissions/apply/', siteUrl: 'https://www.usm.edu' },
    { name: 'William Carey University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Christian university in Hattiesburg. Nursing, education, and business. Yellow Ribbon participant. Military-friendly campus.', applyUrl: 'https://www.wmcarey.edu/admissions/', siteUrl: 'https://www.wmcarey.edu' },
  ],
  'Little Rock AFB': [
    { name: 'University of Arkansas at Little Rock', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'UA system campus in Little Rock. Business, engineering, and information science. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://ualr.edu/admissions/apply/', siteUrl: 'https://ualr.edu' },
    { name: 'Pulaski Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Technical college in North Little Rock near the air base. Healthcare, IT, and business. TA-eligible. Affordable tuition.', applyUrl: 'https://www.uaptc.edu/admissions/', siteUrl: '' },
    { name: 'Hendrix College', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Highly regarded private liberal arts college in Conway, AR. Sciences, business, and humanities. Yellow Ribbon participant.', applyUrl: '', siteUrl: 'https://www.hendrix.edu' },
  ],
  'Dyess AFB': [
    { name: 'Hardin-Simmons University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Abilene. Business, nursing, and education. Yellow Ribbon participant. Military-friendly campus.', applyUrl: 'https://www.hsutx.edu/admissions/apply/', siteUrl: 'https://www.hsutx.edu' },
    { name: 'McMurry University', type: 'Private', degree: '4-Year University', rating: 3.6, desc: 'Methodist university in Abilene. Business, education, and nursing. GI Bill accepted. Small campus with strong faculty.', applyUrl: 'https://www.mcm.edu/admissions/apply/', siteUrl: 'https://www.mcm.edu' },
    { name: 'Cisco College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Cisco, TX. Agriculture, business, and vocational programs. TA-eligible. Affordable community college option.', applyUrl: 'https://www.cisco.edu/admissions/', siteUrl: 'https://www.cisco.edu' },
    { name: 'Abilene Christian University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Christian liberal arts university in Abilene. Theology, business, and sciences. Yellow Ribbon participant. Active military community.', applyUrl: '', siteUrl: 'https://www.acu.edu' },
  ],
  'Luke AFB': [
    { name: 'Glendale Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Maricopa community college adjacent to Luke AFB. Business, healthcare, and technology. TA-eligible. Closest college to base.', applyUrl: 'https://www.gccaz.edu/admissions/', siteUrl: 'https://www.gccaz.edu' },
    { name: 'Arizona State University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Nation\'s #1 innovation university. Business, engineering, and health sciences. Enormous online program. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.asu.edu' },
    { name: 'Grand Canyon University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Christian university in Phoenix. Business, education, and nursing. Military-friendly with Yellow Ribbon. Extensive online programs.', applyUrl: '', siteUrl: 'https://www.gcu.edu' },
    { name: 'Northern Arizona University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Flagstaff with extensive online programs. Business, education, and engineering. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://nau.edu' },
  ],
  'Davis-Monthan AFB': [
    { name: 'Pima Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Tucson. Business, healthcare, and aviation maintenance. TA-eligible. Closest community college to Davis-Monthan.', applyUrl: '', siteUrl: 'https://www.pima.edu' },
    { name: 'University of Arizona', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Flagship Arizona public research university. Engineering, medicine, and business. Yellow Ribbon certified. 10 minutes from base.', applyUrl: 'https://admissions.arizona.edu/apply/', siteUrl: 'https://www.arizona.edu' },
    { name: 'Arizona State University', type: 'Public', degree: '4-Year University', rating: 4.2, desc: "#1 US innovation university. Massive online program for military. Business, engineering, and health sciences. TA and GI Bill accepted.", applyUrl: '', siteUrl: 'https://www.asu.edu' },
    { name: 'Cochise College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Community college in Sierra Vista, AZ near Fort Huachuca. Business, healthcare, and public safety. TA-eligible.', applyUrl: 'https://www.cochise.edu/admissions/', siteUrl: 'https://www.cochise.edu' },
  ],
  'Fairchild AFB': [
    { name: 'Eastern Washington University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Cheney, WA adjacent to Fairchild AFB. Business, education, and dental hygiene. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.ewu.edu' },
    { name: 'Gonzaga University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Jesuit research university in Spokane. Business, law, and nursing. Yellow Ribbon participant. Excellent academic reputation.', applyUrl: 'https://www.gonzaga.edu/admission/apply/', siteUrl: 'https://www.gonzaga.edu' },
    { name: 'Washington State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Flagship Washington land-grant university in Pullman. Engineering, veterinary medicine, and business. TA and GI Bill accepted.', applyUrl: 'https://admission.wsu.edu/apply/', siteUrl: 'https://wsu.edu' },
    { name: 'Spokane Falls Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Spokane. Business, IT, and healthcare. TA-eligible. Strong transfer pathways to EWU and WSU.', applyUrl: '', siteUrl: '' },
  ],
  'Hill AFB': [
    { name: 'Weber State University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Public university in Ogden adjacent to Hill AFB. Business, engineering technology, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.weber.edu' },
    { name: 'Utah State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Utah land-grant research university in Logan. Engineering, business, and agriculture. Strong online programs. TA and GI Bill accepted.', applyUrl: 'https://www.usu.edu/admissions/', siteUrl: 'https://www.usu.edu' },
    { name: 'Ogden-Weber Applied Technology College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Applied technology college in Ogden. Skilled trades, healthcare, and IT certifications. TA-eligible. Excellent for vocational training.', applyUrl: '', siteUrl: '' },
    { name: 'Brigham Young University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Highly ranked private LDS university in Provo. Business, engineering, and law. Low tuition and Yellow Ribbon participant.', applyUrl: 'https://admissions.byu.edu/apply/', siteUrl: 'https://www.byu.edu' },
  ],
  'Minot AFB': [
    { name: 'Minot State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Public university in Minot, ND near the air base. Business, education, and criminal justice. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.minotstateu.edu/enroll/', siteUrl: 'https://www.minotstateu.edu' },
    { name: 'Dakota College at Bottineau', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'Community college in Bottineau, ND. Agriculture, business, and health programs. TA-eligible. Affordable rural community college.', applyUrl: '', siteUrl: 'https://www.dakotacollege.edu' },
    { name: 'University of Mary', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Catholic university in Bismarck, ND. Business, nursing, and education. Yellow Ribbon participant. Military-friendly campus.', applyUrl: '', siteUrl: 'https://www.umary.edu' },
  ],
  'Malmstrom AFB': [
    { name: 'University of Providence', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Catholic university in Great Falls, MT. Business, nursing, and education. Yellow Ribbon participant. Minutes from Malmstrom AFB.', applyUrl: 'https://www.uprovidence.edu/admissions/', siteUrl: 'https://www.uprovidence.edu' },
    { name: 'Montana State University Great Falls', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'MSU college of technology in Great Falls. Business, healthcare, and trades. TA-eligible. Closest public college to Malmstrom.', applyUrl: '', siteUrl: '' },
    { name: 'Montana State University Bozeman', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Flagship Montana research university. Engineering, agriculture, and business. Strong online programs. TA and GI Bill accepted.', applyUrl: 'https://www.montana.edu/admissions/apply/', siteUrl: 'https://www.montana.edu' },
  ],
  'Ellsworth AFB': [
    { name: 'Western Dakota Technical College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical college in Rapid City near Ellsworth AFB. Skilled trades, healthcare, and IT. TA-eligible. Excellent vocational programs.', applyUrl: 'https://www.wdt.edu/admissions/', siteUrl: 'https://www.wdt.edu' },
    { name: 'South Dakota School of Mines', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Engineering-focused public university in Rapid City. Highly ranked STEM programs. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.sdsmt.edu' },
    { name: 'Mount Marty University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Catholic Benedictine university in Yankton, SD. Healthcare, business, and education. Yellow Ribbon participant. Military-friendly.', applyUrl: '', siteUrl: '' },
  ],
  'Hurlburt Field': [
    { name: 'Northwest Florida State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'State college in Niceville, FL near Hurlburt Field. Business, healthcare, and professional programs. TA-eligible.', applyUrl: 'https://www.nwfsc.edu/admissions/', siteUrl: 'https://www.nwfsc.edu' },
    { name: 'University of West Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Pensacola. Business, intelligence studies, and nursing. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://uwf.edu/admissions/', siteUrl: 'https://uwf.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Military-friendly university with campus near Hurlburt Field. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Moody AFB': [
    { name: 'Valdosta State University', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in Valdosta, GA near Moody AFB. Business, nursing, and education. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.valdosta.edu' },
    { name: 'South Georgia Technical College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Technical college in Americus, GA. Healthcare, business, and technology. TA-eligible. Strong workforce training programs.', applyUrl: 'https://www.southgatech.edu/admissions/', siteUrl: 'https://www.southgatech.edu' },
    { name: 'Abraham Baldwin Agricultural College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Georgia public college in Tifton. Agriculture, business, and science programs. TA-eligible. Transfer pathway to UGA and GA Tech.', applyUrl: '', siteUrl: 'https://www.abac.edu' },
  ],
  'Shaw AFB': [
    { name: 'Central Carolina Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Technical college in Sumter, SC adjacent to Shaw AFB. Healthcare, IT, and business. TA-eligible. Closest college to base.', applyUrl: 'https://www.cctech.edu/admissions/', siteUrl: 'https://www.cctech.edu' },
    { name: 'University of South Carolina Sumter', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'USC campus in Sumter. Business, liberal arts, and natural sciences. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: '' },
    { name: 'Columbia College', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private liberal arts college in Columbia, SC. Business, education, and music. Yellow Ribbon participant. Military-friendly.', applyUrl: '', siteUrl: 'https://www.ccis.edu' },
  ],
  'Seymour Johnson AFB': [
    { name: 'Wayne Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Goldsboro, NC adjacent to Seymour Johnson AFB. Business, healthcare, and IT. TA-eligible.', applyUrl: 'https://www.waynecc.edu/admissions/', siteUrl: 'https://www.waynecc.edu' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Nursing, business, and engineering. Active veteran services. 30 miles from base.', applyUrl: 'https://admissions.ecu.edu/apply/', siteUrl: 'https://www.ecu.edu' },
    { name: 'Mount Olive University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Veteran-friendly private university near Seymour Johnson. Business, criminal justice, and education. GI Bill accepted.', applyUrl: 'https://www.umo.edu/admissions/apply/', siteUrl: 'https://www.umo.edu' },
  ],
  'Joint Base San Antonio': [
    { name: 'University of Texas at San Antonio', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major research university in San Antonio. Business, engineering, and health science. Active veteran services and military tuition discounts.', applyUrl: '', siteUrl: 'https://www.utsa.edu' },
    { name: "St. Philip's College", type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'HBCU–Hispanic Serving Institution in San Antonio. Healthcare, IT, and culinary arts. TA accepted. Low tuition.', applyUrl: '', siteUrl: 'https://www.alamo.edu/spc/' },
    { name: 'Trinity University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Highly ranked private liberal arts university in San Antonio. Business, engineering, and sciences. Yellow Ribbon participant.', applyUrl: '', siteUrl: 'https://www.trinity.edu' },
    { name: 'San Antonio College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Alamo College in downtown San Antonio. Nursing, computer science, and pre-professional programs. Transfer partner with UTSA.', applyUrl: '', siteUrl: 'https://www.alamo.edu/sac/' },
  ],
  'Buckley SFB': [
    { name: 'University of Colorado Denver', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus in Denver. Business, engineering, and health sciences. Active veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.ucdenver.edu' },
    { name: 'Community College of Denver', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Denver. Healthcare, business, and technology. TA-eligible. Transfer pathways to CU Denver and MSU Denver.', applyUrl: 'https://www.ccd.edu/admissions/', siteUrl: 'https://www.ccd.edu' },
    { name: 'Metropolitan State University of Denver', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public university in downtown Denver. Business, education, and aviation. Active veteran services. TA and GI Bill accepted.', applyUrl: 'https://www.msudenver.edu/admissions/', siteUrl: 'https://www.msudenver.edu' },
  ],
  'Schriever SFB': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus in Colorado Springs. Engineering, nursing, and business. Extensive veteran services and military discounts.', applyUrl: '', siteUrl: 'https://www.uccs.edu' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Culinary arts, automotive technology, and IT. TA accepted.', applyUrl: '', siteUrl: 'https://www.pikespeak.edu' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan — one course at a time. Yellow Ribbon participant.', applyUrl: 'https://www.coloradocollege.edu/admission/', siteUrl: 'https://www.coloradocollege.edu' },
  ],
  'Peterson SFB': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU system campus near Peterson SFB. Engineering, nursing, and business. Extensive veteran services and military discounts.', applyUrl: '', siteUrl: 'https://www.uccs.edu' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Culinary arts, IT, and business. TA accepted.', applyUrl: '', siteUrl: 'https://www.pikespeak.edu' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan — one course at a time. Yellow Ribbon participant.', applyUrl: 'https://www.coloradocollege.edu/admission/', siteUrl: 'https://www.coloradocollege.edu' },
  ],
  // ── OCONUS ───────────────────────────────────────────────────────────────────
  'Osan Air Base': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'University of Maryland Global Campus Asia. On-base classes at Osan AB. Business, cybersecurity, and public safety. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-post associate degree and certificate programs. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs available at Osan AB. Online with on-base support. TA and GI Bill accepted.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Camp Walker': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses available at Camp Walker. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'Camp Carroll': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at Camp Carroll. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'USAG Yongsan': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at USAG Yongsan/Seoul. Business, cybersecurity, and public safety management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-base associate degree and certificate programs. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs with on-base support at USAG Yongsan. TA and GI Bill accepted.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Camp Zama': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at Camp Zama, Japan. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs with on-base support at Camp Zama. TA and GI Bill accepted.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Misawa Air Base': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at Misawa Air Base, Japan. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'On-base associate degrees and certificates. Flexible scheduling. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'Embry-Riddle Aeronautical University Worldwide', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Aviation and aerospace programs at Misawa AB. Online with on-base support sessions. TA and GI Bill accepted.', applyUrl: 'https://worldwide.erau.edu/admissions/', siteUrl: 'https://worldwide.erau.edu' },
  ],
  'Naval Air Facility Atsugi': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at NAF Atsugi, Japan. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base. Flexible scheduling for shift workers. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'MCAS Iwakuni': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC courses at MCAS Iwakuni, Japan. Business, cybersecurity, and public safety management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at MCAS Iwakuni. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'Spangdahlem Air Base': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Spangdahlem AB, Germany. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU residential campus in Europe. Aviation management and aerospace engineering. Available near Spangdahlem.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with European campus classes. Business, criminal justice, and social sciences. TA and GI Bill accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'USAG Wiesbaden': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at USAG Wiesbaden, Germany. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU courses available at Wiesbaden. Aviation management and aerospace programs. TA and GI Bill accepted.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with classes at Wiesbaden. Business and social sciences. TA and GI Bill accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'USAG Grafenwöhr': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe on-base courses at Grafenwöhr. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU aviation and aerospace programs available at Grafenwöhr. TA and GI Bill accepted.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at Grafenwöhr. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'USAG Ansbach': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at USAG Ansbach, Germany. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU aviation and aerospace programs available near Ansbach. TA and GI Bill accepted.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with European classes near Ansbach. Business and social sciences. TA accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Aviano Air Base': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe on-base courses at Aviano AB, Italy. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Embry-Riddle European Campus', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'ERAU aviation management and aerospace engineering. Available at Aviano. TA and GI Bill accepted.', applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with European campus classes at Aviano. Business and social sciences. TA accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Naval Air Station Sigonella': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at NAS Sigonella, Sicily. Business, cybersecurity, and public safety. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at NAS Sigonella. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'Camp Darby': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Camp Darby, Italy. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Troy University', type: 'Public', degree: '4-Year University', rating: 3.6, desc: 'Military-friendly university with classes near Camp Darby. Business and criminal justice. TA accepted.', applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  ],
  'Naval Station Rota': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Naval Station Rota, Spain. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs at NS Rota. Flexible scheduling. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'Andersen Air Force Base': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Asia courses at Andersen AFB, Guam. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs on-base at Andersen. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'Joint Region Marianas': [
    { name: 'UMGC Asia', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Asia courses in Guam. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Guam Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Local community college on Guam. Business, healthcare, and technology programs. TA-eligible. Strong transfer pathways.', applyUrl: 'https://www.guamcc.edu/admissions/', siteUrl: 'https://www.guamcc.edu' },
    { name: 'University of Guam', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'The only four-year public university on Guam. Business, nursing, and education. TA and GI Bill accepted.', applyUrl: 'https://www.uog.edu/admissions/', siteUrl: 'https://www.uog.edu' },
  ],
  'Al Udeid Air Base': [
    { name: 'UMGC Worldwide Online', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC fully online programs for deployed/OCONUS members at Al Udeid AB. Business and cybersecurity. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs available at Al Udeid. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university designed for military. 190+ programs including intelligence, security, and emergency management.', applyUrl: '', siteUrl: 'https://www.amu.apus.edu' },
  ],
  'Camp Lemonnier': [
    { name: 'UMGC Worldwide Online', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC fully online programs for members at Camp Lemonnier, Djibouti. Business and cybersecurity. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs available at Camp Lemonnier. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'Incirlik Air Base': [
    { name: 'UMGC Europe', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC Europe courses at Incirlik AB, Turkey. Business, cybersecurity, and management. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs at Incirlik. Flexible scheduling. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ],
  'Bahrain Naval Support Activity': [
    { name: 'UMGC Worldwide Online', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'UMGC fully online programs for members at NSA Bahrain. Business and cybersecurity. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
    { name: 'Central Texas College Overseas', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Associate degree and certificate programs at NSA Bahrain. TA accepted.', applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university designed for military. Intelligence, security, and emergency management programs. GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.amu.apus.edu' },
  ],
  // ── Space Force ──────────────────────────────────────────────────────────────
  'Cape Canaveral Space Force Station': [
    { name: 'Florida Institute of Technology', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'STEM-focused private university in Melbourne, FL. Aerospace, engineering, and computer science. Strong ties to space industry and CCSFS. Yellow Ribbon.', applyUrl: '', siteUrl: 'https://www.fit.edu' },
    { name: 'Eastern Florida State College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Affordable community college near CCSFS. Engineering technology, business, and healthcare. TA and GI Bill accepted.', applyUrl: 'https://www.easternflorida.edu/admissions/', siteUrl: 'https://www.easternflorida.edu' },
    { name: 'University of Central Florida', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large public research university in Orlando. Aerospace engineering, computer science, and business. Strong veteran services.', applyUrl: 'https://admissions.ucf.edu/apply/', siteUrl: 'https://www.ucf.edu' },
    { name: 'Embry-Riddle Aeronautical University', type: 'Private', degree: '4-Year University', rating: 4.3, desc: 'Top aviation and aerospace university in Daytona Beach, 50 miles from CCSFS. Aviation science, aerospace engineering. Yellow Ribbon participant.', applyUrl: 'https://admissions.erau.edu/apply/', siteUrl: 'https://www.erau.edu' },
  ],
  'Los Angeles AFB': [
    { name: 'University of Southern California', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Top private research university. Engineering, business, and aerospace. Yellow Ribbon participant. Strong industry connections to space industry.', applyUrl: 'https://www.usc.edu/admission/undergraduate/', siteUrl: 'https://www.usc.edu' },
    { name: 'UCLA', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked UC campus in Westwood. Engineering, business, and sciences. Yellow Ribbon certified.', applyUrl: 'https://admission.ucla.edu/apply/', siteUrl: 'https://www.ucla.edu' },
    { name: 'El Camino College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Torrance. Engineering technology, computer science, and business. TA-eligible. Transfer pathway to CSU/UC.', applyUrl: 'https://www.elcamino.edu/admissions/', siteUrl: 'https://www.elcamino.edu' },
    { name: 'California State University Dominguez Hills', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'CSU campus in Carson near LA AFB. Business, nursing, and technology. Military-friendly with veteran resource center.', applyUrl: 'https://www.csudh.edu/admissions/', siteUrl: 'https://www.csudh.edu' },
  ],
  'Cheyenne Mountain SFS': [
    { name: 'University of Colorado Colorado Springs', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CU campus adjacent to the Colorado Springs military community. Engineering, nursing, and business. Active veteran services.', applyUrl: '', siteUrl: 'https://www.uccs.edu' },
    { name: 'Pikes Peak State College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Career and transfer programs in Colorado Springs. Technology, business, and automotive. TA accepted.', applyUrl: '', siteUrl: 'https://www.pikespeak.edu' },
    { name: 'Colorado College', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Highly selective private liberal arts college. Unique block plan. Yellow Ribbon participant.', applyUrl: 'https://www.coloradocollege.edu/admission/', siteUrl: 'https://www.coloradocollege.edu' },
  ],
  'Cavalier Space Force Station': [
    { name: 'Minot State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'Regional university in Minot, ND. Business, education, and nursing programs. TA and GI Bill accepted.', applyUrl: 'https://www.minotstateu.edu/enroll/', siteUrl: 'https://www.minotstateu.edu' },
    { name: 'University of North Dakota', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Flagship state university with strong aviation and aerospace programs. 2 hours from Cavalier. Yellow Ribbon participant.', applyUrl: 'https://und.edu/admissions/apply/', siteUrl: 'https://und.edu' },
    { name: 'Dakota College at Bottineau', type: 'Public', degree: '2-Year College', rating: 3.6, desc: 'Affordable two-year college near the Canadian border region. Natural resources and business programs. TA-eligible.', applyUrl: '', siteUrl: 'https://www.dakotacollege.edu' },
  ],
  'Clear Space Force Station': [
    { name: 'University of Alaska Fairbanks', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Major Alaskan research university. Engineering, natural science, and liberal arts. Strong veteran services. 100 miles from Clear SFS.', applyUrl: '', siteUrl: 'https://www.uaf.edu' },
    { name: 'UAF Community & Technical College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Vocational and associate degree programs in Fairbanks. TA-eligible. IT, business, and health programs.', applyUrl: '', siteUrl: 'https://ctc.uaf.edu' },
    { name: 'University of Maryland Global Campus', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Leading online university for military members. Available remotely at Clear SFS. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
  ],
  // ── Coast Guard ───────────────────────────────────────────────────────────────
  'USCG Training Center Cape May': [
    { name: 'Stockton University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public liberal arts university 30 miles from Cape May. Business, nursing, and social work. Veteran services office and TA accepted.', applyUrl: 'https://www.stockton.edu/admissions/apply/', siteUrl: 'https://www.stockton.edu' },
    { name: 'Cape May County Community College', type: 'Public', degree: '2-Year College', rating: 3.7, desc: 'Local community college with flexible scheduling for military. Business, healthcare, and criminal justice. TA-eligible.', applyUrl: '', siteUrl: '' },
    { name: 'Rowan University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Growing public research university in Glassboro, NJ. Engineering, business, and health sciences. Yellow Ribbon participant.', applyUrl: 'https://www.rowan.edu/home/offices-services/admissions/apply/', siteUrl: 'https://www.rowan.edu' },
  ],
  'USCG Base Kodiak': [
    { name: 'Kodiak College (UAF)', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'University of Alaska Fairbanks community campus in Kodiak. Associate degrees and certificates. TA accepted. Career and technical programs.', applyUrl: 'https://www.kodiak.alaska.edu/', siteUrl: 'https://www.kodiak.alaska.edu' },
    { name: 'University of Alaska Fairbanks', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Flagship Alaskan university available via distance learning. Engineering, science, and liberal arts. GI Bill and TA accepted.', applyUrl: '', siteUrl: 'https://www.uaf.edu' },
    { name: 'American Military University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Fully online university for military. Intelligence, emergency management, and security studies. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.amu.apus.edu' },
  ],
  'USCG Base Honolulu': [
    { name: 'University of Hawaii at Manoa', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Hawaii flagship research university. Business, engineering, and marine sciences. Strong veteran services. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://manoa.hawaii.edu' },
    { name: 'Hawaii Pacific University', type: 'Private', degree: '4-Year University', rating: 3.7, desc: 'Private university with campuses in Honolulu. Business, nursing, and social sciences. Yellow Ribbon participant.', applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
    { name: 'Honolulu Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Vocational and transfer programs in Honolulu. Automotive, electronics, and healthcare. TA-eligible.', applyUrl: '', siteUrl: '' },
  ],
  'USCG Base Elizabeth City': [
    { name: 'College of the Albemarle', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Elizabeth City. Nursing, IT, and business programs. TA accepted. Flexible scheduling for shift workers.', applyUrl: '', siteUrl: 'https://www.albemarle.edu' },
    { name: 'Elizabeth City State University', type: 'Public', degree: '4-Year University', rating: 3.7, desc: 'HBCU with strong STEM programs, including aviation. Affordable tuition with veteran services. GI Bill and TA accepted.', applyUrl: '', siteUrl: 'https://www.ecsu.edu' },
    { name: 'East Carolina University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Major public university in Greenville, NC. Nursing, business, and engineering. 1 hour from Elizabeth City. Yellow Ribbon.', applyUrl: 'https://admissions.ecu.edu/apply/', siteUrl: 'https://www.ecu.edu' },
  ],
  'USCG ISC Portsmouth': [
    { name: 'Old Dominion University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Top choice for military in Hampton Roads. Monarch Military Center. Engineering, business, and education. TA and GI Bill accepted.', applyUrl: 'https://apply.odu.edu/', siteUrl: 'https://www.odu.edu' },
    { name: 'Tidewater Community College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Five campuses across Hampton Roads. Nursing, IT, and business. Strong military family enrollment. TA-eligible.', applyUrl: 'https://www.tcc.edu/admissions/apply/', siteUrl: 'https://www.tcc.edu' },
    { name: 'Norfolk State University', type: 'Public', degree: '4-Year University', rating: 3.5, desc: 'HBCU near Portsmouth. Mass communications, technology, and social work. Veteran-friendly campus.', applyUrl: 'https://www.nsu.edu/admissions/', siteUrl: 'https://www.nsu.edu' },
  ],
  'Coast Guard Island Alameda': [
    { name: 'California State University East Bay', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'CSU campus in Hayward across the bay. Business, nursing, and computer science. Military-friendly with veteran resource center.', applyUrl: 'https://www.csueastbay.edu/admissions/', siteUrl: 'https://www.csueastbay.edu' },
    { name: 'College of Alameda', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Peralta community college on Alameda Island. Aviation maintenance, business, and IT. TA-eligible. Very close to Coast Guard Island.', applyUrl: '', siteUrl: '' },
    { name: 'UC Berkeley', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'World-renowned public university across the bay. Engineering, business, and law. Yellow Ribbon certified.', applyUrl: 'https://admissions.berkeley.edu/apply/', siteUrl: 'https://www.berkeley.edu' },
    { name: 'Saint Mary\'s College of California', type: 'Private', degree: '4-Year University', rating: 4.1, desc: 'Private Catholic liberal arts college. Business, nursing, and education. Yellow Ribbon participant. 20 minutes from CG Island.', applyUrl: 'https://www.stmarys-ca.edu/admissions/', siteUrl: 'https://www.stmarys-ca.edu' },
  ],
  'USCG Training Center Petaluma': [
    { name: 'Santa Rosa Junior College', type: 'Public', degree: '2-Year College', rating: 4.1, desc: 'One of California\'s top community colleges. Business, nursing, and culinary arts. TA accepted. Transfer pathway to CSU/UC.', applyUrl: 'https://www.santarosa.edu/admissions/', siteUrl: 'https://www.santarosa.edu' },
    { name: 'Sonoma State University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CSU campus in Rohnert Park, 8 miles from TRACEN. Business, nursing, and liberal arts. Veteran-friendly campus.', applyUrl: '', siteUrl: 'https://www.sonoma.edu' },
    { name: 'Touro University California', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Health sciences university in Vallejo. Physician assistant, pharmacy, and nursing programs. Military-friendly.', applyUrl: '', siteUrl: 'https://www.tu.edu' },
  ],
  'USCG Sector New York': [
    { name: 'College of Staten Island (CUNY)', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'CUNY campus on Staten Island near USCG Sector NY. Nursing, business, and social work. Affordable tuition and TA-eligible.', applyUrl: '', siteUrl: 'https://www.csi.cuny.edu' },
    { name: 'New York University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'World-class private university in NYC. Law, business, and engineering. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://apply.nyu.edu/', siteUrl: 'https://www.nyu.edu' },
    { name: 'St. John\'s University', type: 'Private', degree: '4-Year University', rating: 4.0, desc: 'Catholic university in Queens. Law, pharmacy, and business. Yellow Ribbon and military tuition rates.', applyUrl: '', siteUrl: 'https://www.stjohns.edu' },
  ],
  'USCG Sector Miami': [
    { name: 'Florida International University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large research university in Miami. Business, engineering, and law. Strong veteran support office. GI Bill and TA accepted.', applyUrl: 'https://admissions.fiu.edu/apply/', siteUrl: 'https://www.fiu.edu' },
    { name: 'Miami Dade College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Nation\'s largest community college system. Associate degrees and certificates. Very affordable. TA-eligible.', applyUrl: 'https://www.mdc.edu/admissions/', siteUrl: 'https://www.mdc.edu' },
    { name: 'University of Miami', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Private research university in Coral Gables. Marine science, business, and law. Yellow Ribbon participant.', applyUrl: 'https://www.miami.edu/admissions/', siteUrl: 'https://www.miami.edu' },
  ],
  'USCG Sector New Orleans': [
    { name: 'Tulane University', type: 'Private', degree: '4-Year University', rating: 4.4, desc: 'Top private research university. Public health, business, and law. Yellow Ribbon participant. Strong veteran support.', applyUrl: 'https://admission.tulane.edu/apply/', siteUrl: 'https://www.tulane.edu' },
    { name: 'University of New Orleans', type: 'Public', degree: '4-Year University', rating: 3.8, desc: 'Public urban university. Business, engineering, and film studies. Veteran-friendly with active veterans office.', applyUrl: 'https://www.uno.edu/admissions/', siteUrl: 'https://www.uno.edu' },
    { name: 'Delgado Community College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Louisiana\'s largest community college. Healthcare, culinary arts, and IT. TA-eligible. Multiple campuses in metro area.', applyUrl: 'https://www.dcc.edu/admissions/', siteUrl: 'https://www.dcc.edu' },
  ],
  'USCG Sector Houston-Galveston': [
    { name: 'University of Houston', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large public research university. Business, engineering, and law. Active veteran services. GI Bill and TA accepted.', applyUrl: '', siteUrl: 'https://www.uh.edu' },
    { name: 'College of the Mainland', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Community college in Texas City near Galveston. Nursing, welding, and business. TA-eligible.', applyUrl: 'https://www.com.edu/admissions/', siteUrl: 'https://www.com.edu' },
    { name: 'University of Texas Medical Branch (UTMB)', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Medical school and health sciences in Galveston. Nursing and allied health. Strong military connections.', applyUrl: '', siteUrl: 'https://www.utmb.edu' },
  ],
  'USCG Sector San Diego': [
    { name: 'San Diego State University', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Large CSU campus. Business, engineering, and public health. Strong veteran support and military community.', applyUrl: '', siteUrl: 'https://www.sdsu.edu' },
    { name: 'San Diego City College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Downtown San Diego community college. Nursing, business, and IT. TA-eligible. Strong military enrollment.', applyUrl: '', siteUrl: 'https://www.sdcity.edu' },
    { name: 'UC San Diego', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked research university. Engineering, marine biology, and computer science. Yellow Ribbon certified.', applyUrl: 'https://admissions.ucsd.edu/apply/', siteUrl: 'https://www.ucsd.edu' },
  ],
  'USCG AIRSTA Traverse City': [
    { name: 'Northwestern Michigan College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Community college in Traverse City. Aviation, maritime, and business programs. TA-eligible. Strong career focus.', applyUrl: 'https://www.nmc.edu/admissions/', siteUrl: 'https://www.nmc.edu' },
    { name: 'Central Michigan University', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Regional university with distance learning options. Business, health sciences, and education. Yellow Ribbon participant.', applyUrl: 'https://www.cmich.edu/admissions/', siteUrl: 'https://www.cmich.edu' },
  ],
  'USCG Sector Puget Sound': [
    { name: 'University of Washington', type: 'Public', degree: '4-Year University', rating: 4.5, desc: 'Top-ranked public university in Seattle. Engineering, medicine, and business. Yellow Ribbon certified.', applyUrl: '', siteUrl: 'https://www.washington.edu' },
    { name: 'Seattle Central College', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Downtown Seattle community college. Culinary, nursing, and IT programs. TA-eligible. Transfer pathway to UW.', applyUrl: 'https://www.seattlecentral.edu/admissions/', siteUrl: 'https://www.seattlecentral.edu' },
    { name: 'Seattle University', type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Jesuit university in Seattle. Law, nursing, and business. Yellow Ribbon participant. Military-friendly.', applyUrl: 'https://www.seattleu.edu/undergraduate-admissions/apply/', siteUrl: 'https://www.seattleu.edu' },
  ],
  'USCG Sector Boston': [
    { name: 'Massachusetts Maritime Academy', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Only public maritime academy in New England. Marine transportation, marine engineering, and emergency management. Strong CG connections.', applyUrl: '', siteUrl: 'https://www.maritime.edu' },
    { name: 'Bunker Hill Community College', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'Community college in Boston. Business, healthcare, and liberal arts. TA-eligible. Transfer pathway to state universities.', applyUrl: 'https://www.bhcc.edu/admissions/', siteUrl: 'https://www.bhcc.edu' },
    { name: 'Northeastern University', type: 'Private', degree: '4-Year University', rating: 4.5, desc: 'Top co-op university. Engineering, business, and cybersecurity. Yellow Ribbon participant. Excellent veteran support.', applyUrl: 'https://admissions.northeastern.edu/apply/', siteUrl: 'https://www.northeastern.edu' },
  ],
  'USCG Sector Baltimore': [
    { name: 'University of Maryland Baltimore County', type: 'Public', degree: '4-Year University', rating: 4.1, desc: 'Public research university near Baltimore. Cybersecurity, engineering, and health sciences. Strong veteran services.', applyUrl: '', siteUrl: 'https://www.umbc.edu' },
    { name: 'Community College of Baltimore County', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Multiple campuses in Baltimore area. Nursing, IT, and business. TA-eligible. Flexible scheduling.', applyUrl: 'https://www.ccbcmd.edu/Get-Started/Apply/', siteUrl: 'https://www.ccbcmd.edu' },
    { name: 'Towson University', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university near Baltimore. Business, nursing, and education programs. Veteran-friendly with active veterans services.', applyUrl: '', siteUrl: 'https://www.towson.edu' },
  ],
  'USCG AIRSTA Sitka': [
    { name: 'University of Alaska Southeast (Sitka)', type: 'Public', degree: '2-Year College', rating: 3.8, desc: 'UAS campus in Sitka. Associate degrees and certificates in business, health, and liberal arts. TA accepted.', applyUrl: 'https://www.uas.alaska.edu/admissions/', siteUrl: 'https://www.uas.alaska.edu' },
    { name: 'University of Maryland Global Campus', type: 'Public', degree: '4-Year University', rating: 3.9, desc: 'Leading fully online military university. Available from remote Alaska assignments. TA and GI Bill accepted.', applyUrl: '', siteUrl: 'https://www.umgc.edu' },
  ],
  'USCG Sector Jacksonville': [
    { name: 'University of North Florida', type: 'Public', degree: '4-Year University', rating: 4.0, desc: 'Public university in Jacksonville. Business, nursing, and computer science. Active veteran services and military tuition rates.', applyUrl: 'https://www.unf.edu/admissions/', siteUrl: 'https://www.unf.edu' },
    { name: 'Florida State College at Jacksonville', type: 'Public', degree: '2-Year College', rating: 3.9, desc: 'Large community college system in Jacksonville. Nursing, IT, and business. TA-eligible. Multiple campuses.', applyUrl: 'https://www.fscj.edu/admissions/', siteUrl: 'https://www.fscj.edu' },
    { name: 'Jacksonville University', type: 'Private', degree: '4-Year University', rating: 3.8, desc: 'Private university with aviation, nursing, and business programs. Military-friendly. Yellow Ribbon participant.', applyUrl: '', siteUrl: 'https://www.ju.edu' },
  ],
  'USCG Sector Charleston': [
    { name: 'College of Charleston', type: 'Public', degree: '4-Year University', rating: 4.2, desc: 'Historic public liberal arts university. Business, marine biology, and education. Veteran-friendly campus. GI Bill accepted.', applyUrl: 'https://admissions.cofc.edu/apply/', siteUrl: 'https://www.cofc.edu' },
    { name: 'Trident Technical College', type: 'Public', degree: '2-Year College', rating: 4.0, desc: 'Large technical college in Charleston. Nursing, IT, and culinary arts. TA-eligible. High military enrollment.', applyUrl: 'https://www.tridenttech.edu/admissions/', siteUrl: 'https://www.tridenttech.edu' },
    { name: 'The Citadel', type: 'Public', degree: '4-Year University', rating: 4.3, desc: 'Military college of South Carolina. Business, science, and engineering. Strong connection to armed services. Yellow Ribbon.', applyUrl: 'https://www.citadel.edu/root/admissions', siteUrl: 'https://www.citadel.edu' },
  ],
};

// DoD Voluntary Education partner schools that operate on-installation at
// OCONUS bases. Drawn from the public DoDEA / DANTES / installation MWR
// education-center program lists. Same shape as INSTALLATION_COLLEGES so
// the OCONUS college tab renders the curated CONUS-style card layout.
const OCONUS_PARTNER_SCHOOLS = {
  UMGC:     { name: 'University of Maryland Global Campus', type: 'Public',  degree: '4-Year University', rating: 4.0, desc: 'DoD-partnered worldwide university. On-base classrooms and online courses. Accepts TA and GI Bill. Designed for service members and dependents.', applyUrl: 'https://www.umgc.edu/admissions',                  siteUrl: 'https://www.umgc.edu' },
  CTC:      { name: 'Central Texas College',                 type: 'Public',  degree: '2-Year College',     rating: 4.1, desc: 'DoD voluntary-education partner. Worldwide on-installation associate degrees and certificates. TA accepted. Strong military student services.',           applyUrl: 'https://www.ctcd.edu/prospective-students/apply/', siteUrl: 'https://www.ctcd.edu' },
  ERAU:     { name: 'Embry-Riddle Aeronautical University',  type: 'Private', degree: '4-Year University', rating: 4.2, desc: 'Aeronautical and aerospace-focused worldwide campus. Aviation, engineering, security, and management programs. On-base resident centers and online.',     applyUrl: 'https://worldwide.erau.edu/admissions',          siteUrl: 'https://worldwide.erau.edu' },
  Park:     { name: 'Park University',                       type: 'Private', degree: '4-Year University', rating: 3.9, desc: 'Long-standing DoD partner. Associate, bachelor, and master degrees through resident centers on more than 40 military installations worldwide.',        applyUrl: 'https://www.park.edu/admissions/',                siteUrl: 'https://www.park.edu' },
  Coastline:{ name: 'Coastline Community College',           type: 'Public',  degree: '2-Year College',     rating: 3.8, desc: 'California community college serving military worldwide. Online associate degrees and certificates designed around deployments and PCS moves.',        applyUrl: 'https://www.coastline.edu/admissions/',          siteUrl: 'https://www.coastline.edu' },
  CCAF:     { name: 'Community College of the Air Force',    type: 'Public',  degree: '2-Year College',     rating: 4.3, desc: 'Federally chartered, regionally accredited associate-degree program for enlisted Airmen and Guardians. Credit awarded for technical training.',        applyUrl: 'https://www.airuniversity.af.edu/Barnes/CCAF/',    siteUrl: 'https://www.airuniversity.af.edu/Barnes/CCAF/' },
  TUI:      { name: 'Trident University International',      type: 'Private', degree: '4-Year University', rating: 3.7, desc: '100% online university with strong military enrollment. Bachelor, master, and doctoral degrees in business, IT, health sciences, and education.',      applyUrl: 'https://www.trident.edu/admissions/',             siteUrl: 'https://www.trident.edu' },
  CityChicago: { name: 'City Colleges of Chicago',           type: 'Public',  degree: '2-Year College',     rating: 3.8, desc: 'DoD partner serving Navy worldwide through online associate-degree programs. TA accepted. Strong general-education and IT pathways.',                applyUrl: '', siteUrl: 'https://www.ccc.edu' },
};

// Bundles below are reused across installation aliases to keep the data table
// compact while ensuring every OCONUS canonical name in INSTALLATION_MARKETS
// (and the most-common spellings users actually type) hits the same curated
// set of DoD voluntary-education partner schools.
const OCONUS_BUNDLE_KOREA_ARMY  = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CTC, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.Park, OCONUS_PARTNER_SCHOOLS.CCAF];
const OCONUS_BUNDLE_KOREA_AF    = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_JAPAN_AF    = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_OKINAWA     = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.Park, OCONUS_PARTNER_SCHOOLS.CTC];
const OCONUS_BUNDLE_USMC_OKI    = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.Park, OCONUS_PARTNER_SCHOOLS.CTC, OCONUS_PARTNER_SCHOOLS.Coastline];
const OCONUS_BUNDLE_NAVY_JAPAN  = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park, OCONUS_PARTNER_SCHOOLS.CCAF];
const OCONUS_BUNDLE_GERMANY     = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CTC, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_GERMANY_AF  = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.Park, OCONUS_PARTNER_SCHOOLS.CTC];
const OCONUS_BUNDLE_ITALY_ARMY  = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CTC, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_ITALY_NAVY  = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_ITALY_AF    = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_UK_AF       = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.ERAU, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_SPAIN_NAVY  = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_GREECE      = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago];
const OCONUS_BUNDLE_TURKEY      = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF];
const OCONUS_BUNDLE_MIDDLE_EAST = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_GUAM        = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.ERAU];
const OCONUS_BUNDLE_HAWAII      = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.ERAU];
const OCONUS_BUNDLE_ALASKA      = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.CTC, OCONUS_PARTNER_SCHOOLS.ERAU];
const OCONUS_BUNDLE_GREENLAND   = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF];
const OCONUS_BUNDLE_BELGIUM     = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CTC, OCONUS_PARTNER_SCHOOLS.Park];
const OCONUS_BUNDLE_POLAND      = [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CTC, OCONUS_PARTNER_SCHOOLS.Park];

const OCONUS_COLLEGES = {
  // ── ARMY · KOREA ─────────────────────────────────────────────────────────
  'USAG Humphreys':                     OCONUS_BUNDLE_KOREA_ARMY,
  'Camp Humphreys':                     OCONUS_BUNDLE_KOREA_ARMY,
  'USAG Daegu':                         OCONUS_BUNDLE_KOREA_ARMY,
  'USAG Yongsan-Casey':                 OCONUS_BUNDLE_KOREA_ARMY,
  'Camp Walker':                        OCONUS_BUNDLE_KOREA_ARMY,
  'Camp Henry':                         OCONUS_BUNDLE_KOREA_ARMY,
  'Camp Carroll':                       OCONUS_BUNDLE_KOREA_ARMY,
  'Pier 8 Busan':                       OCONUS_BUNDLE_KOREA_ARMY,
  'Camp Casey':                         OCONUS_BUNDLE_KOREA_ARMY,
  'Camp Hovey':                         OCONUS_BUNDLE_KOREA_ARMY,
  'Camp Red Cloud':                     OCONUS_BUNDLE_KOREA_ARMY,
  // ── ARMY · JAPAN ─────────────────────────────────────────────────────────
  'USAG Japan (Camp Zama)':             [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park],
  'Sagami Depot':                       [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park],
  'Yokohama North Dock':                [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago],
  'Torii Station (USAG Okinawa)':       OCONUS_BUNDLE_OKINAWA,
  // ── ARMY · GERMANY ───────────────────────────────────────────────────────
  'USAG Stuttgart':                     OCONUS_BUNDLE_GERMANY,
  'USAG Wiesbaden':                     OCONUS_BUNDLE_GERMANY,
  'USAG Bavaria (Grafenwöhr)':          OCONUS_BUNDLE_GERMANY,
  'Grafenwöhr Training Area':           OCONUS_BUNDLE_GERMANY,
  'Rose Barracks Vilseck':              OCONUS_BUNDLE_GERMANY,
  'Hohenfels Training Area':            OCONUS_BUNDLE_GERMANY,
  'Garmisch Resort':                    OCONUS_BUNDLE_GERMANY,
  'USAG Ansbach':                       OCONUS_BUNDLE_GERMANY,
  'USAG Rheinland-Pfalz (Kaiserslautern)': OCONUS_BUNDLE_GERMANY,
  'Kaiserslautern Military Community':  OCONUS_BUNDLE_GERMANY,
  'Landstuhl Regional Medical Center':  OCONUS_BUNDLE_GERMANY,
  'Sembach Kaserne':                    OCONUS_BUNDLE_GERMANY,
  'Pulaski Barracks':                   OCONUS_BUNDLE_GERMANY,
  'Panzer Kaserne':                     OCONUS_BUNDLE_GERMANY,
  'Vogelweh Military Complex':          OCONUS_BUNDLE_GERMANY,
  'USAG Baumholder':                    OCONUS_BUNDLE_GERMANY,
  'USAG Hohenfels':                     OCONUS_BUNDLE_GERMANY,
  'USAG Garmisch':                      OCONUS_BUNDLE_GERMANY,
  // ── ARMY · BELGIUM / NL / POLAND / KOSOVO ────────────────────────────────
  'USAG Belgium (SHAPE)':               OCONUS_BUNDLE_BELGIUM,
  'Chievres Air Base':                  OCONUS_BUNDLE_BELGIUM,
  'Daumerie Caserne':                   OCONUS_BUNDLE_BELGIUM,
  'USAG BENELUX-Brussels':              OCONUS_BUNDLE_BELGIUM,
  'USAG BENELUX Brunssum':              OCONUS_BUNDLE_BELGIUM,
  'USAG Poland':                        OCONUS_BUNDLE_POLAND,
  'Camp Kosciuszko Poznan':             OCONUS_BUNDLE_POLAND,
  'Powidz Air Base':                    OCONUS_BUNDLE_POLAND,
  'Camp Bondsteel':                     [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CTC],
  // ── ARMY · ITALY ─────────────────────────────────────────────────────────
  'USAG Italy (Vicenza)':               OCONUS_BUNDLE_ITALY_ARMY,
  'Caserma Ederle':                     OCONUS_BUNDLE_ITALY_ARMY,
  'Caserma Del Din':                    OCONUS_BUNDLE_ITALY_ARMY,
  'USAG Italy (Livorno)':               OCONUS_BUNDLE_ITALY_ARMY,
  'Camp Darby':                         OCONUS_BUNDLE_ITALY_ARMY,
  // ── NAVY · OCONUS ────────────────────────────────────────────────────────
  'Naval Support Activity Bahrain':     OCONUS_BUNDLE_MIDDLE_EAST,
  'NSA Bahrain':                        OCONUS_BUNDLE_MIDDLE_EAST,
  'Navy Support Facility Diego Garcia': [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago],
  'Naval Station Guantanamo Bay':       [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park],
  'Naval Support Activity Souda Bay':   OCONUS_BUNDLE_GREECE,
  'Naval Base Guam':                    OCONUS_BUNDLE_GUAM,
  'Commander Fleet Activities Yokosuka': OCONUS_BUNDLE_NAVY_JAPAN,
  'Commander Fleet Activities Sasebo':  OCONUS_BUNDLE_NAVY_JAPAN,
  'Naval Air Facility Atsugi':          OCONUS_BUNDLE_NAVY_JAPAN,
  'Naval Air Station Sigonella':        OCONUS_BUNDLE_ITALY_NAVY,
  'Naval Support Activity Naples':      OCONUS_BUNDLE_ITALY_NAVY,
  'Naval Support Activity Singapore':   [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park],
  'Naval Station Rota':                 OCONUS_BUNDLE_SPAIN_NAVY,
  'Naval Support Activity Stavanger':   [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago],
  'Commander Fleet Activities Chinhae': [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CityChicago, OCONUS_PARTNER_SCHOOLS.Park],
  'Joint Base Pearl Harbor-Hickam':     OCONUS_BUNDLE_HAWAII,
  // ── MARINE CORPS · OCONUS ────────────────────────────────────────────────
  'Camp Butler (Okinawa)':              OCONUS_BUNDLE_USMC_OKI,
  'Camp Foster':                        OCONUS_BUNDLE_USMC_OKI,
  'Camp Kinser':                        OCONUS_BUNDLE_USMC_OKI,
  'Camp Courtney':                      OCONUS_BUNDLE_USMC_OKI,
  'Camp Hansen':                        OCONUS_BUNDLE_USMC_OKI,
  'Camp Schwab':                        OCONUS_BUNDLE_USMC_OKI,
  'MCAS Futenma':                       OCONUS_BUNDLE_USMC_OKI,
  'MCAS Iwakuni':                       [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.Coastline, OCONUS_PARTNER_SCHOOLS.Park, OCONUS_PARTNER_SCHOOLS.CityChicago],
  // ── AIR FORCE · OCONUS ───────────────────────────────────────────────────
  'Ramstein AB':                        OCONUS_BUNDLE_GERMANY_AF,
  'Spangdahlem AB':                     OCONUS_BUNDLE_GERMANY_AF,
  'Aviano AB':                          OCONUS_BUNDLE_ITALY_AF,
  'Incirlik AB':                        OCONUS_BUNDLE_TURKEY,
  'Kadena AB':                          OCONUS_BUNDLE_OKINAWA,
  'Misawa AB':                          OCONUS_BUNDLE_JAPAN_AF,
  'Yokota AB':                          OCONUS_BUNDLE_JAPAN_AF,
  'Osan AB':                            OCONUS_BUNDLE_KOREA_AF,
  'Kunsan AB':                          OCONUS_BUNDLE_KOREA_AF,
  'RAF Lakenheath':                     OCONUS_BUNDLE_UK_AF,
  'RAF Mildenhall':                     OCONUS_BUNDLE_UK_AF,
  'RAF Alconbury':                      OCONUS_BUNDLE_UK_AF,
  'RAF Croughton':                      OCONUS_BUNDLE_UK_AF,
  'Andersen AFB (Guam)':                OCONUS_BUNDLE_GUAM,
  'Morón AB':                           [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.ERAU],
  'Geilenkirchen NATO Air Base':        OCONUS_BUNDLE_GERMANY_AF,
  'Lajes Field':                        [OCONUS_PARTNER_SCHOOLS.UMGC, OCONUS_PARTNER_SCHOOLS.CCAF, OCONUS_PARTNER_SCHOOLS.ERAU],
  // ── SPACE FORCE · OCONUS ─────────────────────────────────────────────────
  'Thule Air Base / Pituffik Space Base': OCONUS_BUNDLE_GREENLAND,
  // ── ALASKA (treated as OCONUS for college fallback) ──────────────────────
  'Fort Wainwright':                    OCONUS_BUNDLE_ALASKA,
  'Fort Greely':                        OCONUS_BUNDLE_ALASKA,
  'Eielson AFB':                        OCONUS_BUNDLE_ALASKA,
  'Clear Space Force Station':          OCONUS_BUNDLE_ALASKA,
};


const COLLEGE_ENROLLMENT_LINKS = {
  'Abilene Christian University': { applyUrl: 'https://www.acu.edu/admissions/', siteUrl: 'https://www.acu.edu' },
  'Abraham Baldwin Agricultural College': { applyUrl: 'https://www.abac.edu/admissions/', siteUrl: 'https://www.abac.edu' },
  'Air Force Institute of Technology': { applyUrl: 'https://www.afit.edu/registrar/admission/', siteUrl: 'https://www.afit.edu' },
  'Alaska Bible College': { applyUrl: 'https://www.akbible.edu/admissions/', siteUrl: 'https://www.akbible.edu' },
  'Alaska Pacific University': { applyUrl: 'https://alaskapacific.edu/admissions/', siteUrl: 'https://alaskapacific.edu' },
  'American Military University': { applyUrl: '', siteUrl: 'https://www.amu.apus.edu' },
  'American University': { applyUrl: 'https://www.american.edu/admissions/apply/', siteUrl: 'https://www.american.edu' },
  'Anne Arundel Community College': { applyUrl: 'https://www.aacc.edu/admissions/apply/', siteUrl: 'https://www.aacc.edu' },
  'Antelope Valley College': { applyUrl: 'https://www.avc.edu/admissions/', siteUrl: 'https://www.avc.edu' },
  'Arizona State University': { applyUrl: 'https://admission.asu.edu/', siteUrl: 'https://www.asu.edu' },
  'Arizona State University Online': { applyUrl: '', siteUrl: 'https://asuonline.asu.edu' },
  'Arizona Western College': { applyUrl: 'https://www.azwestern.edu/admissions/', siteUrl: 'https://www.azwestern.edu' },
  'Auburn University at Montgomery': { applyUrl: 'https://www.aum.edu/admissions/', siteUrl: 'https://www.aum.edu' },
  'Augusta Technical College': { applyUrl: 'https://www.augustatech.edu/admissions/', siteUrl: 'https://www.augustatech.edu' },
  'Augusta University': { applyUrl: 'https://www.augusta.edu/admissions/', siteUrl: 'https://www.augusta.edu' },
  'Austin Peay State University': { applyUrl: 'https://www.apsu.edu/admissions/apply/', siteUrl: 'https://www.apsu.edu' },
  'Bellevue University': { applyUrl: 'https://www.bellevue.edu/admissions/', siteUrl: 'https://www.bellevue.edu' },
  'Benedict College': { applyUrl: '', siteUrl: '' },
  'Bossier Parish Community College': { applyUrl: 'https://www.bpcc.edu/admissions/', siteUrl: 'https://www.bpcc.edu' },
  'Bowie State University': { applyUrl: '', siteUrl: 'https://www.bowiestate.edu' },
  'Brigham Young University': { applyUrl: 'https://admissions.byu.edu/', siteUrl: 'https://www.byu.edu' },
  'Brooklyn College CUNY': { applyUrl: 'https://www.brooklyn.cuny.edu/web/admissions.php', siteUrl: 'https://www.brooklyn.cuny.edu' },
  'Bunker Hill Community College': { applyUrl: 'https://www.bhcc.edu/admissions/', siteUrl: 'https://www.bhcc.edu' },
  'CSU Channel Islands': { applyUrl: 'https://www.csuci.edu/admissions/', siteUrl: 'https://www.csuci.edu' },
  'Cal Lutheran University': { applyUrl: 'https://www.callutheran.edu/admissions/', siteUrl: 'https://www.callutheran.edu' },
  'Cal State San Bernardino': { applyUrl: 'https://www.csusb.edu/admissions/', siteUrl: 'https://www.csusb.edu' },
  'California State University Dominguez Hills': { applyUrl: 'https://www.csudh.edu/admissions/', siteUrl: 'https://www.csudh.edu' },
  'California State University Sacramento': { applyUrl: '', siteUrl: 'https://www.csus.edu' },
  'California State University San Marcos': { applyUrl: '', siteUrl: 'https://www.csusm.edu' },
  'Campbell University': { applyUrl: 'https://www.campbell.edu/admissions/apply/', siteUrl: 'https://www.campbell.edu' },
  'Campbellsville University': { applyUrl: 'https://www.campbellsville.edu/admissions/', siteUrl: 'https://www.campbellsville.edu' },
  'Capitol Technology University': { applyUrl: '', siteUrl: 'https://www.captechu.edu' },
  'Carteret Community College': { applyUrl: 'https://www.carteret.edu/admissions/', siteUrl: 'https://www.carteret.edu' },
  'Central Carolina Technical College': { applyUrl: 'https://www.cctech.edu/admissions/', siteUrl: 'https://www.cctech.edu' },
  'Central Michigan University': { applyUrl: 'https://www.cmich.edu/admissions/', siteUrl: 'https://www.cmich.edu' },
  'Central Texas College': { applyUrl: 'https://www.ctcd.edu/admissions/how-to-apply/', siteUrl: 'https://www.ctcd.edu' },
  'Chaminade University': { applyUrl: 'https://www.chaminade.edu/admissions/', siteUrl: 'https://www.chaminade.edu' },
  'Christopher Newport University': { applyUrl: '', siteUrl: 'https://www.cnu.edu' },
  'Cisco College': { applyUrl: 'https://www.cisco.edu/admissions/', siteUrl: 'https://www.cisco.edu' },
  'Clarkson University': { applyUrl: '', siteUrl: 'https://www.clarkson.edu' },
  'Coastal Carolina Community College': { applyUrl: '', siteUrl: 'https://www.coastalcarolina.edu' },
  'Coastal Carolina University': { applyUrl: 'https://www.coastal.edu/admissions/', siteUrl: 'https://www.coastal.edu' },
  'Coastal Pines Technical College': { applyUrl: 'https://www.coastalpines.edu/admissions/', siteUrl: 'https://www.coastalpines.edu' },
  'Cochise College': { applyUrl: 'https://www.cochise.edu/admissions/', siteUrl: 'https://www.cochise.edu' },
  'College of Alameda': { applyUrl: '', siteUrl: '' },
  'College of Charleston': { applyUrl: 'https://admissions.cofc.edu/', siteUrl: 'https://www.cofc.edu' },
  'College of Coastal Georgia': { applyUrl: 'https://www.ccga.edu/admissions/', siteUrl: 'https://www.ccga.edu' },
  'College of Southern Nevada': { applyUrl: 'https://www.csn.edu/admissions/', siteUrl: 'https://www.csn.edu' },
  'College of Staten Island (CUNY)': { applyUrl: 'https://www.csi.cuny.edu/admissions', siteUrl: 'https://www.csi.cuny.edu' },
  'College of the Albemarle': { applyUrl: '', siteUrl: 'https://www.albemarle.edu' },
  'College of the Mainland': { applyUrl: 'https://www.com.edu/admissions/', siteUrl: 'https://www.com.edu' },
  'Colorado College': { applyUrl: 'https://www.coloradocollege.edu/admission/', siteUrl: 'https://www.coloradocollege.edu' },
  'Columbia College': { applyUrl: 'https://www.columbiasc.edu/admissions/', siteUrl: 'https://www.columbiasc.edu' },
  'Columbia International University': { applyUrl: 'https://www.ciu.edu/admissions/', siteUrl: 'https://www.ciu.edu' },
  'Columbus State University': { applyUrl: '', siteUrl: '' },
  'Columbus Technical College': { applyUrl: 'https://www.columbustech.edu/admissions/', siteUrl: 'https://www.columbustech.edu' },
  'Community College of Baltimore County': { applyUrl: 'https://www.ccbcmd.edu/Getting-Started/Apply-for-Admission.html', siteUrl: 'https://www.ccbcmd.edu' },
  'Community College of Denver': { applyUrl: 'https://www.ccd.edu/admissions/', siteUrl: 'https://www.ccd.edu' },
  'Craven Community College': { applyUrl: 'https://www.cravencc.edu/admissions/', siteUrl: 'https://www.cravencc.edu' },
  'Creighton University': { applyUrl: 'https://admissions.creighton.edu/', siteUrl: 'https://www.creighton.edu' },
  'Dakota College at Bottineau': { applyUrl: '', siteUrl: 'https://www.dakotacollege.edu' },
  'Del Mar College': { applyUrl: '', siteUrl: 'https://www.delmar.edu' },
  'Delgado Community College': { applyUrl: 'https://www.dcc.edu/admissions/', siteUrl: 'https://www.dcc.edu' },
  'Drury University': { applyUrl: 'https://www.drury.edu/admissions/', siteUrl: 'https://www.drury.edu' },
  'East Carolina University': { applyUrl: 'https://admissions.ecu.edu/', siteUrl: 'https://www.ecu.edu' },
  'Eastern Florida State College': { applyUrl: 'https://www.easternflorida.edu/admissions/', siteUrl: 'https://www.easternflorida.edu' },
  'Eastern Washington University': { applyUrl: 'https://www.ewu.edu/admissions/', siteUrl: 'https://www.ewu.edu' },
  'Eckerd College': { applyUrl: 'https://www.eckerd.edu/admissions/', siteUrl: 'https://www.eckerd.edu' },
  'El Camino College': { applyUrl: 'https://www.elcamino.edu/admissions/', siteUrl: 'https://www.elcamino.edu' },
  'El Paso Community College': { applyUrl: 'https://www.epcc.edu/Admissions/', siteUrl: 'https://www.epcc.edu' },
  'Elizabeth City State University': { applyUrl: '', siteUrl: 'https://www.ecsu.edu' },
  'Elizabethtown Community & Technical College': { applyUrl: 'https://elizabethtown.kctcs.edu/admissions/', siteUrl: 'https://elizabethtown.kctcs.edu' },
  'Embry-Riddle Aeronautical University': { applyUrl: 'https://daytonabeach.erau.edu/admissions/', siteUrl: 'https://daytonabeach.erau.edu' },
  'Embry-Riddle Aeronautical University Worldwide': { applyUrl: 'https://worldwide.erau.edu/admissions/apply/', siteUrl: 'https://worldwide.erau.edu' },
  'Embry-Riddle European Campus': { applyUrl: 'https://europe.erau.edu/admissions/', siteUrl: 'https://europe.erau.edu' },
  'Enterprise State Community College': { applyUrl: 'https://www.escc.edu/admissions/', siteUrl: 'https://www.escc.edu' },
  'Everett Community College': { applyUrl: 'https://www.everettcc.edu/admissions/', siteUrl: 'https://www.everettcc.edu' },
  'FSU Panama City': { applyUrl: 'https://pc.fsu.edu/admissions/', siteUrl: 'https://pc.fsu.edu' },
  'Fayetteville State University': { applyUrl: 'https://www.uncfsu.edu/', siteUrl: 'https://www.uncfsu.edu' },
  'Fayetteville Technical Community College': { applyUrl: '', siteUrl: 'https://www.faytechcc.edu' },
  'Florida Institute of Technology': { applyUrl: '', siteUrl: 'https://www.fit.edu' },
  'Florida International University': { applyUrl: 'https://admissions.fiu.edu/', siteUrl: 'https://www.fiu.edu' },
  'Florida State College at Jacksonville': { applyUrl: 'https://www.fscj.edu/admissions/', siteUrl: 'https://www.fscj.edu' },
  'George Mason University': { applyUrl: 'https://admissions.gmu.edu/', siteUrl: 'https://www.gmu.edu' },
  'Georgetown University': { applyUrl: 'https://uadmissions.georgetown.edu/', siteUrl: 'https://www.georgetown.edu' },
  'Georgia Southern University': { applyUrl: 'https://admissions.georgiasouthern.edu/', siteUrl: 'https://www.georgiasouthern.edu' },
  'Glendale Community College': { applyUrl: 'https://www.glendale.edu/admissions/', siteUrl: 'https://www.glendale.edu' },
  'Gonzaga University': { applyUrl: 'https://www.gonzaga.edu/admissions/', siteUrl: 'https://www.gonzaga.edu' },
  'Grand Canyon University': { applyUrl: 'https://www.gcu.edu/admissions/', siteUrl: 'https://www.gcu.edu' },
  'Guam Community College': { applyUrl: 'https://www.guamcc.edu/admissions/', siteUrl: 'https://www.guamcc.edu' },
  'Gulf Coast State College': { applyUrl: 'https://www.gulfcoast.edu/admissions/', siteUrl: 'https://www.gulfcoast.edu' },
  'Hampton University': { applyUrl: 'https://www.hamptonu.edu/admissions/', siteUrl: 'https://www.hamptonu.edu' },
  'Hardin-Simmons University': { applyUrl: 'https://www.hsutx.edu/admissions/', siteUrl: 'https://www.hsutx.edu' },
  'Hawaii Pacific University': { applyUrl: 'https://www.hpu.edu/admissions/apply/', siteUrl: 'https://www.hpu.edu' },
  'Hendrix College': { applyUrl: '', siteUrl: 'https://www.hendrix.edu' },
  'Hillsborough Community College': { applyUrl: 'https://www.hccfl.edu/admissions/', siteUrl: 'https://www.hccfl.edu' },
  'Honolulu Community College': { applyUrl: '', siteUrl: '' },
  'Jacksonville University': { applyUrl: 'https://www.ju.edu/admissions/', siteUrl: 'https://www.ju.edu' },
  'Jefferson Community College': { applyUrl: 'https://www.sunyjefferson.edu/admissions/apply/', siteUrl: 'https://www.sunyjefferson.edu' },
  'John Tyler Community College': { applyUrl: '', siteUrl: '' },
  'Johnson County Community College': { applyUrl: 'https://www.jccc.edu/admissions/', siteUrl: 'https://www.jccc.edu' },
  'Kansas City Kansas Community College': { applyUrl: 'https://www.kckcc.edu/admissions/', siteUrl: 'https://www.kckcc.edu' },
  'Kingsborough Community College': { applyUrl: 'https://www.kbcc.cuny.edu/admissions/', siteUrl: 'https://www.kbcc.cuny.edu' },
  'Kodiak College (UAF)': { applyUrl: '', siteUrl: 'https://www.uaf.edu' },
  'LSU Shreveport': { applyUrl: '', siteUrl: 'https://www.lsus.edu' },
  'Leeward Community College': { applyUrl: 'https://www.leeward.hawaii.edu/admissions', siteUrl: 'https://www.leeward.hawaii.edu' },
  'Lindenwood University': { applyUrl: 'https://www.lindenwood.edu/admissions/', siteUrl: 'https://www.lindenwood.edu' },
  'Louisiana Tech University': { applyUrl: 'https://admissions.latech.edu/', siteUrl: 'https://www.latech.edu' },
  'Marist College': { applyUrl: '', siteUrl: 'https://www.marist.edu' },
  'Massachusetts Maritime Academy': { applyUrl: 'https://www.maritime.edu/admissions', siteUrl: 'https://www.maritime.edu' },
  'McKendree University': { applyUrl: '', siteUrl: 'https://www.mckendree.edu' },
  'McMurry University': { applyUrl: 'https://www.mcm.edu/admissions/', siteUrl: 'https://www.mcm.edu' },
  'Methodist University': { applyUrl: '', siteUrl: 'https://www.methodist.edu' },
  'Metropolitan Community College': { applyUrl: '', siteUrl: 'https://www.mccneb.edu' },
  'Metropolitan State University of Denver': { applyUrl: 'https://www.msudenver.edu/admissions/', siteUrl: 'https://www.msudenver.edu' },
  'Miami Dade College': { applyUrl: 'https://www.mdc.edu/admissions/', siteUrl: 'https://www.mdc.edu' },
  'Middle Tennessee State University': { applyUrl: '', siteUrl: 'https://www.mtsu.edu' },
  'Midlands Technical College': { applyUrl: 'https://www.midlandstech.edu/admissions/', siteUrl: 'https://www.midlandstech.edu' },
  'Minot State University': { applyUrl: '', siteUrl: 'https://www.minotstateu.edu' },
  'MiraCosta College': { applyUrl: 'https://www.miracosta.edu/admissions/', siteUrl: 'https://www.miracosta.edu' },
  'Mississippi Gulf Coast Community College': { applyUrl: '', siteUrl: 'https://www.mgccc.edu' },
  'Missouri S&T': { applyUrl: 'https://admissions.mst.edu/', siteUrl: 'https://www.mst.edu' },
  'Missouri University of Science & Technology': { applyUrl: 'https://admissions.mst.edu/', siteUrl: 'https://www.mst.edu' },
  'Montana State University Bozeman': { applyUrl: 'https://www.montana.edu/admissions/', siteUrl: 'https://www.montana.edu' },
  'Montana State University Great Falls': { applyUrl: '', siteUrl: 'https://www.msubillings.edu' },
  'Mount Marty University': { applyUrl: '', siteUrl: 'https://www.mountmarty.edu' },
  'Mount Olive University': { applyUrl: 'https://umo.edu/admissions/apply/', siteUrl: 'https://umo.edu' },
  'Nashville State Community College': { applyUrl: 'https://www.nscc.edu/admissions', siteUrl: 'https://www.nscc.edu' },
  'National University': { applyUrl: 'https://www.nu.edu/admissions/', siteUrl: 'https://www.nu.edu' },
  'Nevada State University': { applyUrl: '', siteUrl: '' },
  'New Mexico State University': { applyUrl: 'https://admissions.nmsu.edu/', siteUrl: 'https://www.nmsu.edu' },
  'New York University': { applyUrl: 'https://www.nyu.edu/admissions/undergraduate-admissions.html', siteUrl: 'https://www.nyu.edu' },
  'Norfolk State University': { applyUrl: '', siteUrl: 'https://www.nsu.edu' },
  'Northeastern University': { applyUrl: 'https://admissions.northeastern.edu/', siteUrl: 'https://www.northeastern.edu' },
  'Northern Arizona University': { applyUrl: 'https://nau.edu/admissions/', siteUrl: 'https://nau.edu' },
  'Northern Virginia Community College': { applyUrl: 'https://www.nvcc.edu/admissions/', siteUrl: 'https://www.nvcc.edu' },
  'Northwest Florida State College': { applyUrl: 'https://www.nwfsc.edu/admissions/', siteUrl: 'https://www.nwfsc.edu' },
  'Northwestern Michigan College': { applyUrl: 'https://www.nmc.edu/admissions/', siteUrl: 'https://www.nmc.edu' },
  'Oklahoma State University': { applyUrl: 'https://admissions.okstate.edu/', siteUrl: 'https://www.okstate.edu' },
  'Old Dominion University': { applyUrl: 'https://www.odu.edu/apply', siteUrl: 'https://www.odu.edu' },
  'Olympic College': { applyUrl: '', siteUrl: 'https://www.olympic.edu' },
  'Orange County Community College': { applyUrl: 'https://www.sunyorange.edu/admissions/', siteUrl: 'https://www.sunyorange.edu' },
  'Pacific Lutheran University': { applyUrl: 'https://www.plu.edu/admission/apply/', siteUrl: 'https://www.plu.edu' },
  'Paine College': { applyUrl: 'https://www.paine.edu/admissions/', siteUrl: 'https://www.paine.edu' },
  'Palomar College': { applyUrl: 'https://www.palomar.edu/admissions/', siteUrl: 'https://www.palomar.edu' },
  'Park University': { applyUrl: 'https://www.park.edu/admissions/', siteUrl: 'https://www.park.edu' },
  'Pensacola State College': { applyUrl: 'https://www.pensacolastate.edu/admissions/', siteUrl: 'https://www.pensacolastate.edu' },
  'Pierce College': { applyUrl: '', siteUrl: 'https://www.pierce.ctc.edu' },
  'Pikes Peak State College': { applyUrl: '', siteUrl: '' },
  'Pima Community College': { applyUrl: '', siteUrl: 'https://www.pima.edu' },
  'Point Loma Nazarene University': { applyUrl: 'https://www.pointloma.edu/admissions/', siteUrl: 'https://www.pointloma.edu' },
  'Prince George\'s Community College': { applyUrl: 'https://www.pgcc.edu/admissions/', siteUrl: 'https://www.pgcc.edu' },
  'Pulaski Technical College': { applyUrl: '', siteUrl: '' },
  'Regent University': { applyUrl: 'https://www.regent.edu/admissions/apply/', siteUrl: 'https://www.regent.edu' },
  'Richard Bland College': { applyUrl: 'https://www.rbc.edu/admissions/', siteUrl: 'https://www.rbc.edu' },
  'Rose State College': { applyUrl: 'https://www.rose.edu/admissions/', siteUrl: 'https://www.rose.edu' },
  'Rowan University': { applyUrl: 'https://admissions.rowan.edu/', siteUrl: 'https://www.rowan.edu' },
  'SUNY New Paltz': { applyUrl: 'https://www.newpaltz.edu/admissions/', siteUrl: 'https://www.newpaltz.edu' },
  'SUNY Polytechnic Institute': { applyUrl: 'https://sunypoly.edu/admissions/', siteUrl: 'https://sunypoly.edu' },
  'San Antonio College': { applyUrl: '', siteUrl: 'https://www.alamo.edu/sac/' },
  'San Diego City College': { applyUrl: '', siteUrl: 'https://www.sdcity.edu' },
  'San Diego Miramar College': { applyUrl: '', siteUrl: 'https://www.sdmiramar.edu' },
  'San Diego State University': { applyUrl: 'https://admissions.sdsu.edu/', siteUrl: 'https://www.sdsu.edu' },
  'Santa Rosa Junior College': { applyUrl: 'https://admissions.santarosa.edu/', siteUrl: 'https://www.santarosa.edu' },
  'Savannah State University': { applyUrl: 'https://www.savannahstate.edu/admissions/', siteUrl: 'https://www.savannahstate.edu' },
  'Seattle Central College': { applyUrl: '', siteUrl: 'https://seattlecentral.edu' },
  'Seattle University': { applyUrl: 'https://www.seattleu.edu/admissions/', siteUrl: 'https://www.seattleu.edu' },
  'Sinclair Community College': { applyUrl: 'https://www.sinclair.edu/admissions/', siteUrl: 'https://www.sinclair.edu' },
  'Skagit Valley College': { applyUrl: 'https://www.skagit.edu/admissions/', siteUrl: 'https://www.skagit.edu' },
  'Solano Community College': { applyUrl: 'https://www.solano.edu/admissions/', siteUrl: 'https://www.solano.edu' },
  'Sonoma State University': { applyUrl: '', siteUrl: 'https://www.sonoma.edu' },
  'South Dakota School of Mines': { applyUrl: 'https://www.sdsmt.edu/admissions/', siteUrl: 'https://www.sdsmt.edu' },
  'South Georgia Technical College': { applyUrl: 'https://www.southgatech.edu/admissions/', siteUrl: 'https://www.southgatech.edu' },
  'Southern Illinois University Edwardsville': { applyUrl: 'https://www.siue.edu/admissions/', siteUrl: 'https://www.siue.edu' },
  'Southern Nazarene University': { applyUrl: 'https://www.snu.edu/admissions/', siteUrl: 'https://www.snu.edu' },
  'Southwestern Illinois College': { applyUrl: 'https://www.swic.edu/admissions/', siteUrl: 'https://www.swic.edu' },
  'Spokane Falls Community College': { applyUrl: '', siteUrl: '' },
  'St. Philip\'s College': { applyUrl: 'https://www.alamo.edu/spc/admissions/', siteUrl: 'https://www.alamo.edu/spc/' },
  'State Fair Community College': { applyUrl: 'https://www.sfccmo.edu/admissions/', siteUrl: 'https://www.sfccmo.edu' },
  'Stockton University': { applyUrl: 'https://www.stockton.edu/admissions/', siteUrl: 'https://www.stockton.edu' },
  'Tacoma Community College': { applyUrl: '', siteUrl: 'https://www.tacomacc.edu' },
  'Technical College of the Lowcountry': { applyUrl: 'https://www.tcl.edu/admissions/', siteUrl: 'https://www.tcl.edu' },
  'Temple College': { applyUrl: 'https://www.templejc.edu/admissions', siteUrl: 'https://www.templejc.edu' },
  'Texas A&M University Corpus Christi': { applyUrl: 'https://www.tamucc.edu/admissions/', siteUrl: 'https://www.tamucc.edu' },
  'Texas A&M University – Central Texas': { applyUrl: 'https://www.tamuct.edu/admissions/apply-now.html', siteUrl: 'https://www.tamuct.edu' },
  'The Citadel': { applyUrl: '', siteUrl: 'https://www.citadel.edu' },
  'Thomas Nelson Community College': { applyUrl: '', siteUrl: '' },
  'Tidewater Community College': { applyUrl: 'https://www.tcc.edu/admissions/apply/', siteUrl: 'https://www.tcc.edu' },
  'Touro University': { applyUrl: 'https://www.touro.edu/admissions/', siteUrl: 'https://www.touro.edu' },
  'Touro University California': { applyUrl: '', siteUrl: 'https://www.tu.edu' },
  'Touro University Nevada': { applyUrl: 'https://www.tun.touro.edu/admissions/', siteUrl: 'https://www.tun.touro.edu' },
  'Towson University': { applyUrl: 'https://www.towson.edu/admissions/', siteUrl: 'https://www.towson.edu' },
  'Trident Technical College': { applyUrl: 'https://www.tridenttech.edu/admissions/', siteUrl: 'https://www.tridenttech.edu' },
  'Trinity University': { applyUrl: '', siteUrl: 'https://www.trinity.edu' },
  'Troy University': { applyUrl: 'https://www.troy.edu/admissions/apply/', siteUrl: 'https://www.troy.edu' },
  'Tulane University': { applyUrl: 'https://admission.tulane.edu/', siteUrl: 'https://www.tulane.edu' },
  'UAF Community & Technical College': { applyUrl: '', siteUrl: 'https://ctc.uaf.edu' },
  'UC Berkeley': { applyUrl: 'https://admissions.berkeley.edu/', siteUrl: 'https://www.berkeley.edu' },
  'UC Davis': { applyUrl: 'https://admissions.ucdavis.edu/', siteUrl: 'https://www.ucdavis.edu' },
  'UC San Diego': { applyUrl: 'https://admissions.ucsd.edu/', siteUrl: 'https://www.ucsd.edu' },
  'UC Santa Barbara': { applyUrl: 'https://admissions.ucsb.edu/', siteUrl: 'https://www.ucsb.edu' },
  'UCLA': { applyUrl: 'https://admission.ucla.edu/', siteUrl: 'https://www.ucla.edu' },
  'UMGC Worldwide Online': { applyUrl: '', siteUrl: 'https://www.umgc.edu' },
  'UNC Pembroke': { applyUrl: '', siteUrl: 'https://www.uncp.edu' },
  'UNC Wilmington': { applyUrl: '', siteUrl: 'https://www.uncw.edu' },
  'UW Bothell': { applyUrl: 'https://www.uwb.edu/admissions/', siteUrl: 'https://www.uwb.edu' },
  'University of Alaska Anchorage': { applyUrl: 'https://www.uaa.alaska.edu/admissions/', siteUrl: 'https://www.uaa.alaska.edu' },
  'University of Alaska Fairbanks': { applyUrl: 'https://www.uaf.edu/admissions/', siteUrl: 'https://www.uaf.edu' },
  'University of Alaska Southeast (Sitka)': { applyUrl: 'https://www.uas.alaska.edu/admissions/', siteUrl: 'https://www.uas.alaska.edu' },
  'University of Arizona': { applyUrl: 'https://admissions.arizona.edu/', siteUrl: 'https://www.arizona.edu' },
  'University of Arkansas at Little Rock': { applyUrl: 'https://ualr.edu/admissions/', siteUrl: 'https://ualr.edu' },
  'University of Central Florida': { applyUrl: 'https://www.ucf.edu/admissions/', siteUrl: 'https://www.ucf.edu' },
  'University of Central Missouri': { applyUrl: 'https://www.ucmo.edu/admissions/', siteUrl: 'https://www.ucmo.edu' },
  'University of Central Oklahoma': { applyUrl: 'https://www.uco.edu/admissions/', siteUrl: 'https://www.uco.edu' },
  'University of Colorado Colorado Springs': { applyUrl: '', siteUrl: 'https://www.uccs.edu' },
  'University of Colorado Denver': { applyUrl: 'https://www.ucdenver.edu/admissions/', siteUrl: 'https://www.ucdenver.edu' },
  'University of Dayton': { applyUrl: 'https://udayton.edu/admission/', siteUrl: 'https://udayton.edu' },
  'University of Guam': { applyUrl: 'https://www.uog.edu/admissions/', siteUrl: 'https://www.uog.edu' },
  'University of Hawaii at Manoa': { applyUrl: 'https://manoa.hawaii.edu/admissions/', siteUrl: 'https://manoa.hawaii.edu' },
  'University of Houston': { applyUrl: '', siteUrl: 'https://www.uh.edu' },
  'University of Kansas': { applyUrl: 'https://admissions.ku.edu/', siteUrl: 'https://www.ku.edu' },
  'University of Louisville': { applyUrl: 'https://admissions.louisville.edu/apply/', siteUrl: 'https://www.louisville.edu' },
  'University of Mary': { applyUrl: 'https://www.umary.edu/admissions/', siteUrl: 'https://www.umary.edu' },
  'University of Mary Hardin-Baylor': { applyUrl: '', siteUrl: 'https://www.umhb.edu' },
  'University of Mary Washington': { applyUrl: 'https://admissions.umw.edu/apply/', siteUrl: 'https://www.umw.edu' },
  'University of Maryland': { applyUrl: 'https://admissions.umd.edu/apply', siteUrl: 'https://www.umd.edu' },
  'University of Maryland Baltimore County': { applyUrl: '', siteUrl: 'https://www.umbc.edu' },
  'University of Maryland Global Campus': { applyUrl: '', siteUrl: 'https://www.umgc.edu' },
  'University of Miami': { applyUrl: 'https://welcome.miami.edu/apply/', siteUrl: 'https://www.miami.edu' },
  'University of Mount Olive': { applyUrl: 'https://umo.edu/admissions/apply/', siteUrl: 'https://umo.edu' },
  'University of Nebraska Omaha': { applyUrl: 'https://www.unomaha.edu/admissions/', siteUrl: 'https://www.unomaha.edu' },
  'University of Nevada Las Vegas': { applyUrl: 'https://www.unlv.edu/admissions/', siteUrl: 'https://www.unlv.edu' },
  'University of New Orleans': { applyUrl: 'https://www.uno.edu/admissions', siteUrl: 'https://www.uno.edu' },
  'University of North Dakota': { applyUrl: 'https://und.edu/admissions/', siteUrl: 'https://und.edu' },
  'University of North Florida': { applyUrl: 'https://www.unf.edu/admissions/', siteUrl: 'https://www.unf.edu' },
  'University of Providence': { applyUrl: 'https://www.uprovidence.edu/admissions/', siteUrl: 'https://www.uprovidence.edu' },
  'University of Puget Sound': { applyUrl: '', siteUrl: 'https://www.pugetsound.edu' },
  'University of San Diego': { applyUrl: '', siteUrl: 'https://www.sandiego.edu' },
  'University of South Alabama': { applyUrl: 'https://www.southalabama.edu/departments/admissions/', siteUrl: 'https://www.southalabama.edu' },
  'University of South Carolina': { applyUrl: 'https://www.sc.edu/admissions/', siteUrl: 'https://www.sc.edu' },
  'University of South Carolina Aiken': { applyUrl: 'https://www.usca.edu/admissions/', siteUrl: 'https://www.usca.edu' },
  'University of South Carolina Beaufort': { applyUrl: 'https://www.uscb.edu/admissions/', siteUrl: 'https://www.uscb.edu' },
  'University of South Carolina Sumter': { applyUrl: '', siteUrl: '' },
  'University of South Florida': { applyUrl: 'https://www.usf.edu/admissions/', siteUrl: 'https://www.usf.edu' },
  'University of Southern California': { applyUrl: 'https://admission.usc.edu/', siteUrl: 'https://www.usc.edu' },
  'University of Southern Mississippi': { applyUrl: 'https://www.usm.edu/admissions/', siteUrl: 'https://www.usm.edu' },
  'University of Tampa': { applyUrl: 'https://www.ut.edu/admissions/', siteUrl: 'https://www.ut.edu' },
  'University of Texas Medical Branch (UTMB)': { applyUrl: '', siteUrl: 'https://www.utmb.edu' },
  'University of Texas at El Paso': { applyUrl: 'https://www.utep.edu/student-affairs/admissions/apply/', siteUrl: 'https://www.utep.edu' },
  'University of Texas at San Antonio': { applyUrl: '', siteUrl: 'https://www.utsa.edu' },
  'University of Washington Tacoma': { applyUrl: '', siteUrl: 'https://www.tacoma.uw.edu' },
  'University of West Florida': { applyUrl: 'https://www.uwf.edu/admissions/', siteUrl: 'https://www.uwf.edu' },
  'Utah State University': { applyUrl: 'https://www.usu.edu/admissions/', siteUrl: 'https://www.usu.edu' },
  'Valdosta State University': { applyUrl: 'https://www.valdosta.edu/admissions/', siteUrl: 'https://www.valdosta.edu' },
  'Vassar College': { applyUrl: 'https://admissions.vassar.edu/', siteUrl: 'https://www.vassar.edu' },
  'Ventura College': { applyUrl: '', siteUrl: 'https://www.venturacollege.edu' },
  'Virginia Commonwealth University': { applyUrl: 'https://admissions.vcu.edu/', siteUrl: 'https://www.vcu.edu' },
  'Virginia State University': { applyUrl: 'https://www.vsu.edu/admissions/', siteUrl: 'https://www.vsu.edu' },
  'Virginia Tech': { applyUrl: 'https://admissions.vt.edu/apply.html', siteUrl: 'https://www.vt.edu' },
  'Virginia Wesleyan University': { applyUrl: 'https://vwu.edu/admissions/apply/', siteUrl: 'https://vwu.edu' },
  'Volunteer State Community College': { applyUrl: 'https://www.volstate.edu/admissions', siteUrl: 'https://www.volstate.edu' },
  'Wallace Community College': { applyUrl: 'https://www.wallace.edu/admissions/', siteUrl: 'https://www.wallace.edu' },
  'Washington State University': { applyUrl: 'https://admissions.wsu.edu/', siteUrl: 'https://www.wsu.edu' },
  'Wayne Community College': { applyUrl: 'https://www.waynecc.edu/admissions/', siteUrl: 'https://www.waynecc.edu' },
  'Weber State University': { applyUrl: 'https://www.weber.edu/admissions/', siteUrl: 'https://www.weber.edu' },
  'Western Dakota Technical College': { applyUrl: 'https://www.wdt.edu/admissions/', siteUrl: 'https://www.wdt.edu' },
  'Western Kentucky University': { applyUrl: '', siteUrl: 'https://www.wku.edu' },
  'Western Washington University': { applyUrl: 'https://admissions.wwu.edu/apply/', siteUrl: 'https://www.wwu.edu' },
  'William Carey University': { applyUrl: 'https://www.wmcarey.edu/admissions/', siteUrl: 'https://www.wmcarey.edu' },
  'Windward Community College': { applyUrl: 'https://www.windward.hawaii.edu/admissions/', siteUrl: 'https://www.windward.hawaii.edu' },
  'Wright State University': { applyUrl: '', siteUrl: 'https://www.wright.edu' },
};

function getCollegeEnrollmentLinks(col) {
  const fromMap = COLLEGE_ENROLLMENT_LINKS[col?.name] || {};
  const applyUrl = col?.applyUrl || fromMap.applyUrl || '';
  const siteUrl = col?.siteUrl || fromMap.siteUrl || '';
  const officialEducationLink = (url) => {
    if (!url) return false;
    try {
      const host = new URL(url).hostname.toLowerCase();
      return host.endsWith('.edu') || host.endsWith('.gov') || host.endsWith('.mil');
    } catch {
      return false;
    }
  };
  // Build a Google site-restricted search for the school's admissions
  // page. This is the always-200 fallback we use when the curated
  // applyUrl deep-link has rotted (the 2026-05-20 audit found 111 such
  // .edu deep-links 404'ing). The user clicks once more (Google → top
  // result) instead of hitting a dead-end 404.
  const siteHost = (() => {
    try { return new URL(siteUrl).hostname; } catch { return ''; }
  })();
  const searchFallback = (col?.name && siteHost)
    ? `https://www.google.com/search?q=${encodeURIComponent(`${col.name} admissions apply site:${siteHost}`)}`
    : (col?.name
        ? `https://www.google.com/search?q=${encodeURIComponent(`${col.name} admissions apply`)}`
        : '');
  // Strict path-keyword test — we only trust the explicit applyUrl when
  // it points at a known enrollment path. Anything else falls back to
  // the search URL so the button always lands somewhere useful.
  const enrollmentPath = (url) => /admission|apply|enroll|getting-started|steps-to-enroll|how-to-apply/i.test(url || '');
  const trustedApply = officialEducationLink(applyUrl) && enrollmentPath(applyUrl) ? applyUrl : '';
  return {
    applyUrl: trustedApply || searchFallback,
    siteUrl: officialEducationLink(siteUrl) ? siteUrl : '',
  };
}

function EducationBenefitsTab({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('colleges');

  const installName = (profile?.gainingInstallation || '').split(',')[0].trim();
  const COLLEGE_ALIASES = { 'Fort Hood': 'Fort Cavazos', 'Fort Bragg': 'Fort Liberty', 'Fort Rucker': 'Fort Novosel', 'Fort Benning': 'Fort Moore', 'Fort Gordon': 'Fort Eisenhower', 'Fort Lee': 'Fort Gregg-Adams' };
  const resolvedInstall = COLLEGE_ALIASES[installName] || installName;
  // Curated CONUS list first, then OCONUS DoD-partner schools so OCONUS
  // bases (Camp Humphreys, Ramstein, Yokota, Vicenza, etc.) render the
  // same card layout as CONUS bases instead of the generic empty state.
  const nearbyColleges = INSTALLATION_COLLEGES[resolvedInstall]
    || INSTALLATION_COLLEGES[installName]
    || OCONUS_COLLEGES[resolvedInstall]
    || OCONUS_COLLEGES[installName]
    || [];

  const GI_BILL_CHAPTERS = [
    {
      chapter: "Chapter 33",
      name: "Post-9/11 GI Bill",
      who: "Veterans who served 90+ days after 9/11/2001",
      benefits: ["Tuition paid directly to school (100% for in-state public)", "Monthly housing allowance (BAH E-5 with dependents rate)", "Up to $1,000/yr books & supplies stipend", "Transferable to dependents (with qualifying service)"],
      apply: "https://www.va.gov/education/how-to-apply/",
      best: true,
    },
    {
      chapter: "Chapter 30",
      name: "Montgomery GI Bill (MGIB-AD)",
      who: "Active duty veterans who paid into the program ($1,200 contribution)",
      benefits: ["Monthly stipend paid to you directly", "Up to 36 months of benefits", "Must be enrolled at least half-time"],
      apply: "https://www.va.gov/education/how-to-apply/",
      best: false,
    },
    {
      chapter: "Chapter 35",
      name: "Survivors' & Dependents' Educational Assistance",
      who: "Dependents of veterans who are permanently disabled or died in service",
      benefits: ["Monthly stipend for full-time enrollment", "Up to 45 months of benefits", "Career & vocational training included"],
      apply: "https://www.va.gov/education",
      best: false,
    },
    {
      chapter: "Chapter 1606",
      name: "Montgomery GI Bill — Selected Reserve",
      who: "National Guard and Reserve members who have 6-year commitment",
      benefits: ["Monthly payment for college, tech school, distance learning", "Up to 36 months of benefits"],
      apply: "https://www.va.gov/education/how-to-apply/",
      best: false,
    },
  ];

  const TUITION_ASSISTANCE = {
    Army: {
      portal: 'ArmyIgnitED',
      url: 'https://www.armyignited.army.mil/student/',
      source: 'https://www.armyignited.com',
      summary: 'Army Tuition Assistance is requested through ArmyIgnitED after the Soldier establishes an education goal and works with an education counselor when required.',
      steps: [
        'Contact your Army Education Center or ArmyIgnitED support if this is your first TA request.',
        'Sign in to ArmyIgnitED with your CAC and create or update your student profile.',
        'Create an education goal for the school, degree level, and program you plan to pursue.',
        'Complete required ArmyIgnitED training or counseling items shown in the portal.',
        'Register with the school, then submit the TA request in ArmyIgnitED before the course start deadline.',
        'Wait for approval before relying on TA funds; send the approved authorization to the school if requested.',
      ],
    },
    Navy: {
      portal: 'Navy College / MyNavy Education',
      url: 'https://www.navycollege.navy.mil/',
      secondaryUrl: '',
      source: 'https://www.navycollege.navy.mil/',
      summary: 'Navy Tuition Assistance is managed through the Navy College Program and MyNavy Education for eligible Sailors.',
      steps: [
        'Tell your chain of command you intend to use Tuition Assistance.',
        'Complete the required Virtual Learning 101 training in MyNavy Education if you have not done it before.',
        'Work with a Navy College education counselor and define your education goal.',
        'Upload the required education plan or degree plan in MyNavy Education.',
        'Submit the TA application in MyNavy Education within the Navy application window and before the deadline.',
        'After approval, provide the authorization voucher to your school before the course begins.',
      ],
    },
    'Marine Corps': {
      portal: 'Marine Corps Voluntary Education / WebTA',
      url: 'https://www.dantes.mil/mil-ta/',
      source: 'https://www.dantes.mil/mil-ta/',
      summary: 'Marine Corps Tuition Assistance supports eligible Marines taking off-duty courses through approved schools.',
      steps: [
        'Contact your installation Education Center or Voluntary Education office before enrolling.',
        'Confirm eligibility, course limits, degree plan requirements, and command approval rules.',
        'Choose an accredited school and program that meets TA policy requirements.',
        'Register for the course only after you understand the TA request timing and school billing process.',
        'Submit the TA request through the Marine Corps-approved TA system before the course deadline.',
        'Keep the approved TA authorization and coordinate with the school billing or military student office.',
      ],
    },
    'Air Force': {
      portal: 'Air Force Virtual Education Center (AFVEC)',
      url: 'https://afvec.us.af.mil/afvec/public/welcome',
      source: 'https://afvec.us.af.mil/afvec/public/welcome',
      summary: 'Air Force Tuition Assistance is requested through AFVEC for eligible Airmen pursuing voluntary off-duty education.',
      steps: [
        'Discuss your education plan with your supervisor and base education office when required.',
        'Sign in to AFVEC and confirm your profile, education goal, and school information.',
        'Upload or confirm your degree plan if AFVEC or your education office requires it.',
        'Register for courses with the school, then submit the TA request in AFVEC before the deadline.',
        'Wait for supervisor and education office approval before assuming TA will pay.',
        'Provide approved TA documentation to the school and monitor grades to avoid repayment issues.',
      ],
    },
    'Space Force': {
      portal: 'AFVEC for Guardians',
      url: 'https://afvec.us.af.mil/afvec/public/welcome',
      source: 'https://www.spaceforce.mil/News/Article-Display/Article/2421854/department-of-the-air-force-restores-previous-military-tuition-assistance-cap-a/',
      summary: 'Space Force Guardians use Department of the Air Force education systems, including AFVEC, for Tuition Assistance.',
      steps: [
        'Coordinate with your supervisor and servicing education office before enrolling.',
        'Use AFVEC to confirm your education goal, school, and degree plan requirements.',
        'Register for courses only after confirming the course fits current TA policy.',
        'Submit the TA request in AFVEC before the course start deadline.',
        'Wait for all required approvals before relying on TA funding.',
        'Track grades and completion requirements so TA is not recouped.',
      ],
    },
    'Coast Guard': {
      portal: 'MyCG Ed / ETQC Tuition Assistance',
      url: 'https://www.forcecom.uscg.mil/Our-Organization/FORCECOM-UNITS/ETQC/VOLUNTARY-EDUCATION/Tuition-Assistance/Coast-Guard-Credentialing-Online-COOL/',
      source: 'https://www.mycg.uscg.mil/Resources/Article/2454246/education-assistance/',
      summary: 'Coast Guard Tuition Assistance is requested through MyCG Ed and ETQC guidance for eligible members.',
      steps: [
        'Select an approved school and confirm the school has the required DoD MOU status.',
        'Apply to the school and build a degree or certificate plan before requesting TA.',
        'Sign in to MyCG Ed with CAC access and review current ETQC Tuition Assistance policy.',
        'Submit the TA application before the Coast Guard deadline and before the class starts.',
        'Do not begin relying on TA until the voucher or authorization is approved.',
        'Send the approved authorization to the school and submit grades on time after completion.',
      ],
    },
  };

  const selectedTA = TUITION_ASSISTANCE[profile?.branch] || TUITION_ASSISTANCE.Army;

  const HOW_TO_STEPS = [
    { step: 1, title: "Apply on VA.gov", desc: "Go to va.gov/education/how-to-apply and complete VA Form 22-1990. You'll need your DD-214 or current service info." },
    { step: 2, title: "Receive Certificate of Eligibility", desc: "VA will mail your COE in 4-6 weeks. This shows your school exactly what benefits you have. Upload it to eBenefits or keep a copy." },
    { step: 3, title: "Notify School Certifying Official (SCO)", desc: "Every college has an SCO (usually in the Registrar or Veterans Affairs office). They certify your enrollment to VA each semester." },
    { step: 4, title: "Understand BAH (Ch.33)", desc: "If using Post-9/11, your monthly housing allowance is based on the ZIP code of your school's main campus. Online-only students get 50% of national average BAH." },
    { step: 5, title: "Track Benefits Usage", desc: "Log into va.gov/education/check-remaining-entitlement to see how many months remain. You have a 15-year limit from separation (Ch.33)." },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 4 }}>Education</div>
      <div style={{ fontSize: 12, color: '#56697C', marginBottom: 16 }}>Education & scholarship resources for service members and spouses</div>

      <TabBar ariaLabel="Education sections" className="pcs-tabbar--flush">
        {[{ id: 'colleges', label: 'Colleges' }, { id: 'gibill', label: 'GI Bill Chapters' }, { id: 'mycaa', label: 'MyCAA (Spouses)' }, { id: 'tuition', label: 'Tuition Assistance' }].map(t => {
          const isActive = activeTab === t.id;
          return (
            <button key={t.id} id={`edub-tab-${t.id}`} role="tab" aria-selected={isActive} aria-controls={`edub-panel-${t.id}`} data-active={isActive || undefined} onClick={() => setActiveTab(t.id)} className={`pcs-tab ${isActive ? 'is-active' : ''}`} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${isActive ? theme.primary : '#E0E6EE'}`, background: isActive ? theme.primary : '#FFF', color: isActive ? '#FFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
              {t.label}
            </button>
          );
        })}
      </TabBar>

      {activeTab === 'gibill' && (
        <div role="tabpanel" id="edub-panel-gibill" aria-labelledby="edub-tab-gibill">
          {GI_BILL_CHAPTERS.map((ch, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: `1px solid ${ch.best ? theme.accent : '#E0E6EE'}`, borderLeft: `3px solid ${ch.best ? theme.accent : theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#56697C' }}>Chapter {ch.chapter}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0D1821' }}>{ch.name}</div>
                </div>
                {ch.best && <span style={{ background: theme.accent, color: theme.secondary, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>MOST COMMON</span>}
              </div>
              <div style={{ fontSize: 11, color: '#56697C', marginBottom: 10, fontStyle: 'italic' }}>{ch.who}</div>
              {ch.benefits.map((b, i) => (
                <div key={i} style={{ fontSize: 12, color: '#333', marginBottom: 4 }}>✓ {b}</div>
              ))}
              <a href={ch.apply} target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary, marginTop: 10 }}>Apply Online</a>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'howto' && (
        <div role="tabpanel" id="edub-panel-howto" aria-labelledby="edub-tab-howto">
          {HOW_TO_STEPS.map((s) => (
            <div key={s.step} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 12, display: 'flex', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: theme.primary, color: '#FFF', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
          <a href="https://www.va.gov/education/how-to-apply/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary, marginTop: 8, fontSize: 13 }}>
            Start Application on VA.gov
          </a>
        </div>
      )}

      {activeTab === 'tuition' && (
        <div role="tabpanel" id="edub-panel-tuition" aria-labelledby="edub-tab-tuition">
          <div style={{ background: '#FFFFFF', border: '1px solid #DDD5C2', borderLeft: `4px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 14, boxShadow: '0 8px 20px rgba(38,53,31,0.08)' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: theme.primary, letterSpacing: '.14em', marginBottom: 4 }}>{(profile?.branch || 'Army').toUpperCase()} TUITION ASSISTANCE</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#111827', marginBottom: 6 }}>{selectedTA.portal}</div>
            <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>{selectedTA.summary}</div>
            <div style={{ marginTop: 10, fontSize: 11, color: '#7A4A00', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 10, padding: 10, lineHeight: 1.5 }}>
              Always verify current eligibility, deadlines, service obligations, grade requirements, and repayment rules with your education office before enrolling.
            </div>
          </div>

          {selectedTA.steps.map((step, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: theme.primary, color: '#FFFFFF', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</div>
              <div style={{ fontSize: 12, color: '#1F2937', lineHeight: 1.55, fontWeight: 600 }}>{step}</div>
            </div>
          ))}

          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            <a href={selectedTA.url} target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary, fontSize: 13 }}>
              Open {selectedTA.portal}
            </a>
            {selectedTA.secondaryUrl && (
              <a href={selectedTA.secondaryUrl} target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">
                Open application portal
              </a>
            )}
            <a href={selectedTA.source} target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost">
              Review official/public branch education guidance
            </a>
          </div>
        </div>
      )}

      {activeTab === 'colleges' && (
        <div role="tabpanel" id="edub-panel-colleges" aria-labelledby="edub-tab-colleges">
          {nearbyColleges.length > 0 ? (
            <>
              <div style={{ background: theme.secondary, borderRadius: 12, padding: 12, marginBottom: 14, borderLeft: `3px solid ${theme.accent}` }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.12em', marginBottom: 4 }}>COLLEGES NEAR {resolvedInstall.toUpperCase()}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{nearbyColleges.length} schools listed · All links verified · TA and GI Bill acceptance noted</div>
              </div>
              {nearbyColleges.map((col, idx) => {
                const links = getCollegeEnrollmentLinks(col);
                return (
                  <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{col.name}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: col.type === 'Public' ? '#E3F2FD' : '#FCE4EC', color: col.type === 'Public' ? '#1565C0' : '#880E4F' }}>{col.type}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#F3F4F6', color: '#56697C' }}>{col.degree}</span>
                          {links.applyUrl && <span style={{ fontSize: 9, fontWeight: 900, background: '#E8F5E9', color: '#1B5E20', padding: '2px 7px', borderRadius: 10 }}>Verified enrollment link</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: theme.primary }}>{col.rating.toFixed(1)}</div>
                        <div style={{ fontSize: 9, color: '#56697C' }}>/ 5.0</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>{col.desc}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {links.applyUrl && (
                        <a href={links.applyUrl} target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary, flex: 2, minWidth: 150 }}>Enrollment / Admissions</a>
                      )}
                      {links.siteUrl && (
                        <a href={links.siteUrl} target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block card-cta--ghost" style={{ flex: 1, minWidth: 110 }}>College Website</a>
                      )}
                      {!links.applyUrl && !links.siteUrl && (
                        <div style={{ width: '100%', padding: '9px', borderRadius: 8, background: '#FFF8E1', color: '#7A4A00', border: '1px solid #FFE082', fontWeight: 800, fontSize: 11, textAlign: 'center' }}>Enrollment link under official review</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <>
              {/* Google Maps deep-link discovery cards. The curated
                  INSTALLATION_COLLEGES list keys off CONUS US installation
                  names; OCONUS bases (USAG Humphreys, Ramstein, Yokota,
                  etc.) get no curated rows and the prior empty state
                  showed only generic SBA-style sources. These category
                  cards open Google Maps with the gaining-installation
                  locality pre-filled so users see real local colleges
                  and DoD-partner programs that accept TA. */}
              <div data-dynamic-card="google" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 12 }}>
                {[
                  { label: 'Colleges & universities',               q: `colleges and universities near ${resolvedInstall}` },
                  { label: 'Community colleges',                     q: `community colleges near ${resolvedInstall}` },
                  { label: 'DoD voluntary education partners',       q: `DoD voluntary education partner near ${resolvedInstall}` },
                  { label: 'Online programs accepting Military TA',  q: `online university accepting military tuition assistance` },
                ].map((cat, idx) => (
                  <a key={idx}
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cat.q)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${theme.accent}`, borderRadius: 12, padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{cat.label} near {resolvedInstall}</div>
                    <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginBottom: 8 }}>
                      Curated Google Maps search restricted to the area around your gaining installation. Opens with real local schools, ratings, contact info, and TA acceptance details so you can compare and apply.
                    </div>
                    <span className="card-cta" style={{ '--cta-color': theme.primary }}>Open map view</span>
                  </a>
                ))}
              </div>
              <div style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 6 }}>Official college sources for {getInstallationSearchLocation(resolvedInstall)}</div>
                <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginBottom: 12 }}>PCS Express has not stored local college cards for this installation yet. The Google Maps cards above surface real local schools, and the official public search paths below cover NCES, DoDEA, DANTES voluntary education, and branch-specific TA portals.</div>
                {officialCollegeCards(resolvedInstall).map(card => (
                  <a key={card.name} href={card.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E0E6EE', color: '#0D1821', textDecoration: 'none', fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
                    <span style={{ display: 'block' }}>{card.name}</span>
                    <span style={{ display: 'block', fontSize: 10, color: '#56697C', fontWeight: 500, lineHeight: 1.45, marginTop: 3 }}>{card.desc}</span>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'schools' && (
        <div role="tabpanel" id="edub-panel-schools" aria-labelledby="edub-tab-schools">
          <div style={{ background: '#F0F4F8', borderRadius: 12, padding: 14, marginBottom: 14, fontSize: 12, color: '#555', lineHeight: 1.6 }}>
            Use the links below to find VA-approved schools. Make sure any school you attend is on the VA's approved programs list.
          </div>
          {[
            { name: "VA Comparison Tool", desc: "Compare GI Bill benefits at specific schools — see tuition, BAH rates, and ratings.", url: "https://www.va.gov/gi-bill-comparison-tool/" },
            { name: "ArmyIgnitED", desc: "Official Army portal for Tuition Assistance requests, education counseling, and CLEP/DANTES exam registration.", url: "https://www.armyignited.army.mil/student/" },
            { name: "DANTES (DSST Exams)", desc: "Free college-level subject exams for service members — earn college credit.", url: "https://www.dantes.mil" },
            { name: "DANTES Education Programs", desc: "Official voluntary education, testing, and career planning resources for service members.", url: "https://www.dantes.mil/Education-Programs/" },
            { name: "VA Education Benefits", desc: "Apply for and manage VA education benefits on VA.gov.", url: "https://www.va.gov/education/" },
          ].filter(r => r.url).map((r, idx) => (
            <div key={idx} style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginBottom: 8 }}>{r.desc}</div>
              <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: theme.primary, fontWeight: 700, textDecoration: 'none' }}>Open Resource →</a>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'mycaa' && (
        <div role="tabpanel" id="edub-panel-mycaa" aria-labelledby="edub-tab-mycaa">
          <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1B5E20', marginBottom: 6 }}>MyCAA — Military Spouse Career Advancement Accounts</div>
            <div style={{ fontSize: 11, color: '#2E7D32', lineHeight: 1.6 }}>Up to $4,000/year (max $16,000 total) for military spouses to pursue education and portable career credentials.</div>
          </div>
          {[
            { title: 'Eligibility', items: ['Spouse of active duty service member E-1 to O-2 (or W-1 to W-2)', 'Spouse must be 18+ years old', 'Enrolled in a degree or credential program', 'Not eligible if service member is on Title 10 orders for < 180 days'] },
            { title: 'What It Covers', items: ['Associate degrees', 'Bachelor’s/Master’s degrees', 'Licenses and certifications (e.g., nursing, real estate, IT)', 'Vocational/technical training', 'Online and in-person programs at approved schools'] },
            { title: 'How to Apply', items: ['1. Visit MyCAA portal at mycaa.militaryonesource.mil', '2. Create an account with your military ID info', '3. Complete career exploration and education plan', '4. Get Financial Assistance approved before enrolling', '5. School submits invoices directly to MyCAA'] },
          ].map((section, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.accent}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0D1821', marginBottom: 8 }}>{section.title}</div>
              {section.items.map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: '#333', marginBottom: 4 }}>✓ {item}</div>
              ))}
            </div>
          ))}
          <a href="https://mycaa.militaryonesource.mil/mycaa/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': theme.primary, marginBottom: 10, fontSize: 13 }}>Apply for MyCAA</a>
          <a href="https://www.militaryonesource.mil/education-employment/for-spouses/mycaa-scholarship-program/" target="_blank" rel="noopener noreferrer" className="card-cta card-cta--block" style={{ '--cta-color': '#2E7D32' }}>Learn More at MilitaryOneSource</a>
        </div>
      )}
    </div>
  );
}

export default EducationBenefitsTab;
