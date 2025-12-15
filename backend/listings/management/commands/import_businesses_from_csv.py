from django.core.management.base import BaseCommand

from listings.services.csv_importer import import_businesses_from_csv


class Command(BaseCommand):
    help = "Import business listings from a CSV file into the listings app."

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_path",
            type=str,
            help="Path to CSV file (absolute or relative to backend root)",
        )
        parser.add_argument(
            "--source",
            type=str,
            default="csv",
            help="Source label stored on Business.source (e.g. 'google_places', 'csv_import').",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=100,
            help="Number of rows per bulk_create batch.",
        )

    def handle(self, *args, **options):
        csv_path = options["csv_path"]
        source = options["source"]
        batch_size = options["batch_size"]

        self.stdout.write(
            self.style.WARNING(
                f"Starting CSV import from '{csv_path}' with source='{source}', batch_size={batch_size}..."
            )
        )

        stats = import_businesses_from_csv(
            csv_path=csv_path,
            source=source,
            batch_size=batch_size,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Import complete. Rows read: {stats.total_rows}, "
                f"created: {stats.created}, skipped: {stats.skipped}"
            )
        )