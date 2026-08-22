from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from listings.services.osm_city_seeder import (
    OSM_ATTRIBUTION,
    fetch_osm_pbf_places_by_city,
    run_city_dry_run,
    write_review_artifacts,
)


class Command(BaseCommand):
    help = "Fetch and normalize OSM city candidates into review artifacts; never imports records."

    def add_arguments(self, parser):
        parser.add_argument("--city", action="append", required=True, help="City name; repeat for multiple cities.")
        parser.add_argument("--country-code", required=True, help="ISO-3166-1 alpha-2 country code.")
        parser.add_argument("--output-dir", default="imports/review/osm-city-seed", help="Review artifact directory.")
        parser.add_argument("--endpoint", default=None, help="Optional Overpass endpoint.")
        parser.add_argument("--pbf", type=Path, default=None, help="Local .osm.pbf extract; replaces Overpass for extraction.")
        parser.add_argument("--city-pbf-dir", type=Path, default=None, help="Directory of cached per-city .osm.pbf extracts created by extract_city_osm_pbf.")
        parser.add_argument("--boundary-dir", type=Path, default=Path("imports/cache/osm-boundaries"), help="Directory containing <city-slug>.geojson boundaries.")

    def handle(self, *args, **options):
        endpoint = options["endpoint"]
        pbf_path = options["pbf"]
        city_pbf_dir = options["city_pbf_dir"]
        if pbf_path and city_pbf_dir:
            raise CommandError("Use either --pbf or --city-pbf-dir, not both.")
        if pbf_path and not pbf_path.exists():
            raise CommandError(f"PBF file not found: {pbf_path}")
        output_dir = Path(options["output_dir"])
        combined = []
        reports = []
        pbf_places = {}
        if pbf_path:
            boundary_paths = {
                city.lower().replace(" ", "-"): options["boundary_dir"] / f"{city.lower().replace(' ', '-')}.geojson"
                for city in options["city"]
            }
            missing = [str(path) for path in boundary_paths.values() if not path.exists()]
            if missing:
                raise CommandError(f"Missing PBF boundary file(s): {', '.join(missing)}")
            pbf_places = fetch_osm_pbf_places_by_city(pbf_path, boundary_paths)
        for city in options["city"]:
            try:
                city_slug = city.lower().replace(" ", "-")
                city_pbf_path = city_pbf_dir / f"{city_slug}.osm.pbf" if city_pbf_dir else pbf_path
                if city_pbf_path and not city_pbf_path.exists():
                    raise CommandError(f"City PBF file not found: {city_pbf_path}")
                boundary_path = options["boundary_dir"] / f"{city_slug}.geojson" if city_pbf_path else None
                candidates, report = run_city_dry_run(
                    city,
                    options["country_code"],
                    endpoint=endpoint or "https://overpass-api.de/api/interpreter",
                    pbf_path=city_pbf_path,
                    boundary_path=boundary_path,
                    raw_places=pbf_places.get(city_slug) if pbf_path else None,
                )
            except Exception as exc:
                raise CommandError(f"OSM dry run failed for {city}: {exc}") from exc
            city_dir = output_dir / report["city"]
            write_review_artifacts(city_dir, candidates, report)
            combined.extend(candidates)
            reports.append(report)
            self.stdout.write(self.style.SUCCESS(
                f"{city}: raw={report['raw_candidates']} normalized={report['after_chain_non_business_filter']} "
                f"clean={report['clean_import_candidates']} category_review={report['category_review']}"
            ))

        combined_report = {"source": "OpenStreetMap PBF" if (pbf_path or city_pbf_dir) else "OpenStreetMap Overpass", "attribution": OSM_ATTRIBUTION, "cities": reports}
        write_review_artifacts(output_dir / "combined", combined, combined_report)
        self.stdout.write(f"Review artifacts: {output_dir.resolve()}")
        self.stdout.write(f"Attribution required before publication: {OSM_ATTRIBUTION}")
        self.stdout.write("No database writes were performed. This command is dry-run only.")
