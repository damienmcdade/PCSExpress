import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import fetch from 'node-fetch'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const distPath = path.join(__dirname, '..', 'dist')

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10kb' }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PCS Express', version: '1.0.0' })
})

// AI API with web search
app.post('/api/ai', async (req, res) => {
  const { system, user } = req.body
  
  if (!system || !user) {
    return res.status(400).json({ error: 'Missing system or user prompt' })
  }
  
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search'
          }
        ],
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.error('Anthropic API error:', response.status, err)
      return res.status(response.status).json({ 
        error: err.error?.message || 'AI service error',
        status: response.status 
      })
    }

    const data = await response.json()
    const text = data.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')

    res.json({ text })
  } catch (err) {
    console.error('Server error:', err.message)
    res.status(500).json({ error: 'Server error: ' + err.message })
  }
})

// Serve React frontend
console.log(`\nStarting PCS Express server...`)
console.log(`  Checking dist folder: ${distPath}`)
console.log(`  Dist exists: ${fs.existsSync(distPath)}`)

if (fs.existsSync(distPath)) {
  console.log(`  ✓ Serving React app from dist`)
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
} else {
  console.log(`  ✗ WARNING: dist folder not found`)
  app.get('*', (req, res) => {
    res.status(404).json({ error: 'Frontend build not found' })
  })
}

app.listen(PORT, () => {
  console.log(`\n✦ PCS Express running on port ${PORT}`)
  console.log(`  Frontend: http://localhost:${PORT}`)
  console.log(`  API: http://localhost:${PORT}/api/health`)
  console.log(`  AI endpoint: http://localhost:${PORT}/api/ai`)
  console.log(`  API key: ${process.env.ANTHROPIC_API_KEY ? '✓ loaded' : '✗ MISSING'}`)
})

export default app
