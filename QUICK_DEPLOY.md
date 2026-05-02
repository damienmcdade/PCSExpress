# Quick GitHub & Railway Deployment Guide

## 🚀 Push to GitHub (1 minute)

1. Create empty repo at https://github.com/new
   - Name: `pcs-express`
   - Make it **Public**
   - Don't initialize with README

2. Run in your terminal:
```bash
git remote add origin https://github.com/damienmcdade/pcs-express.git
git branch -M main
git push -u origin main
```

## 🚀 Deploy to Railway (5 minutes)

1. Go to https://railway.app
2. Click **New Project** → **Deploy from GitHub repo**
3. Select `damienmcdade/pcs-express`
4. Railway auto-detects docker-compose.yml

### Set Environment Variables in Railway

In the Railway dashboard, add these variables:

```
ANTHROPIC_API_KEY = sk-ant-your_api_key_here
NODE_ENV = production
```

(After deployment, update `ALLOWED_ORIGIN` to your Railway URL)

5. Click **Deploy**
6. Wait 2-5 minutes for build to complete
7. Get your public URL from Railway dashboard (e.g., `pcs-express-prod.up.railway.app`)

## ✅ Verify Deployment

```bash
curl https://your-railway-url/api/health
```

Should return the health check response.

## 🔄 Auto-Deploy on Push

Every time you push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Railway automatically rebuilds and redeploys within minutes.

## 📋 Files for Railway

- ✅ `Dockerfile` — Single-stage production build
- ✅ `docker-compose.yml` — Nginx + Node.js services
- ✅ `railway.json` — Railway-specific config
- ✅ `.dockerignore` — Optimizes build context

See `GITHUB_RAILWAY_SETUP.md` for detailed troubleshooting.
