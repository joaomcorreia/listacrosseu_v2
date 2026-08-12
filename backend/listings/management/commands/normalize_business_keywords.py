from django.core.management.base import BaseCommand

from listings.api.serializers import normalize_keywords
from listings.models import Business


class Command(BaseCommand):
    help = "Audit business keyword JSON and optionally normalize legacy values."

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Persist changes. Without this flag the command is audit-only.",
        )

    def handle(self, *args, **options):
        apply_changes = options["apply"]
        changed = []
        type_counts = {}
        for business in Business.objects.only("id", "keywords").iterator():
            normalized = normalize_keywords(business.keywords)
            if normalized != business.keywords:
                type_name = type(business.keywords).__name__
                type_counts[type_name] = type_counts.get(type_name, 0) + 1
                changed.append((business, normalized))

        self.stdout.write(f"Malformed keyword records: {len(changed)}")
        self.stdout.write(f"Value types: {type_counts or '{}'}")
        if not apply_changes:
            self.stdout.write("Audit only; no records changed. Use --apply to persist normalization.")
            return

        for business, normalized in changed:
            business.keywords = normalized
            business.save(update_fields=["keywords"])
        self.stdout.write(self.style.SUCCESS(f"Normalized {len(changed)} business records."))
