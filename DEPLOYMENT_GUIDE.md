#!/bin/bash
# PCS Express - Production Deployment Guide

## Prerequisites
- Docker & Docker Compose installed
- Domain name (e.g., pcs-express.com)
- Anthropic API key
- SSL certificate (recommended for production)

## 1. Prepare Your Server

```bash
# Clone/upload your project
git clone <your-repo> pcs-express
cd pcs-express

# Copy production environment
cp .env.production .env

# Edit with your values
nano .env
# Set: ANTHROPIC_API_KEY, ALLOWED_ORIGIN
```

## 2. Set Up SSL/TLS (Optional but Recommended)

### Option A: Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy to project
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./certs/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./certs/key.pem
sudo chown $USER:$USER ./certs/*

# Enable HTTPS in nginx.conf: uncomment "return 301 https://$host$request_uri;"
```

### Option B: Self-Signed (Testing Only)
```bash
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes
```

## 3. Configure Nginx for HTTPS

Edit `nginx.conf` to enable SSL:

```nginx
server {
    listen 80;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;
    
    # ... rest of config
}
```

## 4. Deploy with Docker Compose

```bash
# Production build (no dev service)
docker compose build

# Start services
docker compose up -d

# Verify
docker compose ps
docker compose logs -f

# Health check
curl http://localhost/health
curl http://localhost/api/health
```

## 5. Set Up Domain & DNS

Point your domain to your server's IP:
- A record: `pcs-express.com` → `your.server.ip`
- CNAME (optional): `www.pcs-express.com` → `pcs-express.com`

## 6. Automatic Certificate Renewal (Let's Encrypt)

```bash
# Create renewal script
cat > /etc/cron.monthly/renew-certs.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /path/to/certs/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem /path/to/certs/key.pem
cd /path/to/pcs-express
docker compose restart nginx
EOF

chmod +x /etc/cron.monthly/renew-certs.sh
```

## 7. Monitoring & Maintenance

```bash
# View logs
docker compose logs app
docker compose logs nginx

# Restart services
docker compose restart

# Stop all
docker compose down

# Backup database/configs
docker compose exec app tar -cz / > backup.tar.gz

# Update image
docker compose pull
docker compose up -d
```

## 8. Production Checklist

- [ ] ANTHROPIC_API_KEY set in `.env`
- [ ] ALLOWED_ORIGIN points to your domain
- [ ] SSL certificate installed (if using HTTPS)
- [ ] Domain DNS configured
- [ ] Nginx healthcheck passing
- [ ] API responding at `/api/health`
- [ ] Frontend loads at your domain
- [ ] Rate limiting enabled on `/api/ai`
- [ ] Logs monitored for errors
- [ ] Automated backups configured

## Troubleshooting

**Port 80/443 already in use:**
```bash
lsof -i :80
kill -9 <PID>
```

**Certificate validation fails:**
```bash
# Check cert validity
openssl x509 -in certs/cert.pem -text -noout

# Force renewal
sudo certbot renew --force-renewal
```

**API not responding:**
```bash
docker compose logs app
curl http://localhost:3001/api/health
```

**Nginx 502 Bad Gateway:**
```bash
docker compose logs nginx
# Usually means app service not responding
docker compose restart app
```

## Platform-Specific Guides

### AWS EC2
1. Launch Ubuntu 22.04 instance
2. Install Docker: `curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh`
3. Clone project and follow steps above
4. Configure security group for ports 80, 443

### DigitalOcean Droplet
1. Create Droplet with Docker pre-installed
2. SSH in and clone project
3. Follow deployment steps
4. Use DigitalOcean App Platform for automatic CI/CD

### Render
1. Push repo to GitHub
2. Create Web Service from GitHub repo
3. Set build command: `docker build -t pcs-express .`
4. Set start command: `docker compose up app`
5. Add environment variables in Render dashboard

### Railway
1. Connect GitHub repo
2. Add ANTHROPIC_API_KEY as secret
3. Railway auto-detects docker-compose.yml
4. Deploys automatically on git push

## Support

For issues:
- Check logs: `docker compose logs`
- Test API: `curl -X GET http://localhost/api/health`
- Verify env vars: `docker compose config`
