import { useState } from 'react'

const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const CHECKLIST_ITEMS = [
  // Green Card - Adjustment of Status
  {
    id: 'gc_i130',
    category: 'Green Card — Petition',
    text: 'File Form I-130, Petition for Alien Relative (establishes spousal relationship)',
    url: 'https://www.uscis.gov/i-130',
    note: 'Filed by U.S. citizen service member. Fee: $675 online / $820 paper (as of 4/1/2024)',
  },
  {
    id: 'gc_i485',
    category: 'Green Card — Adjustment of Status (In the U.S.)',
    text: 'File Form I-485, Application to Register Permanent Residence',
    url: 'https://www.uscis.gov/i-485',
    note: 'File when a visa number is immediately available. Fee: $1,440 (includes biometrics)',
  },
  {
    id: 'gc_i765',
    category: 'Green Card — Adjustment of Status (In the U.S.)',
    text: 'File Form I-765, Application for Employment Authorization (EAD) concurrently with I-485',
    url: 'https://www.uscis.gov/i-765',
    note: 'No additional fee when filed concurrently with I-485',
  },
  {
    id: 'gc_i131',
    category: 'Green Card — Adjustment of Status (In the U.S.)',
    text: 'File Form I-131, Advance Parole (travel document while I-485 is pending)',
    url: 'https://www.uscis.gov/i-131',
    note: 'No additional fee when filed concurrently with I-485. Do not travel outside the U.S. without it.',
  },
  {
    id: 'gc_i693',
    category: 'Green Card — Medical',
    text: 'Complete Form I-693 Medical Examination by USCIS-designated civil surgeon',
    url: 'https://www.uscis.gov/i-693',
    note: 'Must be completed by a USCIS-designated civil surgeon. Results valid for 2 years.',
  },
  {
    id: 'gc_biometrics',
    category: 'Green Card — Appointments',
    text: 'Attend ASC Biometrics Appointment (fingerprints, photo, signature)',
    url: 'https://www.uscis.gov/forms/filing-guidance/biometrics-services',
    note: 'USCIS will mail appointment notice (I-797C). Included in I-485 fee.',
  },
  {
    id: 'gc_interview',
    category: 'Green Card — Interview',
    text: 'Attend USCIS Interview (if required — bring all originals)',
    url: 'https://www.uscis.gov/green-card/after-green-card-granted/the-green-card-interview',
    note: 'Bring originals of all documents. Interpreter allowed. Military members may request waiver.',
  },
  {
    id: 'gc_docs_marriage',
    category: 'Green Card — Supporting Documents',
    text: 'Gather proof of bona fide marriage (joint lease/mortgage, bank accounts, photos, insurance)',
    url: 'https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen',
    note: 'IRS joint tax returns, joint accounts, and evidence of cohabitation are strongest.',
  },
  {
    id: 'gc_docs_citizenship',
    category: 'Green Card — Supporting Documents',
    text: 'Gather proof of U.S. citizenship for petitioner (passport, birth certificate, or Certificate of Naturalization)',
    url: 'https://www.uscis.gov/i-130',
    note: 'Required to show petitioner is a U.S. citizen.',
  },
  {
    id: 'gc_i864',
    category: 'Green Card — Financial',
    text: 'Complete Form I-864, Affidavit of Support (petitioner must meet 125% federal poverty guideline)',
    url: 'https://www.uscis.gov/i-864',
    note: 'Military members can use base pay + BAH/BAS. Joint sponsor allowed if needed.',
  },
  // Consular Processing
  {
    id: 'cp_nvc',
    category: 'Green Card — Consular Processing (Abroad)',
    text: 'Receive National Visa Center (NVC) case number after I-130 approval',
    url: 'https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process/step-1-submit-a-petition.html',
    note: 'NVC collects fees and documents before scheduling consular interview.',
  },
  {
    id: 'cp_ds260',
    category: 'Green Card — Consular Processing (Abroad)',
    text: 'Complete Form DS-260, Immigrant Visa Application (online via Ceac.state.gov)',
    url: 'https://ceac.state.gov/IV',
    note: 'Required for consular processing. Complete all sections carefully.',
  },
  // Parole in Place
  {
    id: 'pip_apply',
    category: 'Parole in Place (PIP) — Military Families',
    text: 'Apply for Parole in Place if spouse entered without inspection (EWI)',
    url: 'https://www.uscis.gov/military/immigration-benefits-for-military-members-and-their-families',
    note: 'PIP allows undocumented spouses of active duty military to adjust status without leaving the U.S.',
  },
  // Citizenship
  {
    id: 'cit_eligibility',
    category: 'Citizenship (Naturalization) — Eligibility',
    text: 'Confirm eligibility: 3 years as LPR if married to and living with U.S. citizen spouse (5 years general)',
    url: 'https://www.uscis.gov/citizenship/learn-about-citizenship/10-steps-to-naturalization',
    note: 'Must have continuous residence and physical presence. USCIS has 10-step guide.',
  },
  {
    id: 'cit_n400',
    category: 'Citizenship (Naturalization) — Application',
    text: 'File Form N-400, Application for Naturalization',
    url: 'https://www.uscis.gov/n-400',
    note: 'Fee: $760 (military members serving honorably pay $0). Can file online or by mail.',
  },
  {
    id: 'cit_biometrics',
    category: 'Citizenship (Naturalization) — Appointments',
    text: 'Attend ASC Biometrics Appointment for N-400',
    url: 'https://www.uscis.gov/citizenship/learn-about-citizenship/the-naturalization-interview-and-test',
    note: 'USCIS will mail appointment notice after filing.',
  },
  {
    id: 'cit_interview',
    category: 'Citizenship (Naturalization) — Interview & Test',
    text: 'Attend USCIS Naturalization Interview and civics/English test',
    url: 'https://www.uscis.gov/citizenship/learn-about-citizenship/the-naturalization-interview-and-test',
    note: '100 civics questions; 6/10 required to pass. English reading, writing, and speaking tested.',
  },
  {
    id: 'cit_study',
    category: 'Citizenship (Naturalization) — Interview & Test',
    text: 'Study using USCIS official study materials and practice tests',
    url: 'https://www.uscis.gov/citizenship/find-study-materials-and-resources',
    note: 'Free flashcards, practice tests, and civics study guide on USCIS.gov.',
  },
  {
    id: 'cit_ceremony',
    category: 'Citizenship (Naturalization) — Oath',
    text: 'Attend Oath of Allegiance Ceremony',
    url: 'https://www.uscis.gov/citizenship/learn-about-citizenship/the-oath-of-allegiance',
    note: 'After passing the interview, USCIS schedules the oath ceremony. Receive Certificate of Naturalization.',
  },
  {
    id: 'cit_passport',
    category: 'Citizenship (Naturalization) — After Citizenship',
    text: 'Apply for U.S. Passport after receiving Certificate of Naturalization',
    url: 'https://travel.state.gov/content/travel/en/passports/need-passport/first-time.html',
    note: 'Apply at any passport acceptance facility. Expedited passport available for PCS orders.',
  },
];

const CATEGORIES = [...new Set(CHECKLIST_ITEMS.map(i => i.category))];

const GREEN_CARD_STEPS = [
  {
    num: 1,
    title: 'Understand Your Path — Immediate Relative Priority',
    body: 'As the spouse of a U.S. citizen active duty service member, you are classified as an Immediate Relative under INA §201(b). This means there is NO annual visa cap and no waiting for a visa number — your case moves as soon as USCIS approves the petition.',
    url: 'https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-immediate-relatives-of-us-citizen',
    link: 'Immediate Relative Green Card — USCIS.gov',
  },
  {
    num: 2,
    title: 'Service Member Files Form I-130 (Petition for Alien Relative)',
    body: 'The U.S. citizen service member files Form I-130 to establish the legal family relationship. Attach your marriage certificate, proof of U.S. citizenship, and evidence of a bona fide marriage (joint bank account, lease, photos together).',
    url: 'https://www.uscis.gov/i-130',
    link: 'Form I-130 — USCIS.gov',
    fee: '$675 (online) / $820 (paper) — as of April 1, 2024',
  },
  {
    num: 3,
    title: 'File Form I-485 — Adjustment of Status (If in the U.S.)',
    body: 'If your spouse is currently in the United States, file Form I-485 to adjust status to Lawful Permanent Resident. File concurrently with Form I-765 (Employment Authorization) and Form I-131 (Advance Parole/Travel Document) at no additional cost.',
    url: 'https://www.uscis.gov/i-485',
    link: 'Form I-485 — USCIS.gov',
    fee: '$1,440 (includes biometrics, I-765, and I-131 if filed concurrently)',
  },
  {
    num: 4,
    title: 'Consular Processing — If Spouse Is Abroad',
    body: 'If your spouse is outside the U.S., after I-130 approval the case transfers to the National Visa Center (NVC). NVC collects fees and the DS-260 application, then schedules an immigrant visa interview at the nearest U.S. Embassy or Consulate.',
    url: 'https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process.html',
    link: 'Immigrant Visa Process — Travel.State.gov',
  },
  {
    num: 5,
    title: 'Complete Medical Examination (Form I-693)',
    body: 'All green card applicants must undergo a medical examination by a USCIS-designated civil surgeon. The results are submitted directly to USCIS in a sealed envelope. Results are valid for 2 years from the date of the civil surgeon\'s signature.',
    url: 'https://www.uscis.gov/i-693',
    link: 'Form I-693 & Find a Civil Surgeon — USCIS.gov',
  },
  {
    num: 6,
    title: 'File Form I-864 — Affidavit of Support',
    body: 'The petitioning service member must demonstrate financial ability to support the immigrant at 125% of the federal poverty guideline. Active duty military pay (base pay, BAH, BAS) all count toward income. A joint sponsor can be used if needed.',
    url: 'https://www.uscis.gov/i-864',
    link: 'Form I-864 — USCIS.gov',
  },
  {
    num: 7,
    title: 'Attend Biometrics Appointment',
    body: 'USCIS will mail a biometrics appointment notice (Form I-797C) to attend an Application Support Center (ASC). Fingerprints, photo, and signature are collected. Included in the I-485 fee.',
    url: 'https://www.uscis.gov/forms/filing-guidance/biometrics-services',
    link: 'Biometrics Services — USCIS.gov',
  },
  {
    num: 8,
    title: 'Attend the USCIS Interview (If Scheduled)',
    body: 'USCIS may schedule an interview for the couple to verify the bona fide nature of the marriage. Bring originals of all previously submitted documents. An interpreter is allowed. Active duty military members deployed overseas may request an interview waiver.',
    url: 'https://www.uscis.gov/green-card/after-green-card-granted/the-green-card-interview',
    link: 'Green Card Interview — USCIS.gov',
  },
  {
    num: 9,
    title: 'Parole in Place (PIP) — Special Military Provision',
    body: 'Spouses, children, and parents of active duty U.S. military members who entered the United States without inspection (EWI) may be eligible for Parole in Place (PIP). PIP allows them to remain in the U.S. and adjust status without departing. This is a critical military family benefit.',
    url: 'https://www.uscis.gov/military/immigration-benefits-for-military-members-and-their-families',
    link: 'Military Family Immigration Benefits (PIP) — USCIS.gov',
    highlight: true,
  },
];

const CITIZENSHIP_STEPS = [
  {
    num: 1,
    title: 'Determine Eligibility — 3-Year vs 5-Year Rule',
    body: 'Spouses of U.S. citizens can apply for naturalization after only 3 years as a Lawful Permanent Resident (LPR), compared to the standard 5 years — provided you have been married to and living with your U.S. citizen spouse for all 3 years. You must also have continuous residence and physical presence in the U.S.',
    url: 'https://www.uscis.gov/citizenship/learn-about-citizenship/10-steps-to-naturalization',
    link: '10 Steps to Naturalization — USCIS.gov',
  },
  {
    num: 2,
    title: 'File Form N-400 — Application for Naturalization',
    body: 'File Form N-400 online or by mail. You can file up to 90 days before meeting the required residency period. Attach your Green Card (front and back), photos, and any required supporting documents. Active duty military members who have served honorably for any period pay no filing fee.',
    url: 'https://www.uscis.gov/n-400',
    link: 'Form N-400 — USCIS.gov',
    fee: '$760 standard / $0 for military members serving honorably',
  },
  {
    num: 3,
    title: 'Prepare for the Civics and English Test',
    body: 'USCIS tests applicants on U.S. civics (from a list of 100 questions — 6 of 10 must be answered correctly) and English reading, writing, and speaking. USCIS provides free official study materials, flashcards, and practice tests on their website.',
    url: 'https://www.uscis.gov/citizenship/find-study-materials-and-resources',
    link: 'Free USCIS Study Materials — USCIS.gov',
  },
  {
    num: 4,
    title: 'Attend the Naturalization Interview',
    body: 'A USCIS officer reviews your application, conducts the civics and English test, and verifies your eligibility. Bring your Permanent Resident Card, a state-issued ID, your passport, and any documents related to your application.',
    url: 'https://www.uscis.gov/citizenship/learn-about-citizenship/the-naturalization-interview-and-test',
    link: 'The Naturalization Interview & Test — USCIS.gov',
  },
  {
    num: 5,
    title: 'Take the Oath of Allegiance',
    body: 'After passing the interview and being approved, you will be scheduled for an Oath of Allegiance ceremony. You will receive your Certificate of Naturalization at the ceremony — you are now a U.S. citizen.',
    url: 'https://www.uscis.gov/citizenship/learn-about-citizenship/the-oath-of-allegiance',
    link: 'The Oath of Allegiance — USCIS.gov',
  },
  {
    num: 6,
    title: 'Apply for Your U.S. Passport',
    body: 'With your Certificate of Naturalization, apply for a U.S. passport at any passport acceptance facility (post office, library, etc.). If you have PCS orders, you may request expedited processing and a no-fee government passport.',
    url: 'https://travel.state.gov/content/travel/en/passports/need-passport/first-time.html',
    link: 'Apply for a Passport — Travel.State.gov',
  },
];

const LEGAL_RESOURCES = [
  {
    name: 'Military Legal Assistance Office (JAG)',
    tag: 'FREE — On Base',
    desc: 'Every installation has a Judge Advocate General (JAG) office that provides FREE legal assistance to active duty service members, their dependents, and retirees. Immigration matters — including green card and naturalization assistance — are within scope. Request an appointment through your installation\'s legal office.',
    url: 'https://legalassistance.law.af.mil',
    urlLabel: 'Find Your Legal Assistance Office',
  },
  {
    name: 'Military OneSource — Legal Consultations',
    tag: 'FREE — 30 Min Sessions',
    desc: 'Military OneSource provides up to 30-minute free consultations with a licensed attorney for non-criminal matters, including immigration questions. Available 24/7 by phone and online. Does not provide representation, but can provide guidance and referrals.',
    url: 'https://www.militaryonesource.mil/legal',
    urlLabel: 'Military OneSource Legal Help',
  },
  {
    name: 'USCIS Free and Low-Cost Legal Help',
    tag: 'FREE / Low Cost',
    desc: 'USCIS maintains a list of accredited representatives and nonprofit organizations that provide free or low-cost immigration legal assistance. Accredited representatives are reviewed and approved by the Department of Justice (DOJ). Never pay for immigration help from an unaccredited provider.',
    url: 'https://www.uscis.gov/legal-resources/find-legal-advice/free-and-low-cost-legal-help',
    urlLabel: 'USCIS Free Legal Help Directory',
  },
  {
    name: 'USCIS Avoid Scams — Notario Fraud',
    tag: 'IMPORTANT',
    desc: 'USCIS warns against immigration "consultants," "notarios," or anyone not a licensed attorney or accredited representative who charges to prepare immigration forms. Only attorneys and DOJ-accredited representatives may provide immigration legal advice.',
    url: 'https://www.uscis.gov/avoid-scams',
    urlLabel: 'Protect Yourself from Immigration Scams — USCIS.gov',
  },
  {
    name: 'National Immigration Legal Services Center',
    tag: 'FREE / Low Cost',
    desc: 'The Immigration Advocates Network\'s directory lists free and low-cost legal service providers in every state. Includes organizations that specialize in military family immigration cases.',
    url: 'https://www.immigrationadvocates.org/nonprofit/legaldirectory',
    urlLabel: 'Free Legal Services Directory',
  },
  {
    name: 'ABA Military Pro Bono Project',
    tag: 'FREE — Pro Bono',
    desc: 'The American Bar Association Military Pro Bono Project connects active duty service members and their families with volunteer attorneys for civil legal matters, including immigration. Referrals for complex cases beyond JAG scope.',
    url: 'https://www.americanbar.org/groups/legal_aid_indigent_defendants/militaryprob/',
    urlLabel: 'ABA Military Pro Bono Project',
  },
  {
    name: 'USCIS Military Help Line',
    tag: 'Direct USCIS Contact',
    desc: 'USCIS has a dedicated military help line for service members, veterans, and their families. Call 1-877-CIS-4MIL (1-877-247-4645) Monday–Friday 8am–8pm ET. Staff can answer questions about cases, forms, and military-specific benefits.',
    url: 'https://www.uscis.gov/military',
    urlLabel: 'USCIS Military Resources Page',
  },
];

export default function ImmigrationModule({ theme }) {
  const [subTab, setSubTab] = useState('greencard');
  const [checked, setChecked] = useState(() => store.get('immi_checklist') || {});
  const [expandedCat, setExpandedCat] = useState(CATEGORIES[0]);

  const toggle = (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    store.set('immi_checklist', next);
  };

  const totalDone = Object.values(checked).filter(Boolean).length;

  const SUB_TABS = [
    { id: 'greencard', label: 'Green Card' },
    { id: 'citizenship', label: 'Citizenship' },
    { id: 'legal', label: 'Military Legal Help' },
    { id: 'checklist', label: `Checklist (${totalDone}/${CHECKLIST_ITEMS.length})` },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Permanent Resident & Naturalization Guide</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>Official USCIS information for military spouses and families. Free legal assistance is available through your installation JAG office.</div>
        <a href="https://www.uscis.gov/military" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', color: '#FFF', fontSize: 11, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' }}>USCIS Military Page →</a>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} style={{ flexShrink: 0, padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${subTab === t.id ? theme.primary : '#E0E6EE'}`, background: subTab === t.id ? theme.primary : '#FFF', color: subTab === t.id ? '#FFF' : '#56697C', fontSize: 11, cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Green Card Tab */}
      {subTab === 'greencard' && (
        <div>
          <div style={{ background: '#E3F2FD', borderRadius: 10, padding: 12, marginBottom: 16, borderLeft: '3px solid #1565C0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', marginBottom: 4 }}>Immediate Relative — No Annual Cap</div>
            <div style={{ fontSize: 11, color: '#0D47A1', lineHeight: 1.5 }}>As the spouse of a U.S. citizen, you are an <strong>Immediate Relative</strong> under U.S. immigration law. There is no annual numerical limit on immigrant visas — your case moves as soon as USCIS approves the petition.</div>
          </div>
          {GREEN_CARD_STEPS.map(s => (
            <div key={s.num} style={{ background: s.highlight ? `${theme.primary}08` : '#FFF', border: `1px solid ${s.highlight ? theme.primary : '#E0E6EE'}`, borderLeft: `3px solid ${s.highlight ? theme.accent : theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: theme.primary, color: '#FFF', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.num}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: '#4A5568', lineHeight: 1.6, marginBottom: s.fee ? 6 : 8 }}>{s.body}</div>
                {s.fee && (
                  <div style={{ display: 'inline-block', background: '#FFF3E0', color: '#E65100', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, marginBottom: 8 }}>Fee: {s.fee}</div>
                )}
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '5px 12px', borderRadius: 7, background: theme.primary, color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: 10 }}>{s.link} →</a>
              </div>
            </div>
          ))}
          <div style={{ background: '#FFF8E1', border: '1px solid #FFD54F', borderRadius: 10, padding: 12, marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#F57F17', marginBottom: 4 }}>Important Processing Note</div>
            <div style={{ fontSize: 11, color: '#5D4037', lineHeight: 1.5 }}>USCIS processing times vary. Check current processing times at <a href="https://egov.uscis.gov/processing-times/" target="_blank" rel="noopener noreferrer" style={{ color: theme.primary, fontWeight: 700 }}>egov.uscis.gov/processing-times</a>. Request case expedite if a PCS move requires urgent travel documents.</div>
          </div>
        </div>
      )}

      {/* Citizenship Tab */}
      {subTab === 'citizenship' && (
        <div>
          <div style={{ background: '#E8F5E9', borderRadius: 10, padding: 12, marginBottom: 16, borderLeft: '3px solid #2E7D32' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2E7D32', marginBottom: 4 }}>3-Year Benefit for Military Spouses</div>
            <div style={{ fontSize: 11, color: '#1B5E20', lineHeight: 1.5 }}>Military spouses may apply for citizenship after only <strong>3 years</strong> as a permanent resident — compared to the standard 5 years. This benefit applies when married to and living with the U.S. citizen service member throughout those 3 years.</div>
          </div>
          {CITIZENSHIP_STEPS.map(s => (
            <div key={s.num} style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2E7D32', color: '#FFF', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.num}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: '#4A5568', lineHeight: 1.6, marginBottom: s.fee ? 6 : 8 }}>{s.body}</div>
                {s.fee && (
                  <div style={{ display: 'inline-block', background: '#F3E5F5', color: '#6A1B9A', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, marginBottom: 8 }}>Fee: {s.fee}</div>
                )}
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '5px 12px', borderRadius: 7, background: '#2E7D32', color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: 10 }}>{s.link} →</a>
              </div>
            </div>
          ))}
          <div style={{ background: '#E3F2FD', border: '1px solid #90CAF9', borderRadius: 10, padding: 12, marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', marginBottom: 4 }}>USCIS Civics Practice Test</div>
            <div style={{ fontSize: 11, color: '#0D47A1', lineHeight: 1.5, marginBottom: 8 }}>Practice all 100 civics questions for the naturalization test — available free on USCIS.gov.</div>
            <a href="https://www.uscis.gov/citizenship/find-study-materials-and-resources/study-for-the-test/civics-practice-test" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 8, background: '#1565C0', color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: 11 }}>Take Practice Test →</a>
          </div>
        </div>
      )}

      {/* Legal Help Tab */}
      {subTab === 'legal' && (
        <div>
          <div style={{ background: `${theme.primary}10`, border: `1px solid ${theme.primary}30`, borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: theme.primary, marginBottom: 4 }}>You Have Free Legal Help Available</div>
            <div style={{ fontSize: 11, color: '#4A5568', lineHeight: 1.5 }}>Active duty service members and their dependents have access to free immigration legal assistance through the Judge Advocate General (JAG) office on every installation. Always start there before paying for outside counsel.</div>
          </div>
          {LEGAL_RESOURCES.map((r, i) => {
            const isWarning = r.tag === 'IMPORTANT';
            return (
              <div key={i} style={{ background: isWarning ? '#FFF8E1' : '#FFF', border: `1px solid ${isWarning ? '#FFD54F' : '#E0E6EE'}`, borderLeft: `3px solid ${isWarning ? '#F57F17' : theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0D1821', flex: 1, marginRight: 8 }}>{r.name}</div>
                  <span style={{ background: isWarning ? '#FFF3E0' : `${theme.primary}15`, color: isWarning ? '#E65100' : theme.primary, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>{r.tag}</span>
                </div>
                <div style={{ fontSize: 11, color: '#4A5568', lineHeight: 1.6, marginBottom: 8 }}>{r.desc}</div>
                <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 8, background: isWarning ? '#E65100' : theme.primary, color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: 11 }}>{r.urlLabel} →</a>
              </div>
            );
          })}
        </div>
      )}

      {/* Checklist Tab */}
      {subTab === 'checklist' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0D1821' }}>USCIS Requirements Checklist</div>
            <div style={{ background: theme.primary, color: '#FFF', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10 }}>{totalDone}/{CHECKLIST_ITEMS.length} Done</div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, background: '#E0E6EE', borderRadius: 3, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(totalDone / CHECKLIST_ITEMS.length) * 100}%`, background: theme.primary, borderRadius: 3, transition: 'width .3s' }} />
          </div>

          {CATEGORIES.map(cat => {
            const items = CHECKLIST_ITEMS.filter(i => i.category === cat);
            const catDone = items.filter(i => checked[i.id]).length;
            const isOpen = expandedCat === cat;
            return (
              <div key={cat} style={{ marginBottom: 10 }}>
                <button onClick={() => setExpandedCat(isOpen ? null : cat)} style={{ width: '100%', textAlign: 'left', background: isOpen ? theme.primary : '#FFF', border: `1px solid ${isOpen ? theme.primary : '#E0E6EE'}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: isOpen ? '#FFF' : '#0D1821' }}>{cat}</div>
                    <div style={{ fontSize: 10, color: isOpen ? 'rgba(255,255,255,0.7)' : '#56697C', marginTop: 2 }}>{catDone}/{items.length} completed</div>
                  </div>
                  <span style={{ fontSize: 14, color: isOpen ? '#FFF' : theme.primary }}>{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div style={{ border: '1px solid #E0E6EE', borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                    {items.map((item, idx) => (
                      <div key={item.id} style={{ padding: '12px 14px', borderTop: idx > 0 ? '1px solid #F0F4F8' : 'none', background: checked[item.id] ? '#F0FFF4' : '#FFF', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div onClick={() => toggle(item.id)} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${checked[item.id] ? theme.primary : '#C8D0DB'}`, background: checked[item.id] ? theme.primary : '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 1 }}>
                          {checked[item.id] && <span style={{ color: '#FFF', fontSize: 13, fontWeight: 900 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: checked[item.id] ? '#2E7D32' : '#0D1821', marginBottom: 3, textDecoration: checked[item.id] ? 'line-through' : 'none' }}>{item.text}</div>
                          {item.note && <div style={{ fontSize: 10, color: '#56697C', marginBottom: 6, lineHeight: 1.4 }}>{item.note}</div>}
                          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: theme.primary, fontWeight: 700, textDecoration: 'none' }}>View on USCIS.gov →</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ background: '#F8FAFC', border: '1px solid #E0E6EE', borderRadius: 10, padding: 12, marginTop: 8 }}>
            <div style={{ fontSize: 10, color: '#56697C', lineHeight: 1.5 }}>All checklist items link directly to official USCIS.gov pages. For personalized guidance, contact your installation JAG office or call the USCIS Military Help Line: <strong style={{ color: theme.primary }}>1-877-247-4645</strong> (Mon–Fri 8am–8pm ET).</div>
          </div>
        </div>
      )}
    </div>
  );
}
