import json

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from listings.models import Business
from listings.services.osm_city_seeder import repair_mojibake


class Command(BaseCommand):
    help = "Audit or repair detectable mojibake in a named OSM import batch."

    fields = ("name", "address", "address_line1", "postal_code", "website", "phone")

    def add_arguments(self, parser):
        parser.add_argument("--prefix", action="append", default=["porto-", "breda-"], help="csv_source_file prefix to scan")
        parser.add_argument("--apply", action="store_true", help="Write deterministic repairs")
        parser.add_argument("--confirm-repair", action="store_true", help="Required with --apply")

    def handle(self, *args, **options):
        if options["apply"] and not options["confirm_repair"]:
            raise CommandError("Refusing to write repairs without --confirm-repair.")
        prefixes = tuple(dict.fromkeys(options["prefix"]))
        queryset = Business.objects.filter(source="openstreetmap")
        rows = [business for business in queryset if business.csv_source_file.startswith(prefixes)]
        changes = []
        field_counts = {field: 0 for field in self.fields}
        ambiguous = []
        for business in rows:
            repaired = {}
            for field in self.fields:
                original = getattr(business, field) or ""
                if "�" in original:
                    ambiguous.append((business.id, field, original))
                corrected = repair_mojibake(original)
                if corrected != original:
                    repaired[field] = (original, corrected)
                    field_counts[field] += 1
            if repaired:
                changes.append((business, repaired))

        self.stdout.write(f"Rows scanned: {len(rows)}")
        self.stdout.write(f"Rows requiring repair: {len(changes)}")
        self.stdout.write(f"Field counts: {field_counts}")
        self.stdout.write(f"Ambiguous replacement-character values: {len(ambiguous)}")
        for business, repaired in changes[:20]:
            before, after = repaired.get("name", ("", ""))
            self.stdout.write(f"{business.id}: {json.dumps(before, ensure_ascii=True)} -> {json.dumps(after, ensure_ascii=True)}")
        if not options["apply"]:
            self.stdout.write("Audit only; no database changes made.")
            return

        collisions = 0
        with transaction.atomic():
            occupied = set(Business.objects.exclude(id__in=[business.id for business, _ in changes]).values_list("slug", flat=True))
            for business, repaired in changes:
                for field, (_, corrected) in repaired.items():
                    setattr(business, field, corrected)
                if "name" in repaired:
                    base = slugify(f"{business.name}-{business.city.slug if business.city else ''}-{business.country.slug if business.country else ''}") or "business"
                    candidate = base
                    index = 2
                    while candidate in occupied:
                        collisions += 1
                        candidate = f"{base}-{index}"
                        index += 1
                    business.slug = candidate
                    occupied.add(candidate)
                business.save(update_fields=[*repaired.keys(), "slug"] if "name" in repaired else list(repaired.keys()))
        self.stdout.write(self.style.SUCCESS(f"Applied {len(changes)} deterministic repairs; slug collisions resolved: {collisions}."))
