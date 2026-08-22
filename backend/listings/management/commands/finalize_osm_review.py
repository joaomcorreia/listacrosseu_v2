import csv
import json
import re
from collections import Counter
from dataclasses import asdict
from pathlib import Path
from urllib.parse import urlsplit

from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from listings.models import Business, Category, City, Country
from listings.services.osm_city_seeder import (
    Candidate,
    OBVIOUS_NON_BUSINESS,
    _clean,
    _is_obvious_chain,
    category_for_tags,
    load_city_boundary,
    normalize_domain,
    normalize_phone,
    normalize_text,
    point_in_geometry,
    classify_duplicates,
)


PHONE_RE = re.compile(r"^[+()\d\s./-]{6,40}$")
SOURCE_RE = re.compile(r"^osm:(?:node|way|relation)/\d+$")


class Command(BaseCommand):
    help = "Apply the final local quality gate to an OSM review artifact without importing records."

    def add_arguments(self, parser):
        parser.add_argument("--input", type=Path, required=True, help="Combined OSM candidates.json review artifact.")
        parser.add_argument("--output", type=Path, required=True, help="Approved-only JSON artifact to create.")
        parser.add_argument("--country-code", required=True)
        parser.add_argument("--boundary-dir", type=Path, default=Path("imports/cache/osm-boundaries"))

    def handle(self, *args, **options):
        input_path = options["input"]
        if not input_path.is_file():
            raise CommandError(f"Review file not found: {input_path}")
        rows = json.loads(input_path.read_text(encoding="utf-8"))
        if not isinstance(rows, list):
            raise CommandError("Review file must contain a JSON candidate list.")

        country = Country.objects.filter(code__iexact=options["country_code"]).first()
        if country is None:
            raise CommandError("Country code is not present in the existing country table.")
        boundaries = {
            slugify(city): load_city_boundary(options["boundary_dir"] / f"{slugify(city)}.geojson")
            for city in ("Antwerp", "Anderlecht")
        }
        categories = {item.slug: item for item in Category.objects.all()}
        duplicate_source_ids = [
            source_id for source_id, count in Counter(
                str(row.get("source_id") or "")
                for row in rows
                if row.get("duplicate_status") == "clean" and row.get("category_slug")
            ).items() if count > 1
        ]

        candidates = [Candidate(**row) for row in rows if row.get("duplicate_status") == "clean" and row.get("category_slug")]
        classify_duplicates(candidates, options["country_code"])
        removals = Counter()
        approved = []
        for candidate in candidates:
            reason = self._validate(candidate, categories, country, boundaries, duplicate_source_ids)
            if reason:
                removals[reason] += 1
            else:
                approved.append(candidate)

        output_path = options["output"]
        output_path.parent.mkdir(parents=True, exist_ok=True)
        payload = [asdict(candidate) for candidate in approved]
        output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        csv_path = output_path.with_suffix(".csv")
        fields = list(payload[0].keys()) if payload else ["source_id", "name", "city_slug", "category_slug"]
        with csv_path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields)
            writer.writeheader()
            for row in payload:
                row = dict(row)
                row["raw_tags"] = json.dumps(row.get("raw_tags", {}), ensure_ascii=False, sort_keys=True)
                writer.writerow(row)

        summary = {
            "source_artifact": str(input_path),
            "approved_total": len(approved),
            "approved_by_city": dict(sorted(Counter(item.city_slug for item in approved).items())),
            "website_status": dict(sorted(Counter(item.website_status for item in approved).items())),
            "category_distribution": dict(sorted(Counter(item.category_slug for item in approved).items())),
            "removed_during_final_gate": len(candidates) - len(approved),
            "removal_reasons": dict(sorted(removals.items())),
            "review_candidates_excluded": len(rows) - len(candidates),
        }
        output_path.with_name(f"{output_path.stem}-summary.json").write_text(
            json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        self.stdout.write(self.style.SUCCESS(f"Approved candidates: {len(approved)}"))
        self.stdout.write(f"Removed during final gate: {len(candidates) - len(approved)}")
        self.stdout.write(f"Review/category candidates excluded: {len(rows) - len(candidates)}")
        self.stdout.write(f"Approved artifact: {output_path.resolve()}")

    @staticmethod
    def _validate(candidate, categories, country, boundaries, duplicate_source_ids):
        if not _clean(candidate.name):
            return "empty_name"
        if candidate.city_slug not in boundaries:
            return "city_not_allowed"
        city = City.objects.filter(country=country, slug=candidate.city_slug).first()
        if city is None:
            return "invalid_city_assignment"
        if candidate.latitude is None or candidate.longitude is None:
            return "missing_coordinates"
        try:
            latitude = float(candidate.latitude)
            longitude = float(candidate.longitude)
        except (TypeError, ValueError):
            return "invalid_coordinates"
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            return "invalid_coordinates"
        if not point_in_geometry(latitude, longitude, boundaries[candidate.city_slug]):
            return "outside_city_boundary"
        if not SOURCE_RE.match(candidate.source_id or ""):
            return "invalid_source_id"
        if candidate.source_id in duplicate_source_ids:
            return "duplicate_incoming_source_id"
        if candidate.duplicate_status != "clean":
            return f"duplicate_{candidate.duplicate_status}"
        category = categories.get(candidate.category_slug)
        if category is None:
            return "invalid_category"
        if not category.is_public:
            return "unpublished_category"
        if category.slug == "uncategorized":
            return "uncategorized_category"
        mapped_category, _, _ = category_for_tags(candidate.raw_tags or {})
        if mapped_category and mapped_category != candidate.category_slug:
            return "category_tag_conflict"
        tags = candidate.raw_tags or {}
        amenity = str(tags.get("amenity") or "").lower()
        if amenity in OBVIOUS_NON_BUSINESS or amenity in {"school", "college", "university", "kindergarten"}:
            return "obvious_non_business"
        if _is_obvious_chain(tags):
            return "obvious_chain"
        if candidate.website:
            parsed = urlsplit(candidate.website)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                return "invalid_website"
        if candidate.phone and (not PHONE_RE.match(candidate.phone) or len(normalize_phone(candidate.phone)) < 6):
            return "invalid_phone"

        return ""
