# ── Python API Server (Render) ──
FROM python:3.10-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PORT=10000

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 10000

CMD gunicorn --workers 1 --timeout 180 -b 0.0.0.0:${PORT:-10000} app:app
