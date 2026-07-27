from typing import Dict, List, Optional, Tuple

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from blog.models import BlogPost, BlogPostTranslation, LANG_CHOICES
from blog.services.magicai_translation import get_magicai_config, translate_blog_fields


def _language_codes() -> List[str]:
    return [code for code, _ in LANG_CHOICES]


def _build_source(translation: BlogPostTranslation) -> Dict[str, str]:
    title = translation.title or ""
    excerpt = translation.excerpt or ""
    body = translation.body or ""
    seo_title = translation.seo_title or title
    seo_description = translation.seo_description or excerpt or body[:155]
    return {
        "title": title,
        "excerpt": excerpt,
        "body": body,
        "seo_title": seo_title,
        "seo_description": seo_description,
    }


def _resolve_unique_slug(
    language: str, base_slug: str, exclude_pk: Optional[int] = None
) -> str:
    slug = slugify(base_slug) if base_slug else ""
    if not slug:
        slug = "post"

    candidate = slug
    counter = 1
    while True:
        existing = BlogPostTranslation.objects.filter(
            language=language,
            slug=candidate,
        )
        if exclude_pk:
            existing = existing.exclude(pk=exclude_pk)
        if not existing.exists():
            return candidate
        counter += 1
        candidate = f"{slug}-{counter}"


def _needs_translation(translation: Optional[BlogPostTranslation]) -> bool:
    if not translation:
        return True
    required_fields = [
        translation.title,
        translation.excerpt,
        translation.body,
        translation.seo_title,
        translation.seo_description,
    ]
    return any(not value for value in required_fields)


class Command(BaseCommand):
    help = "Translate BlogPostTranslation records for all supported languages."

    def add_arguments(self, parser):
        parser.add_argument(
            "--provider",
            required=True,
            choices=["magicai"],
            help="Translation provider to use (magicai).",
        )

    def handle(self, *args, **options):
        provider = options.get("provider")
        if provider != "magicai":
            raise CommandError("Only --provider=magicai is supported.")

        try:
            get_magicai_config()
        except RuntimeError as exc:
            raise CommandError(str(exc)) from exc

        languages = [code for code in _language_codes() if code != "en"]
        created = 0
        updated = 0
        skipped = 0

        with transaction.atomic():
            for post in BlogPost.objects.prefetch_related("translations").all():
                en_translation = post.translations.filter(language="en").first()
                if not en_translation:
                    raise CommandError(
                        f"Missing EN translation for post {post.id} ({post.slug})."
                    )

                source = _build_source(en_translation)

                for language in languages:
                    translation = post.translations.filter(language=language).first()
                    if not _needs_translation(translation):
                        skipped += 1
                        continue

                    translated = translate_blog_fields(source, language)
                    title = translated.get("title") or source["title"]
                    excerpt = translated.get("excerpt") or source["excerpt"]
                    body = translated.get("body") or source["body"]
                    seo_title = translated.get("seo_title") or source["seo_title"]
                    seo_description = (
                        translated.get("seo_description") or source["seo_description"]
                    )

                    slug = _resolve_unique_slug(
                        language,
                        title or post.slug,
                        exclude_pk=translation.pk if translation else None,
                    )

                    if translation:
                        translation.title = title
                        translation.excerpt = excerpt
                        translation.body = body
                        translation.seo_title = seo_title
                        translation.seo_description = seo_description
                        translation.slug = slug
                        translation.save()
                        updated += 1
                    else:
                        BlogPostTranslation.objects.create(
                            post=post,
                            language=language,
                            title=title,
                            excerpt=excerpt,
                            body=body,
                            seo_title=seo_title,
                            seo_description=seo_description,
                            slug=slug,
                            is_published=True,
                        )
                        created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Blog translations complete. Created: {created}, Updated: {updated}, Skipped: {skipped}"
            )
        )
