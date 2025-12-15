from django.db import models


class SidebarSlot(models.Model):
    """
    Configurable sidebar zones for different pages/sections.
    E.g. 'blog_sidebar', 'search_sidebar', 'category_sidebar'.
    """

    key = models.CharField(
        max_length=80,
        unique=True,
        help_text="Machine key for this sidebar slot (e.g. 'blog_sidebar', 'search_sidebar').",
    )
    name = models.CharField(max_length=120, help_text="Human-readable name for admin.")
    is_active = models.BooleanField(default=True, help_text="Whether this slot is displayed.")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Sidebar slot"
        verbose_name_plural = "Sidebar slots"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class SidebarItem(models.Model):
    """
    Individual items/widgets within a sidebar slot.
    Can be affiliate ads, text blocks, image banners, etc.
    """

    TYPE_HTML = "html"
    TYPE_IMAGE_BANNER = "image_banner"
    TYPE_TEXT_BLOCK = "text_block"
    TYPE_AFFILIATE_AD = "affiliate_ad"

    TYPE_CHOICES = [
        (TYPE_HTML, "Custom HTML"),
        (TYPE_IMAGE_BANNER, "Image Banner"),
        (TYPE_TEXT_BLOCK, "Text Block"),
        (TYPE_AFFILIATE_AD, "Affiliate Ad"),
    ]

    slot = models.ForeignKey(
        SidebarSlot,
        on_delete=models.CASCADE,
        related_name="items",
    )
    title = models.CharField(max_length=200, blank=True, help_text="Optional title for the widget.")
    item_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_HTML)
    
    # Generic content fields - use based on item_type
    content_html = models.TextField(
        blank=True,
        help_text="Raw HTML content (for html type) or affiliate tracking code.",
    )
    content_text = models.TextField(blank=True, help_text="Plain text content (for text_block type).")
    image_url = models.URLField(blank=True, help_text="Image URL (for image_banner type).")
    link_url = models.URLField(blank=True, help_text="Target URL for clickable items.")
    link_text = models.CharField(max_length=100, blank=True, help_text="Link text/CTA.")

    # Display settings
    order = models.PositiveIntegerField(default=0, help_text="Display order within the slot.")
    is_active = models.BooleanField(default=True, help_text="Whether this item is displayed.")
    css_classes = models.CharField(
        max_length=200,
        blank=True,
        help_text="Optional CSS classes to apply to this widget.",
    )

    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "created_at"]
        verbose_name = "Sidebar item"
        verbose_name_plural = "Sidebar items"

    def __str__(self) -> str:
        return f"{self.slot.name} - {self.title or self.item_type} #{self.order}"
