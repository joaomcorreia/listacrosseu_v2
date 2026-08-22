import json
import shlex
import shutil
import subprocess
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from listings.services.osm_city_seeder import CITY_BBOXES, slugify


class Command(BaseCommand):
    help = "Create cached, coarse city .osm.pbf extracts with native osmium-tool."

    def add_arguments(self, parser):
        parser.add_argument("--city", action="append", required=True, help="City slug/name; repeat for multiple cities.")
        parser.add_argument("--source", type=Path, required=True, help="Country .osm.pbf source file.")
        parser.add_argument("--output-dir", type=Path, default=Path("imports/cache/osm-city-pbf"))
        parser.add_argument("--osmium-bin", default="osmium", help="Native osmium-tool executable or absolute path.")
        parser.add_argument("--docker", action="store_true", help="Run osmium-tool in a temporary Debian Docker container.")
        parser.add_argument("--docker-image", default="debian:bookworm-slim", help="Temporary Linux image used with --docker.")
        parser.add_argument("--refresh", action="store_true", help="Recreate extracts even when the cache is current.")

    def handle(self, *args, **options):
        source = options["source"]
        if not source.is_file():
            raise CommandError(f"Country PBF not found: {source}")

        output_dir = options["output_dir"]
        output_dir.mkdir(parents=True, exist_ok=True)
        source_stat = source.stat()
        pending = []

        for city in options["city"]:
            city_slug = slugify(city)
            bbox = CITY_BBOXES.get(city_slug)
            if not bbox:
                raise CommandError(f"No configured coarse bounding box for city: {city}")

            output = output_dir / f"{city_slug}.osm.pbf"
            metadata_path = output.with_suffix(".json")
            metadata = {
                "city": city_slug,
                "source": str(source.resolve()),
                "source_size": source_stat.st_size,
                "source_mtime_ns": source_stat.st_mtime_ns,
                "bbox_latlon": list(bbox),
                "osmium_version": "",
            }
            if not options["refresh"] and output.is_file() and metadata_path.is_file():
                try:
                    cached = json.loads(metadata_path.read_text(encoding="utf-8"))
                    cache_fields = {key: value for key, value in metadata.items() if key != "osmium_version"}
                    cached_fields = {key: value for key, value in cached.items() if key != "osmium_version"}
                    if cached.get("osmium_version") and cached_fields == cache_fields:
                        self.stdout.write(f"{city}: cache hit ({output})")
                        continue
                except (OSError, ValueError):
                    pass

            pending.append((city, city_slug, bbox, output, metadata_path, metadata))

        if not pending:
            return

        if options["docker"]:
            version = self._run_docker_extract(source, pending, options["docker_image"])
        else:
            osmium_bin = shutil.which(options["osmium_bin"]) or options["osmium_bin"]
            try:
                probe = subprocess.run(
                    [osmium_bin, "--version"],
                    check=True,
                    capture_output=True,
                    text=True,
                )
            except (FileNotFoundError, OSError) as exc:
                raise CommandError(
                    "Native osmium-tool is required. Install it locally or use --docker."
                ) from exc
            except subprocess.CalledProcessError as exc:
                raise CommandError(f"Unable to execute osmium-tool: {exc.stderr.strip()}") from exc
            version = probe.stdout.strip() or probe.stderr.strip()

            for city, city_slug, bbox, output, metadata_path, metadata in pending:
                self._run_native_extract(osmium_bin, city, bbox, source, output)
                metadata["osmium_version"] = version
                metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
                self.stdout.write(self.style.SUCCESS(f"{city}: wrote {output.stat().st_size} bytes"))

        for city, city_slug, bbox, output, metadata_path, metadata in pending:
            metadata["osmium_version"] = version
            metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
            self.stdout.write(self.style.SUCCESS(f"{city}: wrote {output.stat().st_size} bytes"))

    def _run_native_extract(self, osmium_bin, city, bbox, source, output):
        south, west, north, east = bbox
        command = [
            osmium_bin, "extract", "--bbox", f"{west},{south},{east},{north}",
            "--output", str(output), "--overwrite", str(source),
        ]
        self.stdout.write(f"{city}: extracting coarse bbox to {output}")
        try:
            subprocess.run(command, check=True)
        except (FileNotFoundError, OSError) as exc:
            raise CommandError(f"Failed to execute osmium-tool for {city}: {exc}") from exc
        except subprocess.CalledProcessError as exc:
            raise CommandError(f"osmium extract failed for {city} with exit code {exc.returncode}") from exc

    def _run_docker_extract(self, source, pending, image):
        project_root = Path.cwd().resolve()
        source = source.resolve()
        try:
            source.relative_to(project_root)
            for _, _, _, output, _, _ in pending:
                output.resolve().relative_to(project_root)
        except ValueError as exc:
            raise CommandError("Docker mode requires source and output paths under the current backend directory.") from exc

        source_rel = source.relative_to(project_root).as_posix()
        script = [
            "set -eu",
            "apt-get update -qq",
            "DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends osmium-tool",
            "echo __OSMIUM_VERSION__ $(osmium --version 2>&1 | head -n 1)",
        ]
        for city, _, bbox, output, _, _ in pending:
            south, west, north, east = bbox
            output_rel = output.resolve().relative_to(project_root).as_posix()
            city_label = shlex.quote(city)
            script.append(f"city_start=$(date +%s%3N); echo __OSMIUM_CITY_START__ {city_label} $city_start")
            script.append(
                "osmium extract --bbox "
                f"{shlex.quote(f'{west},{south},{east},{north}')} "
                f"--output {shlex.quote(output_rel)} --overwrite {shlex.quote(source_rel)}"
            )
            script.append(f"city_end=$(date +%s%3N); echo __OSMIUM_CITY_TIMING__ {city_label} $city_start $city_end $((city_end-city_start))")
            self.stdout.write(f"{city}: queued Docker osmium extraction")

        command = [
            "docker", "run", "--rm", "--user", "root",
            "-v", f"{project_root}:/work", "-w", "/work", image,
            "sh", "-c", " && ".join(script),
        ]
        try:
            result = subprocess.run(command, check=True, capture_output=True, text=True)
        except (FileNotFoundError, OSError) as exc:
            raise CommandError("Docker is required for --docker mode and could not be executed.") from exc
        except subprocess.CalledProcessError as exc:
            detail = (exc.stderr or exc.stdout).strip()[-1000:]
            raise CommandError(f"Docker osmium extraction failed: {detail}") from exc
        lines = result.stdout.strip().splitlines()
        for line in lines:
            if line.startswith("__OSMIUM_CITY_TIMING__ "):
                self.stdout.write(line)
        version_lines = [line for line in lines if line.startswith("__OSMIUM_VERSION__ ")]
        return version_lines[0].replace("__OSMIUM_VERSION__ ", "", 1) if version_lines else "osmium-tool (Docker)"
