from django.db import models


class Page(models.Model):
    """
    Represents a page that can contain multiple sections.
    """
    key = models.CharField(max_length=100, unique=True)
    active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['key']
    
    def __str__(self):
        return f"Page: {self.key}"


class Section(models.Model):
    """
    A section within a page. Each section has a type and can contain items.
    """
    page = models.ForeignKey(Page, related_name='sections', on_delete=models.CASCADE)
    key = models.CharField(max_length=100)
    type = models.CharField(max_length=50)  # Not enum-locked for future flexibility
    order = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)
    settings = models.JSONField(default=dict, blank=True)
    
    # Content fields
    title = models.CharField(max_length=200, blank=True)
    subtitle = models.TextField(blank=True)
    body = models.TextField(blank=True)  # For longer content like problem descriptions
    
    # CTA fields
    cta_label = models.CharField(max_length=100, blank=True)
    cta_href = models.URLField(blank=True)
    cta_secondary_label = models.CharField(max_length=100, blank=True)
    cta_secondary_href = models.URLField(blank=True)
    
    class Meta:
        unique_together = [['page', 'key']]
        ordering = ['order', 'id']
    
    def __str__(self):
        return f"{self.page.key} - {self.key} ({self.type})"


class SectionItem(models.Model):
    """
    Items that belong to a section (e.g., cards in a grid, menu items, etc.)
    """
    section = models.ForeignKey(Section, related_name='items', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)
    
    # Content fields
    title = models.CharField(max_length=200, blank=True)
    subtitle = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)  # Icon name/class
    href = models.URLField(blank=True)
    badge = models.CharField(max_length=50, blank=True)
    
    # Flexible meta data
    meta = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['order', 'id']
    
    def __str__(self):
        return f"{self.section} - Item {self.order}: {self.title or 'Untitled'}"


class SectionBusinessPick(models.Model):
    """
    Join model for manual business selection in CMS sections.
    Allows admin to "pick" which businesses appear in claimed/premium listing sections.
    """
    section = models.ForeignKey(Section, related_name='business_picks', on_delete=models.CASCADE)
    business = models.ForeignKey('listings.Business', on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0, help_text="Display order within the section")
    
    class Meta:
        unique_together = [['section', 'business']]
        ordering = ['order', 'id']
        verbose_name = "Section business pick"
        verbose_name_plural = "Section business picks"
    
    def __str__(self):
        return f"{self.section} - {self.business.name} (#{self.order})"
