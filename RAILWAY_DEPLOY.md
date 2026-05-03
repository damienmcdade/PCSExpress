# Deploy PCS Express to Railway

## Quick Setup

1. **Connect Repository**
   ```bash
   git remote add railway <your-railway-repo>
   git push railway main
   ```

2. **Set Environment Variables**
   In Railway dashboard, go to Variables and add:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   NODE_ENV=production
   PORT=3001
   ```

3. **Deploy**
   Push to Railway:
   ```bash
   git push railway main
   ```

## Troubleshooting

### App keeps crashing
- Check logs: `railway logs`
- Verify API key is set
- Check memory limit (minimum 512MB recommended)

### Health check failing
- Ensure PORT=3001 is set
- Check `/api/health` endpoint responds

### Build times out
- Increase build timeout in Railway settings
- Use Docker cache

## Environment Variables Required

| Variable | Value | Required |
|----------|-------|----------|
| ANTHROPIC_API_KEY | sk-ant-... | Yes |
| NODE_ENV | production | Yes |
| PORT | 3001 | Auto-set by Railway |
| ALLOWED_ORIGIN | https://your-domain.railway.app | Optional |

## Health Check
Railway will test: `GET /api/health`

Response:
```json
{
  "status": "ok",
  "service": "PCS Express",
  "version": "1.0.0"
}
```

## Monitoring
- Logs: `railway logs`
- Metrics: Railway dashboard
- Crashes: Automatic restart (3 max retries)
