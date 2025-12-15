from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import BlogCategory, BlogPost
from .serializers import (
    BlogCategorySerializer,
    BlogPostListSerializer,
    BlogPostDetailSerializer,
)


class BlogCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve blog categories with translations.
    """
    queryset = BlogCategory.objects.prefetch_related("translations")
    serializer_class = BlogCategorySerializer
    filter_backends = [SearchFilter]
    search_fields = ["key", "translations__name"]


class BlogPostViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve blog posts with translations and filtering.
    """
    queryset = BlogPost.objects.prefetch_related(
        "categories", "translations"
    ).select_related()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "categories"]
    search_fields = ["slug", "translations__title", "translations__excerpt"]
    ordering_fields = ["created_at", "published_at", "updated_at"]
    ordering = ["-published_at", "-created_at"]
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action == "retrieve":
            # Use flattened serializer for detail view when lang parameter is provided
            if self.request.query_params.get("lang"):
                from .serializers import BlogPostFlatDetailSerializer
                return BlogPostFlatDetailSerializer
            return BlogPostDetailSerializer
        # Use flattened serializer for list view when lang parameter is provided
        if self.action == "list" and self.request.query_params.get("lang"):
            from .serializers import BlogPostFlatListSerializer
            return BlogPostFlatListSerializer
        return BlogPostListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        # Only show published posts in API
        return queryset.filter(status=BlogPost.STATUS_PUBLISHED)

    def get_serializer(self, *args, **kwargs):
        """
        Pass request language to flattened serializers.
        """
        serializer_class = self.get_serializer_class()
        if hasattr(serializer_class, '__name__') and 'Flat' in serializer_class.__name__:
            # Pass language parameter to flattened serializer
            request_language = self.request.query_params.get("lang", "en")
            kwargs['request_language'] = request_language
        return serializer_class(*args, **kwargs)

    @action(detail=False, methods=["get"])
    def by_category(self, request):
        """
        Get posts filtered by category key.
        Usage: /api/blog/posts/by_category/?category=guides&lang=en
        """
        category_key = request.query_params.get("category")
        if not category_key:
            return Response(
                {"error": "category parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            category = BlogCategory.objects.get(key=category_key)
        except BlogCategory.DoesNotExist:
            return Response(
                {"error": "Category not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        posts = self.get_queryset().filter(categories=category)
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)
