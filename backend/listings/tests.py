from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from listings.models import Business, BusinessClaimRequest, Category, City, Country


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


class DashboardOwnershipTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.country = Country.objects.create(name="France", code="FR", slug="fr")
        self.city = City.objects.create(country=self.country, name="Marseille", slug="marseille")
        self.category = Category.objects.create(name="Retail", slug="retail")
        self.business = Business.objects.create(
            name="Owned Listing", slug="owned-listing", country=self.country,
            city=self.city, category=self.category, phone="+33 1 2 3 4",
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
        repeat = self.client.post(f"/api/dashboard/businesses/{self.business.id}/website/")
        self.assertEqual(repeat.status_code, 200)
        self.assertEqual(repeat.data["website"]["status"], "draft")

    def test_website_trial_requires_explicit_activation(self):
        self.client.force_authenticate(self.owner)
        self.client.post(f"/api/dashboard/businesses/{self.business.id}/website/")
        response = self.client.post(f"/api/dashboard/businesses/{self.business.id}/website/trial/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["website"]["trial"]["status"], "trial")

    def test_authenticated_user_can_create_owned_business_and_duplicate_is_blocked(self):
        self.client.force_authenticate(self.owner)
        payload = {
            "name": "Owner Created Studio", "category_id": self.category.id, "city_id": self.city.id,
            "country_id": self.country.id, "business_type": "Design studio", "description": "A local design studio.",
            "region": "Provence", "phone": "+33 4 00 00 00 00", "email": self.owner.email,
        }
        response = self.client.post("/api/dashboard/create-business/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        business = Business.objects.get(pk=response.data["id"])
        self.assertEqual(business.tier, "claimed")
        self.assertEqual(BusinessClaimRequest.objects.get(listing=business).status, "verified")
        self.assertEqual(self.client.get(f"/api/dashboard/businesses/{business.id}/").status_code, 200)
        duplicate = self.client.post("/api/dashboard/create-business/", payload, format="json")
        self.assertEqual(duplicate.status_code, 409)

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

    def test_verification_updates_claim_and_business(self):
        response = self.client.get(f"/api/verify?token={self.claim.verification_token}")
        self.assertEqual(response.status_code, 200)
        self.claim.refresh_from_db()
        self.business.refresh_from_db()
        self.assertEqual(self.claim.status, "verified")
        self.assertEqual(self.business.tier, "claimed")
        self.assertEqual(response.data["business_id"], self.business.id)
