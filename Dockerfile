FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache curl

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build frontend
COPY . .
RUN npm run build

# Prune production deps
RUN npm prune --production

# Expose correct port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start server
CMD ["npm", "start"]
