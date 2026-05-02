import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import fetch from 'node-fetch'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const IS_PROD = process.env.NODE_ENV === 'production'

// ── Security middleware ────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
    }
  }
}))

app.use(cors({
  origin: IS_PROD
    ? process.env.ALLOWED_ORIGIN || 'https://your-domain.com'
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}))

app.use(express.json({ limit: '10kb' }))

// ── Rate limiting ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please wait a moment and try again.' }
})

const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many AI requests — please slow down.' }
})

app.use('/api/', limiter)

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PCS Express API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// ── Anthropic proxy ───────────────────────────────────────────────────────────
app.post('/api/ai', strictLimiter, async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server.' })
  }

  const { system, user } = req.body
  if (!system || !user) {
    return res.status(400).json({ error: 'Missing system or user prompt.' })
  }
  if (typeof system !== 'string' || typeof user !== 'string') {
    return res.status(400).json({ error: 'Invalid prompt format.' })
  }
  if (system.length > 2000 || user.length > 2000) {
    return res.status(400).json({ error: 'Prompt too long.' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.error('Anthropic API error:', response.status, err)
      return res.status(response.status).json({ error: err.error?.message || 'AI service error' })
    }

    const data = await response.json()
    const text = data.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')

    res.json({ text })
  } catch (err) {
    console.error('Server error:', err)
    res.status(500).json({ error: 'Server error — please try again.' })
  }
})

// ── Serve React app (always, not just production) ─────────────────────────────
const distPath = path.join(__dirname, '..', 'dist')
console.log(`Checking for dist at: ${distPath}`)

if (fs.existsSync(distPath)) {
  console.log('✓ Dist folder found, serving static files')
  app.use(express.static(distPath, { maxAge: '1d', index: 'index.html' }))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
} else {
  console.warn('✗ WARNING: Dist folder not found at', distPath)
  app.get('/', (req, res) => {
    res.json({ message: 'PCS Express API is running but frontend build not found' })
  })
}

app.listen(PORT, () => {
  console.log(`\n✦ PCS Express API running on port ${PORT}`)
  console.log(`  Environment: ${IS_PROD ? 'production' : 'development'}`)
  console.log(`  API key: ${process.env.ANTHROPIC_API_KEY ? '✓ loaded' : '✗ MISSING'}`)
  if (!IS_PROD) {
    console.log(`  React dev server: http://localhost:3000`)
    console.log(`  API proxy: http://localhost:3001/api`)
  }
})

export default app
