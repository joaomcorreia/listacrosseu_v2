from datetime import datetime
from io import BytesIO
from types import SimpleNamespace

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.contrib import admin
from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory
from rest_framework.test import APIClient
from PIL import Image

from listings.api.serializers import BusinessSerializer
from listings.models import AccountVerificationToken, Business, BusinessClaimRequest, Category, CategorySuggestion, City, Country
from listings.sitemaps import CountryCategorySitemap


@override_settings(
    CORS_ALLOWED_ORIGINS=["https://staging.example.com"],
    CORS_ALLOWED_ORIGIN_REGEXES=[r"^https://[a-z0-9-]+\.listacross\.eu$"],
)
class GeneratedWebsiteCorsTests(TestCase):
    def _response_for_origin(self, origin):
        return self.client.get("/healthz/", HTTP_ORIGIN=origin)

    def test_generated_site_first_level_https_subdomains_are_allowed(self):
        for origin in (
            "https://auto-repairs-soldier.listacross.eu",
            "https://another-generated-site.listacross.eu",
        ):
            response = self._response_for_origin(origin)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response["Access-Control-Allow-Origin"], origin)

    def test_unrelated_and_nested_origins_are_rejected(self):
        for origin in (
            "https://evil.example",
            "https://listacross.eu.evil.example",
            "https://foo.bar.listacross.eu",
        ):
            response = self._response_for_origin(origin)
            self.assertEqual(response.status_code, 200)
            self.assertNotIn("Access-Control-Allow-Origin", response)

    def test_existing_explicit_cors_origins_remain_allowed(self):
        response = self._response_for_origin("https://staging.example.com")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Access-Control-Allow-Origin"], "https://staging.example.com")


class BusinessVisibilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.country = Country.objects.create(name="Belgium", code="BE", slug="be")
        self.city = City.objects.create(country=self.country, name="Antwerp", slug="antwerp")
        self.category = Category.objects.create(name="Restaurant", slug="restaurant")

        for tier, name in (("free", "Free Listing"), ("claimed", "Claimed Listing"), ("premium", "Premium Listing")):
            Business.objects.create(
                name=name,
                slug=name.lower().replace(" ", "-"),
                tier=tier,
                country=self.country,
                city=self.city,
                category=self.category,
                description=f"{name} description",
            )

    def test_location_search_returns_all_tiers_in_priority_order(self):
        response = self.client.get("/api/listings/businesses/search/?country=be&limit=100")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total"], 3)
        self.assertEqual([item["tier"] for item in response.data["results"]], ["premium", "claimed", "free"])

    def test_city_geo_endpoint_returns_free_listings(self):
        response = self.client.get("/api/geo/cities/antwerp/businesses/?limit=100")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_count"], 3)
        self.assertIn("Free Listing", [item["name"] for item in response.data["businesses"]])

    def test_featured_country_scope_returns_free_listings(self):
        response = self.client.get("/api/listings/businesses/featured/?scope=country&country=be&limit=100")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 3)
        self.assertEqual([item["tier"] for item in response.data["results"]], ["premium", "claimed", "free"])

    def test_unpublished_business_is_hidden_and_republishing_restores_it(self):
        business = Business.objects.get(slug="free-listing")
        business.is_published = False
        business.save(update_fields=["is_published"])

        search = self.client.get("/api/listings/businesses/search/?country=be&limit=100")
        self.assertEqual(search.data["total"], 2)
        self.assertEqual(self.client.get(f"/api/listings/businesses/{business.slug}/").status_code, 404)
        city = self.client.get("/api/geo/cities/antwerp/businesses/?limit=100")
        self.assertEqual(city.data["total_count"], 2)

        business.is_published = True
        business.save(update_fields=["is_published"])
        self.assertEqual(self.client.get("/api/listings/businesses/search/?country=be&limit=100").data["total"], 3)

    def test_unpublished_category_is_hidden_from_public_category_surfaces(self):
        self.category.is_public = False
        self.category.save(update_fields=["is_public"])

        categories = self.client.get("/api/listings/all-categories/")
        self.assertNotIn("restaurant", [item["slug"] for item in categories.data])
        search = self.client.get("/api/listings/businesses/search/?category=restaurant")
        self.assertEqual(search.data["total"], 0)
        self.assertEqual(list(CountryCategorySitemap().items()), [])

    def test_country_category_threshold_counts_only_published_listings(self):
        for index in range(3):
            Business.objects.create(
                name=f"Additional Listing {index}",
                slug=f"additional-listing-{index}",
                country=self.country,
                city=self.city,
                category=self.category,
            )
        hidden = Business.objects.get(slug="free-listing")
        hidden.is_published = False
        hidden.save(update_fields=["is_published"])

        response = self.client.get("/api/listings/businesses/search/?country=be&category=restaurant&limit=100")
        self.assertEqual(response.data["total"], 5)
        self.assertTrue(response.data["country_category_indexable"])

        second_hidden = Business.objects.get(slug="claimed-listing")
        second_hidden.is_published = False
        second_hidden.save(update_fields=["is_published"])
        response = self.client.get("/api/listings/businesses/search/?country=be&category=restaurant&limit=100")
        self.assertEqual(response.data["total"], 4)
        self.assertFalse(response.data["country_category_indexable"])


class DashboardOwnershipTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.country = Country.objects.create(name="France", code="FR", slug="fr")
        self.city = City.objects.create(country=self.country, name="Marseille", slug="marseille")
        self.category = Category.objects.create(name="Retail", slug="retail")
        self.business = Business.objects.create(
            name="Owned Listing", slug="owned-listing", country=self.country,
            city=self.city, category=self.category, phone="+33 1 2 3 4", tier="claimed",
        )
        self.owner = get_user_model().objects.create_user(username="owner@example.com", email="owner@example.com", password="safe-password-123")
        self.other_user = get_user_model().objects.create_user(username="other@example.com", email="other@example.com", password="safe-password-123")
        BusinessClaimRequest.objects.create(
            listing=self.business, name="Owner", email="owner@example.com", business_name=self.business.name,
            business_address="1 Main Street", business_post_code="13001", status="verified",
        )

    def test_dashboard_requires_authentication(self):
        response = self.client.get("/api/dashboard/businesses/")
        self.assertIn(response.status_code, (401, 403))

    def test_verified_claimant_can_read_and_update_owned_business(self):
        self.client.force_authenticate(self.owner)
        response = self.client.get("/api/dashboard/businesses/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["name"], "Owned Listing")

        response = self.client.patch(
            f"/api/dashboard/businesses/{self.business.id}/",
            {"description": "Updated by owner", "visibility": {"phone": False}},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.business.refresh_from_db()
        self.assertEqual(self.business.description, "Updated by owner")
        self.assertEqual(self.business.premium_sidebar["_dashboard"]["visibility"]["phone"], False)

    def test_long_website_url_survives_admin_serializer_dashboard_and_public_api(self):
        long_url = "https://fictional.example.test/" + ("deep-link/" * 21) + "page?" + ("q=" + "x" * 35)
        self.assertEqual(len(long_url), 283)

        admin_request = RequestFactory().get("/admin/")
        admin_request.user = AnonymousUser()
        admin_form_class = admin.site._registry[Business].get_form(admin_request, obj=self.business)
        self.assertEqual(admin_form_class.base_fields["website"].max_length, 1000)
        self.assertEqual(admin_form_class.base_fields["website"].clean(long_url), long_url)

        serializer = BusinessSerializer(instance=self.business, data={"website": long_url}, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

        self.client.force_authenticate(self.owner)
        dashboard = self.client.patch(
            f"/api/dashboard/businesses/{self.business.id}/",
            {"website": long_url},
            format="json",
        )
        self.assertEqual(dashboard.status_code, 200)
        self.business.refresh_from_db()
        self.assertEqual(self.business.website, long_url)
        public = self.client.get(f"/api/listings/businesses/{self.business.slug}/")
        self.assertEqual(public.status_code, 200)
        self.assertEqual(public.data["website"], long_url)

    def test_verified_claim_wins_over_later_pending_duplicate(self):
        BusinessClaimRequest.objects.create(
            listing=self.business, name="Owner", email=self.owner.email, business_name=self.business.name,
            business_address="1 Main Street", business_post_code="13001", status="pending",
        )
        self.client.force_authenticate(self.owner)
        response = self.client.get("/api/dashboard/businesses/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["claim_status"], "verified")

    def test_pending_claim_reports_pending(self):
        pending_owner = get_user_model().objects.create_user(
            username="pending-owner@example.com", email="pending-owner@example.com", password="safe-password-123",
        )
        BusinessClaimRequest.objects.create(
            listing=self.business, name="Pending Owner", email=pending_owner.email, business_name=self.business.name,
            business_address="1 Main Street", business_post_code="13001", status="pending",
        )
        self.client.force_authenticate(pending_owner)
        response = self.client.get("/api/dashboard/businesses/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["claim_status"], "pending")

    def test_website_draft_is_idempotent_and_does_not_start_trial(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post(f"/api/dashboard/businesses/{self.business.id}/website/")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["website"]["status"], "draft")
        self.assertEqual(response.data["website"]["trial"]["status"], "not_started")
        self.assertEqual(response.data["website"]["template_id"], "editorial-v1")
        self.assertIn("content", response.data["website"])
        repeat = self.client.post(f"/api/dashboard/businesses/{self.business.id}/website/")
        self.assertEqual(repeat.status_code, 200)
        self.assertEqual(repeat.data["website"]["status"], "draft")

    def test_website_trial_requires_explicit_activation(self):
        self.client.force_authenticate(self.owner)
        self.client.post(f"/api/dashboard/businesses/{self.business.id}/website/")
        response = self.client.post(f"/api/dashboard/businesses/{self.business.id}/website/trial/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["website"]["trial"]["status"], "trial")
        started = datetime.fromisoformat(response.data["website"]["trial"]["started_at"])
        ends = datetime.fromisoformat(response.data["website"]["trial"]["ends_at"])
        self.assertEqual((ends - started).days, 30)

    def test_generated_website_omits_empty_content_sections(self):
        self.client.force_authenticate(self.owner)
        self.business.description = ""
        self.business.premium_images = []
        self.business.save(update_fields=["description", "premium_images"])
        response = self.client.post(f"/api/dashboard/businesses/{self.business.id}/website/")
        self.assertEqual(response.status_code, 201)
        website = response.data["website"]
        self.assertFalse(website["sections"]["about"]["enabled"])
        self.assertTrue(website["sections"]["services"]["enabled"])
        self.assertEqual(len(website["sections"]["services"]["items"]), 3)
        self.assertFalse(website["sections"]["gallery"]["enabled"])
        self.assertEqual(website["content"]["description"], "")

    def test_generated_website_keeps_actual_location_and_publishes_public_page(self):
        self.client.force_authenticate(self.owner)
        actual_city_id = self.business.city_id
        created = self.client.post(
            f"/api/dashboard/businesses/{self.business.id}/website/",
            {"page_title": "Test Restaurant Amsterdam", "target_location": "Amsterdam", "service_area": "Amsterdam and surrounding areas"},
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data["website"]["page_title"], "Test Restaurant Amsterdam")
        self.assertEqual(created.data["website"]["target_location"], "Amsterdam")
        self.assertEqual(created.data["website"]["website_slug"], "test-restaurant-amsterdam")
        self.assertEqual(created.data["public_url"], "")
        self.assertIn("preview_token=", created.data["preview_url"])
        self.business.refresh_from_db()
        self.assertEqual(self.business.city_id, actual_city_id)
        self.assertEqual(created.data["website"]["status"], "draft")
        self.assertEqual(self.client.get("/api/listings/generated-websites/test-restaurant-amsterdam/").status_code, 404)
        preview_path, preview_query = created.data["preview_url"].split("?", 1)
        preview = self.client.get(preview_path.replace("/en/generated/test-restaurant-amsterdam", "/api/listings/generated-websites/test-restaurant-amsterdam") + "/?" + preview_query)
        self.assertEqual(preview.status_code, 200)
        self.assertEqual(preview.data["website"]["status"], "draft")
        trial = self.client.post(f"/api/dashboard/businesses/{self.business.id}/website/trial/")
        self.assertEqual(trial.status_code, 200)
        published = self.client.post(f"/api/dashboard/businesses/{self.business.id}/website/publish/")
        self.assertEqual(published.status_code, 200)
        self.assertTrue(published.data["website"]["published"])
        public = self.client.get("/api/listings/generated-websites/test-restaurant-amsterdam/")
        self.assertEqual(public.status_code, 200)
        self.assertEqual(public.data["website"]["target_location"], "Amsterdam")
        self.assertEqual(public.data["website"]["page_title"], "Test Restaurant Amsterdam")

        self.client.patch(f"/api/dashboard/businesses/{self.business.id}/website/", {"page_title": "Private draft only"}, format="json")
        self.assertEqual(self.client.get("/api/listings/generated-websites/test-restaurant-amsterdam/").data["website"]["page_title"], "Test Restaurant Amsterdam")
        republished = self.client.post(f"/api/dashboard/businesses/{self.business.id}/website/publish/")
        self.assertEqual(republished.status_code, 200)
        self.assertEqual(self.client.get("/api/listings/generated-websites/test-restaurant-amsterdam/").data["website"]["page_title"], "Private draft only")
        unpublished = self.client.post(f"/api/dashboard/businesses/{self.business.id}/website/unpublish/")
        self.assertEqual(unpublished.status_code, 200)
        self.assertFalse(unpublished.data["website"]["published"])
        self.assertEqual(self.client.get("/api/listings/generated-websites/test-restaurant-amsterdam/").status_code, 404)

    def test_other_user_cannot_edit_generated_website(self):
        self.client.force_authenticate(self.other_user)
        response = self.client.post(
            f"/api/dashboard/businesses/{self.business.id}/website/",
            {"page_title": "Should not save", "target_location": "Amsterdam"},
            format="json",
        )
        self.assertEqual(response.status_code, 404)

    def test_owner_can_upload_logo_and_save_accent_color(self):
        self.client.force_authenticate(self.owner)
        image = BytesIO()
        Image.new("RGB", (8, 8), "blue").save(image, format="PNG")
        image.seek(0)
        response = self.client.post(
            f"/api/dashboard/businesses/{self.business.id}/logo/",
            {"logo": SimpleUploadedFile("logo.png", image.read(), content_type="image/png")},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.business.refresh_from_db()
        self.assertTrue(self.business.logo_file.name)
        self.assertIn("/media/business_logos/", response.data["logo_url"])
        saved = self.client.patch(
            f"/api/dashboard/businesses/{self.business.id}/",
            {"accent_color": "#16A34A"}, format="json",
        )
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(saved.data["accent_color"], "#16A34A")
        self.business.refresh_from_db()
        self.assertEqual(self.business.accent_color, "#16A34A")
        public = self.client.get(f"/api/listings/businesses/{self.business.slug}/")
        self.assertIn("/media/business_logos/", public.data["logo_url"])
        self.assertEqual(public.data["accent_color"], "#16A34A")
        self.business.logo_file.delete(save=False)

    def test_authenticated_user_can_create_owned_business_and_duplicate_is_blocked(self):
        self.client.force_authenticate(self.owner)
        payload = {
            "name": "Owner Created Studio", "category_id": self.category.id, "city_id": self.city.id,
            "country_id": self.country.id, "business_type": "Design studio", "description": "A local design studio.",
            "region": "Provence", "phone": "+33 4 00 00 00 00", "contact_email": "public-contact@example.test",
        }
        response = self.client.post("/api/dashboard/create-business/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        business = Business.objects.get(pk=response.data["id"])
        self.assertEqual(business.tier, "claimed")
        self.assertEqual(business.business_contact_email, "public-contact@example.test")
        self.assertEqual(BusinessClaimRequest.objects.get(listing=business).status, "verified")
        self.assertEqual(self.client.get(f"/api/dashboard/businesses/{business.id}/").status_code, 200)
        duplicate = self.client.post("/api/dashboard/create-business/", payload, format="json")
        self.assertEqual(duplicate.status_code, 409)

    def test_new_business_multipart_media_seeds_claimed_draft(self):
        self.client.force_authenticate(self.owner)
        logo = BytesIO()
        Image.new("RGB", (8, 8), "blue").save(logo, format="PNG")
        background = BytesIO()
        Image.new("RGB", (16, 9), "green").save(background, format="JPEG")
        response = self.client.post("/api/dashboard/create-business/", {
            "name": "Owner Created Media Studio", "category_id": self.category.id, "city_id": self.city.id,
            "country_id": self.country.id, "business_type": "Design studio", "description": "A local design studio.",
            "contact_email": "media-contact@example.test", "languages": "[]", "visibility": "{}",
            "logo": SimpleUploadedFile("new-logo.png", logo.getvalue(), content_type="image/png"),
            "background": SimpleUploadedFile("new-background.jpg", background.getvalue(), content_type="image/jpeg"),
        }, format="multipart")
        self.assertEqual(response.status_code, 201)
        business = Business.objects.get(pk=response.data["id"])
        self.assertIn("business_logos/", business.logo_file.name)
        self.assertIn("business_backgrounds/", business.claimed_background_file.name)
        draft = business.premium_sidebar["_claimed_listing"]["draft"]
        self.assertIn("/media/business_logos/", draft["logo_url"])
        self.assertIn("/media/business_backgrounds/", draft["background_image"])

    def test_other_user_cannot_read_or_update_owned_business(self):
        self.client.force_authenticate(self.other_user)
        response = self.client.get(f"/api/dashboard/businesses/{self.business.id}/")
        self.assertEqual(response.status_code, 404)


class ClaimVerificationTests(TestCase):
    def setUp(self):
        country = Country.objects.create(name="Spain", code="ES", slug="es")
        city = City.objects.create(country=country, name="Valencia", slug="valencia")
        category = Category.objects.create(name="Cinemas", slug="cinemas")
        self.business = Business.objects.create(
            name="Cinema Test", slug="cinema-test", tier="free", country=country,
            city=city, category=category,
        )
        self.claim = BusinessClaimRequest.objects.create(
            listing=self.business, name="Cinema Owner", email="cinema@example.com",
            business_name=self.business.name, status="pending",
        )
        self.client = APIClient()

    def test_invalid_token_is_a_client_error_not_server_error(self):
        response = self.client.get("/api/verify?token=not-a-uuid")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "Invalid verification token")

    def test_legacy_claim_token_cannot_bypass_account_verification(self):
        response = self.client.get(f"/api/verify?token={self.claim.verification_token}")
        self.assertEqual(response.status_code, 410)
        self.claim.refresh_from_db()
        self.business.refresh_from_db()
        self.assertEqual(self.claim.status, "pending")
        self.assertEqual(self.business.tier, "free")

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_public_claim_returns_pending_context_without_verifying(self):
        response = self.client.post("/api/claims", {
            "listing_id": self.business.id,
            "name": "Local Test Owner",
            "email": "local-claim@example.test",
            "business_name": self.business.name,
            "business_address": "1 Test Street",
            "business_post_code": "1000",
            "password": "safe-password-123",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["claim_status"], "pending")
        self.assertEqual(response.data["business_id"], self.business.id)
        self.assertTrue(response.data["claim_token"])
        self.assertEqual(BusinessClaimRequest.objects.filter(listing=self.business, email="local-claim@example.test", status="pending").count(), 1)
        self.business.refresh_from_db()
        self.assertEqual(self.business.tier, "free")

    def test_verified_owner_blocks_second_claim(self):
        BusinessClaimRequest.objects.create(
            listing=self.business, name="Verified Local Owner", email="verified@example.test",
            business_name=self.business.name, business_address="1 Test Street", business_post_code="1000",
            status="verified", verified_at=datetime.now(),
        )
        response = self.client.post("/api/claims", {
            "listing_id": self.business.id, "name": "Second Local Owner", "email": "second@example.test",
            "business_name": self.business.name, "business_address": "1 Test Street", "business_post_code": "1000",
            "password": "safe-password-123",
        }, format="json")
        self.assertEqual(response.status_code, 409)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend", FRONTEND_SITE_URL="http://localhost:3004")
    def test_claim_account_verification_associates_the_selected_business(self):
        started = self.client.post("/api/claims", {
            "listing_id": self.business.id, "name": "Flow Owner", "email": "flow-owner@example.test",
            "business_name": self.business.name, "business_address": "1 Test Street", "business_post_code": "1000", "password": "safe-password-123",
        }, format="json")
        self.assertEqual(started.status_code, 201)
        account_token = AccountVerificationToken.objects.get(user__email="flow-owner@example.test")
        verified = self.client.get(f"/api/account/verify/?token={account_token.token}")
        self.assertEqual(verified.status_code, 200)
        self.assertEqual(verified.data["business_id"], self.business.id)
        logged_in = self.client.post("/api/dashboard/auth/", {"email": "flow-owner@example.test", "password": "safe-password-123"}, format="json")
        self.assertEqual(logged_in.status_code, 200)
        self.assertEqual(self.client.get("/api/dashboard/businesses/").data["results"][0]["id"], self.business.id)


class ClaimedListingFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.country = Country.objects.create(name="Testland", code="TL", slug="testland")
        self.city = City.objects.create(country=self.country, name="Testville", slug="testville")
        self.category = Category.objects.create(name="Test Services", slug="test-services")
        self.business = Business.objects.create(
            name="Fictional Test Listing", slug="fictional-test-listing", tier="free", country=self.country,
            city=self.city, category=self.category, description="Original directory description", address_line1="Base address",
        )

    def _claim_payload(self, email="claim-owner@example.test"):
        return {
            "listing_id": self.business.id, "name": "Local Test Owner", "email": email,
            "business_name": self.business.name, "business_address": "Draft address", "business_post_code": "1234",
            "password": "safe-password-123", "draft": {
                "name": "Edited Claimed Listing", "description": "Draft-only description", "address_line1": "Draft address",
                "postal_code": "1234", "phone": "+00 000 000", "accent_color": "#16A34A", "business_type": "Test Services",
            },
        }

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend", FRONTEND_SITE_URL="http://localhost:3004")
    def test_draft_stays_private_until_publish_then_public_presentation_changes(self):
        started = self.client.post("/api/claims", self._claim_payload(), format="json")
        self.assertEqual(started.status_code, 201)
        token = AccountVerificationToken.objects.get(user__email="claim-owner@example.test")
        self.assertEqual(self.client.get(f"/api/account/verify/?token={token.token}").status_code, 200)
        owner = get_user_model().objects.get(email="claim-owner@example.test")
        self.client.force_authenticate(owner)
        dashboard = self.client.get("/api/dashboard/businesses/")
        self.assertEqual(dashboard.status_code, 200)
        self.assertEqual(dashboard.data["results"][0]["claimed_listing_status"], "draft")
        public_before = self.client.get(f"/api/listings/businesses/{self.business.slug}/")
        self.assertEqual(public_before.data["tier"], "free")
        self.assertEqual(public_before.data["name"], "Fictional Test Listing")
        published = self.client.post(f"/api/dashboard/businesses/{self.business.id}/claimed-listing/publish/")
        self.assertEqual(published.status_code, 200)
        public_after = self.client.get(f"/api/listings/businesses/{self.business.slug}/")
        self.assertEqual(public_after.data["tier"], "claimed")
        self.assertEqual(public_after.data["name"], "Edited Claimed Listing")
        self.assertEqual(public_after.data["description"], "Draft-only description")
        unpublished = self.client.post(f"/api/dashboard/businesses/{self.business.id}/claimed-listing/unpublish/")
        self.assertEqual(unpublished.status_code, 200)
        self.business.refresh_from_db()
        self.assertTrue(self.business.is_published)
        public_unpublished = self.client.get(f"/api/listings/businesses/{self.business.slug}/")
        self.assertEqual(public_unpublished.status_code, 200)
        self.assertFalse(public_unpublished.data["claimed_listing_published"])

    def test_selecting_existing_category_supersedes_pending_suggestion_and_allows_publish(self):
        owner = get_user_model().objects.create_user(username="category-resolution-owner@example.test", email="category-resolution-owner@example.test", password="safe-password-123")
        BusinessClaimRequest.objects.create(
            listing=self.business, name="Local Test Owner", email=owner.email,
            business_name=self.business.name, business_address="Draft address", business_post_code="1234", status="verified",
        )
        suggestion = CategorySuggestion.objects.create(listing=self.business, proposed_name="Musical Instrument Repair", submitter_email=owner.email)
        self.client.force_authenticate(owner)
        saved = self.client.put(f"/api/dashboard/businesses/{self.business.id}/claimed-listing/draft/", {
            **self._claim_payload()["draft"], "category_id": self.category.id,
        }, format="json")
        self.assertEqual(saved.status_code, 200)
        suggestion.refresh_from_db()
        self.assertEqual(suggestion.status, "rejected")
        self.assertEqual(suggestion.category_id, self.category.id)
        published = self.client.post(f"/api/dashboard/businesses/{self.business.id}/claimed-listing/publish/")
        self.assertEqual(published.status_code, 200)

    def test_category_api_excludes_uncategorized(self):
        Category.objects.create(name="Uncategorized", slug="uncategorized", is_public=True)
        response = self.client.get("/api/listings/all-categories/")
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("uncategorized", {item["slug"] for item in response.data})

    def test_existing_account_claims_second_business_without_duplicate_user(self):
        owner = get_user_model().objects.create_user(username="existing-owner@example.test", email="existing-owner@example.test", password="safe-password-123")
        first = Business.objects.create(name="First Fictional Listing", slug="first-fictional-listing", tier="free", country=self.country, city=self.city, category=self.category)
        BusinessClaimRequest.objects.create(listing=first, name="Existing Owner", email=owner.email, business_name=first.name, business_address="First address", business_post_code="1234", status="verified")
        self.client.force_authenticate(owner)
        response = self.client.post("/api/claims", self._claim_payload("different@example.test"), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["claim_status"], "verified")
        self.assertEqual(get_user_model().objects.filter(email=owner.email).count(), 1)
        owned_ids = set(self.client.get("/api/dashboard/businesses/").data["results"][i]["id"] for i in range(2))
        self.assertEqual(owned_ids, {first.id, self.business.id})

    def test_shared_presentation_contact_languages_visibility_and_styling(self):
        owner = get_user_model().objects.create_user(username="postcard-owner@example.test", email="postcard-owner@example.test", password="safe-password-123")
        BusinessClaimRequest.objects.create(
            listing=self.business, name="Postcard Owner", email=owner.email,
            business_name=self.business.name, business_address="Draft address", business_post_code="1234", status="verified",
        )
        self.client.force_authenticate(owner)
        saved = self.client.put(f"/api/dashboard/businesses/{self.business.id}/claimed-listing/draft/", {
            "name": "Fictional Shared Postcard", "category_id": self.category.id, "city_id": self.city.id,
            "business_type": "Repair Services", "description": "A fictional postcard description", "address_line1": "10 Fictional Street",
            "postal_code": "1000", "phone": "+00 111 222", "contact_email": "contact@fictional.example",
            "whatsapp_number": "+00 333 444", "languages": ["English", "Dutch", "French"], "website": "https://fictional.example",
            "overlay_color": "#111827", "overlay_opacity": 0.6, "accent_color": "#16A34A",
            "visibility": {"address": False, "phone": True, "whatsapp": True, "email": True, "website": True, "languages": True, "description": True, "business_type": True},
        }, format="json")
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(saved.data["claimed_listing_draft"]["languages"], ["English", "Dutch", "French"])
        self.assertEqual(saved.data["claimed_listing_draft"]["contact_email"], "contact@fictional.example")
        self.assertEqual(self.client.post(f"/api/dashboard/businesses/{self.business.id}/claimed-listing/publish/").status_code, 200)
        public = self.client.get(f"/api/listings/businesses/{self.business.slug}/")
        self.assertEqual(public.status_code, 200)
        self.assertEqual(public.data["contact_email"], "contact@fictional.example")
        self.assertEqual(public.data["whatsapp_number"], "+00 333 444")
        self.assertEqual(public.data["languages"], ["English", "Dutch", "French"])
        self.assertEqual(public.data["address"], "")
        self.assertEqual(public.data["email"], "")


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend", FRONTEND_SITE_URL="http://localhost:3004")
class ListingAccountVerificationFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.country = Country.objects.create(name="Italy", code="IT", slug="it")
        self.city = City.objects.create(country=self.country, name="Rome", slug="rome")
        self.category = Category.objects.create(name="Restaurants", slug="restaurants")

    def test_anonymous_listing_requires_verification_before_dashboard(self):
        payload = {
            "name": "Test Italian Restaurant", "category_id": self.category.id,
            "city_id": self.city.id, "country_id": self.country.id,
            "description": "A test restaurant for the local flow.",
            "contact_email": "italian-flow@example.com", "business_type": "Italian restaurant",
        }
        created = self.client.post("/api/dashboard/create-business/", payload, format="json")
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data["claim_status"], "pending")
        created_business = Business.objects.get(pk=created.data["id"])
        self.assertEqual(created_business.business_contact_email, payload["contact_email"])
        self.assertIn(self.client.get("/api/dashboard/businesses/").status_code, (401, 403))

        self.assertTrue(created.data["account_created"])
        self.assertEqual(len(mail.outbox), 1)
        token = AccountVerificationToken.objects.get(user__email=payload["contact_email"])

        verified = self.client.get(f"/api/account/verify/?token={token.token}")
        self.assertEqual(verified.status_code, 200)
        self.assertTrue(verified.data["verified"])
        self.assertTrue(verified.data["authenticated"])
        user = get_user_model().objects.get(email=payload["contact_email"])
        self.assertTrue(user.is_active)
        self.assertFalse(user.has_usable_password())

        dashboard = self.client.get("/api/dashboard/businesses/")
        self.assertEqual(dashboard.status_code, 200)
        self.assertEqual(dashboard.data["results"][0]["name"], payload["name"])
        password_set = self.client.post("/api/dashboard/password/", {"current_password": "", "new_password": "safe-password-123"}, format="json")
        self.assertEqual(password_set.status_code, 200)
        self.client.post("/api/dashboard/logout/")
        logged_in = self.client.post("/api/dashboard/auth/", {"email": payload["contact_email"], "password": "safe-password-123"}, format="json")
        self.assertEqual(logged_in.status_code, 200)

    def test_frontend_style_email_identifier_is_trimmed_for_login(self):
        user = get_user_model().objects.create_user(
            username="login-fixture@local.test", email="login-fixture@local.test", password="safe-password-123",
        )
        response = self.client.post(
            "/api/dashboard/auth/",
            {"email": "  LOGIN-FIXTURE@LOCAL.TEST ", "password": "safe-password-123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["email"], user.email)

    @override_settings(
        DEBUG=False,
        FRONTEND_SITE_URL="http://localhost:3004",
        PUBLIC_SITE_URL="http://localhost:3004",
        ALLOWED_HOSTS=["listacross.eu"],
    )
    def test_production_verification_url_does_not_use_loopback_host(self):
        from listings.api.dashboard import _verification_url

        verification_url = _verification_url("fictional-token")
        self.assertEqual(verification_url, "https://listacross.eu/en/verify-account?token=fictional-token")

    def test_existing_account_is_reused_and_new_listing_context_is_verified(self):
        user = get_user_model().objects.create_user(
            username="existing-new-listing@example.test",
            email="existing-new-listing@example.test",
            password="safe-password-123",
            is_active=True,
        )
        payload = {
            "name": "Second Fictional Restaurant", "category_id": self.category.id,
            "city_id": self.city.id, "country_id": self.country.id,
            "description": "A second fictional local listing.",
            "contact_email": user.email, "business_type": "Restaurant",
        }
        created = self.client.post("/api/dashboard/create-business/", payload, format="json")
        self.assertEqual(created.status_code, 201)
        self.assertFalse(created.data["account_created"])
        self.assertEqual(get_user_model().objects.filter(email__iexact=user.email).count(), 1)
        token = AccountVerificationToken.objects.get(user=user)
        verified = self.client.get(f"/api/account/verify/?token={token.token}")
        self.assertEqual(verified.status_code, 200)
        self.assertEqual(verified.data["business_id"], created.data["id"])
        self.assertFalse(verified.data["authenticated"])
        self.assertEqual(self.client.post("/api/dashboard/auth/", {"email": user.email, "password": "safe-password-123"}, format="json").status_code, 200)
        dashboard = self.client.get("/api/dashboard/businesses/")
        self.assertEqual(dashboard.status_code, 200)
        self.assertIn(created.data["id"], [item["id"] for item in dashboard.data["results"]])


class CategorySuggestionFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.country = Country.objects.create(name="Fictional Category Country", code="ZZ", slug="fictional-category-country")
        self.city = City.objects.create(country=self.country, name="Fictional Category City", slug="fictional-category-city")
        self.existing_category = Category.objects.create(name="Existing Canonical Category", slug="existing-canonical-category")
        self.owner = get_user_model().objects.create_user(username="fictional-category-owner@example.test", email="fictional-category-owner@example.test", password="safe-password-123")

    def _approve(self, suggestion, *, category=None, name="", slug=""):
        suggestion.status = "approved"
        suggestion.category = category
        admin_request = RequestFactory().post("/admin/listings/categorysuggestion/")
        admin_request.user = self.owner
        form = SimpleNamespace(cleaned_data={"category": category, "canonical_name": name, "canonical_slug": slug})
        admin.site._registry[CategorySuggestion].save_model(admin_request, suggestion, form, change=True)

    def test_admin_form_allows_new_category_approval_without_category_field(self):
        from listings.admin import CategorySuggestionAdminForm

        valid = CategorySuggestionAdminForm(data={
            "proposed_name": "Fictional New Category", "status": "approved", "category": "",
            "canonical_name": "Fictional New Category", "canonical_slug": "fictional-new-category",
            "listing": "", "submitted_by": "", "submitter_email": "owner@example.test",
            "reviewer_notes": "",
        })
        self.assertTrue(valid.is_valid(), valid.errors)

        invalid = CategorySuggestionAdminForm(data={
            "proposed_name": "Fictional Missing Category", "status": "approved", "category": "",
            "canonical_name": "", "canonical_slug": "", "listing": "", "submitted_by": "",
            "submitter_email": "owner@example.test", "reviewer_notes": "",
        })
        self.assertFalse(invalid.is_valid())
        self.assertIn("Select an existing category or enter a canonical category name before approving.", str(invalid.errors))

    def test_user_suggestion_stays_pending_then_admin_creates_canonical_category(self):
        self.client.force_authenticate(self.owner)
        created = self.client.post("/api/dashboard/create-business/", {
            "name": "Fictional Instrument Workshop", "category_suggestion": "Musical Instrument Repair",
            "city_id": self.city.id, "country_id": self.country.id, "description": "Fictional local listing",
            "email": self.owner.email, "business_type": "Instrument repair",
        }, format="json")
        self.assertEqual(created.status_code, 201)
        listing = Business.objects.get(pk=created.data["id"])
        suggestion = CategorySuggestion.objects.get(listing=listing)
        self.assertEqual(suggestion.status, "pending")
        self.assertIsNone(listing.category)
        self.assertFalse(listing.is_published)
        self.assertNotIn("Musical Instrument Repair", Category.objects.values_list("name", flat=True))

        self._approve(suggestion, name="Musical Instrument Repair", slug="musical-instrument-repair")
        suggestion.refresh_from_db(); listing.refresh_from_db()
        self.assertEqual(suggestion.status, "approved")
        self.assertEqual(listing.category.slug, "musical-instrument-repair")
        self.assertEqual(((listing.premium_sidebar or {}).get("_claimed_listing", {}).get("draft") or {}).get("category_id"), listing.category_id)
        self.assertTrue(listing.category.is_public)
        self.assertFalse(listing.is_published)
        categories = self.client.get("/api/listings/all-categories/")
        self.assertIn("musical-instrument-repair", [item["slug"] for item in categories.data])

        for index in range(5):
            Business.objects.create(name=f"Fictional Repair Listing {index}", slug=f"fictional-repair-listing-{index}", country=self.country, city=self.city, category=listing.category, is_published=True)
        search = self.client.get("/api/listings/businesses/search/?country=fictional-category-country&category=musical-instrument-repair&limit=10")
        self.assertEqual(search.status_code, 200)
        self.assertTrue(search.data["country_category_indexable"])

        from listings.sitemaps import CountryCategorySitemap
        self.assertIn("/en/countries/fictional-category-country/categories/musical-instrument-repair", [CountryCategorySitemap().location(item) for item in CountryCategorySitemap().items()])

    def test_admin_can_approve_existing_category_or_reject_without_creating_category(self):
        listing = Business.objects.create(name="Fictional Existing Category Listing", slug="fictional-existing-category-listing", country=self.country, city=self.city, is_published=False)
        suggestion = CategorySuggestion.objects.create(proposed_name="Existing Category Alias", listing=listing, submitter_email=self.owner.email)
        self._approve(suggestion, category=self.existing_category)
        listing.refresh_from_db()
        self.assertEqual(listing.category, self.existing_category)

        rejected_listing = Business.objects.create(name="Fictional Rejected Category Listing", slug="fictional-rejected-category-listing", country=self.country, city=self.city, is_published=False)
        rejected = CategorySuggestion.objects.create(proposed_name="Inappropriate Fictional Category", listing=rejected_listing, submitter_email=self.owner.email)
        rejected.status = "rejected"
        admin_request = RequestFactory().post("/admin/listings/categorysuggestion/")
        admin_request.user = self.owner
        admin.site._registry[CategorySuggestion].save_model(admin_request, rejected, SimpleNamespace(cleaned_data={"category": None, "canonical_name": "", "canonical_slug": ""}), change=True)
        rejected_listing.refresh_from_db()
        self.assertEqual(rejected.status, "rejected")
        self.assertIsNone(rejected_listing.category)
