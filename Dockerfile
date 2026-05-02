# Stage 1: Build React and Node app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy all source files
COPY package.json package-lock.json ./
COPY src src
COPY public public
COPY server server
COPY index.html vite.config.js ./

# Install all dependencies
RUN npm ci

# Build React app
RUN npm run build

# Stage 2: Production runtime
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built React app and server code
COPY --from=builder /app/dist ./dist
COPY server ./server

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/index.js"]
