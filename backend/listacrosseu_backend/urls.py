from django.contrib import admin
from django.contrib.sitemaps.views import index, sitemap
from django.urls import include, path

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
