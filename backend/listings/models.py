import uuid

from django.db import models
from django.utils.text import slugify


class Country(models.Model):
    name = models.CharField(max_length=120, unique=True)
    code = models.CharField(max_length=2, blank=True)
    slug = models.SlugField(max_length=150, unique=True, blank=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class City(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name="cities")
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=150, blank=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("country", "slug")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name}, {self.country.name}"


class Town(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name="towns")
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=150, blank=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("city", "slug")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name}, {self.city.name}, {self.city.country.name}"


class Category(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    is_public = models.BooleanField(
        default=True,
        verbose_name="Publish category publicly",
        help_text="Publish this category in the public directory and SEO pages.",
    )

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class CategorySuggestion(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    proposed_name = models.CharField(max_length=200)
    listing = models.ForeignKey("Business", on_delete=models.SET_NULL, null=True, blank=True, related_name="category_suggestions")
    submitted_by = models.ForeignKey("auth.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="category_suggestions")
    submitter_email = models.EmailField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="suggestions")
    reviewer_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.proposed_name} ({self.status})"


class Business(models.Model):
    WEBSITE_MAX_LENGTH = 1000
    # Listing tier choices
    LISTING_TIER_CHOICES = [
        ("free", "Free"),
        ("claimed", "Claimed"),
        ("premium", "Premium"),
    ]

    VISIBILITY_SCOPE_CHOICES = [
        ("country", "Country"),
        ("eu", "EU-wide"),
    ]

    PREMIUM_LAYOUT_WIDTH_CHOICES = [
        ("boxed", "Boxed"),
        ("full", "Full width"),
    ]
    
    # Core identifiers
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    
    # Listing tier - determines display and features
    tier = models.CharField(
        max_length=20,
        choices=LISTING_TIER_CHOICES,
        default="free",
        help_text="Listing tier determines display layout and available features"
    )

    is_published = models.BooleanField(
        default=True,
        verbose_name="Published",
        help_text="Include this listing in the public directory and public APIs.",
    )

    visibility_scope = models.CharField(
        max_length=10,
        choices=VISIBILITY_SCOPE_CHOICES,
        default="eu",
        help_text="Premium visibility scope (country or EU-wide).",
    )
    visibility_country = models.CharField(
        max_length=2,
        blank=True,
        help_text="ISO 2-letter country code required when visibility_scope=country.",
    )

    premium_layout_width = models.CharField(
        max_length=10,
        choices=PREMIUM_LAYOUT_WIDTH_CHOICES,
        default="boxed",
        help_text="Layout width for premium business page.",
    )

    # Location
    country = models.ForeignKey(Country, on_delete=models.PROTECT, related_name="businesses", null=True, blank=True)
    city = models.ForeignKey(City, on_delete=models.PROTECT, related_name="businesses", null=True, blank=True)
    town = models.ForeignKey(Town, on_delete=models.PROTECT, related_name="businesses", null=True, blank=True)
    address = models.TextField(blank=True)
    address_line1 = models.CharField(max_length=255, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    # Business metadata
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    website = models.URLField(blank=True, max_length=1000)
    phone = models.CharField(max_length=80, blank=True)
    business_contact_email = models.EmailField(blank=True, max_length=254)
    whatsapp_number = models.CharField(max_length=80, blank=True)
    spoken_languages = models.JSONField(default=list, blank=True)
    description = models.TextField(blank=True)
    keywords = models.JSONField(default=list, blank=True)  # Store as array of strings
    
    # Media fields for different tiers
    logo_url = models.URLField(blank=True, help_text="Business logo URL (for Premium tier)")
    logo_file = models.ImageField(upload_to="business_logos/", blank=True, null=True, help_text="Uploaded logo image")
    claimed_background_file = models.ImageField(upload_to="business_backgrounds/", blank=True, null=True, help_text="Uploaded Claimed Listing background image")
    accent_color = models.CharField(max_length=7, default="#2563EB", blank=True)
    image_url = models.URLField(blank=True, help_text="Main business image URL (for Premium tier)")
    
    # Premium content fields
    premium_content = models.TextField(blank=True, help_text="Rich text content for premium listings (3-4 paragraphs)")
    premium_images = models.JSONField(default=list, blank=True, help_text="Additional image URLs for premium listings (max 3-4)")
    
    # Premium sidebar configuration (JSON field for flexibility)
    premium_sidebar = models.JSONField(default=dict, blank=True, help_text="Premium sidebar configuration: highlight, services, contact_email, etc.")

    # Micro business indicators (expand later)
    is_micro = models.BooleanField(default=False)
    employee_count = models.IntegerField(null=True, blank=True)

    # Source tracking (CSV, Google Places, Registry, Manual)
    source = models.CharField(max_length=50, default="unknown")
    external_id = models.CharField(max_length=255, blank=True)

    # CSV import tracking
    imported_from_csv = models.BooleanField(default=False)
    csv_imported_at = models.DateTimeField(null=True, blank=True)
    csv_source_file = models.CharField(max_length=255, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = f"{self.name}-{self.city.name if self.city else ''}-{self.country.name}"
            self.slug = slugify(base)
        super().save(*args, **kwargs)

    def get_canonical_path(self, lang="en"):
        """
        Returns the canonical URL path for this business.
        Format: /{lang}/{city_slug}/{town_slug?}/{business_slug}
        """
        if not self.city:
            # Fallback if no city (should be rare)
            return f"/{lang}/business/{self.slug}"
            
        path_parts = [lang, self.city.slug]
        
        # Add town (location) if available
        if self.town:
            path_parts.append(self.town.slug)
            
        path_parts.append(self.slug)
        
        return "/" + "/".join(path_parts)
    
    def get_sitemap_priority(self):
        """Returns sitemap priority based on tier."""
        return {
            'free': 0.3,
            'claimed': 0.6,
            'premium': 0.9
        }.get(self.tier, 0.3)
    
    def get_sitemap_changefreq(self):
        """Returns sitemap change frequency based on tier."""
        return {
            'free': 'monthly',
            'claimed': 'weekly', 
            'premium': 'weekly'
        }.get(self.tier, 'monthly')

    def __str__(self):
        return self.name


class BusinessClaimRequest(models.Model):
    # Associated business (optional, might be new business)
    listing = models.ForeignKey(Business, on_delete=models.CASCADE, null=True, blank=True)
    
    # Claimant details
    name = models.CharField(max_length=255)
    email = models.EmailField()
    
    # Business details (might differ from current listing)
    business_name = models.CharField(max_length=255)
    business_address = models.TextField()
    business_post_code = models.CharField(max_length=20)

    # Verification fields
    verification_token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending Verification"),
            ("verified", "Verified"),
            ("expired", "Expired"),
        ],
        default="pending",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"Claim for {self.business_name} by {self.name}"


class AccountVerificationToken(models.Model):
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE, related_name="account_verification_tokens")
    claim = models.ForeignKey(BusinessClaimRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name="account_verification_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
