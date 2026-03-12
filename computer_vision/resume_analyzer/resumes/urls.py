from django.urls import path
from .views import AnalyzeView, JobResultsView, HealthView

urlpatterns = [
    path('health/', HealthView.as_view(), name='health'),
    path('analyze/', AnalyzeView.as_view(), name='analyze'),
    path('results/<int:job_id>/', JobResultsView.as_view(), name='job-results'),
]
