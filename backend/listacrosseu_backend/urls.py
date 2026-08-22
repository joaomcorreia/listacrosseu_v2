from django.contrib import admin
from django.contrib.sitemaps.views import index, sitemap
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

from listings.sitemaps import sitemaps

from . import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("healthz/", views.healthz, name="healthz"),
    path("api/", include("listings.api.urls")),
    path("api/listings/", include("listings.api.urls")),
    path("api/geo/", include("listings.api.geo_urls")),
    path("api/ui/", include("ui.api.urls")),
    path("api/blog/", include("blog.urls")),
    path("api/", include("content.api.urls")),
    path("sitemap.xml", index, {"sitemaps": sitemaps}),
    path(
        "sitemap-<section>.xml",
        sitemap,
        {"sitemaps": sitemaps},
        name="django.contrib.sitemaps.views.sitemap",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
