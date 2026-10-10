# ============================================================
# RiskFrame Frontend Multi-Stage Dockerfile
# ============================================================

# ── Stage 1: Build Artifacts ──
FROM node:20-alpine AS builder
WORKDIR /app

# Cache package manifests
COPY package.json package-lock.json* ./
RUN npm install

# Build static assets
COPY . .
ENV VITE_API_URL=""
RUN npm run build

# ── Stage 2: Production NGINX Serving ──
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# ── Stage 3: Zero-Build Live Development ──
FROM node:20-alpine AS development
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
