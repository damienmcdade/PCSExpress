# Railway Deployment Troubleshooting

## Problem: Repo doesn't show up in Railway's GitHub list

### Solution 1: Authorize Railway with GitHub
1. Go to https://railway.app
2. Click **GitHub** login (not email)
3. Authorize Railway to access your repositories
4. Confirm GitHub permissions are granted for `damienmcdade` user

### Solution 2: Check GitHub push succeeded
```bash
# Verify repo is on GitHub
git remote -v
# Should show: origin https://github.com/damienmcdade/pcs-express.git

# Verify commits are pushed
git log --oneline

# View on GitHub
# https://github.com/damienmcdade/pcs-express
```

### Solution 3: Railway refresh
- Close and re-open https://railway.app
- Click "New Project" → "Deploy from GitHub repo"
- The repo list should refresh

---

## Problem: Build fails on Railway

### Check Railway Logs
1. In Railway dashboard, click your project
2. Click **Deployments**
3. Click the failed deployment
4. Scroll to **Logs** tab
5. Look for error messages

### Common Build Failures

**Error: `npm: not found`**
- Ensure `package.json` exists in repo root
- Verify it's committed: `git ls-files package.json`

**Error: `ANTHROPIC_API_KEY not set`**
- Go to Railway project → **Variables**
- Add: `ANTHROPIC_API_KEY=sk-ant-your_key_here`
- Redeploy

**Error: `Dockerfile not found`**
- Ensure `Dockerfile` is in repo root
- Verify: `git ls-files Dockerfile`

---

## Problem: App deploys but doesn't respond

### 1. Check if service is running
```bash
curl https://your-railway-url/api/health
```

Should return:
```json
{"status":"ok","service":"PCS Express API","version":"1.0.0"}
```

If 404 or timeout:

### 2. View Railway logs
- Railway dashboard → Deployments → Logs
- Look for startup errors

### 3. Verify environment variables
Railway dashboard → Variables:
```
ANTHROPIC_API_KEY = your_key
NODE_ENV = production
```

### 4. Check port binding
Railway automatically exposes port 80. Verify Dockerfile exposes the correct port:
```dockerfile
EXPOSE 3001  # or PORT env var
```

---

## Problem: 502 Bad Gateway / Proxy error

### Cause 1: App crash on startup
```bash
# Check logs in Railway dashboard for errors
```

### Cause 2: Port mismatch
- Railway expects app on port 80 or configurable via `$PORT`
- Dockerfile should use `EXPOSE $PORT` or specific port
- Verify in `server/index.js`: `app.listen(PORT || 3001, ...)`

### Cause 3: Slow startup
- Railway timeout is ~60 seconds
- Verify healthcheck in Dockerfile passes quickly
- Check `start_period: 10s` gives enough time

---

## Solution: Use Simplified Railway Config

If docker-compose causes issues, Railway prefers a single **Dockerfile**:

1. Ensure `Dockerfile` (not `docker-compose.yml`) is in repo root
2. Update `railway.json`:
```json
{
  "build": {
    "builder": "dockerfile",
    "dockerfile": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node server/index.js"
  }
}
```

3. Commit and push:
```bash
git add railway.json
git commit -m "Fix Railway config"
git push origin main
```

4. In Railway: **Redeploy** (don't rebuild, just deploy)

---

## Step-by-Step Fix

1. **Verify GitHub push**:
```bash
git push origin main
git log --oneline
```

2. **Add Railway env vars**:
   - Dashboard → Variables
   - Add: `ANTHROPIC_API_KEY=your_key`

3. **Redeploy**:
   - Dashboard → Deployments → **Redeploy**
   - Wait 5 minutes

4. **Check status**:
```bash
curl https://your-railway-url/api/health
```

5. **If still failing**, share:
   - Railway deployment logs
   - Error message from dashboard

---

## Contact & Docs

- **Railway Docs**: https://docs.railway.app
- **Docker on Railway**: https://docs.railway.app/reference/dockerfile
- **GitHub Issues**: https://github.com/damienmcdade/pcs-express/issues
