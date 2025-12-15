from django.db import models


class HeroEffectSettings(models.Model):
    """
    Controls the hero snow / stars effect on the public homepage.
    Intended to be a singleton (only one row).
    """

    enabled = models.BooleanField(default=True)
    opacity = models.FloatField(
        default=0.8,
        help_text="Overall opacity of the snow effect (0.0 - 1.0).",
    )

    INTENSITY_LOW = "low"
    INTENSITY_MEDIUM = "medium"
    INTENSITY_HIGH = "high"

    INTENSITY_CHOICES = [
        (INTENSITY_LOW, "Low"),
        (INTENSITY_MEDIUM, "Medium"),
        (INTENSITY_HIGH, "High"),
    ]

    intensity = models.CharField(
        max_length=16,
        choices=INTENSITY_CHOICES,
        default=INTENSITY_MEDIUM,
        help_text="Rough density/speed preset for the effect.",
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Hero effect settings"
        verbose_name_plural = "Hero effect settings"

    def __str__(self) -> str:
        return "Homepage hero effect settings"

    @classmethod
    def get_solo(cls) -> "HeroEffectSettings":
        obj, _ = cls.objects.get_or_create(id=1)
        return obj


class UiTextGroup(models.Model):
    """
    Simple grouping for frontend UI text (e.g. 'home', 'search', 'header').
    """

    key = models.CharField(
        max_length=50,
        unique=True,
        help_text="Machine key (e.g. 'home', 'search', 'header')."
    )

    class Meta:
        verbose_name = "UI text group"
        verbose_name_plural = "UI text groups"

    def __str__(self) -> str:
        return self.key


class UiTextTranslation(models.Model):
    """
    Translated UI strings for a given group + language.
    Keep it generic: a small JSON blob of key-value strings per language.
    """

    group = models.ForeignKey(UiTextGroup, on_delete=models.CASCADE, related_name="translations")
    language = models.CharField(
        max_length=5,
        choices=[
            ("en", "English"),
            ("nl", "Dutch"),
            ("pt", "Portuguese"),
            ("fr", "French"),
            ("es", "Spanish"),
            ("de", "German"),
        ],
    )
    # Example content structure:
    # {
    #   "hero_title": "Connect with trusted small & micro businesses across Europe.",
    #   "hero_subtitle": "ListAcrossEU helps you discover...",
    #   "search_title": "Explore European businesses"
    # }
    data = models.JSONField(default=dict, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("group", "language")
        verbose_name = "UI text translation"
        verbose_name_plural = "UI text translations"

    def __str__(self) -> str:
        return f"{self.group.key} [{self.language}]"
