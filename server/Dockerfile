# ============================================================
# RiskFrame Express Backend Dockerfile
# ============================================================

FROM node:20-alpine AS base
WORKDIR /app

# Cache dependency layer
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy application source
COPY . .

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/index.js"]
