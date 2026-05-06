#!/usr/bin/env node
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

// === PORT CONFIGURATION ===
// CRITICAL: Use PORT environment variable provided by Railway
// Railway injects PORT automatically - must listen on 0.0.0.0
const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || '0.0.0.0'
const API_KEY = process.env.ANTHROPIC_API_KEY
const distPath = path.join(__dirname, '..', 'dist')

console.log('[SERVER] ════════════════════════════════════════════════════════')
console.log('[SERVER] PCS Express - Node.js Backend Server')
console.log('[SERVER] ════════════════════════════════════════════════════════')
console.log(`[SERVER] HOST: ${HOST}`)
console.log(`[SERVER] PORT: ${PORT}`)
console.log(`[SERVER] NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
console.log(`[SERVER] DIST: ${distPath}`)
console.log(`[SERVER] FRONTEND: ${fs.existsSync(distPath) ? 'BUILT' : 'MISSING'}`)
console.log('[SERVER] ════════════════════════════════════════════════════════')

// === MIDDLEWARE ===
app.use(cors())
app.use(express.json({ limit: '1mb' }))

// === HEALTH ENDPOINTS ===
// CRITICAL for Railway: Must respond with 200 OK
app.get('/health', (req, res) => {
  res.status(200).json({ ok: 1, service: 'express', port: PORT })
})

app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: 1, service: 'express-api', port: PORT })
})

// === API ROUTES (MUST BE BEFORE STATIC/FRONTEND) ===
app.post('/api/ai', async (req, res) => {
  try {
    const { system, user } = req.body

    if (!system || !user) {
      return res.status(400).json({ error: 'Missing system or user parameter' })
    }

    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' })
    }

    const signal = AbortSignal.timeout(15000)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 256,
        system,
        messages: [{ role: 'user', content: user }],
      }),
      signal,
    })

    if (!response.ok) {
      console.error(`[API] Anthropic error: ${response.status}`)
      return res.status(502).json({ error: 'Anthropic API error' })
    }

    const data = await response.json()
    res.status(200).json({ text: data.content?.[0]?.text || 'No response' })
  } catch (err) {
    console.error(`[API] Error: ${err.message}`)
    res.status(503).json({ error: 'Service unavailable' })
  }
})

// === FRONTEND SERVING (AFTER ALL API ROUTES) ===
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))

  // SPA fallback: serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })

  console.log('[SERVER] Frontend: ENABLED')
} else {
  // Frontend not built
  app.get('*', (req, res) => {
    res.status(404).json({ error: 'Frontend not built' })
  })

  console.log('[SERVER] Frontend: MISSING (build not run)')
}

// === START SERVER ===
// CRITICAL: Listen on 0.0.0.0 for Railway
const server = app.listen(PORT, HOST, () => {
  console.log('[SERVER] ════════════════════════════════════════════════════════')
  console.log(`[SERVER] ✓ Express server started`)
  console.log(`[SERVER] ✓ Listening on http://${HOST}:${PORT}`)
  console.log(`[SERVER] ✓ Ready to accept requests`)
  console.log('[SERVER] ════════════════════════════════════════════════════════')
})

// Set timeout for keeping alive
server.keepAliveTimeout = 65000
server.headersTimeout = 66000

// === GRACEFUL SHUTDOWN ===
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('[SERVER] Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received, shutting down gracefully...')
  server.close(() => {
    console.log('[SERVER] Server closed')
    process.exit(0)
  })
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[SERVER] Unhandled Rejection at:', promise, 'reason:', reason)
})

export default app
