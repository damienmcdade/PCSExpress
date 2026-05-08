import { useState } from 'react'
import './DemoTour.css'

const DEMO_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to PCS Express',
    description: 'Your all-in-one military PCS relocation assistant. This guided tour will show you all features and how to use them on web, Docker, and iOS.',
    content: 'Click "Next" to begin the tour, or "Skip" to close this demo.',
    highlight: null,
    action: null,
  },
  {
    id: 'chat-intro',
    title: '💬 Chat Assistant',
    description: 'Ask questions about PCS moves, relocation, housing, transitions, and military life.',
    content: 'Type any question and the AI will provide practical advice tailored to military PCS moves.',
    highlight: 'chat',
    action: 'Go to Chat',
  },
  {
    id: 'chat-example',
    title: 'Chat Example',
    description: 'The chat supports any military or PCS-related question.',
    content: 'Try asking:\n• "What are the main steps in a PCS move?"\n• "How long does a PCS typically take?"\n• "What documents do I need for a move?"\n• "How does BAH work?"',
    highlight: 'chat',
    action: null,
  },
  {
    id: 'employment-intro',
    title: '💼 Employment & Resume Matching',
    description: 'Analyze and refine your resume for job positions, especially important during PCS transitions.',
    content: 'Paste resume text and compare it with job descriptions without adding files to the app.',
    highlight: 'employment',
    action: 'Go to Employment',
  },
  {
    id: 'employment-match',
    title: 'Resume Matching',
    description: 'Get AI-powered analysis of how your resume matches the job.',
    content: 'The system provides:\n• Match percentage (0-100%)\n• Your key strengths\n• Skill gaps to address\n• Specific recommendations to improve\n\nOn web/Docker: Upload PDF or text file\nOn iOS: Use Files app to access documents',
    highlight: 'employment',
    action: null,
  },
  {
    id: 'employment-refine',
    title: 'Resume Refinement',
    description: 'Let AI rewrite your resume to better match the job description.',
    content: 'AI rewrites your resume with:\n• Better keyword alignment\n• Stronger action verbs\n• Relevant experience highlighted\n• Download the refined version instantly\n\nUse this for quick job application improvements.',
    highlight: 'employment',
    action: null,
  },
  {
    id: 'daycare-intro',
    title: '👶 Daycare & Family Resources',
    description: 'Find childcare options at your new installation or surrounding area.',
    content: 'Search by installation name or city to find:\n• On-base CDC information\n• Civilian daycare options\n• Military family resources\n• Cost and benefits information',
    highlight: 'daycare',
    action: 'Go to Daycare',
  },
  {
    id: 'daycare-features',
    title: 'Daycare Resources',
    description: 'Full information about childcare options and military benefits.',
    content: 'Available information:\n• Facility Types: CDC, FCC, civilian\n• Costs: Subsidies, FSA, sliding scale\n• Resources: OneSource, locators, reviews\n• Tips: When to search, what to check\n\nAI provides location-specific guidance.',
    highlight: 'daycare',
    action: null,
  },
  {
    id: 'checklist-intro',
    title: '✓ PCS Checklist',
    description: 'Track important tasks before and after your move.',
    content: 'Two sections:\n\nBefore You Move:\n• Notify chain of command\n• Gather medical records\n• Update ID\n• Arrange household shipment\n\nAfter Arrival:\n• In-process\n• Register with housing\n• Enroll children\n• Update military ID\n• Attend briefing',
    highlight: 'checklist',
    action: 'Go to Checklist',
  },
  {
    id: 'faq-intro',
    title: '❓ Frequently Asked Questions',
    description: 'Quick answers to common PCS questions.',
    content: 'Covers:\n• Timeline of PCS moves\n• Dislocation Allowance (BAH)\n• Refusing orders\n• School records transfer\n\nClick any question to expand the answer.',
    highlight: 'faq',
    action: 'Go to FAQ',
  },
  {
    id: 'platforms-web',
    title: '🌐 Using on Web/Browser',
    description: 'Run PCS Express on your desktop or mobile browser.',
    content: 'Access:\n• Local: local development server\n• Railway: Railway deployment URL\n• Desktop: Full-featured interface\n• Mobile browser: Responsive design\n\nFeatures:\n• Upload files for resume matching\n• Real-time chat responses\n• Download refined resume\n• Save checklist progress (browser storage)',
    highlight: null,
    action: null,
  },
  {
    id: 'platforms-docker',
    title: '🐳 Running with Docker',
    description: 'Run PCS Express in a container on any machine.',
    content: 'Quick start:\n\n1. Pull image:\ndocker pull [user]/pcs-express:latest\n\n2. Run container:\ndocker run -e ANTHROPIC_API_KEY=sk-ant-... \\\n  -p 3001:3001 \\\n  [user]/pcs-express:latest\n\n3. Open:\nlocal development server\n\nBenefits: Runs everywhere, no setup needed, auto-restart on crash',
    highlight: null,
    action: null,
  },
  {
    id: 'platforms-ios',
    title: '📱 Using on iOS',
    description: 'Run PCS Express as a native app on iPhone/iPad.',
    content: 'Setup:\n1. Open Xcode: pcs-express/ios/App/App.xcodeproj\n2. Select device/simulator\n3. Press Run (⌘R)\n\nFeatures:\n• App icon (updated)\n• Native iOS experience\n• Offline support (partial)\n• Push notifications ready\n• All features work same as web\n\nFiles:\n• Documents via Files app\n• Share results via AirDrop',
    highlight: null,
    action: null,
  },
  {
    id: 'deployment',
    title: '🚀 Deployment',
    description: 'How to deploy PCS Express to production.',
    content: 'Railway (easiest):\n1. Connect GitHub repo\n2. Set ANTHROPIC_API_KEY\n3. Push to main\n4. Auto-deploys\n\nGitHub Actions:\n• Auto-builds Docker image\n• Push to Docker Hub\n• Tests before deployment\n\niOS:\n• Xcode Cloud for CI/CD\n• App Store submission ready\n\nSee CRASH_FIXES.md, RAILWAY_DEPLOY.md, XCODE_BUILD_GUIDE.md',
    highlight: null,
    action: null,
  },
  {
    id: 'tips',
    title: '💡 Pro Tips',
    description: 'Get the most out of PCS Express.',
    content: '• Start with Chat for quick questions\n• Use Employment tab 2-3 months before PCS\n• Search Daycare 3-6 months early\n• Check Checklist monthly during PCS\n• Use FAQ for quick reference\n\nPlatform tips:\n• Web: Best for file uploads\n• Docker: Best for teams/servers\n• iOS: Best for on-the-go access\n• Mix platforms: Sync via cloud',
    highlight: null,
    action: null,
  },
  {
    id: 'example-demo',
    title: '🎯 Try Example Resume Match',
    description: 'See resume matching in action with sample data.',
    content: 'Sample resume:\n"John Doe | Military Logistics Specialist | 4 years experience | Leadership, supply chain, budgeting"\n\nSample job:\n"Supply Chain Analyst | Required: logistics experience, data analysis, problem-solving"\n\nExpected result: 75-85% match with recommendations to highlight data analysis skills.',
    highlight: 'employment',
    action: 'Load Example',
  },
  {
    id: 'example-daycare',
    title: '🎯 Try Example Daycare Search',
    description: 'See daycare search results for a military installation.',
    content: 'Try searching:\n• Fort Bragg\n• Joint Base San Antonio\n• Naval Station San Diego\n• Ramstein Air Base\n\nResults will show:\n• Facility options\n• Cost estimates\n• Military benefits\n• Family resources available',
    highlight: 'daycare',
    action: 'Load Example',
  },
  {
    id: 'finish',
    title: '✨ Tour Complete!',
    description: 'You now know all features of PCS Express.',
    content: 'Next steps:\n1. Explore each tab\n2. Try the chat assistant\n3. Paste resume text only if needed\n4. Search daycare near you\n5. Deploy to Railway or iOS\n\nFor detailed guides:\n• CRASH_FIXES.md\n• RAILWAY_DEPLOY.md\n• XCODE_BUILD_GUIDE.md\n• GITHUB_ACTIONS_SETUP.md',
    highlight: null,
    action: 'Close Demo',
  },
]

export function DemoTour({ onTabChange, onClose, onLoadExample }) {
  const [currentStep, setCurrentStep] = useState(0)
  const step = DEMO_STEPS[currentStep]

  const handleNext = () => {
    if (currentStep < DEMO_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleAction = () => {
    if (step.action === 'Go to Chat') {
      onTabChange('chat')
    } else if (step.action === 'Go to Employment') {
      onTabChange('employment')
    } else if (step.action === 'Go to Daycare') {
      onTabChange('daycare')
    } else if (step.action === 'Go to Checklist') {
      onTabChange('checklist')
    } else if (step.action === 'Go to FAQ') {
      onTabChange('faq')
    } else if (step.action === 'Load Example') {
      onLoadExample(step.id)
    } else if (step.action === 'Close Demo') {
      onClose()
    }
  }

  const progress = ((currentStep + 1) / DEMO_STEPS.length) * 100

  return (
    <div className="demo-overlay">
      <div className="demo-modal">
        <div className="demo-header">
          <h2>{step.title}</h2>
          <button className="demo-close" onClick={onClose}>✕</button>
        </div>

        <div className="demo-content">
          <p className="demo-description">{step.description}</p>
          <pre className="demo-text">{step.content}</pre>
        </div>

        <div className="demo-footer">
          <div className="demo-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-text">{currentStep + 1} / {DEMO_STEPS.length}</span>
          </div>

          <div className="demo-buttons">
            <button 
              onClick={handlePrev} 
              disabled={currentStep === 0}
              className="btn-secondary"
            >
              ← Back
            </button>

            {step.action && (
              <button 
                onClick={handleAction}
                className="btn-primary"
              >
                {step.action}
              </button>
            )}

            <button 
              onClick={handleNext}
              className="btn-primary"
            >
              {currentStep === DEMO_STEPS.length - 1 ? 'Finish' : 'Next →'}
            </button>
          </div>

          <button 
            onClick={onClose}
            className="btn-skip"
          >
            Skip Tour
          </button>
        </div>
      </div>
    </div>
  )
}

export default DemoTour
