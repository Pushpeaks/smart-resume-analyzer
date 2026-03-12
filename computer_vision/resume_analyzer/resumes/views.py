from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from .models import JobDescription, Resume, AnalysisResult
from .serializers import JobDescriptionSerializer, AnalysisResultSerializer
from ml.extractor import extract_text
from ml.analyzer import rank_resumes


class AnalyzeView(APIView):
    """
    POST /api/analyze/
    Form-data:
      - job_title   (optional)
      - job_description (required, text)
      - resumes[]   (required, one or more files: PDF or DOCX)
    Returns ranked list of resumes with scores.
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        job_title = request.data.get('job_title', '').strip()
        job_description = request.data.get('job_description', '').strip()
        resume_files = request.FILES.getlist('resumes')

        if not job_description:
            return Response(
                {'error': 'Job description is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not resume_files:
            return Response(
                {'error': 'At least one resume file is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save job description
        job = JobDescription.objects.create(
            title=job_title or 'Untitled Job',
            content=job_description,
        )

        # Extract text and save resumes
        resume_texts = []
        resume_objs = []
        for f in resume_files:
            raw_text = extract_text(f)
            resume = Resume.objects.create(
                job=job,
                file=f,
                filename=f.name,
                raw_text=raw_text,
            )
            resume_objs.append(resume)
            resume_texts.append(raw_text)

        # Run ML ranking
        ranked = rank_resumes(job_description, resume_texts)

        # Save results
        results = []
        for rank_idx, item in enumerate(ranked, start=1):
            orig_idx = item['index']
            result = AnalysisResult.objects.create(
                resume=resume_objs[orig_idx],
                score=item['score'],
                matched_skills=item['matched_skills'],
                missing_skills=item['missing_skills'],
                rank=rank_idx,
                quantification_score=item.get('quantification_score', 0.0),
                seniority_level=item.get('seniority_level', 'Unknown'),
                red_flags=item.get('red_flags', []),
                interview_questions=item.get('interview_questions', []),
            )
            results.append(result)

        serializer = AnalysisResultSerializer(results, many=True)
        return Response(
            {
                'job_id': job.pk,
                'job_title': job.title,
                'total_resumes': len(resume_files),
                'results': serializer.data,
            },
            status=status.HTTP_201_CREATED
        )


class JobResultsView(APIView):
    """
    GET /api/results/<job_id>/
    Returns all ranked results for a given job.
    """
    def get(self, request, job_id, *args, **kwargs):
        try:
            job = JobDescription.objects.get(pk=job_id)
        except JobDescription.DoesNotExist:
            return Response({'error': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = JobDescriptionSerializer(job)
        return Response(serializer.data)


class HealthView(APIView):
    """GET /api/health/ — simple liveness check."""
    def get(self, request, *args, **kwargs):
        return Response({'status': 'ok', 'service': 'Smart Resume Analyzer API'})
