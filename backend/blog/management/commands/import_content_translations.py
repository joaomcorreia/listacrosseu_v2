import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from blog.models import BlogCategory, BlogCategoryTranslation, BlogPost, BlogPostTranslation


class Command(BaseCommand):
    help = "Import blog content translations from a JSON export."

    def add_arguments(self, parser):
        parser.add_argument("path", type=str, help="Path to content_*.json export")

    def handle(self, *args, **options):
        path = Path(options["path"]).resolve()
        if not path.exists():
            raise CommandError(f"File not found: {path}")

        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)

        language = data.get("language")
        if not language:
            raise CommandError("Missing 'language' in JSON file")

        categories = data.get("categories", [])
        posts = data.get("posts", [])

        created_categories = 0
        updated_categories = 0
        created_category_translations = 0
        updated_category_translations = 0

        created_posts = 0
        updated_posts = 0
        created_post_translations = 0
        updated_post_translations = 0

        category_lookup = {}

        for category in categories:
            key = category.get("key")
            if not key:
                self.stdout.write(self.style.WARNING("Skipping category without key"))
                continue

            cat_obj, created = BlogCategory.objects.get_or_create(key=key)
            if created:
                created_categories += 1
            else:
                updated_categories += 1

            category_lookup[key] = cat_obj

            name = category.get("name", "")
            description = category.get("description", "")

            trans_obj, trans_created = BlogCategoryTranslation.objects.get_or_create(
                category=cat_obj,
                language=language,
                defaults={
                    "name": name,
                    "description": description,
                    "slug": slugify(name) if name else "",
                },
            )

            if trans_created:
                created_category_translations += 1
                if name and not trans_obj.slug:
                    trans_obj.slug = slugify(name)
                    trans_obj.save(update_fields=["slug"])
            else:
                changed = False
                if name and trans_obj.name != name:
                    trans_obj.name = name
                    changed = True
                if description is not None and trans_obj.description != description:
                    trans_obj.description = description
                    changed = True
                if name:
                    new_slug = slugify(name)
                    if new_slug and trans_obj.slug != new_slug:
                        trans_obj.slug = new_slug
                        changed = True
                if changed:
                    trans_obj.save()
                    updated_category_translations += 1

        for post in posts:
            slug = post.get("slug")
            if not slug:
                self.stdout.write(self.style.WARNING("Skipping post without slug"))
                continue

            post_obj, created = BlogPost.objects.get_or_create(slug=slug)
            if created:
                created_posts += 1
            else:
                updated_posts += 1

            category_keys = post.get("category_keys", []) or []
            post_categories = [category_lookup[key] for key in category_keys if key in category_lookup]
            if post_categories:
                post_obj.categories.set(post_categories)

            title = post.get("title", "")
            excerpt = post.get("excerpt", "")
            body = post.get("body", "") or excerpt or ""

            trans_obj, trans_created = BlogPostTranslation.objects.get_or_create(
                post=post_obj,
                language=language,
                defaults={
                    "title": title,
                    "excerpt": excerpt,
                    "body": body,
                    "slug": slugify(title) if title else slug,
                },
            )

            if trans_created:
                created_post_translations += 1
                if title and not trans_obj.slug:
                    trans_obj.slug = slugify(title)
                    trans_obj.save(update_fields=["slug"])
            else:
                changed = False
                if title and trans_obj.title != title:
                    trans_obj.title = title
                    changed = True
                if excerpt != trans_obj.excerpt:
                    trans_obj.excerpt = excerpt
                    changed = True
                if body != trans_obj.body:
                    trans_obj.body = body
                    changed = True
                if title:
                    new_slug = slugify(title)
                    if new_slug and trans_obj.slug != new_slug:
                        trans_obj.slug = new_slug
                        changed = True
                if changed:
                    trans_obj.save()
                    updated_post_translations += 1

        self.stdout.write("")
        self.stdout.write("Summary:")
        self.stdout.write(f"Categories created: {created_categories}")
        self.stdout.write(f"Categories updated: {updated_categories}")
        self.stdout.write(f"Category translations created: {created_category_translations}")
        self.stdout.write(f"Category translations updated: {updated_category_translations}")
        self.stdout.write(f"Posts created: {created_posts}")
        self.stdout.write(f"Posts updated: {updated_posts}")
        self.stdout.write(f"Post translations created: {created_post_translations}")
        self.stdout.write(f"Post translations updated: {updated_post_translations}")
