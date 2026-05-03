FROM node:18-alpine AS base
WORKDIR /app

# Development dependencies
FROM base AS development
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# Production build
FROM base AS builder
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Production runtime
FROM base AS production
RUN apk add --no-cache curl

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY . .

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "api.js"]
