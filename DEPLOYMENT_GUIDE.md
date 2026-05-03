# PCS EXPRESS - COMPLETE DEPLOYMENT GUIDE

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PCS EXPRESS                             │
├──────────────────────┬──────────────────────────────────────┤
│   FRONTEND (React)   │      BACKEND (Node.js)               │
│   ─────────────────  │      ────────────────                │
│   • iOS Simulator    │      • Express API                   │
│   • Web Browser      │      • PostgreSQL                    │
│   • Port: 3001/5173  │      • Port: 3000                    │
│                      │      • Docker Container              │
└──────────────────────┴──────────────────────────────────────┘
         │                            │
         └────────────────┬───────────┘
                          │
                    [RAILWAY.APP]
                          │
         ┌────────────────┴───────────────┐
         │                                │
    [Backend Container]         [PostgreSQL Service]
         │                                │
    Port 3000                        Port 5432
```

## STEP 1: Deploy Backend to Railway

### 1.1 Create GitHub Repository (Backend)

```bash
# In pcs-backend directory
cd pcs-backend

# Create repo on GitHub at:
# https://github.com/yourusername/pcs-express-backend

# Add remote and push
git remote add origin https://github.com/yourusername/pcs-express-backend.git
git branch -M main
git push -u origin main
```

### 1.2 Deploy to Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select `pcs-express-backend` repository
4. Railway auto-detects Node.js and creates Dockerfile
5. Add PostgreSQL plugin:
   - In Railway, click "Add service" → "PostgreSQL"
6. Set environment variables:
   ```
   DB_USER=postgres
   DB_PASSWORD=<random-password>
   DB_NAME=pcs_db
   NODE_ENV=production
   JWT_SECRET=<random-secret>
   CORS_ORIGIN=https://<your-frontend-url>,https://pcs-express-xcode.railway.app
   ```
7. Click "Deploy"
8. Note the backend URL: `https://pcs-express-backend-<xyz>.railway.app`

### 1.3 Run Database Migrations

Once deployed:

```bash
# In Railway dashboard, go to Backend service → "Railway CLI"
# Or use:
railway exec npm run migrate
```

## STEP 2: Update Frontend to Use Backend

### 2.1 Update API Configuration

Edit `src/config/apiConfig.js`:

```javascript
export const API_CONFIG = {
  development: {
    apiUrl: 'http://localhost:3000'
  },
  production: {
    apiUrl: 'https://pcs-express-backend-<xyz>.railway.app'
  }
};
```

### 2.2 Update App Component

In `src/App.jsx`, add backend integration:

```javascript
import apiConfig from './config/apiConfig'

// Fetch dashboard data
const fetchDashboard = async () => {
  const response = await fetch(
    `${apiConfig.default.apiUrl}/api/dashboard/command`
  )
  const data = await response.json()
  // Use data...
}
```

### 2.3 Rebuild and Test Locally

```bash
cd pcs-express
npm run build
npm start
# Test at http://localhost:3001
```

## STEP 3: Deploy Frontend to Railway

### 3.1 Update Frontend Git

```bash
cd pcs-express

# Commit backend integration
git add .
git commit -m "Integrate with PCS Express backend API"
git push origin main
```

### 3.2 Create Railway Project for Frontend

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select `PCSExpress` repository (or the frontend repo)
4. Set environment variables:
   ```
   VITE_API_URL=https://pcs-express-backend-<xyz>.railway.app
   NODE_ENV=production
   ```
5. Click "Deploy"
6. Note frontend URL: `https://pcs-express-<abc>.railway.app`

## STEP 4: Update Xcode Integration

### 4.1 Update Capacitor Config

```bash
cd pcs-express
npx cap sync
```

### 4.2 Update API Endpoint in Xcode

In `src/DemoTour.jsx` or wherever you fetch data:

```javascript
const API_URL = 'https://pcs-express-backend-<xyz>.railway.app'

fetch(`${API_URL}/api/dashboard/command`)
  .then(r => r.json())
  .then(data => console.log(data))
```

### 4.3 Rebuild iOS App

```bash
cd pcs-express/ios/App
# In Xcode:
# Product → Destination → iPhone 15 Pro Max
# Product → Run (⌘R)
```

## Testing Backend

### 4.1 Test Locally

```bash
docker-compose up --build
docker-compose exec backend npm run migrate

# Health check
curl http://localhost:3000/health

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@military.mil",
    "password": "test123",
    "name": "Test User",
    "rank": "O3",
    "branch": "USAF",
    "dependents": 2
  }'

# Get dashboard
curl http://localhost:3000/api/dashboard/command
```

### 4.2 Test in Production

```bash
# Replace with your Railway backend URL
curl https://pcs-express-backend-<xyz>.railway.app/health

# Should return: {"status":"ok","service":"PCS Express Backend"}
```

## Monitoring

### Check Logs

**Railway Dashboard:**
1. Go to Backend service
2. Click "Logs" tab
3. Monitor real-time activity

**Local:**
```bash
docker-compose logs -f backend
docker-compose logs -f db
```

### Health Checks

Both frontend and backend have health endpoints:

```bash
# Backend
curl https://pcs-express-backend-<xyz>.railway.app/health

# Frontend
curl https://pcs-express-<abc>.railway.app/health
```

## Environment Variables Summary

### Backend (.env)
```
DB_USER=postgres
DB_PASSWORD=<random>
DB_HOST=db (or provided by Railway)
DB_PORT=5432
DB_NAME=pcs_db
PORT=3000
NODE_ENV=production
JWT_SECRET=<random>
CORS_ORIGIN=https://pcs-express-frontend.railway.app
```

### Frontend (.env)
```
VITE_API_URL=https://pcs-express-backend.railway.app
VITE_APP_NAME=PCS Express
NODE_ENV=production
```

## Troubleshooting

### Backend won't connect to database
- Check DATABASE_URL in Railway PostgreSQL service
- Verify DB credentials in .env
- Run `railway exec npm run migrate`

### CORS errors in frontend
- Update CORS_ORIGIN in backend .env
- Include both frontend and Xcode URLs
- Format: `https://url1.com,https://url2.com`

### Frontend can't reach backend
- Verify backend URL in apiConfig.js
- Check CORS is enabled
- Use `curl` to test backend endpoint directly

### Container won't start
- Check logs: `railway logs`
- Verify environment variables are set
- Ensure package.json has correct "start" script

## Production Checklist

- ✓ Backend deployed to Railway
- ✓ Database migrations run
- ✓ Frontend API configuration updated
- ✓ Frontend deployed to Railway
- ✓ Xcode app points to production backend
- ✓ Health checks passing
- ✓ CORS properly configured
- ✓ Environment variables set
- ✓ SSL/TLS enabled (Railway provides)
- ✓ Monitoring configured

## Useful Commands

```bash
# Railway CLI
npm install -g @railway/cli
railway login
railway link
railway up

# Docker local dev
docker-compose up --build
docker-compose down
docker-compose logs -f

# Git push auto-deploys
git push origin main
```

---

**Status:** Ready for production deployment
**Last Updated:** 2024
