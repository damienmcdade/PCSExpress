import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { applyGoogleTranslateLanguage } from './i18n/googleTranslateRuntime'

// Bootstrap step: read the user's saved language preference BEFORE
// React renders and apply the Google Translate cookie so the widget
// picks up the right target on its first DOM walk. Without this, the
// first React render is in English and users see a brief mixed-
// language flash before the widget runs.
try {
  const saved = localStorage.getItem('pcs_user_language')
  if (saved && saved !== 'en') {
    applyGoogleTranslateLanguage(saved)
  }
} catch {
  // localStorage unavailable in privacy modes — no-op
}

function renderBootRecovery(error) {
  const root = document.getElementById('root')
  if (!root) return
  console.error('PCS Express boot recovery', error)
  root.innerHTML = `
    <div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;background:#0d1821;color:#ffffff;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:460px;width:100%;padding:20px;border:1px solid rgba(200,168,75,0.45);border-radius:14px;background:#152536;box-shadow:0 14px 40px rgba(0,0,0,0.35);">
        <div style="font-size:18px;font-weight:900;margin-bottom:8px;color:#ffffff;">PCS Express Recovery</div>
        <div style="font-size:13px;line-height:1.6;color:#d9e3ee;margin-bottom:14px;">The app caught a startup issue before a blank screen could occur. Resetting local PCS profile data returns the app to onboarding. Document attachment is disabled. Resetting clears local planning data and returns the app to onboarding.</div>
        <button id="pcs-recovery-reset" style="width:100%;padding:12px 14px;border:0;border-radius:10px;background:#c8a84b;color:#0d1821;font-size:13px;font-weight:900;cursor:pointer;">Reset Local App Data</button>
      </div>
    </div>
  `
  document.getElementById('pcs-recovery-reset')?.addEventListener('click', () => {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('pcs_') || key.startsWith('immi_') || key === 'translations_saved')
        .forEach(key => localStorage.removeItem(key))
    } catch {}
    window.location.assign(window.location.origin)
  })
}

function boot() {
  const root = document.getElementById('root')
  if (!root) throw new Error('PCS Express root element is missing')
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  window.setTimeout(() => {
    const currentRoot = document.getElementById('root')
    if (currentRoot && currentRoot.childElementCount === 0) {
      renderBootRecovery(new Error('React root stayed empty after startup'))
    }
  }, 3500)
}

try {
  boot()
} catch (error) {
  renderBootRecovery(error)
}
