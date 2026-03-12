from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
import os

def serve_react(request, *args, **kwargs):
    """Serve the React SPA index.html for any non-API route."""
    from django.http import FileResponse, Http404
    index_path = os.path.join(settings.STATIC_ROOT, 'index.html')
    if not os.path.exists(index_path):
        # Fallback: look in STATICFILES_DIRS
        for d in getattr(settings, 'STATICFILES_DIRS', []):
            candidate = os.path.join(str(d), 'index.html')
            if os.path.exists(candidate):
                index_path = candidate
                break
    if not os.path.exists(index_path):
        raise Http404("React build not found. Run: npm run build")
    return FileResponse(open(index_path, 'rb'), content_type='text/html')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('resumes.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + [
    # Catch-all — must be LAST; lets React Router handle client-side navigation
    re_path(r'^(?!static/|media/).*$', serve_react),
]
