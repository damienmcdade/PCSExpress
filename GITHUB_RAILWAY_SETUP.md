# GitHub & Railway Setup Instructions

## Step 1: Create GitHub Repository

Visit https://github.com/new and create a new public repository:
- **Owner**: damienmcdade
- **Repo name**: pcs-express
- **Description**: Personalized PCS guidance for U.S. service members
- **Public**: Yes (recommended for open source)
- **Initialize**: Do NOT initialize with README (we have files already)

## Step 2: Push to GitHub

Run these commands in your local `pcs-express` directory:

```bash
git remote add origin https://github.com/damienmcdade/pcs-express.git
git branch -M main
git push -u origin main
```

If using SSH instead:
```bash
git remote add origin git@github.com:damienmcdade/pcs-express.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Railway

1. **Create Railway Account**: https://railway.app
   - Sign up with your GitHub account (recommended for easy integration)

2. **Create New Project**:
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `damienmcdade/pcs-express`
   - Railway auto-detects `docker-compose.yml`

3. **Configure Environment Variables** in Railway Dashboard:
   ```
   ANTHROPIC_API_KEY = sk-ant-your_key_here
   ALLOWED_ORIGIN = https://your-railway-domain.up.railway.app
   NODE_ENV = production
   ```

4. **Add Volumes** (optional, for persisting data):
   - Skip for now — stateless app doesn't need it

5. **Deploy**:
   - Railway automatically builds and deploys
   - Watch deployment logs in dashboard
   - Takes ~2-5 minutes

6. **Get Your Public URL**:
   - Railway assigns a domain like: `pcs-express-production.up.railway.app`
   - Update `ALLOWED_ORIGIN` with this URL
   - Re-deploy after updating env vars

## Step 4: Test Your Deployment

```bash
curl https://your-railway-domain.up.railway.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "service": "PCS Express API",
  "version": "1.0.0",
  "timestamp": "2026-05-02T..."
}
```

## Step 5: Enable Auto-Deploy (CI/CD)

Railway auto-deploys on every push to `main`:

1. Make changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. Railway detects changes and redeploys automatically
4. View logs in Railway dashboard

## Troubleshooting

**Deployment fails with missing ANTHROPIC_API_KEY**:
- Go to Railway project settings
- Add `ANTHROPIC_API_KEY` env var
- Re-trigger deployment

**502 Bad Gateway**:
- Check Railway logs: Project → Deployments → View logs
- Ensure API key is set
- Verify healthcheck passes locally: `docker compose up`

**Can't connect to database** (if added later):
- Railway provides DATABASE_URL automatically
- Use in connection string

**Need to change domain**:
- Generate Railway domain in project settings
- Update `ALLOWED_ORIGIN` in Railway env vars
- Re-deploy

## Custom Domain (Optional)

To use your own domain (e.g., pcs-express.com):

1. In Railway dashboard → Project Settings → Domains
2. Add custom domain: `pcs-express.com`
3. Point your DNS to Railway's provided CNAME
4. Update `ALLOWED_ORIGIN` to `https://pcs-express.com`
5. Re-deploy

## Next Steps

1. ✅ Create GitHub repo
2. ✅ Push code to GitHub
3. ✅ Deploy to Railway
4. ✅ Test public URL
5. ✅ Add custom domain (optional)
6. Monitor health and logs regularly

Your app will be live in minutes!
