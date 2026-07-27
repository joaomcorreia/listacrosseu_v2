from typing import Iterable, List, Optional

from django.db import transaction
from django.utils.text import slugify

from blog.models import BlogCategory, BlogPost, BlogPostTranslation, LANG_CHOICES
from blog.services.ai_translation import translate_blog_fields


def _all_language_codes() -> List[str]:
    return [code for code, _ in LANG_CHOICES]


def _normalize_text(value: Optional[str]) -> str:
    return (value or "").strip()


def create_blog_post_from_en(
    *,
    title: str,
    excerpt: str,
    body: str,
    seo_title: str,
    seo_description: str,
    categories: Iterable[BlogCategory],
    hero_image_url: Optional[str] = None,
) -> BlogPost:
    en_title = _normalize_text(title)
    en_excerpt = _normalize_text(excerpt)
    en_body = _normalize_text(body)
    en_seo_title = _normalize_text(seo_title) or en_title
    en_seo_description = _normalize_text(seo_description) or en_excerpt or en_body[:155]

    en_slug = slugify(en_title)

    source_payload = {
        "title": en_title,
        "excerpt": en_excerpt,
        "body": en_body,
        "seo_title": en_seo_title,
        "seo_description": en_seo_description,
    }

    with transaction.atomic():
        post = BlogPost.objects.create(
            slug=en_slug,
            hero_image_url=hero_image_url or "",
            status=BlogPost.STATUS_PUBLISHED,
        )

        if categories:
            post.categories.set(categories)

        BlogPostTranslation.objects.create(
            post=post,
            language="en",
            title=en_title,
            excerpt=en_excerpt,
            body=en_body,
            seo_title=en_seo_title,
            seo_description=en_seo_description,
            slug=en_slug,
            is_published=True,
        )

        for language in _all_language_codes():
            if language == "en":
                continue

            translated = translate_blog_fields(source_payload, language)
            translated_title = translated.get("title") or en_title
            translated_excerpt = translated.get("excerpt") or en_excerpt
            translated_body = translated.get("body") or en_body
            translated_seo_title = translated.get("seo_title") or translated_title
            translated_seo_description = (
                translated.get("seo_description")
                or translated_excerpt
                or translated_body[:155]
            )
            translated_slug = slugify(translated_title) or en_slug

            BlogPostTranslation.objects.create(
                post=post,
                language=language,
                title=translated_title,
                excerpt=translated_excerpt,
                body=translated_body,
                seo_title=translated_seo_title,
                seo_description=translated_seo_description,
                slug=translated_slug,
                is_published=True,
            )

    return post
