FROM node:26-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY src ./src
RUN mkdir -p /app/backups /app/data && chown node /app/backups /app/data
USER node

# the bot writes data/heartbeat every 30s while it is connected to Discord; older than 90s is unhealthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 CMD ["node", "src/health.js"]
CMD ["node", "src/index.js"]
