from collections import defaultdict

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from blog.models import (
    BlogCategory,
    BlogCategoryTranslation,
    BlogPost,
    BlogPostTranslation,
)


LANGUAGES = ["nl", "pt", "en", "fr", "de", "es"]


class Command(BaseCommand):
    help = "Seed missing blog translations by cloning EN values."

    def add_arguments(self, parser):
        parser.add_argument(
            "--only-missing",
            action="store_true",
            default=True,
            help="Only create missing translations (default: True).",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            default=False,
            help="Overwrite non-EN translations from EN.",
        )

    def handle(self, *args, **options):
        only_missing = options.get("only_missing", True)
        force = options.get("force", False)
        if force:
            only_missing = False

        category_created = defaultdict(int)
        category_updated = defaultdict(int)
        post_created = defaultdict(int)
        post_updated = defaultdict(int)
        total_created = 0
        total_updated = 0

        with transaction.atomic():
            for category in BlogCategory.objects.prefetch_related("translations"):
                translations = {t.language: t for t in category.translations.all()}
                en = translations.get("en")
                base_name = en.name if en else category.key
                base_description = en.description if en else ""

                for lang in LANGUAGES:
                    existing = translations.get(lang)
                    if existing:
                        if force and lang != "en":
                            existing.name = base_name
                            existing.description = base_description
                            existing.slug = slugify(base_name) if base_name else category.key
                            existing.save()
                            category_updated[lang] += 1
                            total_updated += 1
                        continue

                    if only_missing or not existing:
                        BlogCategoryTranslation.objects.create(
                            category=category,
                            language=lang,
                            name=base_name,
                            description=base_description,
                            slug=slugify(base_name) if base_name else category.key,
                        )
                        category_created[lang] += 1
                        total_created += 1

            for post in BlogPost.objects.prefetch_related("translations"):
                translations = {t.language: t for t in post.translations.all()}
                en = translations.get("en")

                base_title = en.title if en and en.title else post.slug
                base_excerpt = en.excerpt if en and en.excerpt else ""
                base_body = en.body if en and en.body else ""
                base_seo_title = (
                    en.seo_title if en and en.seo_title else base_title
                )
                base_seo_description = (
                    en.seo_description
                    if en and en.seo_description
                    else (base_excerpt or base_body[:155])
                )

                for lang in LANGUAGES:
                    existing = translations.get(lang)
                    if existing:
                        if force and lang != "en":
                            existing.title = base_title
                            existing.excerpt = base_excerpt
                            existing.body = base_body
                            existing.seo_title = base_seo_title
                            existing.seo_description = base_seo_description
                            existing.slug = (
                                slugify(base_title) if base_title else post.slug
                            )
                            existing.save()
                            post_updated[lang] += 1
                            total_updated += 1
                        continue

                    if only_missing or not existing:
                        BlogPostTranslation.objects.create(
                            post=post,
                            language=lang,
                            title=base_title,
                            excerpt=base_excerpt,
                            body=base_body,
                            seo_title=base_seo_title,
                            seo_description=base_seo_description,
                            slug=slugify(base_title) if base_title else post.slug,
                            is_published=True,
                        )
                        post_created[lang] += 1
                        total_created += 1

        self.stdout.write("Summary:")
        for lang in LANGUAGES:
            self.stdout.write(
                f"Categories - {lang}: created {category_created[lang]}, updated {category_updated[lang]}"
            )
        for lang in LANGUAGES:
            self.stdout.write(
                f"Posts - {lang}: created {post_created[lang]}, updated {post_updated[lang]}"
            )
        self.stdout.write(f"Total rows created: {total_created}")
        self.stdout.write(f"Total rows updated: {total_updated}")
