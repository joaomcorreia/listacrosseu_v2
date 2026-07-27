from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from blog.models import BlogPostTranslation


class Command(BaseCommand):
    help = "Backfill missing blog translation slugs and ensure EN is published."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would change without saving.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        updated = 0
        checked = 0

        with transaction.atomic():
            for translation in BlogPostTranslation.objects.select_related("post"):
                checked += 1
                needs_save = False

                if not translation.slug:
                    base = translation.title or translation.post.slug
                    translation.slug = slugify(base) if base else ""
                    needs_save = True

                if translation.language == "en" and not translation.is_published:
                    translation.is_published = True
                    needs_save = True

                if needs_save:
                    updated += 1
                    if not dry_run:
                        translation.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Checked {checked} translations; updated {updated}."
            )
        )
        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run: no changes saved."))
