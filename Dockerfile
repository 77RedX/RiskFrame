# ── Stage 1: Build the React frontend ──
FROM node:20-slim AS frontend-build
WORKDIR /app/website
COPY website/package.json website/package-lock.json ./
RUN npm ci --production=false
COPY website/ .
RUN npm run build

# ── Stage 2: Python backend ──
FROM python:3.10-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Copy built frontend from stage 1
COPY --from=frontend-build /app/website/dist ./website/dist

# Render and HF Spaces both set the PORT environment variable
ENV PORT=7860
EXPOSE 7860

# Run the Flask app with gunicorn using the PORT env variable
CMD gunicorn -b 0.0.0.0:${PORT:-7860} app:app
