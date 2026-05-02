# PCS Express — Production Website Setup

Your project is now configured as a production website with:

## ✨ What's New

1. **Nginx Reverse Proxy** (`nginx.conf`)
   - Serves React frontend at `/`
   - Proxies API requests to `/api/`
   - Built-in caching for static assets
   - Health check endpoint at `/health`

2. **Updated docker-compose.yml**
   - Nginx web server (ports 80/443)
   - Backend API (internal port 3001)
   - Network isolation for security
   - Dev service in separate profile

3. **Production Environment** (`.env.production`)
   - ALLOWED_ORIGIN for CORS
   - SSL/TLS certificate paths
   - Production Node environment

4. **Deployment Guide** (`DEPLOYMENT_GUIDE.md`)
   - Step-by-step setup instructions
   - SSL/Let's Encrypt configuration
   - Platform-specific guides (AWS, DigitalOcean, Render, Railway)
   - CI/CD pipeline setup

5. **GitHub Actions CI/CD** (`.github/workflows/deploy.yml`)
   - Automatic Docker builds on push
   - Multi-tag versioning
   - Build caching for faster deploys
   - PR test validation

6. **Landing Page** (`public/index-fallback.html`)
   - Professional homepage
   - Feature showcase
   - FAQ section
   - Mobile responsive design

## 🚀 Quick Start (Local Testing)

```bash
# Stop previous dev instance
docker compose down

# Build production images
docker compose build

# Run with Nginx
docker compose up

# Visit: http://localhost
```

## 📋 Deployment Options

### Option 1: Self-Hosted (AWS EC2 / DigitalOcean)
See `DEPLOYMENT_GUIDE.md` for full instructions

### Option 2: Platform-as-a-Service
- **Railway**: Push to GitHub, Railway deploys automatically
- **Render**: Connect GitHub repo, configure environment
- **Fly.io**: `flyctl deploy`

### Option 3: Docker Hub Registry
```bash
# Push to Docker Hub
docker build -t yourusername/pcs-express ./pcs-express
docker push yourusername/pcs-express

# Pull on server
docker pull yourusername/pcs-express
docker compose up app
```

## 🔒 Security Features

- Non-root user in container
- HTTPS/SSL support
- Rate limiting on API endpoints
- CORS configuration per domain
- Helmet security headers
- Input validation (10kb limit)
- Health checks for auto-recovery

## 📊 Monitoring

```bash
# View logs
docker compose logs -f app
docker compose logs -f nginx

# Check health
curl http://localhost/health        # Nginx
curl http://localhost/api/health    # API

# Container stats
docker stats
```

## 🛠️ Next Steps

1. **Set up domain**: Point your domain DNS to server IP
2. **Add SSL certificate**: Follow DEPLOYMENT_GUIDE.md for Let's Encrypt
3. **Configure ALLOWED_ORIGIN**: Update `.env` with your domain
4. **Set GitHub secrets**: For automated Docker Hub pushes
5. **Enable monitoring**: Set up uptime monitoring and log aggregation
6. **Add custom domain** in docker-compose or load balancer

## 🔧 Production Checklist

- [ ] Domain name registered
- [ ] DNS configured
- [ ] SSL certificate obtained
- [ ] ANTHROPIC_API_KEY set securely
- [ ] ALLOWED_ORIGIN updated to your domain
- [ ] Health checks passing
- [ ] API responding to requests
- [ ] Frontend loads correctly
- [ ] Rate limiting verified
- [ ] Monitoring alerts configured
- [ ] Automated backups set up
- [ ] CI/CD pipeline tested

Your website is production-ready. Follow the deployment guide for your chosen platform!
