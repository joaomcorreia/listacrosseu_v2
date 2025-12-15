from rest_framework import serializers
from .models import BlogCategory, BlogCategoryTranslation, BlogPost, BlogPostTranslation


class BlogCategoryTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategoryTranslation
        fields = ["language", "name", "slug", "description"]


class BlogCategorySerializer(serializers.ModelSerializer):
    translations = BlogCategoryTranslationSerializer(many=True, read_only=True)

    class Meta:
        model = BlogCategory
        fields = ["id", "key", "created_at", "translations"]


class BlogPostTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPostTranslation
        fields = [
            "language",
            "title",
            "slug",
            "excerpt",
            "body",
            "seo_title",
            "seo_description",
            "is_published",
            "updated_at",
        ]


class BlogPostListSerializer(serializers.ModelSerializer):
    """
    Serializer for blog post lists (includes categories and translations).
    """
    categories = BlogCategorySerializer(many=True, read_only=True)
    translations = BlogPostTranslationSerializer(many=True, read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "slug",
            "status",
            "hero_image_url",
            "created_at",
            "published_at",
            "updated_at",
            "categories",
            "translations",
        ]


class BlogPostFlatListSerializer(serializers.ModelSerializer):
    """
    Flattened serializer for blog post lists that matches frontend expectations.
    Includes translated fields directly on the post object.
    """
    title = serializers.SerializerMethodField()
    excerpt = serializers.SerializerMethodField()
    language = serializers.SerializerMethodField()
    seo_title = serializers.SerializerMethodField()
    seo_description = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "slug",
            "status",
            "published_at",
            "hero_image_url",
            "title",
            "excerpt",
            "language",
            "seo_title",
            "seo_description",
        ]

    def __init__(self, *args, **kwargs):
        self.request_language = kwargs.pop('request_language', 'en')
        super().__init__(*args, **kwargs)

    def get_translation(self, obj):
        """Get the translation for the requested language, fallback to English."""
        translation = None
        # Try to get requested language
        for t in obj.translations.all():
            if t.language == self.request_language and t.is_published:
                translation = t
                break
        
        # Fallback to English
        if not translation:
            for t in obj.translations.all():
                if t.language == 'en' and t.is_published:
                    translation = t
                    break
        
        # Fallback to first available translation
        if not translation:
            published_translations = [t for t in obj.translations.all() if t.is_published]
            if published_translations:
                translation = published_translations[0]
        
        return translation

    def get_title(self, obj):
        translation = self.get_translation(obj)
        return translation.title if translation else obj.slug

    def get_excerpt(self, obj):
        translation = self.get_translation(obj)
        return translation.excerpt if translation else ""

    def get_language(self, obj):
        translation = self.get_translation(obj)
        return translation.language if translation else self.request_language

    def get_seo_title(self, obj):
        translation = self.get_translation(obj)
        return translation.seo_title if translation else ""

    def get_seo_description(self, obj):
        translation = self.get_translation(obj)
        return translation.seo_description if translation else ""


class BlogPostFlatDetailSerializer(serializers.ModelSerializer):
    """
    Flattened serializer for blog post detail that matches frontend expectations.
    Includes translated fields directly on the post object + categories.
    """
    translation = serializers.SerializerMethodField()
    categories = BlogCategorySerializer(many=True, read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "slug",
            "status",
            "published_at",
            "hero_image_url",
            "translation",
            "categories",
        ]

    def __init__(self, *args, **kwargs):
        self.request_language = kwargs.pop('request_language', 'en')
        super().__init__(*args, **kwargs)

    def get_translation_obj(self, obj):
        """Get the translation for the requested language, fallback to English."""
        translation = None
        # Try to get requested language
        for t in obj.translations.all():
            if t.language == self.request_language and t.is_published:
                translation = t
                break
        
        # Fallback to English
        if not translation:
            for t in obj.translations.all():
                if t.language == 'en' and t.is_published:
                    translation = t
                    break
        
        # Fallback to first available translation
        if not translation:
            published_translations = [t for t in obj.translations.all() if t.is_published]
            if published_translations:
                translation = published_translations[0]
        
        return translation

    def get_translation(self, obj):
        translation = self.get_translation_obj(obj)
        if translation:
            return {
                "language": translation.language,
                "title": translation.title,
                "slug": translation.slug,
                "excerpt": translation.excerpt,
                "body": translation.body,
                "seo_title": translation.seo_title,
                "seo_description": translation.seo_description,
                "is_published": translation.is_published,
                "updated_at": translation.updated_at.isoformat() if translation.updated_at else None,
            }
        # Fallback if no translation found
        return {
            "language": self.request_language,
            "title": obj.slug,
            "slug": obj.slug,
            "excerpt": "",
            "body": "",
            "seo_title": "",
            "seo_description": "",
            "is_published": True,
            "updated_at": None,
        }


class BlogPostDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for blog post detail view (includes full content).
    """
    categories = BlogCategorySerializer(many=True, read_only=True)
    translations = BlogPostTranslationSerializer(many=True, read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            "id",
            "slug",
            "status",
            "hero_image_url",
            "created_at",
            "published_at",
            "updated_at",
            "categories",
            "translations",
        ]