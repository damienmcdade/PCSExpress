import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

const STARTUP_VERSION = '2026-05-06-cache-reset-recovery'

function showStartupFailure(error) {
  const root = document.getElementById('root')
  if (!root) return
  console.error('PCS Express startup failed', error)
  root.innerHTML = `
    <div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f0f4f8;color:#0d1821;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:440px;width:100%;padding:18px;border:1px solid #d8e0ea;border-radius:12px;background:#ffffff;box-shadow:0 8px 28px rgba(13,24,33,0.12);">
        <div style="font-size:16px;font-weight:900;margin-bottom:8px;">PCS Express could not start</div>
        <div style="font-size:12px;line-height:1.6;color:#56697c;margin-bottom:14px;">The app bundle loaded, but startup was interrupted. Clear the site data once more or reopen the app so the latest verified bundle can start cleanly.</div>
        <button id="pcs-startup-reset" style="width:100%;padding:12px;border:0;border-radius:10px;background:#1565c0;color:#ffffff;font-size:13px;font-weight:900;">Reload PCS Express</button>
      </div>
    </div>
  `
  document.getElementById('pcs-startup-reset')?.addEventListener('click', () => {
    try {
      localStorage.removeItem('pcs_profile')
    } catch {}
    window.location.assign(window.location.origin)
  })
}

function mount() {
  window.__PCS_EXPRESS_BOOT_VERSION__ = STARTUP_VERSION
  const root = document.getElementById('root')
  if (!root) throw new Error('PCS Express root element is missing')
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

// IIFE bundles load in <head> before <body> is parsed; defer until DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      mount()
    } catch (error) {
      showStartupFailure(error)
    }
  })
} else {
  try {
    mount()
  } catch (error) {
    showStartupFailure(error)
  }
}
