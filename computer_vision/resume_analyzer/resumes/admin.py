from django.contrib import admin
from .models import JobDescription, Resume, AnalysisResult


@admin.register(JobDescription)
class JobDescriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'created_at']
    search_fields = ['title', 'content']


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ['id', 'filename', 'job', 'uploaded_at']
    list_filter = ['job']


@admin.register(AnalysisResult)
class AnalysisResultAdmin(admin.ModelAdmin):
    list_display = ['id', 'resume', 'score', 'rank', 'analyzed_at']
    list_filter = ['rank']
    ordering = ['rank']
