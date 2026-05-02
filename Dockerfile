# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy dependencies
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY src src
COPY public public
COPY server server
COPY index.html vite.config.js ./

# Build
RUN npm run build && echo "Build complete" && ls -la dist/

# Runtime stage
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

# Copy dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy dist and server from builder
COPY --from=builder /app/dist dist
COPY --from=builder /app/server server

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/index.js"]
