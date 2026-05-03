import { useState, useEffect } from 'react'
import './App.css'
import DemoTour from './DemoTour'

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [demoOpen, setDemoOpen] = useState(false)

  useEffect(() => {
    const demoShown = localStorage.getItem('pcs-demo-shown')
    if (!demoShown) {
      setDemoOpen(true)
    }
  }, [])

  const toggleMenu = () => setMenuOpen(!menuOpen)

  const handleDemoClose = () => {
    setDemoOpen(false)
    localStorage.setItem('pcs-demo-shown', 'true')
  }

  return (
    <div className="app">
      {demoOpen && (
        <DemoTour 
          onTabChange={setActiveTab}
          onClose={handleDemoClose}
          onLoadExample={() => setActiveTab('dashboard')}
        />
      )}

      <header className="header">
        <button className="hamburger" onClick={toggleMenu}>☰</button>
        <h1>PCS Express</h1>
        <button className="demo-btn" onClick={() => setDemoOpen(true)} title="Start guided tour">🎯 Demo</button>
      </header>

      <aside className={`sidebar ${menuOpen ? 'open' : 'closed'}`}>
        <nav className="menu">
          <a href="#dashboard" onClick={() => { setActiveTab('dashboard'); setMenuOpen(false) }} className={activeTab === 'dashboard' ? 'active' : ''}>🎖️ Command Dashboard</a>
          <a href="#chat" onClick={() => { setActiveTab('chat'); setMenuOpen(false) }} className={activeTab === 'chat' ? 'active' : ''}>💬 Chat</a>
          <a href="#employment" onClick={() => { setActiveTab('employment'); setMenuOpen(false) }} className={activeTab === 'employment' ? 'active' : ''}>💼 Employment</a>
          <a href="#financial" onClick={() => { setActiveTab('financial'); setMenuOpen(false) }} className={activeTab === 'financial' ? 'active' : ''}>💰 Financial</a>
          <a href="#checklist" onClick={() => { setActiveTab('checklist'); setMenuOpen(false) }} className={activeTab === 'checklist' ? 'active' : ''}>✓ Checklist</a>
          <a href="#faq" onClick={() => { setActiveTab('faq'); setMenuOpen(false) }} className={activeTab === 'faq' ? 'active' : ''}>❓ FAQ</a>
        </nav>
      </aside>

      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}

      <main className="chat-container">
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            <h2>🎖️ PCS Operations Command Dashboard</h2>
            <div className="dashboard-info">
              <div className="info-card">
                <h3>Personnel Status</h3>
                <p>4 active PCS operations</p>
                <p>1 at critical readiness</p>
                <p>2 at-risk</p>
              </div>
              <div className="info-card">
                <h3>System Features</h3>
                <ul>
                  <li>Real-time readiness tracking</li>
                  <li>Dynamic task generation</li>
                  <li>Risk scoring (0-100%)</li>
                  <li>OCONUS base information</li>
                </ul>
              </div>
              <div className="info-card">
                <h3>Next Deadlines</h3>
                <p>Jun 10: Orders Upload</p>
                <p>Jun 15: HHG Schedule</p>
                <p>Jun 20: Travel Booking</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="tab-content">
            <h2>💬 PCS Assistant Chat</h2>
            <p>Ask me anything about military PCS moves, financial planning, or relocation support.</p>
          </div>
        )}

        {activeTab === 'employment' && (
          <div className="tab-content">
            <h2>💼 Employment & Resume Matching</h2>
            <p>Upload your resume and job description to get AI-powered matching analysis.</p>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="tab-content">
            <h2>💰 Financial Module</h2>
            <p>Track DLA, TLE, HHG, and reimbursements with real-time estimates.</p>
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="tab-content">
            <h2>✓ PCS Checklist</h2>
            <div className="checklist">
              <div className="checklist-section">
                <h3>Before You Move</h3>
                <label><input type="checkbox" /> Notify current chain of command</label>
                <label><input type="checkbox" /> Gather medical/dental records</label>
                <label><input type="checkbox" /> Update driver's license address</label>
                <label><input type="checkbox" /> Arrange household goods shipment</label>
                <label><input type="checkbox" /> Schedule final home inspection</label>
              </div>

              <div className="checklist-section">
                <h3>After You Arrive</h3>
                <label><input type="checkbox" /> In-process at new unit</label>
                <label><input type="checkbox" /> Register with housing office</label>
                <label><input type="checkbox" /> Enroll children in schools</label>
                <label><input type="checkbox" /> Update military ID with new address</label>
                <label><input type="checkbox" /> Attend newcomer's brief</label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="tab-content">
            <h2>❓ Frequently Asked Questions</h2>
            <div className="faq">
              <div className="faq-item">
                <h4>How long does a typical PCS move take?</h4>
                <p>From notification to arrival is typically 30-60 days, depending on availability and distance.</p>
              </div>

              <div className="faq-item">
                <h4>What is BAH (Basic Allowance for Housing)?</h4>
                <p>BAH is separate from your salary and covers local housing costs at your new duty station.</p>
              </div>

              <div className="faq-item">
                <h4>Can I refuse a PCS?</h4>
                <p>In most cases, PCS orders are mandatory. Consult your chain of command for specific circumstances.</p>
              </div>

              <div className="faq-item">
                <h4>Are school records automatically transferred?</h4>
                <p>Request official transcripts from the current school. Some states have automatic forwarding agreements.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
