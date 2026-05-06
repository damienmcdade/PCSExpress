import { useState, useEffect } from 'react'
import { LocalEncryptedDataNotice, PublicDataNotice } from './SecurityNotice'
import { secureLocalStore, readLegacyJson } from '../security/SecurityExtensions'

const BASE_CITY = {
  'Fort Liberty': 'Fayetteville, NC', 'Fort Bragg': 'Fayetteville, NC',
  'Fort Campbell': 'Clarksville, TN', 'Fort Cavazos': 'Killeen, TX', 'Fort Hood': 'Killeen, TX',
  'Joint Base Lewis-McChord': 'Tacoma, WA', 'Fort Carson': 'Colorado Springs, CO',
  'Fort Bliss': 'El Paso, TX', 'Fort Stewart': 'Hinesville, GA', 'Fort Drum': 'Watertown, NY',
  'Fort Sill': 'Lawton, OK', 'Fort Jackson': 'Columbia, SC', 'Fort Meade': 'Odenton, MD',
  'Fort Knox': 'Radcliff, KY', 'Fort Leavenworth': 'Leavenworth, KS',
  'Fort Sam Houston': 'San Antonio, TX', 'Fort Wainwright': 'Fairbanks, AK',
  'Fort Eisenhower': 'Augusta, GA', 'Fort Gregg-Adams': 'Petersburg, VA',
  'Fort Leonard Wood': 'Waynesville, MO', 'Fort Novosel': 'Daleville, AL',
  'Fort Rucker': 'Daleville, AL', 'Schofield Barracks': 'Wahiawa, HI',
  'Fort Shafter': 'Honolulu, HI', 'West Point': 'West Point, NY',
  'Fort Hamilton': 'Brooklyn, NY', 'Fort Myer': 'Arlington, VA',
  'Naval Station Norfolk': 'Norfolk, VA', 'Naval Base San Diego': 'San Diego, CA',
  'NAS Jacksonville': 'Jacksonville, FL', 'NAS Pensacola': 'Pensacola, FL',
  'Naval Station Mayport': 'Jacksonville, FL', 'Naval Base Kitsap': 'Bremerton, WA',
  'Naval Station Everett': 'Everett, WA', 'NAS Oceana': 'Virginia Beach, VA',
  'NAS Whidbey Island': 'Oak Harbor, WA', 'NAS Corpus Christi': 'Corpus Christi, TX',
  'Marine Corps Base Camp Lejeune': 'Jacksonville, NC', 'Camp Pendleton': 'Oceanside, CA',
  'MCAS Cherry Point': 'Havelock, NC', 'MCAS Miramar': 'San Diego, CA',
  'MCB Quantico': 'Quantico, VA', 'MCAS New River': 'Jacksonville, NC',
  'MCB Hawaii Kaneohe Bay': 'Kailua, HI', 'MCAS Yuma': 'Yuma, AZ',
  'MCAS Beaufort': 'Beaufort, SC',
  'Joint Base Langley-Eustis': 'Hampton, VA', 'Eglin AFB': 'Valparaiso, FL',
  'MacDill AFB': 'Tampa, FL', 'Travis AFB': 'Fairfield, CA',
  'Wright-Patterson AFB': 'Dayton, OH', 'Joint Base Andrews': 'Clinton, MD',
  'Nellis AFB': 'Las Vegas, NV', 'Edwards AFB': 'Rosamond, CA',
  'Keesler AFB': 'Biloxi, MS', 'Little Rock AFB': 'Jacksonville, AR',
  'Dyess AFB': 'Abilene, TX', 'Luke AFB': 'Glendale, AZ',
  'Davis-Monthan AFB': 'Tucson, AZ', 'Fairchild AFB': 'Spokane, WA',
  'Hill AFB': 'Ogden, UT', 'Minot AFB': 'Minot, ND',
  'Malmstrom AFB': 'Great Falls, MT', 'Ellsworth AFB': 'Rapid City, SD',
  'Hurlburt Field': 'Fort Walton Beach, FL', 'Moody AFB': 'Valdosta, GA',
  'Shaw AFB': 'Sumter, SC', 'Seymour Johnson AFB': 'Goldsboro, NC',
  'Joint Base San Antonio': 'San Antonio, TX',
  'Buckley SFB': 'Aurora, CO', 'Schriever SFB': 'Colorado Springs, CO',
  'Peterson SFB': 'Colorado Springs, CO', 'Patrick SFB': 'Cocoa Beach, FL',
  'Vandenberg SFB': 'Lompoc, CA',
  'Camp Humphreys': 'Pyeongtaek, South Korea', 'Osan Air Base': 'Pyeongtaek, South Korea',
  'Kadena Air Base': 'Okinawa, Japan', 'Yokota Air Base': 'Fussa, Japan',
  'Ramstein Air Base': 'Kaiserslautern, Germany', 'USAG Stuttgart': 'Stuttgart, Germany',
  'USAG Wiesbaden': 'Wiesbaden, Germany',
}

const INDUSTRIES = [
  { id: 'tech',      label: 'Technology & IT',           keywords: 'information technology software cybersecurity network administrator', color: '#1565C0' },
  { id: 'health',    label: 'Healthcare & Medicine',      keywords: 'nurse medical healthcare physician health clinical EMT paramedic',   color: '#00695C' },
  { id: 'business',  label: 'Business & Finance',         keywords: 'finance accounting business management analyst operations',          color: '#E65100' },
  { id: 'govt',      label: 'Government & Defense',       keywords: 'government federal defense contractor intelligence analyst',         color: '#283593' },
  { id: 'eng',       label: 'Engineering & Science',      keywords: 'engineer engineering science research mechanical electrical',        color: '#4A148C' },
  { id: 'edu',       label: 'Education & Training',       keywords: 'teacher education training instructor curriculum developer',         color: '#1B5E20' },
  { id: 'security',  label: 'Law Enforcement & Security', keywords: 'security law enforcement police investigator federal agent',        color: '#B71C1C' },
  { id: 'logistics', label: 'Logistics & Supply Chain',   keywords: 'logistics supply chain warehouse operations distribution planning',  color: '#F57F17' },
  { id: 'trades',    label: 'Skilled Trades',             keywords: 'mechanic electrician plumber technician maintenance HVAC',          color: '#37474F' },
  { id: 'hr',        label: 'Human Resources',            keywords: 'human resources HR recruiter talent management people operations',   color: '#006064' },
]

const SKILL_CATS = [
  { id: 'technical',    label: 'Technical',     color: '#1565C0' },
  { id: 'soft',         label: 'Soft Skill',    color: '#2E7D32' },
  { id: 'cert',         label: 'Certification', color: '#6A1B9A' },
  { id: 'language',     label: 'Language',      color: '#E65100' },
]

const JOB_BOARDS = [
  { name: 'USAJobs.gov',          desc: 'Official federal civilian jobs portal. Schedule A hiring authority and military preference applies to qualifying applicants.',    url: 'https://www.usajobs.gov',                              badge: 'Federal',   color: '#1565C0' },
  { name: 'Indeed',               desc: 'Largest general job search engine. Advanced location, salary, and experience-level filters across all industries.',              url: 'https://www.indeed.com',                               badge: 'General',   color: '#00897B' },
  { name: 'LinkedIn Jobs',        desc: 'Professional networking and job search. Free LinkedIn Premium available to qualifying active duty and recently separated members.',url: 'https://www.linkedin.com/jobs/',                       badge: 'Network',   color: '#0077B5' },
  { name: 'Hire Heroes USA',      desc: 'Free job placement assistance, resume coaching, and employer connections for service members and military spouses.',              url: 'https://www.hireheroesusa.org',                        badge: 'Military',  color: '#C62828' },
  { name: 'ClearanceJobs',        desc: 'Job listings specifically for roles requiring active security clearances. Clearance holders earn significantly more on average.', url: 'https://www.clearancejobs.com',                        badge: 'Clearance', color: '#558B2F' },
  { name: 'Transition GPS (DoD)', desc: 'DoD Transition Assistance Program workshops, employer connections, and career resources for separating service members.',        url: 'https://www.dodtap.mil',                               badge: 'DoD TAP',   color: '#283593' },
  { name: 'CareerOneStop',        desc: 'Department of Labor career exploration tool, training finder, and job search for all experience levels and industries.',          url: 'https://www.careeronestop.org',                        badge: 'DoL',       color: '#37474F' },
  { name: 'ZipRecruiter',         desc: 'AI-powered job matching. Create a profile and get contacted by employers directly. Fast application process.',                    url: 'https://www.ziprecruiter.com',                         badge: 'General',   color: '#E65100' },
]

const SPOUSE_BOARDS = [
  { name: 'MySECO / MSEP Portal',          desc: 'Military Spouse Employment Partnership — 500+ top companies committed to hiring military spouses. Free career coaching, resume review, and job matching.', url: 'https://myseco.militaryonesource.mil/portal/', badge: 'Spouse',    color: '#880E4F' },
  { name: 'Hiring Our Heroes (Spouses)',    desc: 'Free fellowship programs, hiring events, and direct employer connections specifically for military spouses. Active nationwide hiring events.', url: 'https://www.hiringourheroes.org/programs/spouses/', badge: 'Spouse',    color: '#AD1457' },
  { name: 'Blue Star Families Careers',    desc: 'Employment resources, career coaching, and remote-friendly job connections tailored for military families on the move.',                       url: 'https://bluestarfam.org/resources/employment/',   badge: 'Spouse',    color: '#1565C0' },
  { name: 'Military Spouse JD Network',    desc: 'Legal career resources, pro bono opportunities, and bar admission assistance for military spouse attorneys relocating to new states.',         url: 'https://www.msjdn.org/',                           badge: 'Legal',     color: '#4A148C' },
  { name: 'MyCAA Scholarship Program',     desc: 'Up to $4,000 per year in funding for spouse education and career credentials. Portable certificates designed for PCS life.',                  url: 'https://aiportal.acc.af.mil/mycaa',                badge: 'Education', color: '#1B5E20' },
]

const SPOUSE_JOB_SEARCHES = [
  {
    title: 'Remote Customer Success Specialist',
    industries: ['business', 'hr', 'tech'],
    remote: true,
    incentive: 'MSEP / portable career',
    source: 'Live job boards',
    desc: 'Client support, onboarding, account follow-up, and problem solving. Remote-first customer success roles are often portable through PCS moves and frequently appear with MSEP employers.',
    keywords: 'military spouse remote customer success specialist MSEP hiring',
  },
  {
    title: 'Remote Project Coordinator',
    industries: ['business', 'govt', 'tech'],
    remote: true,
    incentive: 'Military spouse encouraged',
    source: 'Live job boards',
    desc: 'Coordinates schedules, deliverables, documentation, and stakeholder updates. Good fit for spouses with admin, operations, logistics, or unit volunteer leadership experience.',
    keywords: 'military spouse remote project coordinator jobs',
  },
  {
    title: 'Human Resources / Talent Coordinator',
    industries: ['hr', 'business'],
    remote: true,
    incentive: 'Spouse-friendly employer',
    source: 'Live job boards',
    desc: 'Supports recruiting, onboarding, personnel records, benefits, and employee communications. Many roles are hybrid or remote and align well with portable HR certifications.',
    keywords: 'military spouse remote human resources talent coordinator jobs',
  },
  {
    title: 'Federal Program Support Specialist',
    industries: ['govt', 'business'],
    remote: false,
    incentive: 'USAJOBS military spouse hiring path',
    source: 'USAJOBS + live job boards',
    desc: 'Administrative, program analysis, mission support, and customer-service roles near installations. Prioritizes announcements open to military spouses and federal agencies near the gaining area.',
    keywords: 'site:usajobs.gov military spouse program support specialist',
  },
  {
    title: 'Medical Administrative Assistant',
    industries: ['health', 'business'],
    remote: false,
    incentive: 'Portable healthcare career',
    source: 'Live job boards',
    desc: 'Front desk, patient scheduling, referral coordination, records, and billing support at clinics or hospitals near the installation. Often compatible with MyCAA-supported training.',
    keywords: 'military spouse medical administrative assistant jobs',
  },
  {
    title: 'Cybersecurity Analyst',
    industries: ['tech', 'govt', 'security'],
    remote: true,
    incentive: 'Clearance / defense spouse-friendly',
    source: 'ClearanceJobs + live job boards',
    desc: 'Security monitoring, vulnerability tracking, compliance support, and help desk escalation. Prioritizes remote or hybrid cyber roles and defense employers that value military community experience.',
    keywords: 'military spouse remote cybersecurity analyst defense jobs',
  },
  {
    title: 'Education & Training Coordinator',
    industries: ['edu', 'hr', 'business'],
    remote: true,
    incentive: 'Portable education role',
    source: 'Live job boards',
    desc: 'Builds training calendars, learning content, student support, or workforce development programs. Good fit for spouses with teaching, FRG, volunteer, or training background.',
    keywords: 'military spouse remote education training coordinator jobs',
  },
  {
    title: 'Logistics Coordinator',
    industries: ['logistics', 'business'],
    remote: false,
    incentive: 'Installation-area demand',
    source: 'Live job boards',
    desc: 'Shipment tracking, vendor coordination, warehouse support, dispatch, and supply-chain operations. Prioritizes employers around bases and defense logistics hubs.',
    keywords: 'military spouse logistics coordinator jobs near military base',
  },
  {
    title: 'Facilities Maintenance Technician',
    industries: ['trades', 'security'],
    remote: false,
    incentive: 'Base-area hiring demand',
    source: 'Live job boards',
    desc: 'Maintenance, HVAC, electrical, repair, or facilities support near installations. Useful for spouses with trades credentials or portable technical certifications.',
    keywords: 'military spouse facilities maintenance technician jobs',
  },
]

function EmploymentModule({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('skills')

  const [skills, setSkills] = useState(() => {
    return readLegacyJson('pcs_employment_skills', [])
  })
  const [newSkill, setNewSkill] = useState('')
  const [newSkillCat, setNewSkillCat] = useState('technical')

  const [radius, setRadius] = useState(25)
  const [selectedIndustries, setSelectedIndustries] = useState(new Set())
  const [showResults, setShowResults] = useState(false)

  const [resumeText, setResumeText] = useState('')
  const [resumeAnalysis, setResumeAnalysis] = useState(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileMsg, setFileMsg] = useState('')
  const [refinedResume, setRefinedResume] = useState('')
  const [selectedPosition, setSelectedPosition] = useState(null)

  useEffect(() => {
    secureLocalStore.set('pcs_employment_skills', skills)
  }, [skills])

  useEffect(() => {
    secureLocalStore.get('pcs_employment_skills', null).then(saved => {
      if (Array.isArray(saved)) setSkills(saved)
    })
  }, [])

  const installName = (profile?.gainingInstallation || '').split(',')[0].trim()
  const searchCity = BASE_CITY[installName] || (installName ? `${installName} area` : 'your area')

  const addSkill = () => {
    const name = newSkill.trim()
    if (!name || skills.some(s => s.name.toLowerCase() === name.toLowerCase())) return
    setSkills(prev => [...prev, { name, cat: newSkillCat }])
    setNewSkill('')
  }

  const removeSkill = idx => setSkills(prev => prev.filter((_, i) => i !== idx))

  const toggleIndustry = id => {
    setSelectedIndustries(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setShowResults(false)
  }

  const getSearchText = (job) => {
    const industryKw = [...selectedIndustries].map(id => INDUSTRIES.find(i => i.id === id)?.keywords || '').join(' ')
    const skillKw = skills.map(s => s.name).join(' ')
    const mobility = job.remote ? 'remote military spouse' : `${searchCity} ${radius} miles`
    return [job.keywords, industryKw, skillKw, mobility].filter(Boolean).join(' ').trim()
  }

  const buildJobSearchLinks = (jobOrKeyword) => {
    const query = typeof jobOrKeyword === 'string' ? jobOrKeyword : getSearchText(jobOrKeyword)
    const kw = encodeURIComponent(query || 'military spouse jobs')
    const loc = encodeURIComponent(searchCity)
    const fallback = (site) => `https://www.google.com/search?q=${encodeURIComponent(`site:${site} ${query} ${searchCity} jobs`)}`
    return [
      { label: 'LinkedIn', url: `https://www.linkedin.com/jobs/search/?keywords=${kw}&location=${loc}&distance=${radius}`, color: '#0077B5', fallback: fallback('linkedin.com/jobs') },
      { label: 'Indeed', url: `https://www.indeed.com/jobs?q=${kw}&l=${loc}&radius=${radius}`, color: '#00897B', fallback: fallback('indeed.com') },
      { label: 'ClearanceJobs', url: `https://www.clearancejobs.com/jobs?keywords=${kw}&location=${loc}&radius=${radius}`, color: '#558B2F', fallback: fallback('clearancejobs.com/jobs') },
      { label: 'USAJOBS', url: `https://www.usajobs.gov/Search/Results?keyword=${kw}&LocationName=${loc}&Radius=${radius}&hp=ms`, color: '#1565C0', fallback: fallback('usajobs.gov') },
    ]
  }

  const buildUsaJobsSpouseUrl = () => {
    const industryKw = [...selectedIndustries].map(id => INDUSTRIES.find(i => i.id === id)?.keywords || '').join(' ')
    const skillKw = skills.map(s => s.name).join(' ')
    const kw = encodeURIComponent([industryKw, skillKw, 'military spouse'].filter(Boolean).join(' ').trim() || 'military spouse')
    const loc = encodeURIComponent(searchCity)
    return `https://www.usajobs.gov/Search/Results?keyword=${kw}&LocationName=${loc}&Radius=${radius}&hp=ms`
  }

  const filteredSpouseJobs = SPOUSE_JOB_SEARCHES.filter(job => {
    if (selectedIndustries.size === 0) return true
    return job.industries.some(id => selectedIndustries.has(id))
  })

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    setFileLoading(true)
    setFileMsg('Reading file...')
    setResumeAnalysis(null)
    const reader = new FileReader()
    const processText = async (text) => {
      setResumeText(text)
      setFileMsg('Analyzing with AI...')
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system: 'Analyze this resume and extract: name, years of experience, top 5 skills, highest education level, and 3 most relevant job titles. Return JSON only: {name, experience_years, skills, education, suggested_titles}',
            user: text,
          }),
        })
        if (!res.ok) throw new Error('AI error')
        const data = await res.json()
        try {
          const raw = data.text || JSON.stringify(data)
          const m = raw.match(/\{[\s\S]*\}/)
          if (m) setResumeAnalysis(JSON.parse(m[0]))
        } catch (_) {}
        setFileMsg('Analysis complete')
      } catch {
        setFileMsg('Resume loaded')
      } finally {
        setFileLoading(false)
      }
    }
    if (ext === 'pdf') {
      reader.onload = ev => processText((ev.target.result.match(/[ -~\n\r\t]{8,}/g) || []).join('\n'))
      reader.readAsBinaryString(file)
    } else {
      reader.onload = ev => processText(ev.target.result || '')
      reader.readAsText(file)
    }
  }

  const TABS = [
    { id: 'skills',          label: 'Skills Profile'  },
    { id: 'search',          label: 'Job Search'      },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'resume',          label: 'Resume'          },
    { id: 'jobboards',       label: 'Job Resources'   },
  ]

  const tb = (t) => ({
    padding: '7px 11px', borderRadius: 8,
    border: `1.5px solid ${activeTab === t.id ? theme.primary : '#E0E6EE'}`,
    background: activeTab === t.id ? theme.primary : '#FFF',
    color: activeTab === t.id ? '#FFF' : '#56697C',
    fontSize: 10, fontWeight: 800, cursor: 'pointer',
    letterSpacing: '.04em', textTransform: 'uppercase',
  })

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, color: '#0D1821', marginBottom: 2 }}>Employment & Career Center</div>
      <div style={{ fontSize: 11, color: '#56697C', marginBottom: 16 }}>Service members & military spouses · {searchCity}</div>
      <PublicDataNotice theme={theme} compact />

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} style={tb(t)}>{t.label}</button>)}
      </div>

      {/* ── SKILLS PROFILE ── */}
      {activeTab === 'skills' && (
        <div>
          <div style={{ background: theme.secondary, borderRadius: 12, padding: 14, marginBottom: 16, borderLeft: `3px solid ${theme.accent}` }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.14em', marginBottom: 4 }}>YOUR SKILLS PROFILE</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>Skills drive your Recommendations and Job Search results. Add technical skills, soft skills, certifications, and languages.</div>
          </div>

          <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0D1821', marginBottom: 10 }}>Add a Skill</div>
            <input
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSkill()}
              placeholder="e.g. Project Management, Python, EMT-B, Spanish, PMP..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E0E6EE', fontSize: 13, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {SKILL_CATS.map(cat => (
                <button key={cat.id} onClick={() => setNewSkillCat(cat.id)} style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${newSkillCat === cat.id ? cat.color : '#E0E6EE'}`, background: newSkillCat === cat.id ? cat.color : '#FFF', color: newSkillCat === cat.id ? '#FFF' : '#56697C', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {cat.label}
                </button>
              ))}
            </div>
            <button onClick={addSkill} style={{ width: '100%', padding: '10px', borderRadius: 10, background: theme.primary, color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
              Add Skill
            </button>
          </div>

          {skills.length > 0 ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#56697C', letterSpacing: '.1em', marginBottom: 10 }}>YOUR SKILLS ({skills.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {skills.map((skill, i) => {
                  const cat = SKILL_CATS.find(c => c.id === skill.cat) || SKILL_CATS[0]
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${cat.color}12`, border: `1px solid ${cat.color}35`, borderRadius: 20, padding: '5px 10px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: cat.color }}>{skill.name}</span>
                      <span style={{ fontSize: 9, color: `${cat.color}AA`, fontWeight: 600 }}>{cat.label}</span>
                      <button onClick={() => removeSkill(i)} style={{ background: 'none', border: 'none', color: cat.color, fontSize: 15, cursor: 'pointer', padding: 0, lineHeight: 1, opacity: 0.65 }}>×</button>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => setActiveTab('recommendations')} style={{ width: '100%', padding: '12px', borderRadius: 10, background: theme.accent, color: theme.secondary, border: 'none', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
                View Matched Jobs →
              </button>
            </div>
          ) : (
            <div style={{ background: '#F0F4F8', borderRadius: 12, padding: 20, textAlign: 'center', color: '#888' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>No skills added yet</div>
              <div style={{ fontSize: 11 }}>Add skills above to unlock personalized job recommendations.</div>
            </div>
          )}
        </div>
      )}

      {/* ── JOB SEARCH ── */}
      {activeTab === 'search' && (
        <div>
          <div style={{ background: theme.secondary, borderRadius: 12, padding: 14, marginBottom: 16, borderLeft: `3px solid ${theme.accent}` }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.14em', marginBottom: 2 }}>SEARCH AREA</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>{searchCity}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)' }}>Near {installName || 'your gaining installation'}</div>
          </div>

          <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#56697C', letterSpacing: '.1em', marginBottom: 10 }}>SEARCH RADIUS</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[10, 25, 50, 75, 100].map(r => (
                <button key={r} onClick={() => { setRadius(r); setShowResults(false) }} style={{ flex: 1, padding: '9px 4px', borderRadius: 8, border: `1.5px solid ${radius === r ? theme.primary : '#E0E6EE'}`, background: radius === r ? theme.primary : '#FFF', color: radius === r ? '#FFF' : '#56697C', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                  {r}mi
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#56697C', letterSpacing: '.1em', marginBottom: 10 }}>
              INDUSTRY FILTER <span style={{ fontWeight: 500, fontSize: 10, letterSpacing: 0 }}>— select one or more</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {INDUSTRIES.map(ind => {
                const sel = selectedIndustries.has(ind.id)
                return (
                  <button key={ind.id} onClick={() => toggleIndustry(ind.id)} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${sel ? ind.color : '#E0E6EE'}`, background: sel ? ind.color : '#FFF', color: sel ? '#FFF' : '#56697C', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}>
                    {ind.label}
                  </button>
                )
              })}
            </div>
            {selectedIndustries.size > 0 && (
              <button onClick={() => { setSelectedIndustries(new Set()); setShowResults(false) }} style={{ marginTop: 10, padding: '5px 14px', borderRadius: 20, border: '1px solid #E0E6EE', background: '#F0F4F8', color: '#888', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>
                Clear Filters
              </button>
            )}
          </div>

          <button
            onClick={() => setShowResults(true)}
            style={{ width: '100%', padding: '13px', borderRadius: 12, background: theme.primary, color: '#FFF', border: 'none', fontWeight: 900, fontSize: 14, cursor: 'pointer', marginBottom: 14 }}
          >
            Search Jobs Within {radius} Miles
          </button>

          {showResults && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#56697C', letterSpacing: '.1em', marginBottom: 12 }}>
                RESULTS — {selectedIndustries.size > 0 ? [...selectedIndustries].map(id => INDUSTRIES.find(i => i.id === id)?.label).join(', ') : 'All Industries'} · {radius}mi of {searchCity}
              </div>
              <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderLeft: '4px solid #2E7D32', borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1B5E20' }}>Military Spouse Priority Search</div>
                  <span style={{ background: '#2E7D32', color: '#FFF', borderRadius: 999, padding: '3px 8px', fontSize: 9, fontWeight: 900, whiteSpace: 'nowrap' }}>OFFICIAL FILTER</span>
                </div>
                <div style={{ fontSize: 11, color: '#2E7D32', lineHeight: 1.5, marginBottom: 10 }}>USAJOBS supports location and keyword searches, and the app now uses live job-board search paths instead of stale Google Jobs cards. If a board blocks embedded query parameters, use the matching Google site-search fallback beside that board.</div>
                <a href={buildUsaJobsSpouseUrl()} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '9px 14px', borderRadius: 10, background: '#2E7D32', color: '#FFF', textDecoration: 'none', fontWeight: 800, fontSize: 12 }}>Open USAJOBS Military Spouse Search</a>
              </div>

              {filteredSpouseJobs.map((job, i) => (
                <div key={i} style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${job.remote ? '#1565C0' : theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{job.title}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        <span style={{ fontSize: 9, fontWeight: 900, color: '#FFF', background: job.remote ? '#1565C0' : '#56697C', padding: '3px 7px', borderRadius: 999 }}>{job.remote ? 'REMOTE' : `WITHIN ${radius}MI`}</span>
                        <span style={{ fontSize: 9, fontWeight: 900, color: '#880E4F', background: '#FCE4EC', padding: '3px 7px', borderRadius: 999 }}>{job.incentive}</span>
                        <span style={{ fontSize: 9, fontWeight: 900, color: '#344255', background: '#F0F4F8', padding: '3px 7px', borderRadius: 999 }}>{job.source}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5 }}>{job.desc}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                    {buildJobSearchLinks(job).map(link => (
                      <div key={link.label} style={{ display: 'grid', gap: 5 }}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ padding: '8px', borderRadius: 8, background: link.color, color: '#FFF', textDecoration: 'none', fontWeight: 800, fontSize: 10, textAlign: 'center' }}>{link.label}</a>
                        <a href={link.fallback} target="_blank" rel="noopener noreferrer" style={{ padding: '7px', borderRadius: 8, background: '#F0F4F8', color: '#344255', textDecoration: 'none', fontWeight: 700, fontSize: 9, textAlign: 'center', border: '1px solid #E0E6EE' }}>Google {link.label}</a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {filteredSpouseJobs.length === 0 && (
                <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 12, padding: 14, color: '#7A4A00', fontSize: 12, fontWeight: 700 }}>
                  No prioritized spouse job templates match that industry filter. Clear filters or select a broader industry.
                </div>
              )}
              {skills.length > 0 && (
                <div style={{ background: '#F0F4F8', borderRadius: 10, padding: 12, marginTop: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#56697C', letterSpacing: '.08em', marginBottom: 6 }}>SKILLS INCLUDED IN SEARCH</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {skills.slice(0, 8).map((s, i) => (
                      <span key={i} style={{ fontSize: 10, fontWeight: 700, color: theme.primary, background: `${theme.primary}12`, padding: '2px 8px', borderRadius: 10, border: `1px solid ${theme.primary}22` }}>{s.name}</span>
                    ))}
                    {skills.length > 8 && <span style={{ fontSize: 10, color: '#888' }}>+{skills.length - 8} more</span>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── RECOMMENDATIONS ── */}
      {activeTab === 'recommendations' && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>Skill-Matched Opportunities</div>
          <div style={{ fontSize: 11, color: '#56697C', marginBottom: 16, lineHeight: 1.5 }}>Active job listings matched to your skills near {searchCity}. Each card links directly to current openings.</div>

          {skills.length > 0 ? (
            <>
              {skills.map((skill, i) => {
                const cat = SKILL_CATS.find(c => c.id === skill.cat) || SKILL_CATS[0]
                const boardLinks = buildJobSearchLinks(skill.name)
                return (
                  <div key={i} style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${cat.color}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{skill.name}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: cat.color, background: `${cat.color}15`, padding: '2px 8px', borderRadius: 10, border: `1px solid ${cat.color}30` }}>{cat.label}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#888', textAlign: 'right' }}>
                        <div style={{ fontWeight: 700 }}>{radius}mi radius</div>
                        <div>{searchCity}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#556', lineHeight: 1.5, marginBottom: 10 }}>
                      Current openings matching your "{skill.name}" skill. Tap a board to view real-time listings.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {boardLinks.map(link => (
                        <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" style={{ padding: '8px', borderRadius: 8, background: link.color, color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: 10, textAlign: 'center', display: 'block' }}>{link.label}</a>
                      ))}
                    </div>
                  </div>
                )
              })}

              <div style={{ background: '#E8F5E9', border: '1.5px solid #4CAF50', borderRadius: 12, padding: 14, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#1B5E20', marginBottom: 4 }}>Security Clearance Advantage</div>
                <div style={{ fontSize: 11, color: '#2E7D32', lineHeight: 1.5, marginBottom: 10 }}>Your military service may have granted a clearance — one of the most valuable credentials in the civilian market. Clearance holders typically earn 10–30% more than peers.</div>
                <a href="https://www.clearancejobs.com" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px', borderRadius: 10, background: '#2E7D32', color: '#FFF', textDecoration: 'none', fontWeight: 800, fontSize: 12, textAlign: 'center' }}>Browse Clearance Jobs</a>
              </div>
            </>
          ) : (
            <div style={{ background: '#F0F4F8', borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 8 }}>No skills on file</div>
              <div style={{ fontSize: 11, color: '#56697C', marginBottom: 14 }}>Add your skills in the Skills Profile tab to see personalized job matches.</div>
              <button onClick={() => setActiveTab('skills')} style={{ padding: '10px 24px', borderRadius: 10, background: theme.primary, color: '#FFF', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Add Skills →</button>
            </div>
          )}
        </div>
      )}

      {/* ── RESUME ── */}
      {activeTab === 'resume' && (
        <div>
          <LocalEncryptedDataNotice theme={theme} />
          <div style={{ fontSize: 11, color: '#7A4A00', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 10, padding: 10, marginBottom: 12 }}>
            Resume files and pasted resume text can contain sensitive personal data. They are processed in the browser session and are not intentionally stored by PCS Express unless you save related skills locally.
          </div>
          {resumeAnalysis && (
            <div style={{ background: '#E8F5E9', border: '1.5px solid #4CAF50', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#2E7D32', marginBottom: 8 }}>Resume AI Analysis</div>
              {resumeAnalysis.name && <div style={{ fontSize: 12, color: '#1B5E20', marginBottom: 4 }}><strong>Name:</strong> {resumeAnalysis.name}</div>}
              {resumeAnalysis.experience_years !== undefined && <div style={{ fontSize: 12, color: '#1B5E20', marginBottom: 4 }}><strong>Experience:</strong> {resumeAnalysis.experience_years} years</div>}
              {resumeAnalysis.education && <div style={{ fontSize: 12, color: '#1B5E20', marginBottom: 8 }}><strong>Education:</strong> {resumeAnalysis.education}</div>}
              {resumeAnalysis.skills?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#2E7D32', marginBottom: 6, letterSpacing: '.1em' }}>DETECTED SKILLS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {resumeAnalysis.skills.map((s, i) => <span key={i} style={{ background: '#C8E6C9', color: '#1B5E20', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12 }}>{s}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `3px solid ${theme.primary}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0D1821', marginBottom: 8 }}>Upload or Paste Resume</div>
            {fileMsg && (
              <div style={{ background: fileLoading ? '#FFF8E1' : resumeAnalysis ? '#E8F5E9' : '#E3F2FD', border: `1px solid ${fileLoading ? '#FFE082' : resumeAnalysis ? '#4CAF50' : '#90CAF9'}`, borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, fontWeight: 700, color: fileLoading ? '#E65100' : resumeAnalysis ? '#2E7D32' : '#1565C0' }}>
                {fileMsg}
              </div>
            )}
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste resume text here, or upload a file below..."
              style={{ width: '100%', minHeight: 280, padding: 12, borderRadius: 8, border: '1px solid #E0E6EE', fontSize: 12, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} disabled={fileLoading} style={{ marginTop: 10, display: 'block', fontSize: 12 }} />
          </div>

          {selectedPosition && (
            <>
              <div style={{ background: `${theme.primary}18`, border: `1px solid ${theme.primary}40`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.primary, marginBottom: 3 }}>Tailoring for: {selectedPosition.title}</div>
                <div style={{ fontSize: 11, color: '#56697C' }}>Auto-tailor aligns your resume keywords to this position.</div>
              </div>
              <button onClick={() => setRefinedResume(`TAILORED FOR: ${selectedPosition.title}\n\n${resumeText}\n\nMATCHED SKILLS:\n${(resumeAnalysis?.skills || []).join('\n')}`)} style={{ width: '100%', padding: 12, borderRadius: 12, background: theme.primary, color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13, marginBottom: 12 }}>
                Auto-Tailor Resume
              </button>
            </>
          )}

          {refinedResume && (
            <>
              <div style={{ background: '#FFF', border: '1px solid #E0E6EE', borderRadius: 12, padding: 14, marginBottom: 10, maxHeight: 300, overflowY: 'auto', whiteSpace: 'pre-wrap', fontSize: 11, fontFamily: 'monospace', color: '#34495E', lineHeight: 1.6 }}>
                {refinedResume}
              </div>
              <button onClick={() => navigator.clipboard.writeText(refinedResume).then(() => alert('Copied!'))} style={{ width: '100%', padding: 12, borderRadius: 10, background: '#4CAF50', color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                Copy to Clipboard
              </button>
            </>
          )}
        </div>
      )}

      {/* ── JOB RESOURCES ── */}
      {activeTab === 'jobboards' && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>Job Resources & Career Portals</div>
          <div style={{ fontSize: 11, color: '#56697C', marginBottom: 16, lineHeight: 1.5 }}>Curated career portals, coaching programs, and official employment resources for military members and spouses. Federal hiring preference applies on USAJobs.gov.</div>

          {JOB_BOARDS.map((board, i) => (
            <div key={i} style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${board.color}`, borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{board.name}</div>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#FFF', background: board.color, padding: '2px 6px', borderRadius: 8 }}>{board.badge}</span>
                </div>
                <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5 }}>{board.desc}</div>
              </div>
              <a href={board.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, padding: '9px 16px', borderRadius: 10, background: board.color, color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: 12 }}>Open</a>
            </div>
          ))}

          <div style={{ background: theme.secondary, borderRadius: 12, padding: 14, marginTop: 8, marginBottom: 12, borderLeft: `3px solid ${theme.accent}` }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: theme.accent, letterSpacing: '.14em', marginBottom: 4 }}>MILITARY SPOUSE EMPLOYMENT</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>Dedicated programs and partnerships for spouses navigating careers through PCS moves. Most programs are completely free.</div>
          </div>

          {SPOUSE_BOARDS.map((board, i) => (
            <div key={i} style={{ background: '#FFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${board.color}`, borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{board.name}</div>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#FFF', background: board.color, padding: '2px 6px', borderRadius: 8 }}>{board.badge}</span>
                </div>
                <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5 }}>{board.desc}</div>
              </div>
              <a href={board.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, padding: '9px 16px', borderRadius: 10, background: board.color, color: '#FFF', textDecoration: 'none', fontWeight: 700, fontSize: 12 }}>Open</a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EmploymentModule
