# PCS Express — Docker Setup Guide

## Quick Start

### Production Build & Run
```bash
docker build -t pcs-express:latest .
docker run -d \
  -p 3001:3001 \
  -e ANTHROPIC_API_KEY=your_key_here \
  pcs-express:latest
```

### With Docker Compose (Production)
```bash
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY
docker compose up app
```

The app will be available at `http://localhost:3001`

### Development with Hot Reload
```bash
docker compose up dev
```

Frontend: http://localhost:3000  
Backend API: http://localhost:3001/api

The development service uses:
- **Bind mounts** (`volumes`) for instant file sync
- **develop.watch** for automatic rebuild on package.json changes
- **nodemon** for backend auto-reload
- **Vite dev server** for frontend hot module reload

## Environment Variables

Required:
- `ANTHROPIC_API_KEY` — Your Anthropic API key

Optional:
- `PORT` — API server port (default: 3001)
- `NODE_ENV` — `production` or `development`
- `ALLOWED_ORIGIN` — CORS origin for production

## Architecture

### Production (`Dockerfile`)
- **Multi-stage build**: Reduces final image size
- **Non-root user**: Security best practice
- **Healthcheck**: Automatic container restart on failures
- **dumb-init**: Proper signal handling for graceful shutdowns
- **Alpine Linux**: Minimal 200MB image

### Development (`Dockerfile.dev`)
- Full dependencies for debugging and development
- Volume mounts for code changes
- Runs both Vite dev server (port 3000) and Express (port 3001)

## Docker Compose Services

| Service | Environment | Ports | Purpose |
|---------|-------------|-------|---------|
| `app` | Production | 3001 | Full-stack app, production-ready |
| `dev` | Development | 3000, 3001 | Hot-reload frontend + backend |

## Health Checks

Both Dockerfiles include HTTP health checks:
- Interval: 30s
- Timeout: 3s
- Retries: 3
- Start period: 5-10s

## Common Commands

```bash
# Build production image
docker compose build app

# Run production
docker compose up app

# Run development with live reload
docker compose up dev

# View logs
docker compose logs -f [service_name]

# Stop all services
docker compose down

# Rebuild without cache
docker compose build --no-cache app
```

## Notes

- The `.dockerignore` file excludes `node_modules`, `.env`, and build artifacts to speed up builds
- Both images use Alpine Linux for minimal footprint
- Production build includes security headers (Helmet) and rate limiting
- Development service maintains hot reload through volume mounts and Compose watch mode
