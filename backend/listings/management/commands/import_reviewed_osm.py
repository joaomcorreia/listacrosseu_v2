import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from listings.models import Business, Category, City, Country
from listings.services.osm_city_seeder import OSM_SOURCE


class Command(BaseCommand):
    help = "Import only manually reviewed clean OSM candidates after explicit confirmation."

    def add_arguments(self, parser):
        parser.add_argument("--file", action="append", required=True, help="JSON review artifact; repeat for a multi-city release.")
        parser.add_argument("--country-code", required=True)
        parser.add_argument("--dry-run", action="store_true", help="Report the guarded import plan without writing the database.")
        parser.add_argument("--confirm-import", action="store_true", help="Required before any database write.")
        parser.add_argument(
            "--publish",
            action="store_true",
            help="Explicitly publish approved clean imports; otherwise imported records remain unpublished.",
        )

    def handle(self, *args, **options):
        if not options["dry_run"] and not options["confirm_import"]:
            raise CommandError("Refusing to write records without --confirm-import.")
        paths = [Path(value) for value in options["file"]]
        for path in paths:
            if not path.exists():
                raise CommandError(f"Review file not found: {path}")
        rows = []
        for path in paths:
            payload = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(payload, list):
                raise CommandError(f"Review file must contain a JSON candidate list: {path}")
            rows.extend(payload)

        country = Country.objects.filter(code__iexact=options["country_code"]).first()
        if country is None:
            raise CommandError("Country code is not present in the existing country table.")
        category_cache = {category.slug: category for category in Category.objects.all()}
        existing_ids = set(Business.objects.filter(source=OSM_SOURCE).values_list("external_id", flat=True))
        planned = 0
        existing = 0
        duplicates = 0
        protected = 0
        uncategorized = 0
        missing_city = 0
        reassigned = 0
        skipped = 0
        now = timezone.now()

        def plan_row(row):
            nonlocal duplicates, existing, protected, uncategorized, missing_city, reassigned, skipped
            if row.get("duplicate_status") != "clean":
                duplicates += 1
                if row.get("duplicate_status") in {"existing_duplicate", "ambiguous_duplicate"}:
                    protected += 1
                skipped += 1
                return None
            category_slug = str(row.get("category_slug") or "").strip()
            if not category_slug or category_slug == "uncategorized" or category_slug not in category_cache:
                uncategorized += 1
                skipped += 1
                return None
            category = category_cache[category_slug]
            if options["publish"] and not category.is_public:
                skipped += 1
                return None
            external_id = str(row.get("source_id") or "").strip()
            if not external_id:
                skipped += 1
                return None
            if external_id in existing_ids:
                existing += 1
                skipped += 1
                return None
            city_slug = str(row.get("city_slug") or "").strip()
            # The reviewed Brussels/Ixelles packs are allowed to carry a Brussels
            # source label; the city table is authoritative for the final import.
            if city_slug == "brussels" and str(row.get("reassigned_city_slug") or "") == "ixelles":
                city_slug = "ixelles"
                reassigned += 1
            city = City.objects.filter(country=country, slug=city_slug).first()
            if city is None:
                missing_city += 1
                skipped += 1
                return None
            name = str(row.get("name") or "").strip()
            if not name:
                skipped += 1
                return None
            return row, category, city, external_id, name

        planned_rows = [item for row in rows if (item := plan_row(row))]
        if not options["dry_run"]:
            with transaction.atomic():
                for row, category, city, external_id, name in planned_rows:
                    Business.objects.create(
                        name=name, slug=self.unique_slug(name, city, country), country=country, city=city,
                        category=category, address=str(row.get("address") or "").strip(),
                        address_line1=str(row.get("address") or "").strip(), postal_code=str(row.get("postal_code") or "").strip(),
                        latitude=row.get("latitude"), longitude=row.get("longitude"), phone=str(row.get("phone") or "").strip(),
                        website=str(row.get("website") or "").strip(), source=OSM_SOURCE, external_id=external_id,
                        imported_from_csv=False, csv_imported_at=now, csv_source_file=", ".join(item.name for item in paths), keywords=[],
                        tier="free", is_published=options["publish"],
                    )
                    existing_ids.add(external_id)

        planned = len(planned_rows)
        label = "Dry-run plan" if options["dry_run"] else "Imported approved OSM candidates"
        self.stdout.write(self.style.SUCCESS(f"{label}: {planned}"))
        self.stdout.write(f"Records to insert: {planned}")
        self.stdout.write(f"Existing external IDs: {existing}")
        self.stdout.write(f"Duplicates: {duplicates}")
        self.stdout.write(f"Manual/claimed records protected: {protected}")
        self.stdout.write(f"Uncategorized/unmapped: {uncategorized}")
        self.stdout.write(f"Brussels/Ixelles reassignments: {reassigned}")
        self.stdout.write(f"Other skipped rows: {skipped - duplicates - uncategorized - existing}")
        self.stdout.write("OSM attribution must be visible site-wide before these records are public.")

    @staticmethod
    def unique_slug(name, city, country):
        base = slugify(f"{name}-{city.slug}-{country.slug}") or "business"
        candidate = base
        index = 2
        while Business.objects.filter(slug=candidate).exists():
            candidate = f"{base}-{index}"
            index += 1
        return candidate
