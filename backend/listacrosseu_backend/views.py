from django.conf import settings
from django.http import JsonResponse


def healthz(request):
    return JsonResponse(
        {
            "status": "ok",
            "debug": settings.DEBUG,
            "database_engine": settings.DATABASES["default"]["ENGINE"],
        }
    )
