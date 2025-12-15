from django.contrib import admin
from .models import BlogCategory, BlogCategoryTranslation, BlogPost, BlogPostTranslation


class BlogCategoryTranslationInline(admin.StackedInline):
    model = BlogCategoryTranslation
    extra = 1
    fields = ["language", "name", "slug", "description"]


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ["key", "created_at"]
    search_fields = ["key"]
    inlines = [BlogCategoryTranslationInline]


class BlogPostTranslationInline(admin.StackedInline):
    model = BlogPostTranslation
    extra = 1
    fields = [
        "language",
        "title",
        "slug",
        "excerpt",
        "body",
        "seo_title",
        "seo_description",
        "is_published",
    ]


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ["slug", "status", "created_at", "published_at"]
    list_filter = ["status", "categories", "created_at"]
    filter_horizontal = ["categories"]
    search_fields = ["slug"]
    date_hierarchy = "created_at"
    fields = [
        "slug",
        "status",
        "categories",
        "hero_image_url",
        "published_at",
    ]
    inlines = [BlogPostTranslationInline]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.prefetch_related("translations", "categories")
