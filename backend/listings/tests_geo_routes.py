from django.test import TestCase

from listings.models import Business, Category, City, Country


class GeoCityRouteTests(TestCase):
    def setUp(self):
        self.country = Country.objects.create(name="Portugal", code="PT", slug="portugal")
        self.city = City.objects.create(country=self.country, name="Porto", slug="porto")
        self.category = Category.objects.create(name="Restaurant", slug="restaurant")
        Business.objects.create(
            name="Test Porto Business",
            slug="test-porto-business",
            country=self.country,
            city=self.city,
            category=self.category,
            is_published=True,
        )

    def test_city_detail_and_business_routes_return_success(self):
        detail = self.client.get("/api/geo/cities/porto/")
        businesses = self.client.get("/api/geo/cities/porto/businesses/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(businesses.status_code, 200)
        self.assertEqual(businesses.json()["total_count"], 1)
