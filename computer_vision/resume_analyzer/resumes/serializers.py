from rest_framework import serializers
from .models import JobDescription, Resume, AnalysisResult


class AnalysisResultSerializer(serializers.ModelSerializer):
    resume_filename = serializers.CharField(source='resume.filename', read_only=True)
    resume_id = serializers.IntegerField(source='resume.id', read_only=True)

    class Meta:
        model = AnalysisResult
        fields = [
            'id', 'resume_id', 'resume_filename',
            'score', 'matched_skills', 'missing_skills', 'rank',
            'quantification_score', 'seniority_level', 'red_flags',
            'interview_questions', 'analyzed_at',
        ]


class ResumeSerializer(serializers.ModelSerializer):
    result = AnalysisResultSerializer(read_only=True)

    class Meta:
        model = Resume
        fields = ['id', 'filename', 'uploaded_at', 'result']


class JobDescriptionSerializer(serializers.ModelSerializer):
    resumes = ResumeSerializer(many=True, read_only=True)

    class Meta:
        model = JobDescription
        fields = ['id', 'title', 'content', 'created_at', 'resumes']
