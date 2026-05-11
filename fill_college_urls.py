#!/usr/bin/env python3
"""Fills in official siteUrl and applyUrl for all colleges in App.jsx."""
import re

COLLEGE_URLS = {
    # ── Fort Liberty / Fayetteville, NC ──────────────────────────────
    'Methodist University':                    ('https://www.methodist.edu', 'https://www.methodist.edu/admissions/apply/'),
    'Fayetteville State University':           ('https://www.uncfsu.edu', 'https://www.uncfsu.edu/admissions/apply-now'),
    'Fayetteville Technical Community College':('https://www.faytechcc.edu', 'https://www.faytechcc.edu/apply/'),
    'Campbell University':                     ('https://www.campbell.edu', 'https://www.campbell.edu/admissions/apply/'),
    'UNC Pembroke':                            ('https://www.uncp.edu', 'https://www.uncp.edu/admissions/apply'),
    # ── Fort Campbell, TN/KY ─────────────────────────────────────────
    'Austin Peay State University':            ('https://www.apsu.edu', 'https://www.apsu.edu/admissions/apply/'),
    'Volunteer State Community College':       ('https://www.volstate.edu', 'https://www.volstate.edu/admissions/'),
    'Middle Tennessee State University':       ('https://www.mtsu.edu', 'https://www.mtsu.edu/admissions/apply.php'),
    'Nashville State Community College':       ('https://www.nscc.edu', 'https://www.nscc.edu/admissions/apply-to-nscc/'),
    # ── Fort Cavazos / Fort Hood, TX ─────────────────────────────────
    'Central Texas College':                   ('https://www.ctcd.edu', 'https://www.ctcd.edu/prospective-students/apply/'),
    'Central Texas College (Overseas)':        ('https://www.ctcd.edu', 'https://www.ctcd.edu/prospective-students/apply/'),
    'Central Texas College Overseas':          ('https://www.ctcd.edu', 'https://www.ctcd.edu/prospective-students/apply/'),
    'Texas A&M University – Central Texas': ('https://www.tamuct.edu', 'https://www.tamuct.edu/admissions/'),
    'University of Mary Hardin-Baylor':        ('https://www.umhb.edu', 'https://www.umhb.edu/admissions/apply/'),
    'Temple College':                          ('https://www.templejc.edu', 'https://www.templejc.edu/apply/'),
    # ── JBLM, WA ─────────────────────────────────────────────────────
    'University of Washington Tacoma':         ('https://www.tacoma.uw.edu', 'https://apply.washington.edu/'),
    'Tacoma Community College':                ('https://www.tacomacc.edu', 'https://www.tacomacc.edu/admissions/'),
    'Pierce College':                          ('https://www.pierce.ctc.edu', 'https://www.pierce.ctc.edu/admissions/'),
    'Pacific Lutheran University':             ('https://www.plu.edu', 'https://www.plu.edu/admission/apply/'),
    'University of Puget Sound':               ('https://www.pugetsound.edu', 'https://www.pugetsound.edu/admission/'),
    # ── Fort Carson, CO ──────────────────────────────────────────────
    'University of Colorado Colorado Springs': ('https://www.uccs.edu', 'https://admissions.uccs.edu/apply/'),
    'Pikes Peak State College':                ('https://www.pikespeak.edu', 'https://www.pikespeak.edu/admissions/apply-to-ppsc/'),
    'Colorado College':                        ('https://www.coloradocollege.edu', 'https://www.coloradocollege.edu/admission/'),
    'Colorado Technical University':           ('https://www.coloradotech.edu', 'https://www.coloradotech.edu/admissions/'),
    # ── Fort Bliss, TX ───────────────────────────────────────────────
    'University of Texas at El Paso':          ('https://www.utep.edu', 'https://www.utep.edu/admissions/'),
    'El Paso Community College':               ('https://www.epcc.edu', 'https://www.epcc.edu/Admissions/'),
    'New Mexico State University':             ('https://www.nmsu.edu', 'https://admissions.nmsu.edu/apply/'),
    # ── Fort Stewart, GA ─────────────────────────────────────────────
    'Georgia Southern University':             ('https://www.georgiasouthern.edu', 'https://admissions.georgiasouthern.edu/apply/'),
    'Savannah State University':               ('https://www.savannahstate.edu', 'https://www.savannahstate.edu/admissions/'),
    'Coastal Pines Technical College':         ('https://www.coastalpines.edu', 'https://www.coastalpines.edu/admissions/'),
    'College of Coastal Georgia':              ('https://www.ccga.edu', 'https://www.ccga.edu/admissions/apply/'),
    # ── Fort Drum, NY ────────────────────────────────────────────────
    'Jefferson Community College':             ('https://www.sunyjefferson.edu', 'https://www.sunyjefferson.edu/admissions/apply/'),
    'SUNY Polytechnic Institute':              ('https://www.sunypoly.edu', 'https://www.sunypoly.edu/admissions/'),
    'Clarkson University':                     ('https://www.clarkson.edu', 'https://www.clarkson.edu/admissions/apply/'),
    # ── Naval Station Norfolk, VA ────────────────────────────────────
    'Old Dominion University':                 ('https://www.odu.edu', 'https://apply.odu.edu/'),
    'Tidewater Community College':             ('https://www.tcc.edu', 'https://www.tcc.edu/admissions/apply/'),
    'Norfolk State University':                ('https://www.nsu.edu', 'https://www.nsu.edu/admissions/'),
    'Regent University':                       ('https://www.regent.edu', 'https://www.regent.edu/admissions/apply/'),
    'Virginia Wesleyan University':            ('https://www.vwu.edu', 'https://www.vwu.edu/admission/apply/'),
    # ── Camp Lejeune, NC ─────────────────────────────────────────────
    'Coastal Carolina Community College':      ('https://www.coastalcarolina.cc.nc.us', 'https://www.coastalcarolina.cc.nc.us/apply/'),
    'University of Mount Olive':               ('https://www.umo.edu', 'https://www.umo.edu/admissions/apply/'),
    'Mount Olive University':                  ('https://www.umo.edu', 'https://www.umo.edu/admissions/apply/'),
    'East Carolina University':                ('https://www.ecu.edu', 'https://admissions.ecu.edu/apply/'),
    # ── MCB Camp Pendleton, CA ───────────────────────────────────────
    'MiraCosta College':                       ('https://www.miracosta.edu', 'https://www.miracosta.edu/admissions/'),
    'California State University San Marcos':  ('https://www.csusm.edu', 'https://www.csusm.edu/admissions/'),
    'Palomar College':                         ('https://www.palomar.edu', 'https://www2.palomar.edu/admissions/'),
    'University of San Diego':                 ('https://www.sandiego.edu', 'https://admissions.sandiego.edu/apply/'),
    # ── Fort Sam Houston, TX (San Antonio) ───────────────────────────
    'University of Texas at San Antonio':      ('https://www.utsa.edu', 'https://apply.utsa.edu/'),
    "St. Philip's College":                    ('https://www.alamo.edu/spc/', 'https://www.alamo.edu/spc/admissions/apply/'),
    'Trinity University':                      ('https://www.trinity.edu', 'https://www.trinity.edu/admissions/apply/'),
    'San Antonio College':                     ('https://www.alamo.edu/sac/', 'https://www.alamo.edu/sac/admissions/apply/'),
    # ── USAG Humphreys, Korea ────────────────────────────────────────
    'University of Maryland Global Campus':    ('https://www.umgc.edu', 'https://www.umgc.edu/admission/apply/'),
    'University of Maryland Global Campus Asia':('https://www.umgc.edu', 'https://www.umgc.edu/admission/apply/'),
    'University of Maryland Global Campus Europe':('https://www.umgc.edu', 'https://www.umgc.edu/admission/apply/'),
    'UMGC Asia':                               ('https://www.umgc.edu', 'https://www.umgc.edu/admission/apply/'),
    'UMGC Europe':                             ('https://www.umgc.edu', 'https://www.umgc.edu/admission/apply/'),
    'UMGC Worldwide Online':                   ('https://www.umgc.edu', 'https://www.umgc.edu/admission/apply/'),
    'Embry-Riddle Aeronautical University Worldwide':('https://worldwide.erau.edu', 'https://worldwide.erau.edu/admissions/'),
    'Embry-Riddle Aeronautical University':    ('https://www.erau.edu', 'https://admissions.erau.edu/apply/'),
    'Embry-Riddle European Campus':            ('https://europe.erau.edu', 'https://europe.erau.edu/admissions/'),
    'American Military University':            ('https://www.amu.apus.edu', 'https://www.amu.apus.edu/admission/'),
    # ── Ramstein AB, Germany ─────────────────────────────────────────
    'Troy University':                         ('https://www.troy.edu', 'https://www.troy.edu/admissions/apply/'),
    # ── Fort Meade, MD ───────────────────────────────────────────────
    'University of Maryland':                  ('https://www.umd.edu', 'https://apply.umd.edu/'),
    'Anne Arundel Community College':          ('https://www.aacc.edu', 'https://www.aacc.edu/admissions/'),
    'Capitol Technology University':           ('https://www.captechu.edu', 'https://www.captechu.edu/admissions/'),
    # ── Schofield Barracks, HI ───────────────────────────────────────
    'University of Hawaii at Manoa':           ('https://manoa.hawaii.edu', 'https://admissions.hawaii.edu/apply/'),
    'Hawaii Pacific University':               ('https://www.hpu.edu', 'https://www.hpu.edu/admissions/apply/'),
    'Leeward Community College':               ('https://www.leeward.hawaii.edu', 'https://www.leeward.hawaii.edu/future-students/'),
    # ── Fort Moore, GA ───────────────────────────────────────────────
    'Columbus State University':               ('https://www.columbusstate.edu', 'https://admissions.columbusstate.edu/apply/'),
    'Columbus Technical College':              ('https://www.columbustech.edu', 'https://www.columbustech.edu/admissions/'),
    'Auburn University at Montgomery':         ('https://www.aum.edu', 'https://www.aum.edu/admissions/apply/'),
    # ── Fort Eisenhower, GA ──────────────────────────────────────────
    'Augusta University':                      ('https://www.augusta.edu', 'https://www.augusta.edu/admissions/apply.php'),
    'Augusta Technical College':               ('https://www.augustatech.edu', 'https://www.augustatech.edu/admissions/'),
    'Paine College':                           ('https://www.paine.edu', 'https://www.paine.edu/admissions/'),
    'University of South Carolina Aiken':      ('https://www.usca.edu', 'https://www.usca.edu/admissions/apply/'),
    # ── Fort Gregg-Adams, VA ─────────────────────────────────────────
    'Virginia State University':               ('https://www.vsu.edu', 'https://www.vsu.edu/admissions/apply/'),
    'Richard Bland College':                   ('https://www.rbc.edu', 'https://www.rbc.edu/admissions/apply/'),
    'Virginia Commonwealth University':        ('https://www.vcu.edu', 'https://admissions.vcu.edu/apply/'),
    'John Tyler Community College':            ('https://www.reynolds.edu', 'https://www.reynolds.edu/admissions/apply/'),
    # ── Fort Knox, KY ────────────────────────────────────────────────
    'Elizabethtown Community & Technical College': ('https://elizabethtown.kctcs.edu', 'https://elizabethtown.kctcs.edu/apply/'),
    'University of Louisville':                ('https://www.louisville.edu', 'https://admissions.louisville.edu/apply/'),
    'Western Kentucky University':             ('https://www.wku.edu', 'https://www.wku.edu/admissions/'),
    'Campbellsville University':               ('https://www.campbellsville.edu', 'https://www.campbellsville.edu/admissions/apply/'),
    # ── Fort Jackson, SC ─────────────────────────────────────────────
    'University of South Carolina':            ('https://www.sc.edu', 'https://sc.edu/admissions/undergraduate/apply/'),
    'Columbia International University':       ('https://www.ciu.edu', 'https://www.ciu.edu/admissions/apply/'),
    'Midlands Technical College':              ('https://www.midlandstech.edu', 'https://www.midlandstech.edu/admissions/'),
    'Benedict College':                        ('https://www.benedict.edu', 'https://www.benedict.edu/admissions/apply/'),
    # ── Fort Leonard Wood, MO ────────────────────────────────────────
    'Missouri University of Science & Technology': ('https://www.mst.edu', 'https://apply.mst.edu/'),
    'Missouri S&T':                            ('https://www.mst.edu', 'https://apply.mst.edu/'),
    'University of Central Missouri':          ('https://www.ucmo.edu', 'https://www.ucmo.edu/admissions/apply/'),
    'State Fair Community College':            ('https://www.sfccmo.edu', 'https://www.sfccmo.edu/admissions/apply/'),
    'Drury University':                        ('https://www.drury.edu', 'https://www.drury.edu/admissions/apply/'),
    # ── Fort Wainwright, AK ──────────────────────────────────────────
    'University of Alaska Fairbanks':          ('https://www.uaf.edu', 'https://admissions.uaf.edu/apply/'),
    'UAF Community & Technical College':       ('https://ctc.uaf.edu', 'https://ctc.uaf.edu/admissions/'),
    'Alaska Bible College':                    ('https://www.akbible.edu', 'https://www.akbible.edu/admissions/'),
    # ── Fort Novosel (Fort Rucker), AL ───────────────────────────────
    'Enterprise State Community College':      ('https://www.escc.edu', 'https://www.escc.edu/admissions/'),
    'Wallace Community College':               ('https://www.wallace.edu', 'https://www.wallace.edu/admissions/'),
    # ── Fort Leavenworth, KS ─────────────────────────────────────────
    'University of Kansas':                    ('https://www.ku.edu', 'https://admissions.ku.edu/apply/'),
    'Kansas City Kansas Community College':    ('https://www.kckcc.edu', 'https://www.kckcc.edu/admissions/'),
    'Park University':                         ('https://www.park.edu', 'https://www.park.edu/admissions/apply/'),
    'Johnson County Community College':        ('https://www.jccc.edu', 'https://www.jccc.edu/admissions/apply/'),
    # ── Fort Hamilton, NY (Brooklyn) ─────────────────────────────────
    'Brooklyn College CUNY':                   ('https://www.brooklyn.cuny.edu', 'https://www.brooklyn.cuny.edu/web/admissions.php'),
    'Kingsborough Community College':          ('https://www.kbcc.cuny.edu', 'https://www.kbcc.cuny.edu/admissions/'),
    'New York University':                     ('https://www.nyu.edu', 'https://apply.nyu.edu/'),
    'Touro University':                        ('https://www.touro.edu', 'https://www.touro.edu/admissions/'),
    # ── West Point area / Fort Hamilton ──────────────────────────────
    'SUNY New Paltz':                          ('https://www.newpaltz.edu', 'https://www.newpaltz.edu/admissions/apply/'),
    'Marist College':                          ('https://www.marist.edu', 'https://www.marist.edu/admission/apply/'),
    # ── JB Andrews / Fort Belvoir, MD/VA ─────────────────────────────
    "Prince George's Community College":       ('https://www.pgcc.edu', 'https://www.pgcc.edu/admissions/apply/'),
    'Northern Virginia Community College':     ('https://www.nvcc.edu', 'https://www.nvcc.edu/admissions/'),
    'George Mason University':                 ('https://www2.gmu.edu', 'https://admissions.gmu.edu/apply/'),
    'Georgetown University':                   ('https://www.georgetown.edu', 'https://uadmissions.georgetown.edu/apply/'),
    'American University':                     ('https://www.american.edu', 'https://www.american.edu/admissions/apply/'),
    'Bowie State University':                  ('https://www.bowiestate.edu', 'https://www.bowiestate.edu/admissions/apply/'),
    'Thomas Nelson Community College':         ('https://www.tncc.edu', 'https://www.tncc.edu/admissions/'),
    'Christopher Newport University':          ('https://www.cnu.edu', 'https://www.cnu.edu/admissions/apply/'),
    'Virginia Tech':                           ('https://www.vt.edu', 'https://admissions.vt.edu/apply.html'),
    'University of Mary Washington':           ('https://www.umw.edu', 'https://apply.umw.edu/'),
    # ── NS Great Lakes, IL ───────────────────────────────────────────
    'McKendree University':                    ('https://www.mckendree.edu', 'https://www.mckendree.edu/admissions/apply/'),
    'Lindenwood University':                   ('https://www.lindenwood.edu', 'https://www.lindenwood.edu/admissions/apply/'),
    'Southern Illinois University Edwardsville': ('https://www.siue.edu', 'https://www.siue.edu/admissions/'),
    'Southwestern Illinois College':           ('https://www.swic.edu', 'https://www.swic.edu/admissions/'),
    # ── NAS Pensacola, FL ────────────────────────────────────────────
    'University of West Florida':              ('https://uwf.edu', 'https://uwf.edu/admissions/'),
    'Pensacola State College':                 ('https://www.pensacolastate.edu', 'https://www.pensacolastate.edu/admissions/'),
    'Gulf Coast State College':                ('https://www.gulfcoast.edu', 'https://www.gulfcoast.edu/admissions/'),
    # ── NAS Jacksonville, FL ─────────────────────────────────────────
    'University of North Florida':             ('https://www.unf.edu', 'https://www.unf.edu/admissions/'),
    'Florida State College at Jacksonville':   ('https://www.fscj.edu', 'https://www.fscj.edu/admissions/'),
    'Jacksonville University':                 ('https://www.ju.edu', 'https://www.ju.edu/admissions/apply/'),
    'Edward Waters University':                ('https://www.ewu.edu', 'https://www.ewu.edu/admissions/'),
    # ── NAS Oceana / NSB Norfolk, VA ─────────────────────────────────
    'Hampton University':                      ('https://www.hamptonu.edu', 'https://www.hamptonu.edu/admission/apply.cfm'),
    'College of William & Mary':               ('https://www.wm.edu', 'https://www.wm.edu/admissions/undergraduateadmissions/apply/'),
    # ── NS Mayport / NAS Jacksonville area ───────────────────────────
    'Eastern Florida State College':           ('https://www.easternflorida.edu', 'https://www.easternflorida.edu/admissions/'),
    'Florida Institute of Technology':         ('https://www.fit.edu', 'https://www.fit.edu/admissions/apply/'),
    'Florida International University':        ('https://www.fiu.edu', 'https://admissions.fiu.edu/apply/'),
    'University of Tampa':                     ('https://www.ut.edu', 'https://www.ut.edu/admissions/apply/'),
    'University of South Florida':             ('https://www.usf.edu', 'https://admissions.usf.edu/apply/'),
    'Hillsborough Community College':          ('https://www.hccfl.edu', 'https://www.hccfl.edu/admissions/'),
    'Eckerd College':                          ('https://www.eckerd.edu', 'https://www.eckerd.edu/admissions/apply/'),
    # ── Eglin AFB, FL ────────────────────────────────────────────────
    'Northwest Florida State College':         ('https://www.nwfsc.edu', 'https://www.nwfsc.edu/admissions/'),
    'FSU Panama City':                         ('https://www.pc.fsu.edu', 'https://admissions.fsu.edu/apply/'),
    # ── JB Charleston, SC ────────────────────────────────────────────
    'College of Charleston':                   ('https://www.cofc.edu', 'https://admissions.cofc.edu/apply/'),
    'Trident Technical College':               ('https://www.tridenttech.edu', 'https://www.tridenttech.edu/admissions/'),
    'The Citadel':                             ('https://www.citadel.edu', 'https://www.citadel.edu/root/admissions'),
    'Technical College of the Lowcountry':     ('https://www.tcl.edu', 'https://www.tcl.edu/admissions/'),
    'University of South Carolina Beaufort':   ('https://www.uscb.edu', 'https://www.uscb.edu/admissions/apply/'),
    # ── Ft. Meade / NSA area ─────────────────────────────────────────
    'University of Maryland Baltimore County': ('https://www.umbc.edu', 'https://admissions.umbc.edu/apply/'),
    'Community College of Baltimore County':   ('https://www.ccbcmd.edu', 'https://www.ccbcmd.edu/Get-Started/Apply/'),
    'Towson University':                       ('https://www.towson.edu', 'https://www.towson.edu/admissions/apply/'),
    # ── Sitka, AK ────────────────────────────────────────────────────
    'University of Alaska Southeast (Sitka)':  ('https://www.uas.alaska.edu', 'https://www.uas.alaska.edu/admissions/'),
    'University of Alaska Anchorage':          ('https://www.uaa.alaska.edu', 'https://www.uaa.alaska.edu/admissions/'),
    'Kodiak College (UAF)':                    ('https://www.kodiak.alaska.edu', 'https://www.kodiak.alaska.edu/'),
    'Alaska Pacific University':               ('https://www.alaskapacific.edu', 'https://www.alaskapacific.edu/admissions/'),
    # ── WPAFB, OH ────────────────────────────────────────────────────
    'Wright State University':                 ('https://www.wright.edu', 'https://www.wright.edu/admissions/apply'),
    'University of Dayton':                    ('https://www.udayton.edu', 'https://udayton.edu/admission/apply/'),
    'Sinclair Community College':              ('https://www.sinclair.edu', 'https://www.sinclair.edu/admissions/'),
    'Air Force Institute of Technology':       ('https://www.afit.edu', 'https://www.afit.edu/admissions/'),
    # ── Scott AFB, IL ────────────────────────────────────────────────
    'Columbia College':                        ('https://www.ccis.edu', 'https://www.ccis.edu/admissions/apply/'),
    # ── Travis AFB, CA ───────────────────────────────────────────────
    'Solano Community College':                ('https://www.solano.edu', 'https://www.solano.edu/admissions/'),
    'California State University Sacramento':  ('https://www.csus.edu', 'https://www.csus.edu/apply/'),
    'Sonoma State University':                 ('https://www.sonoma.edu', 'https://www.sonoma.edu/admissions/'),
    'University of California Davis':          ('https://www.ucdavis.edu', 'https://www.ucdavis.edu/admissions/'),
    'UC Davis':                                ('https://www.ucdavis.edu', 'https://www.ucdavis.edu/admissions/'),
    'Santa Rosa Junior College':               ('https://www.santarosa.edu', 'https://www.santarosa.edu/admissions/'),
    # ── Vandenberg SFB, CA ───────────────────────────────────────────
    'CSU Channel Islands':                     ('https://www.csuci.edu', 'https://apply.csuci.edu/'),
    'Ventura College':                         ('https://www.venturacollege.edu', 'https://www.venturacollege.edu/admissions/'),
    'Cal Lutheran University':                 ('https://www.callutheran.edu', 'https://www.callutheran.edu/admissions/'),
    'Cal State San Bernardino':                ('https://www.csusb.edu', 'https://www.csusb.edu/admissions/'),
    'Antelope Valley College':                 ('https://www.avc.edu', 'https://www.avc.edu/admissions/'),
    'California State University Mojave':      ('https://www.csub.edu', 'https://www.csub.edu/admissions/'),
    # ── Peterson SFB / Schriever SFB, CO ─────────────────────────────
    'University of Colorado Denver':           ('https://www.ucdenver.edu', 'https://admissions.ucdenver.edu/apply/'),
    'Community College of Denver':             ('https://www.ccd.edu', 'https://www.ccd.edu/admissions/'),
    'Metropolitan State University of Denver': ('https://www.msudenver.edu', 'https://www.msudenver.edu/admissions/'),
    # ── Kirtland AFB, NM ─────────────────────────────────────────────
    'University of New Mexico':                ('https://www.unm.edu', 'https://admissions.unm.edu/apply/'),
    'Central New Mexico Community College':    ('https://www.cnm.edu', 'https://www.cnm.edu/admissions/'),
    'New Mexico Highlands University':         ('https://www.nmhu.edu', 'https://www.nmhu.edu/admissions/'),
    # ── Luke AFB, AZ ─────────────────────────────────────────────────
    'Glendale Community College':              ('https://www.gccaz.edu', 'https://www.gccaz.edu/admissions/'),
    'Northern Arizona University':             ('https://nau.edu', 'https://nau.edu/admissions/apply/'),
    'Arizona State University':                ('https://www.asu.edu', 'https://admission.asu.edu/undergrad/apply'),
    'Arizona State University Online':         ('https://asuonline.asu.edu', 'https://asuonline.asu.edu/online-degree-programs/'),
    'University of Arizona':                   ('https://www.arizona.edu', 'https://admissions.arizona.edu/apply/'),
    'Pima Community College':                  ('https://www.pima.edu', 'https://www.pima.edu/admissions/'),
    # ── Hill AFB, UT ─────────────────────────────────────────────────
    'Weber State University':                  ('https://www.weber.edu', 'https://www.weber.edu/admissions/apply/'),
    'Utah State University':                   ('https://www.usu.edu', 'https://www.usu.edu/admissions/'),
    'Ogden-Weber Applied Technology College':  ('https://www.owatc.edu', 'https://www.owatc.edu/admissions/'),
    'Brigham Young University':                ('https://www.byu.edu', 'https://admissions.byu.edu/apply/'),
    # ── Nellis AFB, NV ───────────────────────────────────────────────
    'University of Nevada Las Vegas':          ('https://www.unlv.edu', 'https://www.unlv.edu/admissions/apply'),
    'College of Southern Nevada':              ('https://www.csn.edu', 'https://www.csn.edu/admissions/'),
    'Nevada State University':                 ('https://www.nevadastate.edu', 'https://www.nevadastate.edu/admissions/'),
    'Grand Canyon University':                 ('https://www.gcu.edu', 'https://www.gcu.edu/admissions/apply/'),
    'Touro University Nevada':                 ('https://tun.touro.edu', 'https://tun.touro.edu/admissions/'),
    # ── Fairchild AFB, WA ────────────────────────────────────────────
    'Eastern Washington University':           ('https://www.ewu.edu', 'https://access.ewu.edu/apply/'),
    'Washington State University':             ('https://wsu.edu', 'https://admission.wsu.edu/apply/'),
    'Gonzaga University':                      ('https://www.gonzaga.edu', 'https://www.gonzaga.edu/admission/apply/'),
    'Spokane Falls Community College':         ('https://www.spokanefalls.edu', 'https://www.spokanefalls.edu/admissions/'),
    # ── Minot AFB, ND ────────────────────────────────────────────────
    'Minot State University':                  ('https://www.minotstateu.edu', 'https://www.minotstateu.edu/enroll/'),
    'Dakota College at Bottineau':             ('https://www.dakotacollege.edu', 'https://www.dakotacollege.edu/admissions/'),
    'University of North Dakota':              ('https://und.edu', 'https://und.edu/admissions/apply/'),
    # ── Ellsworth AFB, SD ────────────────────────────────────────────
    'South Dakota School of Mines':            ('https://www.sdsmt.edu', 'https://www.sdsmt.edu/Academics/Admissions/Apply/'),
    'Western Dakota Technical College':        ('https://www.wdt.edu', 'https://www.wdt.edu/admissions/'),
    'Mount Marty University':                  ('https://www.mtmc.edu', 'https://www.mtmc.edu/admissions/apply/'),
    # ── McConnell AFB, KS ────────────────────────────────────────────
    'Wichita State University':                ('https://www.wichita.edu', 'https://admissions.wichita.edu/apply/'),
    'Wichita State Technical College':         ('https://www.wstc.edu', 'https://www.wstc.edu/admissions/'),
    # ── Barksdale AFB, LA ────────────────────────────────────────────
    'Louisiana Tech University':               ('https://www.latech.edu', 'https://www.latech.edu/admissions/apply/'),
    'LSU Shreveport':                          ('https://www.lsus.edu', 'https://www.lsus.edu/admissions/'),
    'Centenary College':                       ('https://www.centenary.edu', 'https://www.centenary.edu/admission/apply/'),
    'Bossier Parish Community College':        ('https://www.bpcc.edu', 'https://www.bpcc.edu/admissions/'),
    # ── Maxwell AFB, AL ──────────────────────────────────────────────
    'Auburn University':                       ('https://www.auburn.edu', 'https://www.auburn.edu/admissions/apply/'),
    'University of South Alabama':             ('https://www.southalabama.edu', 'https://www.southalabama.edu/departments/admissions/apply/'),
    'Faulkner University':                     ('https://www.faulkner.edu', 'https://www.faulkner.edu/admissions/apply/'),
    # ── Altus / Vance AFB, OK ────────────────────────────────────────
    'University of Central Oklahoma':          ('https://www.uco.edu', 'https://www.uco.edu/admissions/apply/'),
    'Oklahoma State University':               ('https://go.okstate.edu', 'https://go.okstate.edu/admissions/apply/'),
    'Rose State College':                      ('https://www.rose.edu', 'https://www.rose.edu/admissions/'),
    'Cisco College':                           ('https://www.cisco.edu', 'https://www.cisco.edu/admissions/'),
    'Hardin-Simmons University':               ('https://www.hsutx.edu', 'https://www.hsutx.edu/admissions/apply/'),
    'Abilene Christian University':            ('https://www.acu.edu', 'https://www.acu.edu/admissions/apply/'),
    'McMurry University':                      ('https://www.mcm.edu', 'https://www.mcm.edu/admissions/apply/'),
    # ── Keesler AFB, MS ──────────────────────────────────────────────
    'Mississippi Gulf Coast Community College': ('https://www.mgccc.edu', 'https://www.mgccc.edu/admissions/'),
    'University of Southern Mississippi':      ('https://www.usm.edu', 'https://www.usm.edu/admissions/apply/'),
    'William Carey University':                ('https://www.wmcarey.edu', 'https://www.wmcarey.edu/admissions/'),
    # ── Robins AFB, GA ───────────────────────────────────────────────
    'Valdosta State University':               ('https://www.valdosta.edu', 'https://www.valdosta.edu/admissions/apply/'),
    'South Georgia Technical College':         ('https://www.southgatech.edu', 'https://www.southgatech.edu/admissions/'),
    'Abraham Baldwin Agricultural College':    ('https://www.abac.edu', 'https://www.abac.edu/admissions/apply/'),
    # ── Seymour Johnson AFB, NC ──────────────────────────────────────
    'Wayne Community College':                 ('https://www.waynecc.edu', 'https://www.waynecc.edu/admissions/'),
    'Carteret Community College':              ('https://www.carteret.edu', 'https://www.carteret.edu/admissions/'),
    'College of the Albemarle':                ('https://www.albemarle.edu', 'https://www.albemarle.edu/admissions/'),
    'Craven Community College':                ('https://www.cravencc.edu', 'https://www.cravencc.edu/admissions/'),
    'UNC Wilmington':                          ('https://www.uncw.edu', 'https://www.uncw.edu/admissions/apply.html'),
    'Elizabeth City State University':         ('https://www.ecsu.edu', 'https://www.ecsu.edu/admissions/apply/'),
    'Coastal Carolina University':             ('https://www.coastal.edu', 'https://www.coastal.edu/admissions/'),
    # ── NS Norfolk area ──────────────────────────────────────────────
    'Stockton University':                     ('https://www.stockton.edu', 'https://www.stockton.edu/admissions/apply/'),
    'Rowan University':                        ('https://www.rowan.edu', 'https://www.rowan.edu/home/offices-services/admissions/apply/'),
    'Orange County Community College':         ('https://www.sunyorange.edu', 'https://www.sunyorange.edu/admissions/'),
    'Cape May County Community College':       ('https://www.capemaycc.edu', 'https://www.capemaycc.edu/admissions/'),
    # ── Fort Riley, KS ───────────────────────────────────────────────
    'Metropolitan Community College':          ('https://www.mcckc.edu', 'https://www.mcckc.edu/enrollment/'),
    'Bellevue University':                     ('https://www.bellevue.edu', 'https://www.bellevue.edu/admissions/apply/'),
    'University of Nebraska Omaha':            ('https://www.unomaha.edu', 'https://www.unomaha.edu/admissions/'),
    # ── Fort Sill, OK ────────────────────────────────────────────────
    'Southern Nazarene University':            ('https://www.snu.edu', 'https://www.snu.edu/admissions/apply/'),
    # ── Aberdeen Proving Ground, MD ──────────────────────────────────
    'Bowie State University':                  ('https://www.bowiestate.edu', 'https://www.bowiestate.edu/admissions/apply/'),
    # ── MCAS Miramar / NS San Diego, CA ──────────────────────────────
    'San Diego State University':              ('https://www.sdsu.edu', 'https://admissions.sdsu.edu/apply/'),
    'San Diego City College':                  ('https://www.sdcity.edu', 'https://www.sdcity.edu/Admissions/'),
    'San Diego Miramar College':               ('https://www.sdmiramar.edu', 'https://www.sdmiramar.edu/admissions/'),
    'UC San Diego':                            ('https://www.ucsd.edu', 'https://admissions.ucsd.edu/apply/'),
    'El Camino College':                       ('https://www.elcamino.edu', 'https://www.elcamino.edu/admissions/'),
    # ── Guam ─────────────────────────────────────────────────────────
    'University of Guam':                      ('https://www.uog.edu', 'https://www.uog.edu/admissions/'),
    'Guam Community College':                  ('https://www.guamcc.edu', 'https://www.guamcc.edu/admissions/'),
    # ── NB Kitsap / Puget Sound area, WA ─────────────────────────────
    'Olympic College':                         ('https://www.olympic.edu', 'https://www.olympic.edu/admissions/'),
    'Everett Community College':               ('https://www.everettcc.edu', 'https://www.everettcc.edu/admissions/'),
    'Skagit Valley College':                   ('https://www.skagit.edu', 'https://www.skagit.edu/admissions/'),
    'Western Washington University':           ('https://www.wwu.edu', 'https://admissions.wwu.edu/apply/'),
    'UW Bothell':                              ('https://www.uwb.edu', 'https://www.uwb.edu/admissions/apply/'),
    'University of Washington':                ('https://www.washington.edu', 'https://apply.washington.edu/'),
    'Seattle Central College':                 ('https://www.seattlecentral.edu', 'https://www.seattlecentral.edu/admissions/'),
    'Seattle University':                      ('https://www.seattleu.edu', 'https://www.seattleu.edu/undergraduate-admissions/apply/'),
    # ── NB San Diego, CA ─────────────────────────────────────────────
    'Point Loma Nazarene University':          ('https://www.pointloma.edu', 'https://www.pointloma.edu/undergraduate-admission/apply/'),
    'University of Southern California':       ('https://www.usc.edu', 'https://www.usc.edu/admission/undergraduate/'),
    # ── NAS Lemoore / NB Ventura County, CA ──────────────────────────
    'Cal State San Bernardino':                ('https://www.csusb.edu', 'https://www.csusb.edu/admissions/'),
    'California State University Dominguez Hills': ('https://www.csudh.edu', 'https://www.csudh.edu/admissions/'),
    'California State University East Bay':    ('https://www.csueastbay.edu', 'https://www.csueastbay.edu/admissions/'),
    'College of Alameda':                      ('https://www.alameda.peralta.edu', 'https://www.alameda.peralta.edu/admissions/'),
    'UC Berkeley':                             ('https://www.berkeley.edu', 'https://admissions.berkeley.edu/apply/'),
    'UCLA':                                    ('https://www.ucla.edu', 'https://admission.ucla.edu/apply/'),
    'UC Santa Barbara':                        ('https://www.ucsb.edu', 'https://admissions.sa.ucsb.edu/apply/'),
    # ── JBSA Lackland, TX ────────────────────────────────────────────
    'Del Mar College':                         ('https://www.delmar.edu', 'https://www.delmar.edu/admissions/'),
    'Texas A&M University Corpus Christi':     ('https://www.tamucc.edu', 'https://www.tamucc.edu/admissions/'),
    # ── Goodfellow AFB, TX ───────────────────────────────────────────
    'Cisco College':                           ('https://www.cisco.edu', 'https://www.cisco.edu/admissions/'),
    # ── Shaw AFB, SC ─────────────────────────────────────────────────
    'University of South Carolina Sumter':     ('https://www.uscsumter.edu', 'https://www.uscsumter.edu/admissions/apply/'),
    'Central Carolina Technical College':      ('https://www.cctech.edu', 'https://www.cctech.edu/admissions/'),
    # ── NS JRB Fort Worth, TX ────────────────────────────────────────
    'Texas Christian University':              ('https://www.tcu.edu', 'https://admissions.tcu.edu/apply/'),
    'Tarrant County College':                  ('https://www.tccd.edu', 'https://www.tccd.edu/admissions/'),
    # ── Pulaski Technical / Little Rock AFB, AR ──────────────────────
    'University of Arkansas at Little Rock':   ('https://ualr.edu', 'https://ualr.edu/admissions/apply/'),
    'Pulaski Technical College':               ('https://pulaskitech.edu', 'https://www.uaptc.edu/admissions/'),
    'Hendrix College':                         ('https://www.hendrix.edu', 'https://www.hendrix.edu/admission/apply/'),
    # ── Fort Huachuca, AZ ────────────────────────────────────────────
    'Cochise College':                         ('https://www.cochise.edu', 'https://www.cochise.edu/admissions/'),
    'Arizona Western College':                 ('https://www.azwestern.edu', 'https://www.azwestern.edu/admissions/'),
    # ── Montana / Malmstrom AFB ───────────────────────────────────────
    'Montana State University Bozeman':        ('https://www.montana.edu', 'https://www.montana.edu/admissions/apply/'),
    'Montana State University Great Falls':    ('https://www.msugf.edu', 'https://www.msugf.edu/admissions/'),
    'University of Providence':                ('https://www.uprovidence.edu', 'https://www.uprovidence.edu/admissions/'),
    # ── Joint Base MDL, NJ ───────────────────────────────────────────
    'Rowan University':                        ('https://www.rowan.edu', 'https://www.rowan.edu/home/offices-services/admissions/apply/'),
    # ── USCG Training Center / Cape May, NJ ──────────────────────────
    'Cape May County Community College':       ('https://www.capemaycc.edu', 'https://www.capemaycc.edu/admissions/'),
    # ── Hurlburt Field, FL ───────────────────────────────────────────
    'Northwest Florida State College':         ('https://www.nwfsc.edu', 'https://www.nwfsc.edu/admissions/'),
    # ── NAS Corpus Christi, TX ───────────────────────────────────────
    'Del Mar College':                         ('https://www.delmar.edu', 'https://www.delmar.edu/admissions/'),
    # ── Honolulu area, HI ────────────────────────────────────────────
    'Honolulu Community College':              ('https://honolulu.hawaii.edu', 'https://honolulu.hawaii.edu/apply/'),
    'Windward Community College':              ('https://www.windward.hawaii.edu', 'https://www.windward.hawaii.edu/apply/'),
    'Chaminade University':                    ('https://www.chaminade.edu', 'https://www.chaminade.edu/admission/apply/'),
    # ── Touro CA / NV ────────────────────────────────────────────────
    'Touro University California':             ('https://www.tu.edu', 'https://www.tu.edu/admissions/'),
    # ── Great Falls / Malmstrom ───────────────────────────────────────
    'University of Mary':                      ('https://www.umary.edu', 'https://www.umary.edu/admissions/apply/'),
    # ── Creighton / Omaha area ────────────────────────────────────────
    'Creighton University':                    ('https://www.creighton.edu', 'https://admissions.creighton.edu/apply/'),
    # ── National University (online) ─────────────────────────────────
    'National University':                     ('https://www.nu.edu', 'https://www.nu.edu/admissions/apply/'),
    # ── Charter College (online/Alaska) ──────────────────────────────
    'Charter College':                         ('https://www.chartercollege.edu', 'https://www.chartercollege.edu/admissions/'),
    # ── Northwest Michigan ────────────────────────────────────────────
    'Northwestern Michigan College':           ('https://www.nmc.edu', 'https://www.nmc.edu/admissions/'),
    'Central Michigan University':             ('https://www.cmich.edu', 'https://www.cmich.edu/admissions/'),
    # ── CG Boston ────────────────────────────────────────────────────
    'Massachusetts Maritime Academy':          ('https://www.maritime.edu', 'https://www.maritime.edu/admissions/apply/'),
    'Bunker Hill Community College':           ('https://www.bhcc.edu', 'https://www.bhcc.edu/admissions/'),
    'Northeastern University':                 ('https://www.northeastern.edu', 'https://admissions.northeastern.edu/apply/'),
    # ── Fort Belvoir / Pentagon area ──────────────────────────────────
    'Vassar College':                          ('https://www.vassar.edu', 'https://admissions.vassar.edu/apply/'),
    # ── South Georgia ────────────────────────────────────────────────
    'Valdosta State University':               ('https://www.valdosta.edu', 'https://www.valdosta.edu/admissions/apply/'),
    # ── USCG Sector / CG Training ─────────────────────────────────────
    'Florida Coastal School of Law':           ('https://www.fcsl.edu', 'https://www.fcsl.edu/admissions/'),
    # ── NB Everett, WA ───────────────────────────────────────────────
    'University of Washington':                ('https://www.washington.edu', 'https://apply.washington.edu/'),
    # ── NAVSUP / NSA Mechanicsburg ────────────────────────────────────
    'Shippensburg University':                 ('https://www.ship.edu', 'https://www.ship.edu/admissions/apply/'),
    # ── Aberdeen / Harford County, MD ────────────────────────────────
    'University of Maryland':                  ('https://www.umd.edu', 'https://apply.umd.edu/'),
    # ── JB Pearl Harbor-Hickam ───────────────────────────────────────
    'University of Hawaii at Manoa':           ('https://manoa.hawaii.edu', 'https://admissions.hawaii.edu/apply/'),
    # ── MCAS Cherry Point, NC ────────────────────────────────────────
    'Carteret Community College':              ('https://www.carteret.edu', 'https://www.carteret.edu/admissions/'),
    # ── NS Great Lakes / Chicago ──────────────────────────────────────
    'College of Lake County':                  ('https://www.clcillinois.edu', 'https://www.clcillinois.edu/admissions/'),
    'Rosalind Franklin University':            ('https://www.rosalindfranklin.edu', 'https://www.rosalindfranklin.edu/admissions/'),
    # ── Keesler area ─────────────────────────────────────────────────
    'Gulf Coast State College':                ('https://www.gulfcoast.edu', 'https://www.gulfcoast.edu/admissions/'),
    # ── Camp Zama / Japan ─────────────────────────────────────────────
    'Temple University Japan':                 ('https://www.tuj.ac.jp', 'https://www.tuj.ac.jp/ug/admissions/'),
    # ── MCAS Beaufort, SC ────────────────────────────────────────────
    'University of South Carolina Beaufort':   ('https://www.uscb.edu', 'https://www.uscb.edu/admissions/apply/'),
    'Technical College of the Lowcountry':     ('https://www.tcl.edu', 'https://www.tcl.edu/admissions/'),
    # ── NAS Whiting Field, FL ────────────────────────────────────────
    'Pensacola State College':                 ('https://www.pensacolastate.edu', 'https://www.pensacolastate.edu/admissions/'),
    # ── NS Norfolk / USMC Norfolk ────────────────────────────────────
    'Christopher Newport University':          ('https://www.cnu.edu', 'https://www.cnu.edu/admissions/apply/'),
    # ── Fort Campbell / Clarksville area ─────────────────────────────
    'Creighton University':                    ('https://www.creighton.edu', 'https://admissions.creighton.edu/apply/'),
    # ── Laughlin AFB, TX ─────────────────────────────────────────────
    'Sul Ross State University':               ('https://www.sulross.edu', 'https://www.sulross.edu/admissions/'),
    # ── USAF Academy / Peterson SFB, CO ──────────────────────────────
    'Colorado State University':               ('https://www.colostate.edu', 'https://admissions.colostate.edu/apply/'),
    # ── Mountain Home AFB, ID ────────────────────────────────────────
    'College of Western Idaho':                ('https://www.cwidaho.cc', 'https://www.cwidaho.cc/admissions/'),
    'Boise State University':                  ('https://www.boisestate.edu', 'https://www.boisestate.edu/admissions/'),
    # ── USCG Alaska ──────────────────────────────────────────────────
    'University of Alaska Anchorage':          ('https://www.uaa.alaska.edu', 'https://www.uaa.alaska.edu/admissions/'),
    # ── Schofield / Hawaii ───────────────────────────────────────────
    'University of Hawaii at Hilo':            ('https://hilo.hawaii.edu', 'https://hilo.hawaii.edu/admissions/'),
    # ── Fort Riley, KS ───────────────────────────────────────────────
    'Kansas State University':                 ('https://www.k-state.edu', 'https://www.k-state.edu/admissions/'),
    # ── Misc other colleges ───────────────────────────────────────────
    'St. John\'s University':                  ('https://www.stjohns.edu', 'https://www.stjohns.edu/admissions/undergraduate/apply/'),
    'Saint Mary\'s University of Minnesota':   ('https://www.smumn.edu', 'https://www.smumn.edu/admissions/apply/'),
    'College of Staten Island (CUNY)':         ('https://www.csi.cuny.edu', 'https://www.csi.cuny.edu/admissions/apply/'),
    'Lindenwood University':                   ('https://www.lindenwood.edu', 'https://www.lindenwood.edu/admissions/apply/'),
    'Mount Olive University':                  ('https://www.umo.edu', 'https://www.umo.edu/admissions/apply/'),
    'Cochise College':                         ('https://www.cochise.edu', 'https://www.cochise.edu/admissions/'),
}

def fill_college_urls(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    replacements = 0
    for college_name, (site_url, apply_url) in COLLEGE_URLS.items():
        # Match lines containing this college name with empty applyUrl/siteUrl
        # We look for: name: 'CollegeName' or name: "CollegeName"
        # with applyUrl: '' or applyUrl: ""
        # Strategy: replace applyUrl: '', siteUrl: '' on lines that contain the college name

        # Escape special regex chars in college name
        escaped = re.escape(college_name)

        # Pattern: find applyUrl: '', siteUrl: '' that follows this college name on the same line
        # We replace the empty pair on lines that contain the college name
        pattern = r"((?:['\"])" + escaped + r"(?:['\"]).*?applyUrl: )'', siteUrl: ''"
        replacement = rf"\g<1>'{apply_url}', siteUrl: '{site_url}'"
        new_content, n = re.subn(pattern, replacement, content)
        if n > 0:
            content = new_content
            replacements += n
            print(f"  ✓ {college_name} ({n} occurrence{'s' if n > 1 else ''})")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"\nTotal replacements: {replacements}")

if __name__ == '__main__':
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else '/Users/damiengantt-mcdade/PCSExpress/src/App.jsx'
    print(f"Processing {path}...")
    fill_college_urls(path)
    print("Done.")
