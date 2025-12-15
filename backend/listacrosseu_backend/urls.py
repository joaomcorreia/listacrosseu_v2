"""
URL configuration for listacrosseu_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.contrib.sitemaps.views import index, sitemap
from django.urls import path, include
from listings.sitemaps import sitemaps

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/listings/", include("listings.api.urls")),  # Listings API (includes debug endpoints)
    path("api/geo/", include("listings.api.geo_urls")),  # Geo-specific API for city/location pages
    path("api/ui/", include("ui.api.urls")),
    path("api/blog/", include("blog.urls")),
    path("api/", include("content.api.urls")),  # CMS API
    
    # SEO / Sitemap
    path("sitemap.xml", index, {"sitemaps": sitemaps}),
    path("sitemap-<section>.xml", sitemap, {"sitemaps": sitemaps}, name="django.contrib.sitemaps.views.sitemap"),
]
