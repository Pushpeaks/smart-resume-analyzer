from django.db import models


class JobDescription(models.Model):
    title = models.CharField(max_length=255, blank=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or f"Job #{self.pk}"


class Resume(models.Model):
    job = models.ForeignKey(JobDescription, on_delete=models.CASCADE, related_name='resumes')
    file = models.FileField(upload_to='resumes/%Y/%m/')
    filename = models.CharField(max_length=255)
    raw_text = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.filename


class AnalysisResult(models.Model):
    resume = models.OneToOneField(Resume, on_delete=models.CASCADE, related_name='result')
    score = models.FloatField(default=0.0)               # 0.0 – 100.0
    matched_skills = models.JSONField(default=list)
    missing_skills = models.JSONField(default=list)
    rank = models.PositiveIntegerField(default=0)
    # ── Unique insight fields ──────────────────────────────────────────────────
    quantification_score = models.FloatField(default=0.0)  # % of bullets with numbers
    seniority_level = models.CharField(max_length=20, default='Unknown')
    red_flags = models.JSONField(default=list)
    interview_questions = models.JSONField(default=list)
    analyzed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['rank']

    def __str__(self):
        return f"{self.resume.filename} — {self.score:.1f}%"
