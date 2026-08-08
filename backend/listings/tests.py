from django.test import TestCase
from rest_framework.test import APIClient

from listings.models import Business, Category, City, Country


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
