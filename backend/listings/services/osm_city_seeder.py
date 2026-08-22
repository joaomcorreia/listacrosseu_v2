"""Reusable OpenStreetMap city discovery, normalization, and review helpers.

The discovery stage is deliberately separate from importing.  A dry run produces
review data only; no Business, Category, City, or Country rows are written.
"""

from __future__ import annotations

import csv
import json
import math
import os
import re
import time
import unicodedata
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.utils.text import slugify

from listings.models import Business, Category, City, Country


OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter"
OSM_SOURCE = "openstreetmap"
OSM_ATTRIBUTION = "OpenStreetMap contributors (ODbL 1.0)"

CITY_ALIASES = {
    "antwerp": ("Antwerpen", "Antwerp"),
    "anderlecht": ("Anderlecht",),
    "brussels": ("Brussels", "Bruxelles", "Brussel"),
    "ixelles": ("Ixelles", "Elsene"),
}

# Bounding boxes keep the first reusable pass predictable and avoid downloading
# every named object in a whole metropolitan area. They can be replaced by a
# maintained boundary lookup later without changing normalization/deduplication.
CITY_BBOXES = {
    "antwerp": (51.15, 4.25, 51.40, 4.60),
    "anderlecht": (50.80, 4.25, 50.90, 4.40),
    "brussels": (50.78, 4.25, 50.95, 4.50),
    "ixelles": (50.80, 4.34, 50.84, 4.42),
    "ghent": (50.95, 3.55, 51.15, 3.90),
}

# These are intentionally conservative.  A raw OSM value not listed here is
# reported for review instead of becoming a public ListAcrossEU category.
TAG_TO_CATEGORY = {
    ("amenity", "restaurant"): "restaurant",
    ("amenity", "cafe"): "cafe",
    ("amenity", "fast_food"): "fast-food",
    ("amenity", "bar"): "bars-pubs",
    ("amenity", "pub"): "bars-pubs",
    ("amenity", "pharmacy"): "pharmacy",
    ("amenity", "dentist"): "dentist",
    ("amenity", "veterinary"): "veterinary",
    ("shop", "supermarket"): "supermarkets",
    ("shop", "bakery"): "pastry-shops",
    ("shop", "clothes"): "clothing-store",
    ("shop", "shoes"): "shoe-stores",
    ("shop", "books"): "bookstore",
    ("shop", "electronics"): "electronics-stores",
    ("shop", "jewelry"): "jewelry-stores",
    ("shop", "car"): "car-dealers",
    ("shop", "confectionery"): "pastry-shops",
    ("shop", "hairdresser"): "beauty-salon",
    ("shop", "beauty"): "beauty-salon",
    ("craft", "photographer"): "creative-services",
    ("craft", "watchmaker"): "retail",
    ("office", "accountant"): "accounting-firms",
    ("office", "lawyer"): "legal-services",
    ("office", "estate_agent"): "real-estate-agencies",
    ("office", "photographer"): "creative-services",
    ("office", "architect"): "creative-services",
    ("healthcare", "physiotherapist"): "physiotherapy",
    ("healthcare", "dentist"): "dentist",
    ("leisure", "fitness_centre"): "gym",
    ("tourism", "hotel"): "hotel",
    ("tourism", "hostel"): "hostels",
}

OBVIOUS_NON_BUSINESS = {
    "bench", "bus_stop", "fountain", "grave_yard", "parking", "pitch",
    "playground", "post_box", "recycling", "shelter", "stop", "toilets",
    "tree", "waste_basket",
}

OBVIOUS_CHAIN_NAMES = {
    "aldi", "carrefour", "decathlon", "delhaize", "ikea", "lidl", "mcdonalds",
    "quick", "starbucks", "subway", "tesco", "action", "zeeman",
}


@dataclass
class RawOSMPlace:
    source_id: str
    element_type: str
    element_id: int
    tags: dict[str, str]
    latitude: float | None
    longitude: float | None


@dataclass
class Candidate:
    city_slug: str
    source_id: str
    name: str
    category_slug: str
    category_source: str
    address: str
    postal_code: str
    latitude: float | None
    longitude: float | None
    phone: str
    website: str
    social_url: str
    website_status: str
    source_timestamp: str
    duplicate_status: str = "clean"
    duplicate_reason: str = ""
    review_reason: str = ""
    raw_tags: dict[str, str] = field(default_factory=dict)


def normalize_text(value: str | None) -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    normalized = "".join(c for c in normalized if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", normalized.lower()).strip()


def normalize_phone(value: str | None) -> str:
    return re.sub(r"\D", "", value or "")


def normalize_domain(value: str | None) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"^https?://", "", value)
    return value.split("/", 1)[0].removeprefix("www.")


def _clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def _element_coordinates(element: dict[str, Any]) -> tuple[float | None, float | None]:
    if element.get("lat") is not None:
        return element.get("lat"), element.get("lon")
    center = element.get("center") or {}
    return center.get("lat"), center.get("lon")


def _point_in_ring(latitude: float, longitude: float, ring: list[list[float]]) -> bool:
    inside = False
    previous = ring[-1]
    for current in ring:
        current_lon, current_lat = current[0], current[1]
        previous_lon, previous_lat = previous[0], previous[1]
        intersects = ((current_lat > latitude) != (previous_lat > latitude)) and (
            longitude < (previous_lon - current_lon) * (latitude - current_lat) / (previous_lat - current_lat) + current_lon
        )
        if intersects:
            inside = not inside
        previous = current
    return inside


def point_in_geometry(latitude: float | None, longitude: float | None, geometry: dict[str, Any]) -> bool:
    if latitude is None or longitude is None:
        return False
    kind = geometry.get("type")
    coordinates = geometry.get("coordinates") or []
    if kind == "Polygon":
        return bool(coordinates) and _point_in_ring(latitude, longitude, coordinates[0]) and not any(
            _point_in_ring(latitude, longitude, ring) for ring in coordinates[1:]
        )
    if kind == "MultiPolygon":
        return any(point_in_geometry(latitude, longitude, {"type": "Polygon", "coordinates": polygon}) for polygon in coordinates)
    return False


def load_city_boundary(boundary_path: Path) -> dict[str, Any]:
    payload = json.loads(boundary_path.read_text(encoding="utf-8"))
    if payload.get("type") == "FeatureCollection":
        features = payload.get("features") or []
        if not features:
            raise ValueError(f"Boundary file contains no features: {boundary_path}")
        return features[0].get("geometry") or {}
    if payload.get("type") == "Feature":
        return payload.get("geometry") or {}
    return payload


def _tags_from_osmium(item: Any) -> dict[str, str]:
    return {str(tag.k): str(tag.v) for tag in item.tags}


def fetch_osm_pbf_places_by_city(pbf_path: Path, boundary_paths: dict[str, Path]) -> dict[str, list[RawOSMPlace]]:
    """Stream one PBF once and retain POIs inside each supplied city boundary."""
    try:
        import osmium
    except ImportError as exc:  # pragma: no cover - environment-specific guard
        raise RuntimeError("Install the osmium package to read .osm.pbf files") from exc

    geometries = {city_slug: load_city_boundary(path) for city_slug, path in boundary_paths.items()}
    places_by_city = {city_slug: [] for city_slug in boundary_paths}

    class POIHandler(osmium.SimpleHandler):
        def _append(self, item: Any, element_type: str, latitude: float | None, longitude: float | None) -> None:
            tags = _tags_from_osmium(item)
            if not tags.get("name") or not any(tags.get(key) for key in ("amenity", "shop", "craft", "office", "healthcare", "leisure", "tourism")):
                return
            place = RawOSMPlace(
                source_id=f"osm:{element_type}/{item.id}",
                element_type=element_type,
                element_id=int(item.id),
                tags=tags,
                latitude=latitude,
                longitude=longitude,
            )
            for city_slug, geometry in geometries.items():
                if point_in_geometry(latitude, longitude, geometry):
                    places_by_city[city_slug].append(place)

        def node(self, node: Any) -> None:
            location = node.location
            self._append(node, "node", location.lat if location.valid() else None, location.lon if location.valid() else None)

        def way(self, way: Any) -> None:
            points = [node.location for node in way.nodes if node.location.valid()]
            if not points:
                return
            self._append(way, "way", sum(point.lat for point in points) / len(points), sum(point.lon for point in points) / len(points))

    # pyosmium streams the PBF and retains only the node-location index needed
    # to resolve way geometries. The Windows wheel does not compile sparse_mem;
    # flex_mem is its supported, substantially faster location table for local
    # dry runs. A future deployment can select a disk-backed index through the
    # parser call without changing extraction or normalization.
    POIHandler().apply_file(os.fspath(pbf_path), locations=True, idx="flex_mem")
    return places_by_city


def fetch_osm_pbf_places(pbf_path: Path, boundary_path: Path) -> list[RawOSMPlace]:
    """Compatibility wrapper for a single-city PBF extraction."""
    return next(iter(fetch_osm_pbf_places_by_city(pbf_path, {"city": boundary_path}).values()))


def build_overpass_query(city: str) -> str:
    bbox = CITY_BBOXES.get(slugify(city))
    if bbox:
        box = ",".join(str(value) for value in bbox)
        return f"""[out:json][timeout:180];
(
  nwr({box})[\"name\"][\"amenity\"~\"restaurant|cafe|fast_food|bar|pub|pharmacy|dentist|veterinary\"];
  nwr({box})[\"name\"][\"shop\"~\"supermarket|bakery|clothes|shoes|books|electronics|jewelry|car|confectionery|hairdresser|beauty\"];
  nwr({box})[\"name\"][\"craft\"~\"photographer|watchmaker\"];
  nwr({box})[\"name\"][\"office\"~\"accountant|lawyer|estate_agent|photographer|architect\"];
  nwr({box})[\"name\"][\"healthcare\"~\"physiotherapist|dentist\"];
  nwr({box})[\"name\"][\"leisure\"=\"fitness_centre\"];
  nwr({box})[\"name\"][\"tourism\"~\"hotel|hostel\"];
);
out center tags;"""
    aliases = CITY_ALIASES.get(slugify(city), (city,))
    names = ";".join(f'area["name"="{name}"]["boundary"="administrative"]' for name in aliases)
    return f"""[out:json][timeout:300];
({names};)->.city_area;
(
  nwr(area.city_area)["name"]["amenity"];
  nwr(area.city_area)["name"]["shop"];
  nwr(area.city_area)["name"]["craft"];
  nwr(area.city_area)["name"]["office"];
  nwr(area.city_area)["name"]["healthcare"];
  nwr(area.city_area)["name"]["leisure"];
  nwr(area.city_area)["name"]["tourism"];
);
out center tags;"""


def fetch_osm_places(city: str, endpoint: str = OVERPASS_ENDPOINT, pbf_path: Path | None = None, boundary_path: Path | None = None) -> list[RawOSMPlace]:
    if pbf_path:
        if not boundary_path or not boundary_path.exists():
            raise FileNotFoundError(f"A GeoJSON boundary is required for PBF city filtering: {boundary_path}")
        return fetch_osm_pbf_places(pbf_path, boundary_path)
    query = build_overpass_query(city)
    request = Request(
        endpoint,
        data=urlencode({"data": query}).encode("utf-8"),
        headers={"User-Agent": "ListAcrossEU city seeder/1.0 (review-only)"},
        method="POST",
    )
    with urlopen(request, timeout=240) as response:
        payload = json.load(response)

    places = []
    for element in payload.get("elements", []):
        tags = {str(k): str(v) for k, v in (element.get("tags") or {}).items()}
        lat, lon = _element_coordinates(element)
        places.append(RawOSMPlace(
            source_id=f"osm:{element.get('type')}/{element.get('id')}",
            element_type=str(element.get("type", "")),
            element_id=int(element.get("id", 0)),
            tags=tags,
            latitude=lat,
            longitude=lon,
        ))
    return places


def category_for_tags(tags: dict[str, str]) -> tuple[str | None, str, str]:
    for key in ("amenity", "shop", "craft", "office", "healthcare", "leisure", "tourism"):
        value = tags.get(key, "").lower()
        if (key, value) in TAG_TO_CATEGORY:
            return TAG_TO_CATEGORY[(key, value)], f"{key}={value}", ""
    concepts = [f"{key}={tags[key]}" for key in ("amenity", "shop", "craft", "office", "healthcare", "leisure", "tourism") if tags.get(key)]
    return None, ";".join(concepts), "no confident canonical category mapping"


def website_fields(tags: dict[str, str]) -> tuple[str, str, str]:
    website = _clean(tags.get("contact:website") or tags.get("website") or tags.get("url"))
    social = _clean(tags.get("contact:facebook") or tags.get("contact:instagram") or tags.get("contact:twitter"))
    if website:
        return website, social, "WEBSITE_PRESENT"
    if social:
        return "", social, "SOCIAL_ONLY"
    return "", "", "NO_WEBSITE"


def _is_obvious_chain(tags: dict[str, str]) -> bool:
    brand = normalize_text(tags.get("brand"))
    operator = normalize_text(tags.get("operator"))
    name = normalize_text(tags.get("name"))
    return any(value in OBVIOUS_CHAIN_NAMES for value in (brand, operator, name))


def normalize_place(place: RawOSMPlace, city_slug: str, fetched_at: str) -> Candidate | None:
    tags = place.tags
    name = _clean(tags.get("name"))
    if not name or tags.get("amenity", "").lower() in OBVIOUS_NON_BUSINESS:
        return None
    if tags.get("amenity", "").lower() in {"school", "college", "university", "kindergarten"}:
        return None
    if _is_obvious_chain(tags):
        return None

    category_slug, category_source, review_reason = category_for_tags(tags)
    website, social, status = website_fields(tags)
    review_keys = {
        "name", "brand", "operator", "amenity", "shop", "craft", "office", "healthcare",
        "leisure", "tourism", "addr:street", "addr:housenumber", "addr:postcode",
        "contact:website", "website", "url", "contact:facebook", "contact:instagram",
        "contact:twitter", "contact:phone", "phone",
    }
    address_parts = [
        _clean(tags.get("addr:street")),
        _clean(tags.get("addr:housenumber")),
    ]
    address = " ".join(part for part in address_parts if part)
    return Candidate(
        city_slug=city_slug,
        source_id=place.source_id,
        name=name,
        category_slug=category_slug or "",
        category_source=category_source,
        address=address,
        postal_code=_clean(tags.get("addr:postcode")),
        latitude=place.latitude,
        longitude=place.longitude,
        phone=_clean(tags.get("contact:phone") or tags.get("phone")),
        website=website,
        social_url=social,
        website_status=status,
        source_timestamp=fetched_at,
        review_reason=review_reason,
        raw_tags={key: value for key, value in tags.items() if key in review_keys},
    )


def rejection_reason_for_place(place: RawOSMPlace) -> str:
    """Explain extraction-stage exclusions without changing normalization rules."""
    tags = place.tags
    if not _clean(tags.get("name")):
        return "missing_name"
    amenity = tags.get("amenity", "").lower()
    if amenity in OBVIOUS_NON_BUSINESS:
        return "obvious_non_business_amenity"
    if amenity in {"school", "college", "university", "kindergarten"}:
        return "education_facility"
    if _is_obvious_chain(tags):
        return "obvious_chain"
    return ""


def _distance_meters(a_lat: float | None, a_lon: float | None, b_lat: float | None, b_lon: float | None) -> float | None:
    if None in (a_lat, a_lon, b_lat, b_lon):
        return None
    lat_delta = math.radians(float(a_lat) - float(b_lat))
    lon_delta = math.radians(float(a_lon) - float(b_lon))
    mean_lat = math.radians((float(a_lat) + float(b_lat)) / 2)
    return 6_371_000 * math.sqrt(lat_delta * lat_delta + (math.cos(mean_lat) * lon_delta) ** 2)


def classify_duplicates(candidates: list[Candidate], country_code: str) -> None:
    country = Country.objects.filter(code__iexact=country_code).first()
    existing = list(Business.objects.filter(country=country).select_related("city")) if country else []
    seen: dict[str, Candidate] = {}
    for candidate in candidates:
        key = candidate.source_id
        if key in seen:
            candidate.duplicate_status = "incoming_duplicate"
            candidate.duplicate_reason = f"same source identifier as {seen[key].source_id}"
            continue
        seen[key] = candidate

        name_key = normalize_text(candidate.name)
        phone_key = normalize_phone(candidate.phone)
        domain_key = normalize_domain(candidate.website)
        for business in existing:
            same_source = business.source == OSM_SOURCE and business.external_id == candidate.source_id
            same_name_address = name_key == normalize_text(business.name) and (
                normalize_text(candidate.address) and normalize_text(candidate.address) in normalize_text(business.address)
            )
            same_phone = bool(phone_key and phone_key == normalize_phone(business.phone))
            same_domain = bool(domain_key and domain_key == normalize_domain(business.website))
            near = _distance_meters(candidate.latitude, candidate.longitude, business.latitude, business.longitude)
            same_location = near is not None and near <= 60
            if same_source or same_name_address or same_phone or same_domain:
                candidate.duplicate_status = "existing_duplicate"
                candidate.duplicate_reason = "source id, name/address, phone, or website matched existing listing"
                break
            if same_location and name_key == normalize_text(business.name):
                candidate.duplicate_status = "ambiguous_duplicate"
                candidate.duplicate_reason = "same normalized name within 60 metres of existing listing"
                break


def summarize(candidates: Iterable[Candidate], raw_count: int, filtered_count: int, city_slug: str, rejection_reasons: dict[str, int] | None = None) -> dict[str, Any]:
    candidates = list(candidates)
    return {
        "city": city_slug,
        "raw_candidates": raw_count,
        "after_chain_non_business_filter": filtered_count,
        "existing_duplicates": sum(c.duplicate_status == "existing_duplicate" for c in candidates),
        "incoming_duplicates": sum(c.duplicate_status == "incoming_duplicate" for c in candidates),
        "ambiguous_duplicates": sum(c.duplicate_status == "ambiguous_duplicate" for c in candidates),
        "clean_import_candidates": sum(bool(c.category_slug) and c.duplicate_status == "clean" for c in candidates),
        "category_review": sum(not c.category_slug for c in candidates),
        "rejection_reasons": rejection_reasons or {},
        "category_distribution": _counts(c.category_slug or "REVIEW_REQUIRED" for c in candidates if c.duplicate_status == "clean"),
        "website_status": _counts(c.website_status for c in candidates if c.duplicate_status == "clean"),
        "unknown_category_concepts": _counts(c.category_source for c in candidates if not c.category_slug),
    }


def _counts(values: Iterable[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1
    return dict(sorted(counts.items()))


def write_review_artifacts(output_dir: Path, candidates: list[Candidate], report: dict[str, Any]) -> None:
    artifact_started = time.perf_counter()
    output_dir.mkdir(parents=True, exist_ok=True)
    with (output_dir / "candidates.json").open("w", encoding="utf-8") as handle:
        json.dump([asdict(candidate) for candidate in candidates], handle, indent=2, ensure_ascii=False)
    fieldnames = [key for key in asdict(candidates[0]).keys()] if candidates else ["name", "source_id"]
    with (output_dir / "candidates.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for candidate in candidates:
            row = asdict(candidate)
            row["raw_tags"] = json.dumps(row["raw_tags"], ensure_ascii=False, sort_keys=True)
            writer.writerow(row)
    report.setdefault("timing_seconds", {})["artifact_generation"] = round(time.perf_counter() - artifact_started, 3)
    (output_dir / "summary.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")


def run_city_dry_run(city: str, country_code: str, endpoint: str = OVERPASS_ENDPOINT, pbf_path: Path | None = None, boundary_path: Path | None = None, raw_places: list[RawOSMPlace] | None = None) -> tuple[list[Candidate], dict[str, Any]]:
    city_slug = slugify(city)
    fetched_at = datetime.now(timezone.utc).isoformat()
    parsing_started = time.perf_counter()
    raw = raw_places if raw_places is not None else fetch_osm_places(city, endpoint=endpoint, pbf_path=pbf_path, boundary_path=boundary_path)
    parsing_seconds = time.perf_counter() - parsing_started
    normalization_started = time.perf_counter()
    rejection_reasons = _counts(
        reason for place in raw if (reason := rejection_reason_for_place(place))
    )
    normalized = [candidate for place in raw if (candidate := normalize_place(place, city_slug, fetched_at))]
    normalization_seconds = time.perf_counter() - normalization_started
    dedupe_started = time.perf_counter()
    classify_duplicates(normalized, country_code)
    dedupe_seconds = time.perf_counter() - dedupe_started
    report = summarize(normalized, len(raw), len(normalized), city_slug, rejection_reasons)
    report["timing_seconds"] = {
        "candidate_parsing": round(parsing_seconds, 3),
        "normalization": round(normalization_seconds, 3),
        "deduplication": round(dedupe_seconds, 3),
    }
    return normalized, report
