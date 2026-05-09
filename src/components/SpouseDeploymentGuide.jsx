import { useState } from 'react'

function SpouseDeploymentGuide({ theme, profile }) {
  const [completedTasks, setCompletedTasks] = useState({})

  const SPOUSE_GUIDE_SECTIONS = [
    {
      key: 'legal',
      title: 'LEGAL & FINANCIAL PREPARATION',
      content: [
        {
          id: 'poa',
          title: 'Power of Attorney (POA)',
          description: 'Allows spouse to make financial and medical decisions on behalf of the service member during deployment.',
          steps: [
            'Contact JAG (Judge Advocate General) office at your installation',
            'Request General Power of Attorney form',
            'Complete form with service member',
            'Get notarized (typically free on base)',
            'Keep multiple certified copies',
            'Register with banks and insurance companies',
          ],
          deadline: '60 days before deployment',
          critical: true,
          links: [
            { label: 'JAG Legal Assistance', url: 'https://legalassistance.law.af.mil' },
            { label: 'SCRA Protections (DOJ)', url: 'https://www.justice.gov/servicemembers/servicemembers-civil-relief-act-scra' },
          ],
        },
        {
          id: 'will',
          title: 'Update Will & Beneficiaries',
          description: 'Ensure proper inheritance and life insurance coverage are in order before departure.',
          steps: [
            'Review current will with service member',
            'Update beneficiaries on all insurance policies',
            "Verify SGLI (Servicemembers' Group Life Insurance) coverage",
            'Document asset locations and access credentials',
            'Store original documents in a secure location (safe deposit box)',
            'Provide copy to spouse and trusted family member',
          ],
          deadline: '90 days before deployment',
          critical: true,
          links: [
            { label: 'SGLI — VA Life Insurance', url: 'https://www.va.gov/life-insurance/options-eligibility/sgli/' },
            { label: 'VA Benefits', url: 'https://www.va.gov/' },
          ],
        },
        {
          id: 'budget',
          title: 'Establish Family Budget',
          description: 'Plan and organize household finances to run smoothly throughout the deployment period.',
          steps: [
            'List all monthly bills and recurring expenses',
            'Identify and configure automatic payments',
            'Plan for BAH/housing allowance allocation',
            'Set aside emergency fund (3–6 months of expenses)',
            'Review credit cards and outstanding debt',
            'Create backup payment methods and access',
          ],
          deadline: '90 days before deployment',
          critical: true,
          links: [
            { label: 'myPay (DFAS)', url: 'https://mypay.dfas.mil' },
            { label: 'Military OneSource Money', url: 'https://www.militaryonesource.mil/financial-legal/personal-finance/' },
          ],
        },
      ],
    },
    {
      key: 'mental_health',
      title: 'MENTAL HEALTH & RESILIENCE',
      content: [
        {
          id: 'counseling',
          title: 'Establish Counseling Support',
          description: 'Access mental health and counseling services for the spouse and family before and during deployment.',
          steps: [
            'Register with Military OneSource (free 8 sessions)',
            'Identify a military family support counselor on installation',
            'Learn about VA mental health benefits available to family',
            'Record crisis hotline numbers in phone and on paper',
            'Join a spouse support group before deployment begins',
            'Schedule regular check-ins with counselor or support network',
          ],
          deadline: '60 days before deployment',
          critical: true,
          links: [
            { label: 'Military OneSource', url: 'https://www.militaryonesource.mil' },
            { label: 'Veterans Crisis Line', url: 'https://www.veteranscrisisline.net' },
            { label: 'MFLC Program', url: 'https://www.militaryonesource.mil/confidential-help/non-medical-counseling/military-family-life-counseling/' },
          ],
        },
        {
          id: 'stress_management',
          title: 'Stress Management Techniques',
          description: 'Build and practice healthy coping strategies to sustain resilience throughout the deployment.',
          steps: [
            'Learn meditation and deep breathing exercises',
            'Establish a regular exercise routine (installation fitness centers are free)',
            'Join a hobby group or community interest organization',
            'Practice journaling to process emotions',
            'Maintain a consistent sleep schedule',
            'Limit alcohol and avoid unhealthy coping habits',
          ],
          deadline: 'Before deployment',
          critical: false,
          links: [],
        },
        {
          id: 'community_support',
          title: 'Build Community Support Network',
          description: 'Establish connections with other military families to provide mutual aid and friendship during deployment.',
          steps: [
            'Attend Family Readiness Group (FRG) meetings',
            'Exchange contact information with fellow military spouses',
            'Participate in unit social events before departure',
            'Join military spouse online communities and local groups',
            'Volunteer in spouse organizations on installation',
            'Identify trusted neighbors or friends for day-to-day support',
          ],
          deadline: '60 days before deployment',
          critical: true,
          links: [
            { label: 'Military OneSource Family', url: 'https://www.militaryonesource.mil/family-relationships/' },
            { label: 'Installation Family Support', url: 'https://installations.militaryonesource.mil/' },
          ],
        },
      ],
    },
    {
      key: 'family',
      title: 'FAMILY & CHILDREN',
      content: [
        {
          id: 'childcare',
          title: 'Arrange Childcare Support',
          description: 'Secure reliable primary and backup childcare for the full deployment period.',
          steps: [
            'Identify and confirm primary childcare provider',
            'Arrange at least one backup childcare option',
            'Set up clear emergency contact procedures',
            'Provide detailed written instructions, routines, and medical info',
            'Confirm and document payment arrangements',
            'Supply childcare provider with relevant military documents and permissions',
          ],
          deadline: '60 days before deployment',
          critical: true,
          links: [
            { label: 'Military Child Care', url: 'https://militarychildcare.com/' },
            { label: 'DoDEA', url: 'https://www.dodea.edu/' },
          ],
        },
        {
          id: 'children_prep',
          title: 'Prepare Children for Deployment',
          description: 'Help children understand and emotionally navigate the deployment in an age-appropriate way.',
          steps: [
            'Use age-appropriate language to explain the deployment',
            'Read military-themed children\'s books together',
            'Establish a communication plan (video calls, letters, care packages)',
            'Create a deployment countdown calendar with the children',
            'Let children help prepare a care package for the service member',
            'Schedule family counseling if adjustment difficulties arise',
          ],
          deadline: '30 days before deployment',
          critical: false,
          links: [],
        },
        {
          id: 'education',
          title: 'Maintain Education Support',
          description: "Ensure children's schooling and academic progress continue without disruption.",
          steps: [
            "Notify school administration of parent's deployment",
            'Establish a point of contact with classroom teachers',
            'Set up tutoring or academic support if needed',
            'Arrange school pick-up and drop-off logistics',
            'Monitor grades and attendance throughout deployment',
            'Maintain a stable academic routine at home',
          ],
          deadline: '60 days before deployment',
          critical: true,
          links: [
            { label: 'School Liaison Officers', url: 'https://www.militaryonesource.mil/benefits/school-liaison-program/' },
            { label: 'Military OneSource Education', url: 'https://www.militaryonesource.mil/education-employment/for-children-and-youth/' },
          ],
        },
      ],
    },
    {
      key: 'household',
      title: 'HOUSEHOLD MANAGEMENT',
      content: [
        {
          id: 'emergency_contacts',
          title: 'Emergency Contacts & Access',
          description: 'Compile and secure all critical contact information and account access before departure.',
          steps: [
            'Create a comprehensive emergency contact list',
            'Share unit contact information and command chain details with spouse',
            'Provide healthcare provider contacts and TRICARE information',
            'List all insurance agents, policy numbers, and account numbers',
            'Document auto repair, utility, and property contacts',
            'Store the completed document in an accessible, secure location',
          ],
          deadline: '60 days before deployment',
          critical: true,
          links: [
            { label: 'TRICARE', url: 'https://www.tricare.mil' },
            { label: 'MilitaryINSTALLATIONS', url: 'https://installations.militaryonesource.mil/' },
          ],
        },
        {
          id: 'home_maintenance',
          title: 'Home Maintenance Plan',
          description: 'Prepare the home and establish a maintenance plan to handle issues independently during deployment.',
          steps: [
            'Service air conditioning and heating units before departure',
            'Stock emergency supplies (water, batteries, flashlights, first aid)',
            'Locate and label circuit breaker panel and water shut-off valve',
            'Change air filter before deployment',
            'Arrange lawn and yard maintenance coverage',
            'Test all smoke and carbon monoxide detectors',
          ],
          deadline: '30 days before deployment',
          critical: false,
          links: [],
        },
        {
          id: 'vehicle',
          title: 'Vehicle Maintenance',
          description: "Keep the family vehicle in reliable condition and ensure the spouse can manage it throughout the deployment.",
          steps: [
            'Complete all scheduled maintenance before departure',
            'Verify registration and insurance remain current for deployment duration',
            'Learn or review how to change a tire and check fluids',
            'Stock emergency roadside kit in vehicle',
            'Identify a trusted mechanic for non-emergency repairs',
            'Keep all vehicle-related contacts and documents accessible',
          ],
          deadline: '45 days before deployment',
          critical: true,
          links: [
            { label: 'SCRA Financial Protections', url: 'https://www.justice.gov/servicemembers/financial-and-housing-rights-0' },
            { label: 'SCRA Auto Protections (CFPB)', url: 'https://www.consumerfinance.gov/consumer-tools/military-financial-lifecycle/scra/' },
          ],
        },
      ],
    },
  ]

  const toggleTask = (sectionKey, taskId) => {
    const key = `${sectionKey}-${taskId}`
    setCompletedTasks(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const getTotalTasks = () =>
    SPOUSE_GUIDE_SECTIONS.reduce((sum, section) => sum + section.content.length, 0)

  const getCompletedCount = () =>
    Object.values(completedTasks).filter(Boolean).length

  const completionPercent = Math.round((getCompletedCount() / getTotalTasks()) * 100)

  return (
    <div style={{ padding: 16 }}>

      {/* PAGE HEADER */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, letterSpacing: '.12em', fontWeight: 900, color: theme.accent || '#B8860B', marginBottom: 2 }}>
          DEPLOYMENT PREPARATION
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: theme.primary || '#0D1821', lineHeight: 1.2 }}>
          Spouse Readiness Guide
        </div>
        <div style={{ fontSize: 11, color: '#56697C', marginTop: 4 }}>
          Complete all tasks before deployment date. Check each item as it is confirmed.
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{
        background: `${theme.primary}12`,
        border: `1.5px solid ${theme.primary}`,
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: theme.primary, letterSpacing: '.08em' }}>
            DEPLOYMENT READINESS
          </span>
          <span style={{ fontSize: 13, fontWeight: 900, color: theme.primary }}>
            {completionPercent}%
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 6, background: '#E0E6EE', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${completionPercent}%`,
            background: theme.primary,
            transition: 'width .3s ease',
            borderRadius: 6,
          }} />
        </div>
        <div style={{ fontSize: 10, color: theme.primary, marginTop: 8, fontWeight: 700 }}>
          {getCompletedCount()} of {getTotalTasks()} tasks completed
        </div>
      </div>

      {/* ALL SECTIONS — SCROLLABLE */}
      {SPOUSE_GUIDE_SECTIONS.map((section, idx) => (
        <div key={section.key}>

          {/* SECTION HEADER BAND */}
          <div style={{
            background: theme.secondary || '#1B2A3B',
            borderRadius: 12,
            padding: '10px 14px',
            marginBottom: 12,
            marginTop: idx > 0 ? 20 : 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 4,
              height: 28,
              borderRadius: 2,
              background: theme.accent || '#C9A84C',
              flexShrink: 0,
            }} />
            <div>
              <div style={{ fontSize: 11, letterSpacing: '.1em', fontWeight: 900, color: theme.accent || '#C9A84C' }}>
                SECTION {idx + 1}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>
                {section.title}
              </div>
            </div>
          </div>

          {/* TASK CARDS */}
          {section.content.map((item) => {
            const taskKey = `${section.key}-${item.id}`
            const isCompleted = !!completedTasks[taskKey]
            const leftBorderColor = isCompleted
              ? '#4CAF50'
              : item.critical
              ? '#D32F2F'
              : '#FFC107'

            return (
              <div
                key={item.id}
                style={{
                  background: isCompleted ? '#F9FFF8' : '#FFFFFF',
                  border: `1px solid ${isCompleted ? '#C8E6C9' : '#E0E6EE'}`,
                  borderLeft: `4px solid ${leftBorderColor}`,
                  borderRadius: 10,
                  padding: '14px 14px 14px 12px',
                  marginBottom: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>

                  {/* CHECKBOX */}
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => toggleTask(section.key, item.id)}
                    style={{ marginTop: 3, width: 18, height: 18, cursor: 'pointer', flexShrink: 0, accentColor: theme.primary }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>

                    {/* TASK TITLE */}
                    <div style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: isCompleted ? '#7A9A7A' : '#0D1821',
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      marginBottom: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}>
                      {item.title}
                      {item.critical && !isCompleted && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 900,
                          letterSpacing: '.08em',
                          color: '#C62828',
                          background: '#FFEBEE',
                          border: '1px solid #EF9A9A',
                          borderRadius: 4,
                          padding: '2px 6px',
                        }}>
                          CRITICAL
                        </span>
                      )}
                    </div>

                    {/* DESCRIPTION */}
                    <div style={{ fontSize: 11, color: '#56697C', marginBottom: 10, lineHeight: 1.5 }}>
                      {item.description}
                    </div>

                    {/* NUMBERED STEPS */}
                    <div style={{ fontSize: 10, color: '#34495E', marginBottom: 10 }}>
                      <div style={{ fontWeight: 800, letterSpacing: '.06em', marginBottom: 5, color: '#0D1821', fontSize: 10 }}>
                        ACTION STEPS
                      </div>
                      <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.75 }}>
                        {item.steps.map((step, stepIdx) => (
                          <li key={stepIdx} style={{ marginBottom: 2 }}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    {/* DEADLINE BADGE */}
                    <div style={{
                      display: 'inline-block',
                      background: item.critical ? '#FFEBEE' : '#FFF8E1',
                      border: `1px solid ${item.critical ? '#EF9A9A' : '#FFE082'}`,
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 10,
                      color: item.critical ? '#C62828' : '#E65100',
                      fontWeight: 800,
                      letterSpacing: '.05em',
                      marginBottom: item.links && item.links.length > 0 ? 10 : 0,
                    }}>
                      DEADLINE: {item.deadline.toUpperCase()}
                    </div>

                    {/* RESOURCE LINKS */}
                    {item.links && item.links.length > 0 && (
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '.08em', color: '#56697C', marginBottom: 5 }}>
                          OFFICIAL RESOURCES
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                          {item.links.map((link, linkIdx) => (
                            <a
                              key={linkIdx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: '#E3F2FD',
                                color: '#1565C0',
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: 6,
                                textDecoration: 'none',
                                marginRight: 6,
                                marginBottom: 4,
                              }}
                            >
                              {link.label} →
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* CRISIS SUPPORT */}
      <div style={{
        background: '#FFEBEE',
        border: '1.5px solid #EF9A9A',
        borderLeft: '4px solid #C62828',
        borderRadius: 12,
        padding: '14px 16px',
        marginTop: 24,
      }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.12em', color: '#C62828', marginBottom: 8 }}>
          CRISIS SUPPORT
        </div>
        <div style={{ fontSize: 11, color: '#8B0000', lineHeight: 1.8 }}>
          <strong>Military OneSource:</strong> (800) 342-9647<br />
          <strong>Veterans Crisis Line:</strong> 988 — then press 1<br />
          <strong>Military Spouse Support:</strong> (844) 866-9833<br />
          <span style={{ fontSize: 10, color: '#B71C1C', fontStyle: 'italic' }}>
            All services are free and strictly confidential.
          </span>
        </div>
      </div>

    </div>
  )
}

export default SpouseDeploymentGuide
