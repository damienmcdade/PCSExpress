import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

function mount() {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

// IIFE bundles load in <head> before <body> is parsed; defer until DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount)
} else {
  mount()
}
