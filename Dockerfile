# Stage 1: Build React app
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json package-lock.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY server server

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

CMD ["node", "server/index.js"]
