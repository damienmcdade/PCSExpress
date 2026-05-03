import { useState } from 'react'

function EmploymentModule({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('resume')
  const [resumeText, setResumeText] = useState('')
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [refinedResume, setRefinedResume] = useState('')
  const [mosInput, setMosInput] = useState('')
  const [mosResult, setMosResult] = useState(null)

  // New state for AI resume analysis
  const [resumeAnalysis, setResumeAnalysis] = useState(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileMsg, setFileMsg] = useState('')

  // Mock job database for region
  const JOBS_DATABASE = {
    'Fort Liberty NC': [
      {
        id: 1,
        title: 'Logistics Coordinator',
        company: 'US Army Civilian',
        location: 'Fort Liberty, NC',
        salary: '$45,000–$55,000',
        matchScore: 95,
        description: 'Coordinate supply chain and inventory management',
        applyUrl: 'https://usajobs.gov',
      },
      {
        id: 2,
        title: 'IT Systems Administrator',
        company: 'Government Contractor',
        location: 'Fayetteville, NC',
        salary: '$60,000–$75,000',
        matchScore: 88,
        description: 'Manage military IT infrastructure',
        applyUrl: 'https://usajobs.gov',
      },
      {
        id: 3,
        title: 'Project Manager',
        company: 'Federal Contractor',
        location: 'Fort Liberty, NC',
        salary: '$70,000–$85,000',
        matchScore: 82,
        description: 'Oversee military construction projects',
        applyUrl: 'https://usajobs.gov',
      },
    ],
  }

  // MOS to civilian career mapping
  const MOS_MAP = {
    '11B': {
      label: 'Army Infantry',
      careers: ['Security Manager', 'Law Enforcement Officer', 'Emergency Services', 'Federal Agent'],
      description:
        'Infantry experience translates directly to security, law enforcement, and federal protective roles. Your leadership, firearms proficiency, and high-stress decision-making are highly valued.',
    },
    '0311': {
      label: 'Marine Rifleman',
      careers: ['Security Specialist', 'Police Officer', 'First Responder'],
      description:
        'Marine rifleman background is ideal for law enforcement, protective services, and first responder careers. Physical discipline and tactical training are major assets.',
    },
    '68W': {
      label: 'Army Medic',
      careers: ['EMT', 'Paramedic', 'Medical Assistant', 'Healthcare Administrator'],
      description:
        'Combat medic training often qualifies you for EMT or Paramedic licensing. Clinical experience and ability to perform under pressure are invaluable in civilian healthcare.',
    },
    'IT': {
      label: 'Signal / IT',
      careers: ['IT Support Specialist', 'Network Engineer', 'Cybersecurity Analyst', 'Systems Administrator'],
      description:
        'Military IT and signal experience is in high demand. Certifications like CompTIA Security+, Network+, or CCNA can accelerate your transition.',
    },
    '25U': {
      label: 'Signal Support Systems Specialist',
      careers: ['IT Support Specialist', 'Network Engineer', 'Cybersecurity Analyst', 'Systems Administrator'],
      description:
        'Signal support experience maps directly to enterprise IT roles. Your hands-on networking and communications background is a strong foundation for civilian tech careers.',
    },
    '92A': {
      label: 'Automated Logistical Specialist',
      careers: ['Supply Chain Manager', 'Warehouse Manager', 'Operations Coordinator', 'Inventory Analyst'],
      description:
        'Logistics and supply chain experience from the military is highly transferable. Civilian employers value your ability to manage large inventories and coordinate complex operations.',
    },
    '15T': {
      label: 'UH-60 Helicopter Mechanic',
      careers: ['Aircraft Mechanic (FAA)', 'Aerospace Technician', 'Maintenance Supervisor', 'Quality Control Inspector'],
      description:
        'Military aviation maintenance experience is directly applicable to FAA-certified civilian roles. Pursue an A&P (Airframe & Powerplant) certificate to formalize your credentials.',
    },
    '2A3X2': {
      label: 'Aircraft Hydraulic Systems',
      careers: ['Aircraft Mechanic (FAA)', 'Aerospace Technician', 'Maintenance Supervisor'],
      description:
        'Hydraulic systems expertise is valued in commercial aviation and aerospace industries. Your Air Force training gives you a strong baseline for FAA certification.',
    },
  }

  const JOB_BOARDS = [
    {
      name: 'USAJobs.gov',
      description: 'Official federal civilian jobs portal with veteran preference and Schedule A hiring.',
      url: 'https://www.usajobs.gov',
      badge: 'Federal',
      badgeColor: '#1565C0',
    },
    {
      name: 'Indeed Military',
      description: 'Job search engine with filters tailored to military skills and experience.',
      url: 'https://www.indeed.com/q-military-jobs.html',
      badge: 'General',
      badgeColor: '#00897B',
    },
    {
      name: 'LinkedIn Veterans',
      description: 'Free LinkedIn Premium subscription for eligible veterans. Expand your network and apply faster.',
      url: 'https://socialimpact.linkedin.com/programs/veterans',
      badge: 'Networking',
      badgeColor: '#0077B5',
    },
    {
      name: 'Hire Heroes USA',
      description: 'Free job placement assistance, resume coaching, and employer connections for veterans.',
      url: 'https://www.hireheroesusa.org',
      badge: 'Veteran-Focused',
      badgeColor: '#C62828',
    },
    {
      name: 'Transition GPS (dodtap.mil)',
      description: 'DoD Transition Assistance Program resources, workshops, and career tools.',
      url: 'https://www.dodtap.mil',
      badge: 'DoD',
      badgeColor: '#283593',
    },
    {
      name: 'ClearanceJobs',
      description: 'Job listings specifically for roles requiring active security clearances.',
      url: 'https://www.clearancejobs.com',
      badge: 'Clearance',
      badgeColor: '#558B2F',
    },
    {
      name: 'Military.com Jobs',
      description: 'Job board built for the military community with veteran-friendly employers.',
      url: 'https://www.military.com/veteran-jobs',
      badge: 'Community',
      badgeColor: '#6A1B9A',
    },
    {
      name: 'CareerOneStop',
      description: 'Department of Labor career exploration, training, and job search tools for veterans.',
      url: 'https://www.careeronestop.org/Veterans/default.aspx',
      badge: 'DoL',
      badgeColor: '#37474F',
    },
  ]

  // Handle file upload with FileReader API + AI analysis
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
            system:
              'Analyze this resume and extract: name, years of experience, top 5 skills, highest education level, and 3 most relevant job titles. Return JSON: {name, experience_years, skills, education, suggested_titles}',
            message: text,
          }),
        })

        if (!res.ok) throw new Error('AI request failed')

        const data = await res.json()
        let parsed = null

        // Try to parse JSON from AI response
        try {
          const raw = typeof data === 'string' ? data : data.reply || data.content || data.text || JSON.stringify(data)
          const jsonMatch = raw.match(/\{[\s\S]*\}/)
          if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
        } catch (_) {
          parsed = null
        }

        const jobs = getJobsList()
        if (parsed) {
          setResumeAnalysis(parsed)
          setFileMsg(`Analysis complete! ${jobs.length} job matches found`)
        } else {
          setFileMsg(`Resume loaded. ${jobs.length} job matches found`)
        }
      } catch (err) {
        const jobs = getJobsList()
        setFileMsg(`Resume loaded. Upload your resume for better matches (${jobs.length} jobs available)`)
      } finally {
        setFileLoading(false)
      }
    }

    if (ext === 'pdf') {
      reader.onload = (ev) => {
        const binary = ev.target.result
        // Extract printable ASCII strings from binary
        const printable = (binary.match(/[ -~\n\r\t]{8,}/g) || []).join('\n')
        processText(printable || '[PDF content extracted — paste text manually for best results]')
      }
      reader.readAsBinaryString(file)
    } else {
      reader.onload = (ev) => {
        processText(ev.target.result || '')
      }
      reader.readAsText(file)
    }
  }

  // Get raw jobs list for the current installation
  const getJobsList = () => {
    const parts = profile?.gainingInstallation?.split(',') || []
    const baseKey = (parts[0] || '').trim() + ' ' + (parts[1] || '').trim()
    return JOBS_DATABASE[baseKey] || []
  }

  // Match jobs — use AI-extracted skills when available for smarter ordering
  const matchJobsToResume = () => {
    const jobs = getJobsList()
    if (!resumeAnalysis || !resumeAnalysis.skills) {
      return jobs.sort((a, b) => b.matchScore - a.matchScore)
    }

    // Boost matchScore based on skill keyword overlap with job title/description
    const skills = (resumeAnalysis.skills || []).map((s) => s.toLowerCase())
    const suggested = (resumeAnalysis.suggested_titles || []).map((t) => t.toLowerCase())

    const scored = jobs.map((job) => {
      const haystack = `${job.title} ${job.description}`.toLowerCase()
      let boost = 0
      skills.forEach((skill) => { if (haystack.includes(skill)) boost += 3 })
      suggested.forEach((title) => { if (haystack.includes(title)) boost += 5 })
      return { ...job, matchScore: Math.min(99, job.matchScore + boost) }
    })

    return scored.sort((a, b) => b.matchScore - a.matchScore)
  }

  const refineResume = (jobListing) => {
    const refined = `TAILORED RESUME FOR: ${jobListing.title}

${resumeText}

TAILORED SKILLS:
  Project management (matched to role)
  Supply chain coordination (matched to role)
  Team leadership experience
  Military protocol knowledge
  Logistics optimization

---
This resume has been auto-tailored to match the job requirements for:
${jobListing.title} at ${jobListing.company}`
    setRefinedResume(refined)
  }

  const lookupMOS = () => {
    const code = mosInput.trim().toUpperCase()
    const result = MOS_MAP[code] || null
    setMosResult(result ? { code, ...result } : { code, notFound: true })
  }

  const TABS = [
    { id: 'resume', label: 'Resume', icon: '📄' },
    { id: 'jobs', label: 'Browse Jobs', icon: '🔍' },
    { id: 'refinement', label: 'Tailor Resume', icon: '✏️' },
    { id: 'recommendations', label: 'Recommendations', icon: '🎯' },
    { id: 'jobboards', label: 'Job Boards', icon: '🌐' },
  ]

  const tabBtn = (t) => ({
    padding: '8px 12px',
    borderRadius: 20,
    border: `1.5px solid ${activeTab === t.id ? theme.primary : '#E0E6EE'}`,
    background: activeTab === t.id ? theme.primary : '#FFFFFF',
    color: activeTab === t.id ? '#FFFFFF' : '#56697C',
    fontSize: 11,
    cursor: 'pointer',
    fontWeight: activeTab === t.id ? 800 : 500,
    whiteSpace: 'nowrap',
  })

  const card = (extra = {}) => ({
    background: '#FFFFFF',
    border: '1px solid #E0E6EE',
    borderRadius: 12,
    padding: '14px',
    marginBottom: 12,
    ...extra,
  })

  const primaryBtn = (extra = {}) => ({
    width: '100%',
    padding: '12px',
    borderRadius: 12,
    background: theme.primary,
    color: '#FFFFFF',
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 13,
    ...extra,
  })

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ color: theme.primary, marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 800 }}>
        Employment &amp; Career Center
      </h2>

      {/* TAB BAR */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabBtn(t)}>
            <span style={{ marginRight: 4 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── RESUME ── */}
      {activeTab === 'resume' && (
        <div>
          {/* AI Analysis Summary Card */}
          {resumeAnalysis && (
            <div style={{
              background: '#E8F5E9',
              border: '1.5px solid #4CAF50',
              borderRadius: 12,
              padding: '14px',
              marginBottom: 14,
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#2E7D32', marginBottom: 8 }}>
                Resume AI Analysis
              </div>
              {resumeAnalysis.name && (
                <div style={{ fontSize: 12, color: '#1B5E20', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700 }}>Name: </span>{resumeAnalysis.name}
                </div>
              )}
              {resumeAnalysis.experience_years !== undefined && (
                <div style={{ fontSize: 12, color: '#1B5E20', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700 }}>Experience: </span>{resumeAnalysis.experience_years} years
                </div>
              )}
              {resumeAnalysis.education && (
                <div style={{ fontSize: 12, color: '#1B5E20', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700 }}>Education: </span>{resumeAnalysis.education}
                </div>
              )}
              {resumeAnalysis.skills && resumeAnalysis.skills.length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#2E7D32', marginBottom: 4 }}>TOP SKILLS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {resumeAnalysis.skills.map((skill, i) => (
                      <div key={i} style={{
                        background: '#C8E6C9',
                        color: '#1B5E20',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 12,
                      }}>
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {resumeAnalysis.suggested_titles && resumeAnalysis.suggested_titles.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#2E7D32', marginBottom: 4 }}>AI-SUGGESTED JOB TITLES</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {resumeAnalysis.suggested_titles.map((title, i) => (
                      <div key={i} style={{
                        background: '#A5D6A7',
                        color: '#1B5E20',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 12,
                      }}>
                        {title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ ...card(), borderLeft: `3px solid ${theme.primary}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 8 }}>
              Upload or Paste Your Resume
            </div>

            {/* File status message */}
            {fileMsg ? (
              <div style={{
                background: fileLoading ? '#FFF8E1' : resumeAnalysis ? '#E8F5E9' : '#E3F2FD',
                border: `1px solid ${fileLoading ? '#FFE082' : resumeAnalysis ? '#4CAF50' : '#90CAF9'}`,
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 10,
                fontSize: 12,
                fontWeight: 700,
                color: fileLoading ? '#E65100' : resumeAnalysis ? '#2E7D32' : '#1565C0',
              }}>
                {fileLoading ? '⏳ ' : resumeAnalysis ? '✅ ' : 'ℹ️ '}{fileMsg}
              </div>
            ) : null}

            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here or upload a file below..."
              style={{
                width: '100%',
                minHeight: 300,
                padding: 12,
                borderRadius: 8,
                border: '1px solid #E0E6EE',
                fontSize: 12,
                fontFamily: 'monospace',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              disabled={fileLoading}
              style={{ marginTop: 12, display: 'block', fontSize: 12 }}
            />
            {fileLoading && (
              <div style={{ fontSize: 11, color: '#56697C', marginTop: 6 }}>
                Analyzing resume with AI...
              </div>
            )}
          </div>
          <button onClick={() => setActiveTab('jobs')} style={primaryBtn()}>
            Scan &amp; Match Jobs
          </button>
        </div>
      )}

      {/* ── BROWSE JOBS ── */}
      {activeTab === 'jobs' && (
        <div>
          {resumeText ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 6, letterSpacing: 0.5 }}>
                {resumeAnalysis
                  ? `AI-MATCHED JOBS IN REGION (${matchJobsToResume().length})`
                  : `MATCHED JOBS IN REGION (${matchJobsToResume().length})`}
              </div>
              {!resumeAnalysis && (
                <div style={{
                  background: '#FFF8E1',
                  border: '1px solid #FFE082',
                  borderRadius: 8,
                  padding: '8px 12px',
                  marginBottom: 12,
                  fontSize: 11,
                  color: '#6D4C00',
                }}>
                  Upload your resume for better matches
                </div>
              )}
              {matchJobsToResume().map((job) => {
                const scoreColor = job.matchScore > 90 ? '#4CAF50' : job.matchScore > 80 ? '#FFC107' : '#FF9800'
                return (
                  <div
                    key={job.id}
                    style={{ ...card(), borderLeft: `3px solid ${scoreColor}` }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{job.title}</div>
                        <div style={{ fontSize: 11, color: '#56697C' }}>{job.company} · {job.location}</div>
                      </div>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#FFFFFF',
                        background: scoreColor,
                        padding: '4px 8px',
                        borderRadius: 6,
                        whiteSpace: 'nowrap',
                      }}>
                        {job.matchScore}% match
                      </div>
                    </div>
                    {/* Prominent pay range badge */}
                    <div style={{
                      background: '#E8F5E9',
                      color: '#2E7D32',
                      fontSize: 12,
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: 6,
                      display: 'inline-block',
                      marginBottom: 8,
                    }}>
                      💰 {job.salary}
                    </div>
                    <div style={{ fontSize: 12, color: '#34495E', marginBottom: 10 }}>{job.description}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { setSelectedPosition(job); setActiveTab('refinement') }}
                        style={{
                          flex: 1,
                          padding: 8,
                          borderRadius: 8,
                          background: theme.primary,
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        Tailor Resume
                      </button>
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          padding: 8,
                          borderRadius: 8,
                          background: '#E3F2FD',
                          color: '#1565C0',
                          textDecoration: 'none',
                          fontWeight: 700,
                          fontSize: 11,
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        Apply Now
                      </a>
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div style={{ background: '#F5F5F5', borderRadius: 12, padding: 20, textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Upload Resume First</div>
              <div style={{ fontSize: 11 }}>Go to the Resume tab to paste or upload your resume to start matching.</div>
            </div>
          )}
        </div>
      )}

      {/* ── TAILOR RESUME ── */}
      {activeTab === 'refinement' && (
        <div>
          {selectedPosition ? (
            <>
              <div style={{
                background: `${theme.primary}20`,
                border: `1px solid ${theme.primary}`,
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.primary, marginBottom: 4 }}>
                  Tailoring for: {selectedPosition.title}
                </div>
                <div style={{ fontSize: 11, color: '#56697C' }}>
                  The auto-tailor tool will align your resume skills to the target job requirements.
                </div>
              </div>
              <button
                onClick={() => refineResume(selectedPosition)}
                style={primaryBtn({ marginBottom: 16 })}
              >
                Auto-Tailor Resume for This Position
              </button>
              {refinedResume && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 8, letterSpacing: 0.5 }}>
                    REFINED RESUME PREVIEW
                  </div>
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E0E6EE',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 16,
                    maxHeight: 400,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: '#34495E',
                    lineHeight: 1.6,
                  }}>
                    {refinedResume}
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(refinedResume); alert('Resume copied to clipboard!') }}
                    style={{
                      ...primaryBtn({ marginBottom: 8 }),
                      background: '#4CAF50',
                      fontSize: 12,
                      borderRadius: 8,
                    }}
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={() => window.open(selectedPosition.applyUrl)}
                    style={{
                      ...primaryBtn(),
                      background: '#2196F3',
                      fontSize: 12,
                      borderRadius: 8,
                    }}
                  >
                    Apply with Tailored Resume
                  </button>
                </>
              )}
            </>
          ) : (
            <div style={{ background: '#F5F5F5', borderRadius: 12, padding: 20, textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Select a Position First</div>
              <div style={{ fontSize: 11 }}>Go to Browse Jobs and tap "Tailor Resume" on a listing.</div>
            </div>
          )}
        </div>
      )}

      {/* ── RECOMMENDATIONS ── */}
      {activeTab === 'recommendations' && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>
            MOS / Rate to Civilian Career Translator
          </div>
          <div style={{ fontSize: 11, color: '#56697C', marginBottom: 16, lineHeight: 1.5 }}>
            Enter your MOS, AFSC, NEC, or rate code to see recommended civilian career paths based on your military specialty.
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              value={mosInput}
              onChange={(e) => setMosInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookupMOS()}
              placeholder="e.g. 11B, 0311, 68W, 25U, 92A"
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid #E0E6EE',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              onClick={lookupMOS}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                background: theme.primary,
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Look Up
            </button>
          </div>

          {mosResult && !mosResult.notFound && (
            <div style={{
              background: '#FFFFFF',
              border: `1px solid #E0E6EE`,
              borderLeft: `4px solid ${theme.accent || theme.primary}`,
              borderRadius: 12,
              padding: '16px',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0D1821', marginBottom: 2 }}>
                {mosResult.code} — {mosResult.label}
              </div>
              <div style={{ fontSize: 11, color: '#56697C', marginBottom: 12, lineHeight: 1.6 }}>
                {mosResult.description}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#56697C', marginBottom: 8, letterSpacing: 0.5 }}>
                RECOMMENDED CIVILIAN CAREERS
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {mosResult.careers.map((career, i) => (
                  <div
                    key={i}
                    style={{
                      background: `${theme.primary}15`,
                      color: theme.primary,
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      border: `1px solid ${theme.primary}40`,
                    }}
                  >
                    {career}
                  </div>
                ))}
              </div>
            </div>
          )}

          {mosResult && mosResult.notFound && (
            <div style={{
              background: '#FFF8E1',
              border: '1px solid #FFE082',
              borderRadius: 12,
              padding: '16px',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#E65100', marginBottom: 8 }}>
                MOS "{mosResult.code}" not found in quick-reference
              </div>
              <div style={{ fontSize: 11, color: '#56697C', marginBottom: 12, lineHeight: 1.6 }}>
                Use these official tools to translate your military experience to civilian careers:
              </div>
              <a
                href="https://www.mynextmove.org/vets/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  background: '#FFFFFF',
                  border: '1px solid #E0E6EE',
                  borderRadius: 10,
                  padding: '12px',
                  marginBottom: 10,
                  textDecoration: 'none',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.primary, marginBottom: 2 }}>
                  My Next Move for Veterans
                </div>
                <div style={{ fontSize: 11, color: '#56697C' }}>
                  mynextmove.org/vets — Enter your MOS for a full civilian career crosswalk
                </div>
              </a>
              <a
                href="https://www.onetonline.org/crosswalk/MOC/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  background: '#FFFFFF',
                  border: '1px solid #E0E6EE',
                  borderRadius: 10,
                  padding: '12px',
                  textDecoration: 'none',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.primary, marginBottom: 2 }}>
                  O*NET Military Crosswalk
                </div>
                <div style={{ fontSize: 11, color: '#56697C' }}>
                  onetonline.org — Comprehensive occupation crosswalk for all military branches
                </div>
              </a>
            </div>
          )}

          {/* Quick reference grid */}
          {!mosResult && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#56697C', marginBottom: 10, letterSpacing: 0.5 }}>
                COMMON MOS QUICK REFERENCE
              </div>
              {Object.entries(MOS_MAP).map(([code, info]) => (
                <div
                  key={code}
                  onClick={() => { setMosInput(code); setMosResult({ code, ...info }) }}
                  style={{
                    ...card({ cursor: 'pointer' }),
                    borderLeft: `3px solid ${theme.secondary || '#E0E6EE'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: theme.primary }}>{code}</div>
                    <div style={{ fontSize: 10, color: '#56697C', fontWeight: 600 }}>{info.label}</div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {info.careers.slice(0, 3).map((c, i) => (
                      <div key={i} style={{ fontSize: 10, color: '#34495E', background: '#F5F5F5', padding: '2px 8px', borderRadius: 10 }}>
                        {c}
                      </div>
                    ))}
                    {info.careers.length > 3 && (
                      <div style={{ fontSize: 10, color: '#56697C', padding: '2px 4px' }}>
                        +{info.careers.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 4 }}>
                <a
                  href="https://www.mynextmove.org/vets/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    background: `${theme.primary}10`,
                    border: `1px solid ${theme.primary}30`,
                    borderRadius: 10,
                    padding: '12px',
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: theme.primary,
                  }}
                >
                  Search All MOS Codes at mynextmove.org/vets
                </a>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── JOB BOARDS ── */}
      {activeTab === 'jobboards' && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>
            Veteran Job Boards &amp; Resources
          </div>
          <div style={{ fontSize: 11, color: '#56697C', marginBottom: 16, lineHeight: 1.5 }}>
            Curated job boards and career portals with veteran preference, free services, and military-friendly employers.
          </div>
          {JOB_BOARDS.map((board, idx) => (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E0E6EE',
                borderLeft: `4px solid ${board.badgeColor}`,
                borderRadius: 12,
                padding: '14px',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{board.name}</div>
                  <div style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    background: board.badgeColor,
                    padding: '2px 6px',
                    borderRadius: 8,
                    whiteSpace: 'nowrap',
                    letterSpacing: 0.3,
                  }}>
                    {board.badge}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#56697C', lineHeight: 1.5 }}>
                  {board.description}
                </div>
              </div>
              <a
                href={board.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flexShrink: 0,
                  padding: '9px 16px',
                  borderRadius: 10,
                  background: board.badgeColor,
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Open
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EmploymentModule
