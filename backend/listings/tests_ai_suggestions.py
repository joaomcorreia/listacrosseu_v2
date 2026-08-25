import json
import os
from types import SimpleNamespace
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase, override_settings
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate

from listings.api.dashboard import DashboardWebsiteAISuggestionView, _normalize_website_languages
from listings.models import Business, BusinessClaimRequest, Category, City, Country
from listings.services.ai_suggestions import _build_payload, build_suggestion_context, generate_field_suggestion


class GeneratedWebsiteAISuggestionTests(SimpleTestCase):
    def setUp(self):
        self.business = SimpleNamespace(
            id=42,
            name="North Star Bakery",
            business_type="Bakery",
            description="A neighborhood bakery offering bread and pastries.",
            city_id=7,
            city=SimpleNamespace(name="Ghent"),
            country_id=8,
            country=SimpleNamespace(name="Belgium"),
            category_id=9,
            category=SimpleNamespace(name="Food & Drink"),
        )
        self.draft = {
            "sections": {
                "services": {
                    "items": [{"name": "Bread", "description": "Fresh bread."}],
                },
            },
        }

    def test_context_contains_known_facts_and_field_language_only(self):
        context = build_suggestion_context(
            business=self.business,
            draft=self.draft,
            field="services.0.description",
            current_value="Fresh bread.",
            language="nl-BE",
        )
        self.assertEqual(context["language"], "nl")
        self.assertEqual(context["business_name"], "North Star Bakery")
        self.assertEqual(context["current_service"]["service_name"], "Bread")
        self.assertNotIn("phone", context)
        self.assertNotIn("email", context)

    def test_prompt_explicitly_prohibits_invented_facts(self):
        payload = _build_payload({"field": "hero title", "current_value": "North Star Bakery", "language": "en"}, "test-model")
        system = payload["messages"][0]["content"]
        self.assertIn("Never invent or imply facts", system)
        self.assertIn("Return only valid JSON", system)
        self.assertEqual(payload["model"], "test-model")

    @override_settings()
    @patch.dict(os.environ, {"OPENAI_API_KEY": "test-key", "OPENAI_API_URL": "https://example.test/chat", "AI_SUGGESTIONS_MODEL": "test-model"}, clear=False)
    @patch("listings.services.ai_suggestions.urllib.request.urlopen")
    def test_provider_response_is_parsed_without_saving(self, urlopen):
        class FakeResponse:
            def read(self):
                return json.dumps({"choices": [{"message": {"content": '{"suggestion":"Bakkerij met vers brood."}'}}]}).encode()

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return None

        response = FakeResponse()
        urlopen.return_value = response
        self.assertEqual(generate_field_suggestion({"field": "about text", "current_value": "Bread", "language": "nl"}), "Bakkerij met vers brood.")
        urlopen.assert_called_once()

    @patch("listings.api.dashboard.get_object_or_404")
    @patch("listings.api.dashboard._website_draft", return_value={"sections": {}})
    @patch("listings.api.dashboard.generate_field_suggestion")
    def test_endpoint_returns_suggestion_without_mutating_draft(self, generate, draft, get_business):
        get_business.return_value = self.business
        generate.return_value = "North Star Bakery in Ghent"
        request = APIRequestFactory().post("/api/dashboard/businesses/42/website/ai-suggest/", {
            "field": "hero.title", "current_value": "North Star Bakery", "language": "en",
        }, format="json")
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True, email="owner@example.com"))
        response = DashboardWebsiteAISuggestionView.as_view()(request, business_id=42)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["suggestion"], "North Star Bakery in Ghent")
        self.assertEqual(draft.call_count, 1)
        self.assertEqual(generate.call_count, 1)

    @patch("listings.api.dashboard.get_object_or_404")
    @patch("listings.api.dashboard._website_draft", return_value={"sections": {}})
    @patch("listings.api.dashboard.generate_field_suggestion")
    def test_invalid_field_is_rejected_before_provider_call(self, generate, draft, get_business):
        get_business.return_value = self.business
        request = APIRequestFactory().post("/api/dashboard/businesses/42/website/ai-suggest/", {
            "field": "contact.phone", "current_value": "+32 9 123 45 67", "language": "en",
        }, format="json")
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True, email="owner@example.com"))
        response = DashboardWebsiteAISuggestionView.as_view()(request, business_id=42)
        self.assertEqual(response.status_code, 400)
        generate.assert_not_called()


class GeneratedWebsiteAISuggestionAccessTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.owner = user_model.objects.create_user(username="owner@example.com", email="owner@example.com", password="password")
        self.other = user_model.objects.create_user(username="other@example.com", email="other@example.com", password="password")
        country = Country.objects.create(name="Belgium", code="BE", slug="be")
        city = City.objects.create(country=country, name="Ghent", slug="ghent")
        category = Category.objects.create(name="Food & Drink", slug="food-drink")
        self.business = Business.objects.create(name="Owner Bakery", slug="owner-bakery", country=country, city=city, category=category, description="Bread and pastries.")
        BusinessClaimRequest.objects.create(
            listing=self.business,
            name="Owner",
            email=self.owner.email,
            business_name=self.business.name,
            business_address="Main Street",
            business_post_code="9000",
            status="pending",
        )
        self.client = APIClient()
        self.url = f"/api/listings/dashboard/businesses/{self.business.id}/website/ai-suggest/"

    @patch("listings.api.dashboard.generate_field_suggestion", return_value="Owner Bakery in Ghent")
    def test_authenticated_pending_claimant_is_allowed(self, generate):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(self.url, {"field": "hero.title", "current_value": self.business.name, "language": "en"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["suggestion"], "Owner Bakery in Ghent")
        generate.assert_called_once()

    @patch("listings.api.dashboard.generate_field_suggestion")
    def test_authenticated_non_owner_is_denied(self, generate):
        self.client.force_authenticate(user=self.other)
        response = self.client.post(self.url, {"field": "hero.title", "current_value": self.business.name, "language": "en"}, format="json")
        self.assertIn(response.status_code, {401, 403, 404})
        generate.assert_not_called()

    @patch("listings.api.dashboard.generate_field_suggestion")
    def test_unauthenticated_user_is_denied(self, generate):
        response = self.client.post(self.url, {"field": "hero.title", "current_value": self.business.name, "language": "en"}, format="json")
        self.assertIn(response.status_code, {401, 403})
        generate.assert_not_called()


class GeneratedWebsiteLanguageDataTests(SimpleTestCase):
    def test_language_config_is_capped_and_secondary_content_is_not_primary_copy(self):
        draft = {
            "page_title": "Primary title",
            "language_config": {"primary": "en", "additional": ["fr", "de", "es", "nl"], "max_count": 4},
            "sections": {"hero": {"title": "Primary title", "tagline": "Primary text"}, "services": {"items": [{"name": "Bread", "description": "Fresh bread"}]}, "faq": {"items": [{"question": "Primary question", "answer": "Primary answer"}]}},
            "contact": {"phone": "+32 1", "address": "Main Street"},
            "localized": {"fr": {"sections": {"hero": {"title": "Titre français"}, "faq": {"items": [{"question": "Question française", "answer": "Réponse française"}]}}}},
        }
        normalized = _normalize_website_languages(draft)
        self.assertEqual(normalized["language_config"], {"primary": "en", "additional": ["fr", "de", "es"], "max_count": 4})
        self.assertEqual(normalized["localized"]["en"]["sections"]["hero"]["title"], "Primary title")
        self.assertEqual(normalized["localized"]["fr"]["sections"]["hero"]["title"], "Titre français")
        self.assertNotIn("tagline", normalized["localized"]["fr"].get("sections", {}).get("hero", {}))
        self.assertEqual(normalized["contact"]["phone"], "+32 1")
