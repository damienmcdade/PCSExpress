# ✦ PCS Express

**Branch-aware PCS guidance for U.S. service members — from orders to arrival.**

PCS Express is a mobile-first web application that gives service members a personalized, AI-powered relocation guide based on their branch, component, pay grade, and specific installations. It includes a dynamic out-processing checklist with real deadlines, an AI-searched gaining installation guide, spouse & family community resources, and a live PCS assistant.

---

## Features

- **Branch theming** — Army, Navy, Marine Corps, Air Force, Space Force, Coast Guard each have their own color scheme and SVG insignia
- **Component support** — Active Duty, Reserve, National Guard, AGR, Full-Time National Guard with component-specific entitlement guidance
- **Dynamic out-processing checklist** — 25+ tasks calculated against your real RNLTD, filterable by phase and category, with office + contact info per task
- **AI-powered gaining installation guide** — 9 categories (housing, spouse community, daycare, unit info, vehicles, activities, nightlife, social clubs, USO & events) searched live
- **Spouse & family community section** — dedicated screen for spouse clubs, FRGs, Facebook groups, employment resources, and events at the gaining installation
- **Local resources** — AI-searched cleaning services, gear stores, and VPC detailing near the losing installation
- **PCS assistant chat** — freeform AI chat with web search, pre-loaded with the soldier's full context
- **Persistent storage** — profile and checklist state saved to localStorage
- **Secure API proxy** — Anthropic API key never exposed to the client

---

## Prerequisites

- Node.js 18 or higher (`node --version`)
- npm 9 or higher (`npm --version`)
- An [Anthropic API key](https://console.anthropic.com) with access to Claude models

---

## Quick Start (Local Development)

### 1. Clone and install

```bash
git clone https://github.com/your-org/pcs-express.git
cd pcs-express
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
NODE_ENV=development
PORT=3001
```

### 3. Start the development servers

```bash
npm run dev
```

This starts both servers concurrently:
- **React app** → http://localhost:3000
- **Express API proxy** → http://localhost:3001

Open http://localhost:3000 in your browser (or on your phone via your local IP).

---

## Project Structure

```
pcs-express/
├── src/
│   ├── App.jsx          # Full React application (all screens + components)
│   └── main.jsx         # React entry point
├── server/
│   └── index.js         # Express API proxy (secures Anthropic API key)
├── public/
│   └── favicon.svg      # App icon
├── index.html           # Vite HTML entry point
├── vite.config.js       # Vite configuration (dev proxy to :3001)
├── package.json         # Dependencies and scripts
├── .env.example         # Environment variable template
├── netlify.toml         # Netlify deployment config
├── vercel.json          # Vercel deployment config
└── .gitignore
```

---

## Deployment

### Option A: Vercel (Recommended — Full-Stack)

Vercel handles both the React frontend and the Express API in one deploy.

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Set environment variables in the Vercel dashboard:
   - `ANTHROPIC_API_KEY` = your key
   - `NODE_ENV` = `production`
   - `ALLOWED_ORIGIN` = `https://your-vercel-url.vercel.app`
4. Deploy. Vercel auto-detects `vercel.json`.

```bash
# Or deploy via CLI:
npm i -g vercel
vercel --prod
```

---

### Option B: Railway (Full-Stack, Simple)

Railway runs the Express server which serves both the API and the built React app.

1. Push repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Set environment variables:
   - `ANTHROPIC_API_KEY`
   - `NODE_ENV=production`
   - `ALLOWED_ORIGIN=https://your-railway-url.railway.app`
4. Railway runs `npm start` → `node server/index.js`

The server detects `NODE_ENV=production` and serves the React `dist/` build statically. Before deploying, build the frontend:

```bash
npm run build
```

Then commit the `dist/` folder (or add a Railway build command: `npm run build && npm start`).

---

### Option C: Render (Full-Stack)

1. Push repo to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Build command: `npm install && npm run build`
4. Start command: `node server/index.js`
5. Set environment variables in the Render dashboard

---

### Option D: Netlify (Frontend only — requires separate API)

If you only want to deploy the frontend to Netlify and host the API elsewhere (e.g., Railway or Render):

1. Deploy the API server to Railway/Render
2. Set `ALLOWED_ORIGIN` to your Netlify URL on the API server
3. In your Vite config, set `VITE_API_BASE` to point to your API URL
4. Update `src/App.jsx` line: `fetch("/api/ai", ...)` → `fetch(\`${import.meta.env.VITE_API_BASE}/api/ai\`, ...)`
5. Push to GitHub → connect to Netlify → deploy

---

### Option E: Docker

A `Dockerfile` can be added for containerized deployment:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "server/index.js"]
```

Build and run:

```bash
docker build -t pcs-express .
docker run -p 3001:3001 -e ANTHROPIC_API_KEY=your_key pcs-express
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Anthropic API key from console.anthropic.com |
| `PORT` | No | API server port (default: 3001) |
| `NODE_ENV` | No | `development` or `production` (default: development) |
| `ALLOWED_ORIGIN` | Production | Your frontend URL for CORS (e.g., https://pcs-express.com) |

---

## API Reference

### `POST /api/ai`

Secure proxy to Anthropic Claude with web search.

**Request body:**
```json
{
  "system": "You are a PCS assistant...",
  "user": "What are the housing options at Fort Liberty?"
}
```

**Response:**
```json
{
  "text": "At Fort Liberty, housing options include..."
}
```

**Rate limits:**
- 60 requests per 15 minutes per IP (general)
- 10 AI requests per minute per IP (strict, for `/api/ai`)

### `GET /api/health`

Returns server status.

```json
{
  "status": "ok",
  "service": "PCS Express API",
  "version": "1.0.0",
  "timestamp": "2025-08-01T12:00:00.000Z"
}
```

---

## Adding Features

### Push Notifications (Task Deadlines)
Use the [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) with a service worker. Add a `public/sw.js` service worker and register it in `main.jsx`. Use [web-push](https://www.npmjs.com/package/web-push) on the server to send notifications.

### Shareable PCS Plans
Generate a unique plan ID, encode the profile as a URL-safe token, and add a `/plan/:id` route. Store plans server-side (e.g., Supabase or a simple JSON store).

### Authentication
Add [Supabase Auth](https://supabase.com/auth) or [Auth0](https://auth0.com) to let service members create accounts and sync their checklist across devices.

### Analytics
Add [Plausible](https://plausible.io) (privacy-friendly) to understand which features are most used.

---

## Security Notes

- The Anthropic API key is **only used server-side** in `server/index.js`. It is never sent to the browser.
- All AI requests are routed through `/api/ai` which validates input, enforces rate limits, and sanitizes prompts.
- Helmet.js sets secure HTTP headers including a Content Security Policy.
- CORS is locked to your specific frontend origin in production.
- Input is validated and size-limited (2000 chars max per prompt field).

---

## License

Built for U.S. service members and their families. Free to use and modify.

---

*PCS Express is an independent tool and is not affiliated with, endorsed by, or sponsored by the U.S. Department of Defense or any military branch.*
