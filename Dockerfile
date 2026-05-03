FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm prune --production
EXPOSE 3001
CMD ["node", "server/index.js"]
