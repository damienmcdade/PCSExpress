import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10kb' }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PCS Express', version: '1.0.0' })
})

// AI API
app.post('/api/ai', async (req, res) => {
  const { system, user } = req.body
  if (!system || !user) return res.status(400).json({ error: 'Missing prompt' })

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
      return res.status(response.status).json({ error: err.error?.message || 'AI error' })
    }

    const data = await response.json()
    const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('\n')
    res.json({ text })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Serve React frontend
const distPath = path.join(__dirname, '..', 'dist')
console.log(`Serving frontend from: ${distPath}`)
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`✦ PCS Express running on port ${PORT}`)
})

export default app
