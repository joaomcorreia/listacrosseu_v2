from django.db import models
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
        verbose_name = "Blog post translation"
        verbose_name_plural = "Blog post translations"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.title} [{self.language}]"
