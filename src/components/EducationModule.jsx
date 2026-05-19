import { useState } from 'react'

function EducationModule({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('schools')
  const [spouseSearch, setSpouseSearch] = useState('')
  const [spouseSkills, setSpouseSkills] = useState('')
  const [filteredJobs, setFilteredJobs] = useState([])

  // Mock education institutions database
  const SCHOOLS_DATABASE = {
    'Fort Liberty NC': [
      {
        id: 1,
        name: 'Fort Liberty Elementary School',
        type: 'Elementary (K-5)',
        distance: 1.2,
        rating: 4.6,
        militaryFamily: 95,
        grades: 'K-5',
        website: '',
        address: '100 Education Way, Fort Liberty, NC',
        phone: '(910) 555-0100',
      },
      {
        id: 2,
        name: 'Fort Liberty Middle School',
        type: 'Middle (6-8)',
        distance: 2.1,
        rating: 4.5,
        militaryFamily: 92,
        grades: '6-8',
        website: '',
        address: '200 Education Way, Fort Liberty, NC',
        phone: '(910) 555-0200',
      },
      {
        id: 3,
        name: 'Fort Liberty High School',
        type: 'High (9-12)',
        distance: 3.5,
        rating: 4.7,
        militaryFamily: 94,
        grades: '9-12',
        website: '',
        address: '300 Education Way, Fort Liberty, NC',
        phone: '(910) 555-0300',
      },
      {
        id: 4,
        name: 'Fayetteville State University',
        type: 'University',
        distance: 8.2,
        rating: 4.4,
        militaryFamily: 88,
        degrees: ['Bachelor', 'Master', 'PhD'],
        website: '',
        address: '1200 Murchison Rd, Fayetteville, NC',
        phone: '(910) 672-1234',
      },
      {
        id: 5,
        name: 'Cape Fear Community College',
        type: 'Community College',
        distance: 5.3,
        rating: 4.3,
        militaryFamily: 90,
        degrees: ['Associate', 'Certificate'],
        website: 'https://cfcc.edu',
        address: '411 North Front St, Wilmington, NC',
        phone: '(910) 251-5000',
      },
    ],
  };

  // Mock spouse job database
  const SPOUSE_JOBS = [
    {
      id: 1,
      title: 'Administrative Assistant',
      company: 'Fort Liberty Human Resources',
      location: 'Fort Liberty, NC',
      type: 'Military Base',
      salary: '$32,000-$38,000',
      matchScore: 95,
      skills: ['Communication', 'Organization', 'Microsoft Office'],
      url: 'https://www.usajobs.gov',
    },
    {
      id: 2,
      title: 'Healthcare Coordinator',
      company: 'Fayetteville Health Services',
      location: 'Fayetteville, NC',
      type: 'Public',
      salary: '$38,000-$45,000',
      matchScore: 88,
      skills: ['Healthcare Knowledge', 'Customer Service', 'Documentation'],
      url: '',
    },
    {
      id: 3,
      title: 'Remote Customer Service Representative',
      company: 'Tech Solutions Inc.',
      location: 'Remote',
      type: 'Remote',
      salary: '$28,000-$35,000',
      matchScore: 82,
      skills: ['Communication', 'Problem Solving', 'Customer Service'],
      url: '',
    },
    {
      id: 4,
      title: 'Project Manager',
      company: 'Fort Liberty Engineering',
      location: 'Fort Liberty, NC',
      type: 'Military Base',
      salary: '$50,000-$62,000',
      matchScore: 85,
      skills: ['Project Management', 'Leadership', 'Technical Knowledge'],
      url: 'https://www.usajobs.gov',
    },
    {
      id: 5,
      title: 'Remote Virtual Assistant',
      company: 'Global Remote Services',
      location: 'Remote',
      type: 'Remote',
      salary: '$30,000-$40,000',
      matchScore: 79,
      skills: ['Organization', 'Communication', 'Time Management'],
      url: '',
    },
    {
      id: 6,
      title: 'Nursing Assistant',
      company: 'Fayetteville General Hospital',
      location: 'Fayetteville, NC',
      type: 'Public',
      salary: '$28,000-$32,000',
      matchScore: 80,
      skills: ['Healthcare', 'Empathy', 'Physical Stamina'],
      url: '',
    },
  ];

  const searchSpouseJobs = () => {
    if (!spouseSearch.trim()) {
      alert('Please enter a job title or position');
      return;
    }

    const skills = spouseSkills.split(',').map(s => s.trim().toLowerCase());
    
    const results = SPOUSE_JOBS.filter(job => {
      const titleMatch = job.title.toLowerCase().includes(spouseSearch.toLowerCase());
      const companyMatch = job.company.toLowerCase().includes(spouseSearch.toLowerCase());
      
      let skillMatch = 0;
      if (skills.length > 0 && skills[0] !== '') {
        skillMatch = job.skills.filter(s => 
          skills.some(skill => s.toLowerCase().includes(skill))
        ).length;
      }
      
      return (titleMatch || companyMatch) || (skillMatch > 0);
    }).sort((a, b) => {
      if (spouseSkills) {
        const aSkills = a.skills.filter(s => 
          skills.some(skill => s.toLowerCase().includes(skill))
        ).length;
        const bSkills = b.skills.filter(s => 
          skills.some(skill => s.toLowerCase().includes(skill))
        ).length;
        return bSkills - aSkills;
      }
      return b.matchScore - a.matchScore;
    });

    setFilteredJobs(results);
  };

  const getEducationInstitutions = () => {
    const baseKey = profile?.gainingInstallation?.split(',')[0] + ' ' + profile?.gainingInstallation?.split(',')[1];
    return SCHOOLS_DATABASE[baseKey] || [];
  };

  return (
    <div className="tab-content">
      <h2 style={{ color: theme.primary }}>🎓 Education & Spouse Employment</h2>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { id: 'schools', label: 'Schools', icon: '🏫' },
          { id: 'universities', label: 'Universities', icon: '🎓' },
          { id: 'spouse', label: 'Spouse Jobs', icon: '💼' },
          { id: 'career', label: profile?.component === 'DoD Civilian' ? 'Civilian Career' : 'Career & Benefits', icon: '🎯' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pcs-tab ${activeTab === t.id ? 'is-active' : ''}`}
            style={{
              padding: '8px 12px',
              borderRadius: 20,
              border: `1.5px solid ${activeTab === t.id ? theme.primary : '#E0E6EE'}`,
              background: activeTab === t.id ? theme.primary : '#FFFFFF',
              color: activeTab === t.id ? '#FFFFFF' : '#56697C',
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: activeTab === t.id ? 800 : 500,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* SCHOOLS */}
      {activeTab === 'schools' && (() => {
        const installName = profile?.gainingInstallation?.split(',')[0]?.trim() || '';
        const k12 = getEducationInstitutions()
          .filter(s => s.type.includes('Elementary') || s.type.includes('Middle') || s.type.includes('High'));
        const showGoogleFallback = k12.length === 0 && installName;
        return (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 12 }}>
            K-12 SCHOOLS IN AREA
          </div>
          {showGoogleFallback && (
            <div data-dynamic-card="google" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'Public elementary schools', query: `public elementary schools near ${installName}` },
                { label: 'Public middle schools',     query: `public middle schools near ${installName}` },
                { label: 'Public high schools',       query: `public high schools near ${installName}` },
                { label: 'DoDEA schools (overseas)',  query: `DoDEA schools near ${installName}` },
                { label: 'Private schools',           query: `private schools near ${installName}` },
                { label: 'Charter schools',           query: `charter schools near ${installName}` },
              ].map((cat, idx) => (
                <a key={idx}
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cat.query)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${theme.accent}`, borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{cat.label} near {installName}</div>
                  <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginBottom: 8 }}>
                    Curated Google Maps search pre-filtered to the area around your gaining installation. Opens with real schools, ratings, zoning details, and contacts. Verify enrollment with the local district before deciding.
                  </div>
                  <span className="card-cta" style={{ '--cta-color': theme.primary }}>Open map view</span>
                </a>
              ))}
            </div>
          )}
          {k12.map((school) => (
              <div
                key={school.id}
                style={{
                  background: '#FFFFFF',
                  border: `1px solid #E0E6EE`,
                  borderLeft: `3px solid ${theme.accent}`,
                  borderRadius: 12,
                  padding: '14px',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{school.name}</div>
                    <div style={{ fontSize: 10, color: '#56697C', marginTop: 2 }}>{school.type}</div>
                  </div>
                  <div style={{
                    background: '#E8F5E9',
                    color: '#1B5E20',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                  }}>
                    {school.militaryFamily}% Military
                  </div>
                </div>
                
                <div style={{ fontSize: 11, color: '#34495E', marginBottom: 8, lineHeight: 1.5 }}>
                  <div>⭐ {school.rating}/5</div>
                  <div>📍 {school.distance} miles away</div>
                  <div>📚 Grades: {school.grades}</div>
                  <div>📞 {school.phone}</div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={school.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 6,
                      background: theme.primary,
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                  >
                    Visit Website
                  </a>
                </div>
              </div>
            ))}
        </div>
        );
      })()}

      {/* UNIVERSITIES & COLLEGES */}
      {activeTab === 'universities' && (() => {
        const installName = profile?.gainingInstallation?.split(',')[0]?.trim() || '';
        const colleges = getEducationInstitutions()
          .filter(s => s.type.includes('University') || s.type.includes('College'));
        const showGoogleFallback = colleges.length === 0 && installName;
        return (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 12 }}>
            COLLEGES & UNIVERSITIES
          </div>
          {showGoogleFallback && (
            <div data-dynamic-card="google" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'Colleges & universities', query: `colleges and universities near ${installName}` },
                { label: 'DoD voluntary education partners', query: `DoD voluntary education partners near ${installName}` },
                { label: 'Community colleges', query: `community colleges near ${installName}` },
                { label: 'Online programs with military TA', query: `online university accepting military tuition assistance` },
              ].map((cat, idx) => (
                <a key={idx}
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cat.query)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${theme.accent}`, borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0D1821', marginBottom: 4 }}>{cat.label} near {installName}</div>
                  <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5, marginBottom: 8 }}>
                    Curated Google Maps search pre-filtered to the area around your gaining installation. Opens with real local schools, ratings, and contact info so you can compare and apply.
                  </div>
                  <span className="card-cta" style={{ '--cta-color': theme.primary }}>Open map view</span>
                </a>
              ))}
            </div>
          )}
          {colleges.map((school) => (
              <div
                key={school.id}
                style={{
                  background: '#FFFFFF',
                  border: `1px solid #E0E6EE`,
                  borderLeft: `3px solid ${theme.accent}`,
                  borderRadius: 12,
                  padding: '14px',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{school.name}</div>
                    <div style={{ fontSize: 10, color: '#56697C', marginTop: 2 }}>{school.type}</div>
                  </div>
                  <div style={{
                    background: '#E3F2FD',
                    color: '#0D47A1',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                  }}>
                    {school.militaryFamily}% Military
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#34495E', marginBottom: 8, lineHeight: 1.5 }}>
                  <div>⭐ {school.rating}/5</div>
                  <div>📍 {school.distance} miles away</div>
                  <div>🎓 Degrees: {school.degrees?.join(', ')}</div>
                  <div>📞 {school.phone}</div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={school.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 6,
                      background: theme.primary,
                      color: '#FFFFFF',
                      textDecoration: 'none',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: 10,
                      cursor: 'pointer',
                    }}
                  >
                    Learn More
                  </a>
                </div>
              </div>
            ))}
        </div>
        );
      })()}

      {/* SPOUSE EMPLOYMENT */}
      {activeTab === 'spouse' && (
        <div>
          <div style={{ background: '#FFFFFF', border: `1px solid #E0E6EE`, borderRadius: 12, padding: '14px', marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#56697C', display: 'block', marginBottom: 6 }}>
              JOB TITLE OR POSITION
            </label>
            <input
              type="text"
              value={spouseSearch}
              onChange={(e) => setSpouseSearch(e.target.value)}
              placeholder="e.g., Project Manager, Nursing Assistant, Virtual Assistant..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: '1px solid #E0E6EE',
                marginBottom: 12,
                fontSize: 12,
              }}
            />

            <label style={{ fontSize: 11, fontWeight: 700, color: '#56697C', display: 'block', marginBottom: 6 }}>
              SKILLS (comma-separated, optional)
            </label>
            <input
              type="text"
              value={spouseSkills}
              onChange={(e) => setSpouseSkills(e.target.value)}
              placeholder="e.g., Project Management, Healthcare, Communication..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: '1px solid #E0E6EE',
                fontSize: 12,
              }}
            />
          </div>

          <button
            onClick={searchSpouseJobs}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              background: theme.primary,
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            Search Jobs ({filteredJobs.length})
          </button>

          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                style={{
                  background: '#FFFFFF',
                  border: `1px solid #E0E6EE`,
                  borderLeft: `3px solid ${
                    job.type === 'Military Base' ? '#FF9800' :
                    job.type === 'Remote' ? '#2196F3' :
                    '#4CAF50'
                  }`,
                  borderRadius: 12,
                  padding: '14px',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{job.title}</div>
                    <div style={{ fontSize: 11, color: '#56697C' }}>{job.company} • {job.location}</div>
                  </div>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: '#FFFFFF',
                    background: job.matchScore > 85 ? '#4CAF50' : job.matchScore > 75 ? '#FFC107' : '#FF9800',
                    padding: '4px 8px',
                    borderRadius: 6,
                  }}>
                    {job.matchScore}% match
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#34495E', marginBottom: 8 }}>
                  <div>💰 {job.salary}</div>
                  <div>📍 {job.type}</div>
                </div>

                <div style={{ fontSize: 10, color: '#56697C', marginBottom: 10 }}>
                  <strong>Required Skills:</strong> {job.skills.join(', ')}
                </div>

                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px',
                    borderRadius: 8,
                    background: '#2196F3',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  View & Apply →
                </a>
              </div>
            ))
          ) : spouseSearch ? (
            <div style={{ background: '#F5F5F5', borderRadius: 12, padding: '20px', textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>No Jobs Found</div>
              <div style={{ fontSize: 11 }}>Try a different search term or add skills</div>
            </div>
          ) : (
            <div style={{ background: '#F5F5F5', borderRadius: 12, padding: '20px', textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Enter Job Title</div>
              <div style={{ fontSize: 11 }}>Search for spouse employment opportunities in the area</div>
            </div>
          )}
        </div>
      )}

      {/* CAREER & BENEFITS — component-aware. DoD Civilians get OPM /
          DCPAS / DAU / USDA-Grad-School career resources. Uniformed
          members get TA / GI Bill / SkillBridge / credentialing. */}
      {activeTab === 'career' && (() => {
        const civilian = profile?.component === 'DoD Civilian';
        const cards = civilian ? [
          { title: 'USDA Graduate School (Graduate School USA)',  desc: 'Continuing education and certificate programs widely used by federal civilians for career development and promotion eligibility.',  url: 'https://graduateschool.edu/' },
          { title: 'Defense Acquisition University (DAU)',         desc: 'FREE training for DoD acquisition, engineering, contracting, and program-management civilians and military. Courses count toward DAWIA certifications.', url: 'https://www.dau.edu/' },
          { title: 'OPM HR University',                            desc: 'Centralized federal HR training portal run by the Office of Personnel Management — free courses for federal civilians on hiring, classification, payroll, and leadership.', url: 'https://www.opm.gov/wiki/training/index.aspx' },
          { title: 'DCPAS Civilian Career Development',            desc: 'DoD Civilian Personnel Advisory Service career-development guidance: career programs, leadership development, mentoring, IDP templates.', url: 'https://www.dcpas.osd.mil/policy/career-management' },
          { title: 'OPM USA Learning',                             desc: 'Free professional-development courses available to all federal employees through OPM\'s shared learning platform.', url: 'https://www.usalearning.gov/' },
          { title: 'DoD STEM Career Pathways',                     desc: 'STEM training and rotational opportunities for DoD civilian engineers, scientists, and analysts.', url: 'https://www.dodstem.us/' },
          { title: 'Federal Employees Tuition Assistance',          desc: 'Many DoD agencies reimburse academic coursework related to current or future federal positions. Confirm with your servicing HR Service Center which agency-specific policy applies.', url: 'https://www.opm.gov/policy-data-oversight/training-and-development/' },
          { title: 'USAJOBS Career Pathways',                       desc: 'Official federal hiring portal — Pathways internships, recent-graduate, and presidential management fellowships for civilian career progression.', url: 'https://www.usajobs.gov/help/working-in-government/unique-hiring-paths/students/' },
          { title: 'Thrift Savings Plan (TSP) Education',           desc: 'Federal employee retirement savings — civilians should review contribution limits and matching during PCS to avoid interruption.', url: 'https://www.tsp.gov/publications/' },
          { title: 'SkillBridge (DoD-Wide)',                        desc: 'Civilian employer internship program — DoD Civilians can post and host SkillBridge interns from transitioning service members.', url: 'https://skillbridge.osd.mil/' },
        ] : [
          { title: 'Post-9/11 GI Bill (Chapter 33)',                desc: 'Up to 36 months of full tuition, housing allowance (MHA), and book stipend. Verify your benefit status on the VA Education Service portal.',  url: 'https://www.va.gov/education/about-gi-bill-benefits/post-9-11/' },
          { title: 'Tuition Assistance (TA)',                       desc: 'Branch-specific active-duty tuition assistance covering up to $4,500/year. Coordinate through your installation Education Center before enrolling.', url: 'https://www.dantes.mil/Education-Programs/Tuition-Assistance/' },
          { title: 'DANTES & DSST Exams',                           desc: 'Free college-equivalency exams for service members — earn academic credit without classroom time.', url: 'https://www.dantes.mil/' },
          { title: 'SkillBridge',                                   desc: 'DoD internship program for service members in their last 180 days — civilian employer placement before separation.', url: 'https://skillbridge.osd.mil/' },
          { title: 'MyCAA (Military Spouse Career Advancement)',    desc: 'Up to $4,000 for portable career credentials for spouses of E-1 through E-5, W-1 through W-2, and O-1 through O-2.', url: 'https://mycaa.militaryonesource.mil/' },
          { title: 'SECO Career Coaching',                          desc: 'Free career counseling for military spouses — résumé review, interview prep, federal-hiring guidance.', url: 'https://myseco.militaryonesource.mil/portal/' },
          { title: 'Yellow Ribbon Program',                          desc: 'Tops-up Post-9/11 GI Bill at private and out-of-state schools beyond the standard tuition cap.', url: 'https://www.va.gov/education/about-gi-bill-benefits/post-9-11/yellow-ribbon-program/' },
          { title: 'VR&E (Chapter 31)',                              desc: 'VA Vocational Rehabilitation & Employment for veterans with service-connected disabilities — covers training, education, and job-readiness.', url: 'https://www.va.gov/careers-employment/vocational-rehabilitation/' },
        ];
        return (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 12 }}>
              {civilian
                ? 'Federal civilian career development resources. All free and run by OPM, DCPAS, DAU, or other DoD agencies.'
                : 'Education benefits and career-development resources tied to your military service.'}
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {cards.map((c) => (
                <a key={c.title} href={c.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', background: '#FFFFFF', border: '1px solid #E0E6EE', borderLeft: `4px solid ${theme.accent || '#C99A3D'}`, borderRadius: 12, padding: 12, textDecoration: 'none', color: '#0D1821' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.55, marginBottom: 8 }}>{c.desc}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: theme.primary || '#244247' }}>Open official source →</div>
                </a>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default EducationModule;
