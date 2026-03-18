# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build the React / Vite frontend
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /frontend

# Install deps
COPY computer_vision/resume_analyzer_frontend/package*.json ./
RUN npm install

# Copy source and build
COPY computer_vision/resume_analyzer_frontend/ ./
RUN npm run build           # outputs to: /frontend/dist/


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Python / Django runtime
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim

# System deps: libgomp (scikit-learn), build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Python dependencies ───────────────────────────────────────────────────────
COPY computer_vision/resume_analyzer/requirements.txt ./

# Install without pymysql (SQLite mode only on HF Spaces)
RUN pip install --no-cache-dir \
    Django==6.0.3 \
    djangorestframework==3.16.1 \
    django-cors-headers==4.9.0 \
    "whitenoise[brotli]==6.9.0" \
    gunicorn==23.0.0 \
    pypdf==6.7.5 \
    python-docx==1.2.0 \
    scikit-learn==1.8.0 \
    numpy

# Download spaCy English model (small, ~12 MB)
RUN pip install --no-cache-dir spacy==3.8.11 && \
    python -m spacy download en_core_web_sm

# ── Copy Django project ───────────────────────────────────────────────────────
COPY computer_vision/resume_analyzer/ ./resume_analyzer/

# ── Copy React build output into the Django project tree ─────────────────────
COPY --from=frontend-builder /frontend/dist/ ./resume_analyzer_frontend/dist/

# ── Collect static files ─────────────────────────────────────────────────────
WORKDIR /app/resume_analyzer

RUN USE_SQLITE=1 python manage.py collectstatic --noinput

# ── Run migrations + start gunicorn ──────────────────────────────────────────
# HF Spaces requires port 7860
EXPOSE 7860

# startup.sh runs migrate then gunicorn so migrations run fresh on each deploy
CMD ["sh", "-c", "\
    USE_SQLITE=1 python manage.py migrate --noinput && \
    USE_SQLITE=1 gunicorn core.wsgi:application \
    --bind 0.0.0.0:7860 \
    --workers 2 \
    --timeout 120 \
    "]
