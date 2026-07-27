from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BlogCategoryViewSet,
    BlogPostViewSet,
    blog_post_resolve,
    blog_post_slug_by_id,
)

app_name = "blog"

router = DefaultRouter()
router.register(r"categories", BlogCategoryViewSet, basename="category")
router.register(r"posts", BlogPostViewSet, basename="post")

urlpatterns = [
    path("resolve/", blog_post_resolve, name="blog-post-resolve"),
    path("posts/<int:post_id>/", blog_post_slug_by_id, name="blog-post-slug-by-id"),
    path("", BlogPostViewSet.as_view({"get": "list"}), name="blog-posts-root"),
    path("", include(router.urls)),
    path("<slug:slug>/", BlogPostViewSet.as_view({"get": "retrieve"}), name="blog-post-detail-root"),
]
