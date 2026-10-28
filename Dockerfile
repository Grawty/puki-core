FROM node:26-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY src ./src
RUN mkdir -p /app/backups && chown node /app/backups
USER node
CMD ["node", "src/index.js"]
