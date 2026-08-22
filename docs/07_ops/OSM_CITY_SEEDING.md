# OSM city seeding workflow

The reusable city seeder uses OpenStreetMap/Overpass for discovery and produces
review artifacts. It does not create `Business`, `Category`, `City`, or `Country`
rows. Raw OSM tags are mapped only to existing canonical ListAcrossEU categories;
unmapped concepts are sent to review and never become `Uncategorized`.

Each candidate retains an OSM element identifier, source timestamp, raw source
tags in the review artifact, and website classification. If approved for public
publication, the site must display OpenStreetMap attribution and link to the
OpenStreetMap copyright page, consistent with the ODbL requirements.

Overpass dry run:

```text
python manage.py seed_city_from_osm --city Antwerp --city Anderlecht --country-code BE --output-dir imports/review/osm-city-seed
```

For a local country extract, pass the `.osm.pbf` path and OSM-derived city
boundary GeoJSON files. The PBF is streamed with pyosmium; the command reads
one extract for all requested cities, then reuses the same normalization,
category mapping, deduplication, and review pipeline:

```text
python manage.py seed_city_from_osm --city Antwerp --city Anderlecht --country-code BE --pbf imports/cache/geofabrik/belgium-latest.osm.pbf --boundary-dir imports/cache/osm-boundaries --output-dir imports/review/osm-city-seed
```

For the faster reusable path, install native `osmium-tool` locally and first
create coarse, full-record city extracts from the country PBF:

```text
python manage.py extract_city_osm_pbf --city Antwerp --city Anderlecht --source imports/cache/geofabrik/belgium-latest.osm.pbf --output-dir imports/cache/osm-city-pbf
python manage.py seed_city_from_osm --city Antwerp --city Anderlecht --country-code BE --city-pbf-dir imports/cache/osm-city-pbf --boundary-dir imports/cache/osm-boundaries --output-dir imports/review/osm-city-seed
```

The extraction uses the configured coarse bounding boxes and preserves the
original OSM PBF records. The existing exact boundary check, normalization,
deduplication, and review output remain downstream. City extracts are reused
when the source size/mtime and extraction configuration match; use
`--refresh` to recreate them.

Keep country extracts and boundaries under the ignored `backend/imports/cache/`
tree. A later country run can provide its own PBF, boundary directory, and
city arguments without changing the extraction or import code.

The next process after review is to approve only rows marked `clean`, validate
their category assignments, and pass the approved file to a guarded importer
that writes `source=openstreetmap` and `external_id=osm:<type>/<id>`. The
importer keeps records unpublished by default; add `--publish` only after
manual approval and attribution verification. No import is run by the
discovery command.
