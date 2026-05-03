import { useState } from 'react'

function EmploymentModule({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('resume')
  const [resumeText, setResumeText] = useState('')
  const [jobAddress, setJobAddress] = useState('')
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [refinedResume, setRefinedResume] = useState('')

  // Mock job database for region
  const JOBS_DATABASE = {
    'Fort Liberty NC': [
      {
        id: 1,
        title: 'Logistics Coordinator',
        company: 'US Army Civilian',
        location: 'Fort Liberty, NC',
        salary: '$45,000-$55,000',
        matchScore: 95,
        description: 'Coordinate supply chain and inventory management',
        applyUrl: 'https://usajobs.gov',
      },
      {
        id: 2,
        title: 'IT Systems Administrator',
        company: 'Government Contractor',
        location: 'Fayetteville, NC',
        salary: '$60,000-$75,000',
        matchScore: 88,
        description: 'Manage military IT infrastructure',
        applyUrl: 'https://usajobs.gov',
      },
      {
        id: 3,
        title: 'Project Manager',
        company: 'Federal Contractor',
        location: 'Fort Liberty, NC',
        salary: '$70,000-$85,000',
        matchScore: 82,
        description: 'Oversee military construction projects',
        applyUrl: 'https://usajobs.gov',
      },
    ],
  };

  // Mock daycare database
  const DAYCARES = {
    'Fort Liberty NC': [
      {
        id: 1,
        name: 'Fort Liberty Child Development Center',
        address: '123 Base Drive, Fort Liberty, NC 28307',
        distance: 0.5,
        rating: 4.8,
        militaryFriendly: 'Highly Friendly',
        militaryScore: 95,
        pricePartTime: '$800/month',
        priceFullTime: '$1200/month',
        availability: 'Limited - 2 slots',
        website: 'https://childcare.army.mil',
        hours: '6:00 AM - 6:00 PM',
        ages: '6 weeks - 5 years',
      },
      {
        id: 2,
        name: "Rainbow's Learning Center",
        address: '456 School St, Fayetteville, NC 28301',
        distance: 3.2,
        rating: 4.6,
        militaryFriendly: 'Very Friendly',
        militaryScore: 88,
        pricePartTime: '$750/month',
        priceFullTime: '$1100/month',
        availability: 'Available - 5 slots',
        website: 'https://rainbows-daycare.com',
        hours: '7:00 AM - 5:30 PM',
        ages: '2 months - 6 years',
      },
      {
        id: 3,
        name: 'Bright Futures Academy',
        address: '789 Learning Lane, Spring Lake, NC 28390',
        distance: 5.1,
        rating: 4.7,
        militaryFriendly: 'Military Family Focused',
        militaryScore: 92,
        pricePartTime: '$900/month',
        priceFullTime: '$1350/month',
        availability: 'Available - 3 slots',
        website: 'https://bright-futures-academy.com',
        hours: '6:30 AM - 6:30 PM',
        ages: '2 weeks - 5 years',
      },
    ],
  };

  const calculateDistance = (baseAddress, customAddress) => {
    // Mock distance calculation - in production use actual mapping API
    return Math.random() * 10 + 0.5;
  };

  const matchJobsToResume = () => {
    const baseKey = profile?.gainingInstallation?.split(',')[0] + ' ' + profile?.gainingInstallation?.split(',')[1];
    const jobs = JOBS_DATABASE[baseKey] || [];
    return jobs.sort((a, b) => b.matchScore - a.matchScore);
  };

  const refineResume = (jobListing) => {
    const refined = `
TAILORED RESUME FOR: ${jobListing.title}

${resumeText}

TAILORED SKILLS:
✓ Project management (matched to role)
✓ Supply chain coordination (matched to role)
✓ Team leadership experience
✓ Military protocol knowledge
✓ Logistics optimization

---
This resume has been auto-tailored to match the job requirements for:
${jobListing.title} at ${jobListing.company}
    `;
    setRefinedResume(refined);
  };

  const getFilteredDaycares = () => {
    const baseKey = profile?.gainingInstallation?.split(',')[0] + ' ' + profile?.gainingInstallation?.split(',')[1];
    const daycares = DAYCARES[baseKey] || [];
    
    if (jobAddress) {
      return daycares.map(dc => ({
        ...dc,
        customDistance: calculateDistance(dc.address, jobAddress),
      })).sort((a, b) => a.customDistance - b.customDistance);
    }
    
    return daycares.sort((a, b) => a.distance - b.distance);
  };

  return (
    <div className="tab-content">
      <h2 style={{ color: theme.primary }}>💼 Employment & Career Center</h2>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { id: 'resume', label: 'Resume', icon: '📄' },
          { id: 'jobs', label: 'Job Matching', icon: '🔍' },
          { id: 'refinement', label: 'Tailor Resume', icon: '✏️' },
          { id: 'daycare', label: 'Daycare', icon: '👶' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
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

      {/* RESUME UPLOAD */}
      {activeTab === 'resume' && (
        <div>
          <div style={{ background: '#FFFFFF', border: `1px solid #E0E6EE`, borderLeft: `3px solid ${theme.primary}`, borderRadius: 12, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 8 }}>Upload or Paste Resume</div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here or upload a file..."
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '12px',
                borderRadius: 8,
                border: '1px solid #E0E6EE',
                fontSize: 12,
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
            />
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              style={{ marginTop: 12, display: 'block' }}
            />
          </div>
          <button
            onClick={() => setActiveTab('jobs')}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              background: theme.primary,
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Scan & Match Jobs →
          </button>
        </div>
      )}

      {/* JOB MATCHING */}
      {activeTab === 'jobs' && (
        <div>
          {resumeText ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 12 }}>
                MATCHED JOBS IN REGION ({matchJobsToResume().length})
              </div>
              {matchJobsToResume().map((job) => (
                <div
                  key={job.id}
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid #E0E6EE`,
                    borderLeft: `3px solid ${job.matchScore > 90 ? '#4CAF50' : job.matchScore > 80 ? '#FFC107' : '#FF9800'}`,
                    borderRadius: 12,
                    padding: '14px',
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{job.title}</div>
                      <div style={{ fontSize: 11, color: '#56697C' }}>{job.company} • {job.location}</div>
                    </div>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#FFFFFF',
                      background: job.matchScore > 90 ? '#4CAF50' : job.matchScore > 80 ? '#FFC107' : '#FF9800',
                      padding: '4px 8px',
                      borderRadius: 6,
                    }}>
                      {job.matchScore}% match
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#34495E', marginBottom: 8 }}>{job.description}</div>
                  <div style={{ fontSize: 11, color: '#56697C', marginBottom: 10, fontWeight: 700 }}>{job.salary}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setSelectedPosition(job);
                        setActiveTab('refinement');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
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
                        padding: '8px',
                        borderRadius: 8,
                        background: '#E3F2FD',
                        color: '#1565C0',
                        border: 'none',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      Apply Now
                    </a>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ background: '#F5F5F5', borderRadius: 12, padding: '20px', textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Upload Resume First</div>
              <div style={{ fontSize: 11 }}>Go to Resume tab to upload or paste your resume to start matching</div>
            </div>
          )}
        </div>
      )}

      {/* RESUME REFINEMENT */}
      {activeTab === 'refinement' && (
        <div>
          {selectedPosition ? (
            <>
              <div style={{ background: `${theme.primary}20`, border: `1px solid ${theme.primary}`, borderRadius: 12, padding: '12px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.primary, marginBottom: 4 }}>
                  Tailoring for: {selectedPosition.title}
                </div>
                <div style={{ fontSize: 11, color: '#56697C' }}>
                  AI will scan the job listing and auto-tailor your resume to match required skills
                </div>
              </div>

              <button
                onClick={() => refineResume(selectedPosition)}
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
                Auto-Tailor Resume for This Position
              </button>

              {refinedResume && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 8 }}>REFINED RESUME PREVIEW</div>
                  <div style={{
                    background: '#FFFFFF',
                    border: `1px solid #E0E6EE`,
                    borderRadius: 12,
                    padding: '14px',
                    marginBottom: 16,
                    maxHeight: '400px',
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
                    onClick={() => {
                      navigator.clipboard.writeText(refinedResume);
                      alert('Resume copied to clipboard!');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 8,
                      background: '#4CAF50',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginBottom: 8,
                    }}
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={() => window.open(selectedPosition.applyUrl)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: 8,
                      background: '#2196F3',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Apply with Tailored Resume
                  </button>
                </>
              )}
            </>
          ) : (
            <div style={{ background: '#F5F5F5', borderRadius: 12, padding: '20px', textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Select a Position First</div>
              <div style={{ fontSize: 11 }}>Go to Job Matching tab and select a position to tailor your resume</div>
            </div>
          )}
        </div>
      )}

      {/* DAYCARE FINDER */}
      {activeTab === 'daycare' && (
        <div>
          <div style={{ background: '#FFFFFF', border: `1px solid #E0E6EE`, borderRadius: 12, padding: '14px', marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#56697C', display: 'block', marginBottom: 6 }}>
              HOME/WORK ADDRESS (for distance calculation)
            </label>
            <input
              type="text"
              value={jobAddress}
              onChange={(e) => setJobAddress(e.target.value)}
              placeholder="Enter your address (e.g., 123 Main St, Fort Liberty, NC)"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: '1px solid #E0E6EE',
                fontSize: 12,
              }}
            />
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: '#56697C', marginBottom: 12 }}>
            AVAILABLE DAYCARES ({getFilteredDaycares().length})
          </div>

          {getFilteredDaycares().map((daycare) => (
            <div
              key={daycare.id}
              style={{
                background: '#FFFFFF',
                border: `1px solid #E0E6EE`,
                borderLeft: `3px solid ${daycare.militaryScore > 90 ? '#4CAF50' : '#FFC107'}`,
                borderRadius: 12,
                padding: '14px',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821' }}>{daycare.name}</div>
                  <div style={{ fontSize: 11, color: '#56697C', marginTop: 2 }}>{daycare.address}</div>
                </div>
                <div style={{
                  background: '#E8F5E9',
                  color: '#1B5E20',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}>
                  {daycare.militaryScore}% Military
                </div>
              </div>

              <div style={{ fontSize: 11, color: '#34495E', marginBottom: 8, lineHeight: 1.5 }}>
                <div>⭐ {daycare.rating}/5 • {daycare.militaryFriendly}</div>
                <div>📍 {jobAddress ? daycare.customDistance : daycare.distance} miles away</div>
                <div>🕐 {daycare.hours}</div>
                <div>👶 Ages: {daycare.ages}</div>
              </div>

              <div style={{
                background: '#F5F5F5',
                borderRadius: 8,
                padding: '10px',
                marginBottom: 10,
                fontSize: 11,
              }}>
                <div style={{ fontWeight: 700, color: '#0D1821', marginBottom: 4 }}>Pricing</div>
                <div>Part-time: <span style={{ fontWeight: 700 }}>{daycare.pricePartTime}</span></div>
                <div>Full-time: <span style={{ fontWeight: 700 }}>{daycare.priceFullTime}</span></div>
              </div>

              <div style={{
                background: daycare.availability.includes('Limited') ? '#FFF3E0' : '#E8F5E9',
                borderRadius: 8,
                padding: '8px 10px',
                marginBottom: 10,
                fontSize: 11,
                fontWeight: 700,
                color: daycare.availability.includes('Limited') ? '#E65100' : '#1B5E20',
              }}>
                {daycare.availability}
              </div>

              <a
                href={daycare.website}
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
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Visit Website
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EmploymentModule;
