---
title: Smart Resume Analyzer
emoji: 📄
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# Smart Resume Analyzer 📄

An AI-powered tool that ranks resumes against a job description using TF-IDF similarity scoring.

## Features
- Upload multiple PDF / DOCX resumes
- Paste a job description
- Get instant similarity scores and ranked results
- See matched & missing skills at a glance

## Stack
- **Backend**: Django 6 + Django REST Framework
- **Frontend**: React + Vite
- **ML**: scikit-learn TF-IDF, spaCy NLP
- **Deployment**: Hugging Face Spaces (Docker)

## Running Locally (MySQL)

```bash
# Backend
cd computer_vision/resume_analyzer
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (separate terminal)
cd computer_vision/resume_analyzer_frontend
npm install
npm run dev
```

## Running Locally (SQLite / Docker)

```bash
docker build -t resume-analyzer .
docker run -p 7860:7860 -e USE_SQLITE=1 resume-analyzer
# Open http://localhost:7860
```
