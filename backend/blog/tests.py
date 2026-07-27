from django.test import TestCase
from rest_framework.test import APIClient

from blog.models import BlogPost, BlogPostTranslation


class BlogResolveEndpointsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.post = BlogPost.objects.create(
            slug="en-post",
            status=BlogPost.STATUS_PUBLISHED,
        )
        BlogPostTranslation.objects.create(
            post=self.post,
            language="en",
            title="EN Post",
            slug="en-post",
            excerpt="EN excerpt",
            body="EN body",
            is_published=True,
        )
        BlogPostTranslation.objects.create(
            post=self.post,
            language="pt",
            title="PT Post",
            slug="pt-post",
            excerpt="PT excerpt",
            body="PT body",
            is_published=True,
        )

    def test_resolve_by_slug_returns_id(self):
        response = self.client.get("/api/blog/resolve/?lang=pt&slug=pt-post")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], self.post.id)

    def test_resolve_by_slug_404(self):
        response = self.client.get("/api/blog/resolve/?lang=pt&slug=missing")
        self.assertEqual(response.status_code, 404)

    def test_slug_by_id_returns_translation_slug(self):
        response = self.client.get(f"/api/blog/posts/{self.post.id}/?lang=pt")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["id"], self.post.id)
        self.assertEqual(payload["slug"], "pt-post")
        self.assertEqual(payload["lang"], "pt")

    def test_slug_by_id_404_when_missing_translation(self):
        response = self.client.get(f"/api/blog/posts/{self.post.id}/?lang=de")
        self.assertEqual(response.status_code, 404)
