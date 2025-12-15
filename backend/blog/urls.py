from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BlogCategoryViewSet, BlogPostViewSet

app_name = "blog"

router = DefaultRouter()
router.register(r"categories", BlogCategoryViewSet, basename="category")
router.register(r"posts", BlogPostViewSet, basename="post")

urlpatterns = [
    path("", include(router.urls)),
]