"""
ml/analyzer.py  —  NLP Resume Ranking Engine
Unique features:
  - TF-IDF + Cosine Similarity scoring with skill-gap penalty
  - Quantification Score  (how data-driven are the achievements?)
  - Seniority Level Detection  (Junior / Mid / Senior / Lead)
  - Red Flag Detector  (thin resume, buzzword soup, vague language)
  - Interview Question Generator  (targeted questions from resume content)
"""

import re
from typing import List, Dict, Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ── Skill keyword library ────────────────────────────────────────────────────
COMMON_SKILLS = {
    "python","java","javascript","typescript","c","c++","c#","ruby","go","golang",
    "rust","kotlin","swift","scala","r","matlab","php","perl","bash","shell","sql",
    "html","css","react","angular","vue","nodejs","node","django","flask","fastapi",
    "spring","laravel","express","graphql","rest","restful","api","jquery",
    "machine learning","deep learning","nlp","natural language processing",
    "computer vision","tensorflow","pytorch","keras","scikit-learn","sklearn",
    "pandas","numpy","scipy","matplotlib","seaborn","plotly","huggingface",
    "transformers","bert","gpt","llm","opencv",
    "mysql","postgresql","mongodb","redis","elasticsearch","bigquery",
    "spark","hadoop","kafka","airflow","dbt","aws","gcp","azure","docker",
    "kubernetes","ci/cd","git","github","gitlab","linux","nginx","terraform",
    "jenkins","android","ios","flutter","react native","unity","unreal",
    "blockchain","cybersecurity","devops","microservices","testing",
    "selenium","pytest","junit","excel","powerbi","tableau",
    "communication","leadership","teamwork","agile","scrum","kanban",
    "problem solving","analytical","management",
}

# ── Seniority signals ────────────────────────────────────────────────────────
LEAD_SIGNALS   = {"vp","director","head of","principal","chief","cto","ceo","coo",
                  "founder","co-founder","lead","staff engineer","fellow"}
SENIOR_SIGNALS = {"senior","sr.","sr ","architect","manager","tech lead","team lead",
                  "solutions engineer","engineering manager"}
MID_SIGNALS    = {"mid","mid-level","associate","specialist","engineer ii","developer ii"}

# ── Buzzword list (overuse is a red flag) ────────────────────────────────────
BUZZWORDS = {"synergy","leverage","paradigm","disruption","innovative","passionate",
             "guru","ninja","rockstar","wizard","thought leader","ecosystem",
             "holistic","bandwidth","deep dive","circle back","move the needle",
             "best-in-class","proactive","results-driven","detail-oriented","hardworking"}

# ── Strong action verbs (absence is a red flag) ─────────────────────────────
STRONG_VERBS = {"achieved","built","created","delivered","designed","developed","drove",
                "engineered","grew","implemented","increased","launched","led","managed",
                "optimized","reduced","saved","scaled","shipped","solved","spearheaded"}


def _clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^\w\s\+\#\%\$\.]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def _extract_skills(text: str) -> set:
    cleaned = _clean_text(text)
    found = set()
    for skill in COMMON_SKILLS:
        if re.search(r'\b' + re.escape(skill) + r'\b', cleaned):
            found.add(skill)
    return found


# ── Feature 1: Quantification Score ─────────────────────────────────────────
def _quantification_score(text: str) -> float:
    """
    Percentage of sentences/bullets that contain a number, %, $, or metric.
    Higher = more data-backed achievements.
    """
    sentences = re.split(r'[\n\.\;\|•\-–]', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 15]
    if not sentences:
        return 0.0
    quantified = sum(1 for s in sentences if re.search(r'\d+[\%\+xX]?|\$[\d,]+|[\d,]+ (users|customers|revenue|projects|years|months)', s))
    return round((quantified / len(sentences)) * 100, 1)


# ── Feature 2: Seniority Level Detection ────────────────────────────────────
def _detect_seniority(text: str) -> str:
    """Estimate seniority from title signals and years of experience mentioned."""
    lower = text.lower()

    for sig in LEAD_SIGNALS:
        if sig in lower:
            return "Lead / Executive"

    for sig in SENIOR_SIGNALS:
        if sig in lower:
            return "Senior"

    # Check years of experience
    year_matches = re.findall(r'(\d+)\+?\s*years?(?:\s+of)?\s+(?:experience|exp)', lower)
    if year_matches:
        max_years = max(int(y) for y in year_matches)
        if max_years >= 8:
            return "Senior"
        elif max_years >= 4:
            return "Mid-Level"
        elif max_years >= 1:
            return "Junior"

    for sig in MID_SIGNALS:
        if sig in lower:
            return "Mid-Level"

    return "Junior"


# ── Feature 3: Red Flag Detector ─────────────────────────────────────────────
def _detect_red_flags(text: str, matched_skills: list, missing_skills: list) -> list:
    """Detect common resume red flags that recruiters notice."""
    flags = []
    lower = text.lower()
    words = lower.split()

    # Thin resume (very short)
    if len(words) < 150:
        flags.append("Resume appears very short — may lack sufficient detail")

    # Buzzword overuse
    found_buzz = [b for b in BUZZWORDS if b in lower]
    if len(found_buzz) >= 3:
        flags.append(f"Heavy use of buzzwords: {', '.join(found_buzz[:4])}")

    # No quantified achievements
    if _quantification_score(text) < 10:
        flags.append("No measurable achievements found — consider adding numbers/metrics")

    # Weak action verbs
    strong_found = [v for v in STRONG_VERBS if v in lower]
    if len(strong_found) < 2:
        flags.append("Few strong action verbs — try: built, delivered, scaled, optimized…")

    # Very large skill gap
    total = len(matched_skills) + len(missing_skills)
    if total > 0 and len(missing_skills) / total > 0.7:
        flags.append(f"Large skill gap — missing {len(missing_skills)} of {total} required skills")

    # Generic objective/summary detected
    if re.search(r'(seeking a|looking for a|to obtain|passionate professional|dynamic individual)', lower):
        flags.append("Generic opening statement detected — make it role-specific")

    return flags


# ── Feature 4: Interview Question Generator ──────────────────────────────────
def _generate_questions(text: str, matched_skills: list, jd_text: str) -> list:
    """Generate targeted interview questions from the resume + JD."""
    questions = []
    lower = text.lower()

    # Skill-based questions
    for skill in matched_skills[:3]:
        questions.append(f"Walk me through a project where you applied {skill} in a real-world scenario.")

    # Achievement probing
    numbers = re.findall(r'(\d+[\%\+]?)\s*(increase|decrease|reduction|growth|improvement)', lower)
    if numbers:
        val, metric = numbers[0]
        questions.append(f"You mention a {val} {metric} — what was your specific contribution and what challenges did you face?")

    # Seniority-based
    seniority = _detect_seniority(text)
    if "Senior" in seniority or "Lead" in seniority:
        questions.append("How do you approach mentoring junior team members while managing your own deliverables?")
    else:
        questions.append("Describe a situation where you had to learn a new technology quickly under pressure.")

    # Gap-based (ask about missing critical skills from JD)
    jd_skills = _extract_skills(jd_text)
    resume_skills = _extract_skills(text)
    gap = list(jd_skills - resume_skills)[:2]
    for skill in gap:
        questions.append(f"This role requires {skill} — do you have any exposure to it, even informally?")

    return questions[:5]  # cap at 5 questions


# ── Main Ranking Function ────────────────────────────────────────────────────
def rank_resumes(job_description: str, resume_texts: List[str]) -> List[Dict[str, Any]]:
    if not resume_texts:
        return []

    clean_jd = _clean_text(job_description)
    clean_resumes = [_clean_text(t) for t in resume_texts]

    corpus = [clean_jd] + clean_resumes
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english', max_features=8000, sublinear_tf=True)
    try:
        tfidf_matrix = vectorizer.fit_transform(corpus)
    except ValueError:
        return [{'index': i, 'score': 0.0, 'matched_skills': [], 'missing_skills': [],
                 'quantification_score': 0.0, 'seniority_level': 'Unknown',
                 'red_flags': [], 'interview_questions': []} for i in range(len(resume_texts))]

    jd_vector     = tfidf_matrix[0]
    resume_vectors= tfidf_matrix[1:]
    similarities  = cosine_similarity(jd_vector, resume_vectors).flatten()

    jd_skills = _extract_skills(job_description)

    results = []
    for i, (sim, raw_text) in enumerate(zip(similarities, resume_texts)):
        resume_skills  = _extract_skills(raw_text)
        matched        = sorted(jd_skills & resume_skills)
        missing        = sorted(jd_skills - resume_skills)

        # ── Scoring ──────────────────────────────────────────────
        total_jd  = max(len(jd_skills), 1)
        coverage  = len(matched) / total_jd
        miss_ratio= len(missing) / total_jd
        base_score= (float(sim) * 0.55 + coverage * 0.45) * 100
        penalty   = miss_ratio * 40
        score     = round(float(min(max(base_score - penalty, 0.0), 100.0)), 2)

        # ── Unique features ───────────────────────────────────────
        quant  = _quantification_score(raw_text)
        seniority = _detect_seniority(raw_text)
        flags  = _detect_red_flags(raw_text, matched, missing)
        questions = _generate_questions(raw_text, matched, job_description)

        results.append({
            'index': i,
            'score': score,
            'matched_skills': matched,
            'missing_skills': missing,
            'quantification_score': quant,
            'seniority_level': seniority,
            'red_flags': flags,
            'interview_questions': questions,
        })

    results.sort(key=lambda x: x['score'], reverse=True)
    return results
