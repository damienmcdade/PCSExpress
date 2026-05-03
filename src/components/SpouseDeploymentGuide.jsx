import { useState } from 'react'

function SpouseDeploymentGuide({ theme, profile }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [completedTasks, setCompletedTasks] = useState({})

  const SPOUSE_GUIDE_SECTIONS = {
    legal: {
      title: '⚖️ Legal & Financial',
      icon: '📋',
      content: [
        {
          id: 'poa',
          title: 'Power of Attorney (POA)',
          description: 'Allows spouse to make financial and medical decisions',
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
        },
        {
          id: 'will',
          title: 'Update Will & Beneficiaries',
          description: 'Ensure proper inheritance and life insurance',
          steps: [
            'Review current will with service member',
            'Update beneficiaries on all insurance',
            'Verify SGLI (Servicemembers\' Group Life Insurance)',
            'Document asset locations and access',
            'Store in secure location (safe deposit box)',
            'Provide copy to spouse and trusted family',
          ],
          deadline: '90 days before deployment',
          critical: true,
        },
        {
          id: 'budget',
          title: 'Establish Family Budget',
          description: 'Plan finances during deployment',
          steps: [
            'List all monthly bills and expenses',
            'Identify automatic payments needed',
            'Plan for BAH/housing allowance',
            'Set aside emergency fund (3-6 months)',
            'Review credit cards and debt',
            'Create backup payment methods',
          ],
          deadline: '90 days before deployment',
          critical: true,
        },
      ],
    },
    mental_health: {
      title: '🧠 Mental Health & Coping',
      icon: '💭',
      content: [
        {
          id: 'counseling',
          title: 'Establish Counseling Support',
          description: 'Access mental health services for spouse',
          steps: [
            'Register with Military OneSource (free 8 sessions)',
            'Identify military family support counselor',
            'Learn about VA mental health benefits',
            'Know crisis hotline numbers',
            'Join spouse support group before deployment',
            'Schedule regular check-ins',
          ],
          deadline: '60 days before deployment',
          critical: true,
        },
        {
          id: 'stress_management',
          title: 'Stress Management Techniques',
          description: 'Learn healthy coping strategies',
          steps: [
            'Learn meditation and deep breathing exercises',
            'Establish exercise routine (fitness center free)',
            'Join hobby or interest groups',
            'Practice journaling',
            'Maintain sleep schedule',
            'Limit alcohol and unhealthy habits',
          ],
          deadline: 'Before deployment',
          critical: false,
        },
        {
          id: 'community_support',
          title: 'Build Community Support Network',
          description: 'Connect with other military families',
          steps: [
            'Attend Family Readiness Group (FRG) meetings',
            'Exchange contact information with spouse friends',
            'Participate in unit social events',
            'Join military spouse Facebook groups',
            'Volunteer in spouse organizations',
            'Identify trusted neighbors or friends',
          ],
          deadline: '60 days before deployment',
          critical: true,
        },
      ],
    },
    family: {
      title: '👨‍👩‍👧‍👦 Family & Children',
      icon: '👶',
      content: [
        {
          id: 'childcare',
          title: 'Arrange Childcare Support',
          description: 'Secure childcare for deployment period',
          steps: [
            'Identify primary childcare provider',
            'Arrange backup childcare',
            'Set up emergency contact procedures',
            'Provide detailed instructions and routines',
            'Discuss payment arrangements',
            'Give childcare provider military documents',
          ],
          deadline: '60 days before deployment',
          critical: true,
        },
        {
          id: 'children_prep',
          title: 'Prepare Children for Deployment',
          description: 'Help children understand deployment',
          steps: [
            'Use age-appropriate language to explain',
            'Read military-themed children\'s books',
            'Establish communication plan (video calls, letters)',
            'Create deployment countdown calendar',
            'Let children help prepare care package',
            'Schedule family counseling if needed',
          ],
          deadline: '30 days before deployment',
          critical: false,
        },
        {
          id: 'education',
          title: 'Maintain Education Support',
          description: 'Ensure children\'s schooling continues smoothly',
          steps: [
            'Notify schools of parent\'s deployment',
            'Establish point of contact with teachers',
            'Set up tutoring if needed',
            'Arrange school pick-up if applicable',
            'Monitor grades and attendance',
            'Maintain academic routine',
          ],
          deadline: '60 days before deployment',
          critical: true,
        },
      ],
    },
    household: {
      title: '🏠 Household Management',
      icon: '🏡',
      content: [
        {
          id: 'emergency_contacts',
          title: 'Emergency Contacts & Access',
          description: 'Ensure access to critical information',
          steps: [
            'Create emergency contact list',
            'Share unit and command information',
            'Provide healthcare provider contacts',
            'List insurance agents and account numbers',
            'Document auto repair and utility contacts',
            'Store in accessible location',
          ],
          deadline: '60 days before deployment',
          critical: true,
        },
        {
          id: 'home_maintenance',
          title: 'Home Maintenance Plan',
          description: 'Prepare home for deployment period',
          steps: [
            'Service air conditioning/heating units',
            'Stock emergency supplies (water, batteries)',
            'Know location of circuit breaker and water shut-off',
            'Change air filter before deployment',
            'Set up yard maintenance (if needed)',
            'Test smoke and carbon monoxide detectors',
          ],
          deadline: '30 days before deployment',
          critical: false,
        },
        {
          id: 'vehicle',
          title: 'Vehicle Maintenance',
          description: 'Maintain service member\'s vehicle',
          steps: [
            'Complete all scheduled maintenance',
            'Keep registration and insurance current',
            'Know how to change oil and tire',
            'Stock emergency car kit',
            'Arrange mechanic for repairs',
            'Keep vehicle contact numbers accessible',
          ],
          deadline: '45 days before deployment',
          critical: true,
        },
      ],
    },
  };

  const toggleTask = (sectionKey, taskId) => {
    const key = `${sectionKey}-${taskId}`;
    setCompletedTasks(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getTotalTasks = () => {
    return Object.values(SPOUSE_GUIDE_SECTIONS).reduce((sum, section) => {
      return sum + section.content.length;
    }, 0);
  };

  const getCompletedTasks = () => {
    return Object.keys(completedTasks).filter(key => completedTasks[key]).length;
  };

  const completionPercent = Math.round((getCompletedTasks() / getTotalTasks()) * 100);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ color: theme.primary }}>Deployment Guide</h2>

      {/* PROGRESS BAR */}
      <div style={{
        background: `${theme.primary}15`,
        border: `1px solid ${theme.primary}`,
        borderRadius: 12,
        padding: '14px',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.primary }}>Deployment Readiness</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.primary }}>{completionPercent}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 6, background: '#E0E6EE', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${completionPercent}%`,
            background: theme.primary,
            transition: 'width .3s ease',
          }} />
        </div>
        <div style={{ fontSize: 10, color: theme.primary, marginTop: 8, fontWeight: 700 }}>
          {getCompletedTasks()} of {getTotalTasks()} tasks completed
        </div>
      </div>

      {/* SECTION TABS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(SPOUSE_GUIDE_SECTIONS).map(([key, section]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '8px 12px',
              borderRadius: 20,
              border: `1.5px solid ${activeTab === key ? theme.primary : '#E0E6EE'}`,
              background: activeTab === key ? theme.primary : '#FFFFFF',
              color: activeTab === key ? '#FFFFFF' : '#56697C',
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: activeTab === key ? 800 : 500,
            }}
          >
            {section.icon}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {Object.entries(SPOUSE_GUIDE_SECTIONS).map(([sectionKey, section]) => {
        if (activeTab !== sectionKey) return null;

        return (
          <div key={sectionKey}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0D1821', marginBottom: 14 }}>
              {section.title}
            </div>

            {section.content.map((item) => {
              const taskKey = `${sectionKey}-${item.id}`;
              const isCompleted = completedTasks[taskKey];

              return (
                <div
                  key={item.id}
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${isCompleted ? '#D0E8C8' : '#E0E6EE'}`,
                    borderLeft: `3px solid ${item.critical && !isCompleted ? '#D32F2F' : isCompleted ? '#4CAF50' : '#FFC107'}`,
                    borderRadius: 12,
                    padding: '14px',
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => toggleTask(sectionKey, item.id)}
                      style={{ marginTop: 4, width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#0D1821',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        marginBottom: 4,
                      }}>
                        {item.title}
                        {item.critical && <span style={{ color: '#D32F2F', marginLeft: 6 }}>⚠️</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#56697C', marginBottom: 8 }}>
                        {item.description}
                      </div>
                      <div style={{ fontSize: 10, color: '#34495E', marginBottom: 8, lineHeight: 1.6 }}>
                        <strong>Steps:</strong>
                        <ol style={{ margin: '6px 0', paddingLeft: '20px' }}>
                          {item.steps.map((step, idx) => (
                            <li key={idx} style={{ marginBottom: 4 }}>{step}</li>
                          ))}
                        </ol>
                      </div>
                      <div style={{
                        background: item.critical ? '#FFEBEE' : '#FFF8E1',
                        borderRadius: 6,
                        padding: '6px 10px',
                        fontSize: 10,
                        color: item.critical ? '#C62828' : '#F57F17',
                        fontWeight: 700,
                      }}>
                        📅 Deadline: {item.deadline}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* CRISIS RESOURCES */}
      <div style={{
        background: '#FFEBEE',
        border: '1px solid #EF9A9A',
        borderRadius: 12,
        padding: '14px',
        marginTop: 16,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#C62828', marginBottom: 8 }}>
          🆘 If You're Struggling
        </div>
        <div style={{ fontSize: 11, color: '#8B0000', lineHeight: 1.6 }}>
          <strong>Military OneSource:</strong> (800) 342-9647<br />
          <strong>Veterans Crisis Line:</strong> 988 then press 1<br />
          <strong>Military Spouse Support:</strong> (844) 866-9833<br />
          All services are free and confidential.
        </div>
      </div>
    </div>
  );
}

export default SpouseDeploymentGuide;
