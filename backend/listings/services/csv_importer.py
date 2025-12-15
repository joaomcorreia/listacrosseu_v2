from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Set

from django.utils import timezone
from django.utils.text import slugify

from listings.models import Business, Country, City, Category


@dataclass
class ImportStats:
    total_rows: int = 0
    created: int = 0
    skipped: int = 0


def _normalize_bool(value: str) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "y"}


def _parse_int_or_none(value: str):
    value = str(value).strip()
    if not value:
        return None
    try:
        return int(value)
    except ValueError:
        return None


def _parse_float_or_none(value: str):
    value = str(value).strip()
    if not value:
        return None
    try:
        return float(value)
    except ValueError:
        return None


def _make_unique_slug(
    name: str,
    city_name: str | None,
    country_name: str,
    existing_slugs: Set[str],
) -> str:
    base_parts = [name]
    if city_name:
        base_parts.append(city_name)
    base_parts.append(country_name)
    base_slug = slugify("-".join(base_parts))
    if not base_slug:
        base_slug = slugify(name) or "business"

    slug = base_slug
    idx = 2
    while slug in existing_slugs:
        slug = f"{base_slug}-{idx}"
        idx += 1

    existing_slugs.add(slug)
    return slug


def import_businesses_from_csv(
    csv_path: str,
    source: str = "csv",
    batch_size: int = 100,
) -> ImportStats:
    """
    Import businesses from a CSV file into the listings app.

    Expected CSV columns (extra columns are ignored):

    - name (required)
    - country (required)
    - city
    - address
    - category
    - latitude
    - longitude
    - website
    - phone
    - description
    - external_id
    - is_micro
    - employee_count

    The CSV files you provided (cleaned/merged exports) should either already match
    these headers, or we will add a small transform step later. For now we assume
    canonical headers as above.
    """
    path = Path(csv_path)
    if not path.exists():
        raise FileNotFoundError(f"CSV file not found: {path}")

    stats = ImportStats()

    # Preload existing keys for idempotency
    existing_external_ids: Set[str] = set(
        Business.objects.filter(source=source)
        .exclude(external_id="")
        .values_list("external_id", flat=True)
    )
    existing_slugs: Set[str] = set(
        Business.objects.values_list("slug", flat=True)
    )

    batch: list[Business] = []
    now = timezone.now()

    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            stats.total_rows += 1

            name = (row.get("name") or "").strip()
            if not name:
                stats.skipped += 1
                continue

            country_name = (row.get("country") or "").strip()
            if not country_name:
                stats.skipped += 1
                continue

            city_name = (row.get("city") or "").strip() or None
            category_name = (row.get("category") or "").strip() or None

            # Get or create related models (cache is handled by the ORM here;
            # dataset size is reasonable so we keep it simple).
            country, _ = Country.objects.get_or_create(name=country_name)
            city = None
            if city_name:
                city, _ = City.objects.get_or_create(country=country, name=city_name)

            category = None
            if category_name:
                category, _ = Category.objects.get_or_create(name=category_name)

            external_id = (row.get("external_id") or "").strip()
            if external_id and external_id in existing_external_ids:
                stats.skipped += 1
                continue

            # Generate deterministic, unique slug
            slug = _make_unique_slug(name, city_name, country_name, existing_slugs)

            business = Business(
                name=name,
                slug=slug,
                country=country,
                city=city,
                category=category,
                address=(row.get("address") or "").strip(),
                website=(row.get("website") or "").strip(),
                phone=(row.get("phone") or "").strip(),
                description=(row.get("description") or "").strip(),
                latitude=_parse_float_or_none(row.get("latitude", "")),
                longitude=_parse_float_or_none(row.get("longitude", "")),
                is_micro=_normalize_bool(row.get("is_micro", "")),
                employee_count=_parse_int_or_none(row.get("employee_count", "")),
                source=source,
                external_id=external_id,
                imported_from_csv=True,
                csv_imported_at=now,
                csv_source_file=path.name,
            )

            if external_id:
                existing_external_ids.add(external_id)

            batch.append(business)

            if len(batch) >= batch_size:
                Business.objects.bulk_create(batch, ignore_conflicts=True)
                stats.created += len(batch)
                batch.clear()

        # Final flush
        if batch:
            Business.objects.bulk_create(batch, ignore_conflicts=True)
            stats.created += len(batch)

    return stats