from django.contrib import admin
from django.core.exceptions import ValidationError
from django.forms.models import BaseInlineFormSet
from django.utils.text import slugify
from .models import (
    BlogCategory,
    BlogCategoryTranslation,
    BlogPost,
    BlogPostTranslation,
    LANG_CHOICES,
)


def _all_language_codes():
    return [code for code, _ in LANG_CHOICES]


class BlogPostTranslationInlineFormSet(BaseInlineFormSet):
    def clean(self):
        super().clean()

        seen_languages = set()
        en_form = None
        for form in self.forms:
            if not hasattr(form, "cleaned_data"):
                continue
            if form.cleaned_data.get("DELETE"):
                continue
            language = form.cleaned_data.get("language")
            if language:
                if language in seen_languages:
                    raise ValidationError(
                        f"Duplicate language '{language}' in blog post translations."
                    )
                seen_languages.add(language)
            if form.cleaned_data.get("language") == "en":
                en_form = form
                break

        if en_form:
            if not en_form.cleaned_data.get("seo_title"):
                raise ValidationError("EN SEO title is required.")
            if not en_form.cleaned_data.get("seo_description"):
                raise ValidationError("EN SEO description is required.")


class BlogCategoryTranslationInline(admin.StackedInline):
    model = BlogCategoryTranslation
    extra = 0
    fields = ["language", "name", "slug", "description"]


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ["key", "created_at"]
    search_fields = ["key"]
    inlines = [BlogCategoryTranslationInline]
    actions = ["clone_en_to_missing_translations"]

    @admin.action(description="Clone EN to missing translations")
    def clone_en_to_missing_translations(self, request, queryset):
        created = 0
        for category in queryset:
            en = category.translations.filter(language="en").first()
            if not en:
                continue
            for code in _all_language_codes():
                obj, was_created = BlogCategoryTranslation.objects.get_or_create(
                    category=category,
                    language=code,
                    defaults={
                        "name": en.name,
                        "description": en.description,
                        "slug": slugify(en.name) if en.name else category.key,
                    },
                )
                if was_created:
                    created += 1
        self.message_user(request, f"Created {created} missing category translations.")


class BlogPostTranslationInline(admin.StackedInline):
    model = BlogPostTranslation
    extra = 0
    max_num = len(LANG_CHOICES)
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
    formset = BlogPostTranslationInlineFormSet

    def has_add_permission(self, request, obj=None):
        # Prevent creating new inline rows on the add view to avoid duplicates.
        return obj is not None


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
    actions = ["clone_en_to_missing_translations"]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.prefetch_related("translations", "categories")

    @admin.action(description="Clone EN to missing translations")
    def clone_en_to_missing_translations(self, request, queryset):
        created = 0
        for post in queryset:
            en = post.translations.filter(language="en").first()
            if not en:
                continue
            for code in _all_language_codes():
                obj, was_created = BlogPostTranslation.objects.get_or_create(
                    post=post,
                    language=code,
                    defaults={
                        "title": en.title,
                        "excerpt": en.excerpt,
                        "body": en.body,
                        "seo_title": en.seo_title,
                        "seo_description": en.seo_description,
                        "slug": slugify(en.title) if en.title else post.slug,
                        "is_published": en.is_published,
                    },
                )
                if was_created:
                    created += 1
        self.message_user(request, f"Created {created} missing post translations.")
