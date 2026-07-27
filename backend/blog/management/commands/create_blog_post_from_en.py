from django.core.management.base import BaseCommand, CommandError

from blog.models import BlogCategory
from blog.services.blog_post_creator import create_blog_post_from_en


class Command(BaseCommand):
    help = "Create a blog post from EN content and auto-generate translations."

    def add_arguments(self, parser):
        parser.add_argument("--title", required=True)
        parser.add_argument("--excerpt", required=True)
        parser.add_argument("--body", required=True)
        parser.add_argument("--seo-title", required=True)
        parser.add_argument("--seo-description", required=True)
        parser.add_argument("--categories", default="")
        parser.add_argument("--hero-image-url", default="")

    def handle(self, *args, **options):
        title = options["title"]
        excerpt = options["excerpt"]
        body = options["body"]
        seo_title = options["seo_title"]
        seo_description = options["seo_description"]
        categories_arg = options["categories"]
        hero_image_url = options["hero_image_url"]

        categories = []
        if categories_arg:
            keys = [key.strip() for key in categories_arg.split(",") if key.strip()]
            categories = list(BlogCategory.objects.filter(key__in=keys))
            missing = sorted(set(keys) - {cat.key for cat in categories})
            if missing:
                raise CommandError(f"Unknown categories: {', '.join(missing)}")

        post = create_blog_post_from_en(
            title=title,
            excerpt=excerpt,
            body=body,
            seo_title=seo_title,
            seo_description=seo_description,
            categories=categories,
            hero_image_url=hero_image_url or None,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Created post {post.id} with slug '{post.slug}' and translations."
            )
        )
