FROM node:22-alpine

WORKDIR /app

# Install curl for healthchecks only
RUN apk add --no-cache curl

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install all dependencies (production + dev for build)
RUN npm ci

# Copy application code
COPY . .

# Build React frontend to /app/dist
RUN npm run build

# Prune dev dependencies (production only)
RUN npm prune --production

# === PORT 3001 ===
# Express backend server runs on port 3001 (inside container)
EXPOSE 3001

# Healthcheck: verify Express server is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f -4 http://127.0.0.1:3001/health || exit 1

# Start: run Express server
CMD ["npm", "start"]
