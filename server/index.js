import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const distPath = path.join(__dirname, '..', 'dist')

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10kb' }))

// DEBUG: Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// AI
app.post('/api/ai', async (req, res) => {
  const { system, user } = req.body
  if (!system || !user) return res.status(400).json({ error: 'Missing' })
  
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
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: 'API error' })
    }

    const data = await response.json()
    const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
    res.json({ text })
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
})

// Serve static
console.log(`\nStartup checks:`)
console.log(`  Dist path: ${distPath}`)
console.log(`  Dist exists: ${fs.existsSync(distPath)}`)

if (fs.existsSync(distPath)) {
  console.log(`  ✓ Serving static files`)
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    console.log(`  → Fallback to index.html for ${req.path}`)
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        console.error(`  ✗ Error sending file: ${err.message}`)
        res.status(500).send('Error')
      }
    })
  })
} else {
  console.log(`  ✗ Dist not found!`)
  app.get('*', (req, res) => {
    res.status(404).json({ error: 'Frontend not found' })
  })
}

const server = app.listen(PORT, () => {
  console.log(`✦ PCS Express on port ${PORT}\n`)
})

export default app
