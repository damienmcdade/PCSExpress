#!/usr/bin/env node
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000
const API_KEY = process.env.ANTHROPIC_API_KEY
const distPath = path.join(__dirname, '..', 'dist')

console.log('[INIT] Starting PCS Express')
console.log(`[INIT] PORT=${PORT}`)
console.log(`[INIT] DIST=${distPath}`)
console.log(`[INIT] FRONTEND=${fs.existsSync(distPath) ? 'YES' : 'NO'}`)

// Middleware
app.use(cors())
app.use(express.json({ limit: '1mb' }))

// Health
app.get('/health', (req, res) => {
  res.json({ ok: 1 })
})

// API
app.post('/api/ai', async (req, res) => {
  try {
    const { system, user } = req.body
    if (!system || !user || !API_KEY) {
      return res.status(400).json({ error: 'Missing params' })
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
      signal
    })

    if (!response.ok) {
      return res.status(500).json({ error: 'API error' })
    }

    const data = await response.json()
    res.json({ text: data.content?.[0]?.text || 'No response' })
  } catch (err) {
    res.status(503).json({ error: 'Service error' })
  }
})

// Frontend
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
  console.log('[INIT] Frontend ready')
} else {
  app.get('*', (req, res) => res.status(404).json({ error: 'Frontend not built' }))
  console.log('[INIT] Frontend missing')
}

// Start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[START] http://localhost:${PORT}`)
})

process.on('SIGTERM', () => process.exit(0))
process.on('SIGINT', () => process.exit(0))
