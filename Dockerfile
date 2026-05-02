# Stage 1: Build React app and install dependencies
FROM node:18-alpine AS builder

WORKDIR /app

# Copy all source files needed for build
COPY package.json package-lock.json ./
COPY src ./src
COPY public ./public
COPY index.html vite.config.js ./

# Install dependencies
RUN npm ci

# Debug: verify files exist
RUN ls -la && echo "---" && ls -la src/ && echo "---" && ls -la public/

# Build React app
RUN npm run build && ls -la dist/

# Stage 2: Production runtime
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm install --only=production && npm cache clean --force

# Copy built React app from builder
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server ./server

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/index.js"]
