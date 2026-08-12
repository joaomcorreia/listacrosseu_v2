from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify


LANG_CHOICES = [
    ("en", "English"),
    ("nl", "Dutch"),
    ("pt", "Portuguese"),
    ("fr", "French"),
    ("es", "Spanish"),
    ("de", "German"),
]


class BlogCategory(models.Model):
    """
    Category for blog posts (e.g. 'Guides', 'Updates').
    Translations are stored in BlogCategoryTranslation.
    """

    key = models.SlugField(
        max_length=80,
        unique=True,
        help_text="Machine key for this category (e.g. 'guides', 'updates').",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Blog category"
        verbose_name_plural = "Blog categories"

    def __str__(self) -> str:
        return self.key


class BlogCategoryTranslation(models.Model):
    category = models.ForeignKey(
        BlogCategory,
        on_delete=models.CASCADE,
        related_name="translations",
    )
    language = models.CharField(max_length=5, choices=LANG_CHOICES)
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=150)
    description = models.TextField(blank=True)

    class Meta:
        unique_together = ("category", "language")
        verbose_name = "Blog category translation"
        verbose_name_plural = "Blog category translations"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.name} [{self.language}]"


class BlogPost(models.Model):
    """
    Base blog post object, language-agnostic.
    Per-language content lives in BlogPostTranslation.
    """

    slug = models.SlugField(
        max_length=150,
        unique=True,
        help_text="Primary slug used in URLs (usually English).",
    )

    STATUS_DRAFT = "draft"
    STATUS_PUBLISHED = "published"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_PUBLISHED, "Published"),
    ]

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
    )

    categories = models.ManyToManyField(
        BlogCategory,
        related_name="posts",
        blank=True,
    )

    hero_image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Optional manual publish datetime; can be used for ordering.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]
        verbose_name = "Blog post"
        verbose_name_plural = "Blog posts"

    def __str__(self) -> str:
        return self.slug


class BlogPostTranslation(models.Model):
    """
    Per-language fields for a blog post.
    """

    post = models.ForeignKey(
        BlogPost,
        on_delete=models.CASCADE,
        related_name="translations",
    )
    language = models.CharField(max_length=5, choices=LANG_CHOICES)
    title = models.CharField(max_length=200)
    slug = models.SlugField(
        max_length=200,
        help_text="Language-specific slug. Primarily for display; API URLs will use the base post.slug.",
    )
    excerpt = models.TextField(blank=True)
    body = models.TextField()

    seo_title = models.CharField(max_length=255, blank=True)
    seo_description = models.CharField(max_length=300, blank=True)

    is_published = models.BooleanField(
        default=True,
        help_text="Whether this language version is published (post status must also be published).",
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("post", "language")
        constraints = [
            models.UniqueConstraint(
                fields=["language", "slug"],
                name="unique_blogposttranslation_language_slug",
            )
        ]
        verbose_name = "Blog post translation"
        verbose_name_plural = "Blog post translations"

    def save(self, *args, **kwargs):
        if not self.slug and self.language == "en":
            self.slug = slugify(self.title) if self.title else ""
        if not self.slug:
            self.slug = slugify(self.title) if self.title else self.post.slug
        if self.slug:
            base_slug = self.slug
            counter = 1
            while BlogPostTranslation.objects.filter(
                language=self.language,
                slug=self.slug,
            ).exclude(pk=self.pk).exists():
                counter += 1
                self.slug = f"{base_slug}-{counter}"
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.title} [{self.language}]"


def _all_language_codes():
    return [code for code, _ in LANG_CHOICES]


@receiver(post_save, sender=BlogCategory)
def create_category_translations(sender, instance, created, **kwargs):
    if not created:
        return

    en_translation = instance.translations.filter(language="en").first()
    base_name = en_translation.name if en_translation else instance.key
    base_description = en_translation.description if en_translation else ""

    for code in _all_language_codes():
        BlogCategoryTranslation.objects.get_or_create(
            category=instance,
            language=code,
            defaults={
                "name": base_name,
                "description": base_description,
                "slug": slugify(base_name) if base_name else instance.key,
            },
        )
