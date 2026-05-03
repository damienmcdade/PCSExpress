#!/usr/bin/env node

/**
 * PCS Express Server - Ultra-Stable Production Build
 * Minimal, bulletproof, crash-proof
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import fetch from 'node-fetch'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import multer from 'multer'

// Setup
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const distPath = path.join(__dirname, '..', 'dist')
const API_KEY = process.env.ANTHROPIC_API_KEY

// Console logging helper
const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`)

log('STARTING SERVER')
log(`PORT: ${PORT}`)
log(`DIST: ${distPath}`)
log(`API_KEY: ${API_KEY ? 'SET' : 'MISSING'}`)

// Multer - safe config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 } // 500KB only
})

// SAFETY: Catch ALL errors globally
process.on('uncaughtException', (err) => {
  log(`FATAL UNCAUGHT: ${err.message}`)
  setTimeout(() => process.exit(1), 1000)
})

process.on('unhandledRejection', (reason) => {
  log(`UNHANDLED REJECTION: ${reason}`)
})

// MIDDLEWARE: Absolute minimum
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors())
app.use(express.json({ limit: '500kb' }))
app.use(express.urlencoded({ limit: '500kb' }))

// TIMEOUT: Safety valve
app.use((req, res, next) => {
  res.setTimeout(20000) // 20 seconds max
  next()
})

// HEALTH - Super simple, can't fail
app.get('/health', (req, res) => {
  res.json({ ok: 1 })
})

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    uptime: process.uptime(),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
  })
})

// AI ENDPOINT - With aggressive error handling
app.post('/api/ai', async (req, res) => {
  const { system, user } = req.body || {}
  
  try {
    if (!system || !user) {
      return res.status(400).json({ error: 'Missing system or user' })
    }
    if (!API_KEY) {
      return res.status(500).json({ error: 'No API key' })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

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
      signal: controller.signal,
    }).catch(e => {
      clearTimeout(timeout)
      throw e
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return res.status(500).json({ error: 'API error' })
    }

    const data = await response.json().catch(() => ({}))
    const text = data.content?.[0]?.text || 'No response'
    
    res.json({ text })
  } catch (err) {
    log(`AI ERROR: ${err.message}`)
    res.status(503).json({ error: 'Service error' })
  }
})

// RESUME ENDPOINT - Ultra simple
app.post('/api/resume-match', upload.single('resume'), async (req, res) => {
  const { action, jobDescription } = req.body || {}
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file' })
    }
    if (!action || !jobDescription) {
      return res.status(400).json({ error: 'Missing fields' })
    }
    if (!API_KEY) {
      return res.status(500).json({ error: 'No API key' })
    }

    const resumeText = req.file.buffer.toString('utf-8').slice(0, 10000)
    if (!resumeText) {
      return res.status(400).json({ error: 'Empty file' })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        system: action === 'match' 
          ? 'Analyze resume vs job. Return JSON only: {matchPercentage, strengths, gaps, recommendations}'
          : 'Rewrite resume. Return text only.',
        messages: [{ 
          role: 'user', 
          content: `Resume: ${resumeText}\n\nJob: ${jobDescription}`
        }],
      }),
      signal: controller.signal,
    }).catch(e => {
      clearTimeout(timeout)
      throw e
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return res.status(500).json({ error: 'API error' })
    }

    const data = await response.json().catch(() => ({}))
    const result = data.content?.[0]?.text || ''

    if (action === 'match') {
      try {
        res.json(JSON.parse(result))
      } catch {
        res.json({ error: 'Parse error', raw: result.slice(0, 200) })
      }
    } else {
      res.json({ refinedResume: result })
    }
  } catch (err) {
    log(`RESUME ERROR: ${err.message}`)
    res.status(503).json({ error: 'Service error' })
  }
})

// STATIC FILES - Serve frontend
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '1d' }))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html')).catch(() => {
      res.status(404).json({ error: 'not found' })
    })
  })
  log('FRONTEND: Ready')
} else {
  log('FRONTEND: NOT FOUND')
  app.get('*', (req, res) => res.status(404).json({ error: 'frontend not built' }))
}

// ERROR HANDLER - Last resort
app.use((err, req, res, next) => {
  log(`ERROR: ${err.message}`)
  res.status(500).json({ error: 'internal error' })
})

// START SERVER - With error handling
let server = null
try {
  server = app.listen(PORT, '0.0.0.0', () => {
    log(`STARTED ON PORT ${PORT}`)
    log(`http://localhost:${PORT}`)
  })

  server.on('error', (err) => {
    log(`SERVER ERROR: ${err.message}`)
    process.exit(1)
  })
} catch (err) {
  log(`STARTUP ERROR: ${err.message}`)
  process.exit(1)
}

// SHUTDOWN - Clean
const gracefulShutdown = (signal) => {
  log(`SHUTDOWN: ${signal}`)
  if (server) {
    server.close(() => {
      log(`STOPPED`)
      process.exit(0)
    })
    setTimeout(() => {
      log(`FORCE EXIT`)
      process.exit(1)
    }, 5000)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

export default app
