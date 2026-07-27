from django.core.management.base import BaseCommand
from django.db import transaction

from listings.models import Country, Business


COUNTRY_CODE_MAP = {
    "austria": "AT",
    "belgium": "BE",
    "bulgaria": "BG",
    "croatia": "HR",
    "cyprus": "CY",
    "czech republic": "CZ",
    "czechia": "CZ",
    "denmark": "DK",
    "estonia": "EE",
    "finland": "FI",
    "france": "FR",
    "germany": "DE",
    "greece": "GR",
    "hungary": "HU",
    "ireland": "IE",
    "italy": "IT",
    "latvia": "LV",
    "lithuania": "LT",
    "luxembourg": "LU",
    "malta": "MT",
    "netherlands": "NL",
    "poland": "PL",
    "portugal": "PT",
    "romania": "RO",
    "slovakia": "SK",
    "slovenia": "SI",
    "spain": "ES",
    "sweden": "SE",
}


class Command(BaseCommand):
    help = "Backfill Country.code and premium listing visibility fields."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show changes without saving them.",
        )
        parser.add_argument(
            "--set-country-default",
            dest="country_default",
            help="Explicitly set premium listings to country-only with this ISO code.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        country_default = (options.get("country_default") or "").strip().upper()

        country_updates = 0
        visibility_updates = 0
        visibility_country_updates = 0

        with transaction.atomic():
            for country in Country.objects.all():
                if country.code:
                    continue

                code = None
                slug = (country.slug or "").strip().upper()
                if len(slug) == 2:
                    code = slug
                else:
                    name_key = (country.name or "").strip().lower()
                    code = COUNTRY_CODE_MAP.get(name_key)

                if code:
                    country.code = code
                    country_updates += 1
                    if not dry_run:
                        country.save(update_fields=["code"])

            for business in Business.objects.filter(tier="premium"):
                updated = False

                if country_default:
                    if business.visibility_scope != "country" or business.visibility_country != country_default:
                        business.visibility_scope = "country"
                        business.visibility_country = country_default
                        visibility_country_updates += 1
                        updated = True

                scope = (business.visibility_scope or "").strip()
                if scope not in {"country", "eu"}:
                    business.visibility_scope = "eu"
                    updated = True

                if business.visibility_country and business.visibility_scope != "country":
                    business.visibility_scope = "country"
                    updated = True

                if (
                    business.visibility_scope == "country"
                    and not business.visibility_country
                    and business.country
                    and business.country.code
                ):
                    business.visibility_country = business.country.code.upper()
                    visibility_country_updates += 1
                    updated = True

                if updated:
                    visibility_updates += 1
                    if not dry_run:
                        business.save(
                            update_fields=["visibility_scope", "visibility_country"]
                        )

            if dry_run:
                transaction.set_rollback(True)

        self.stdout.write("Backfill summary:")
        self.stdout.write(f"- Countries updated: {country_updates}")
        self.stdout.write(f"- Premium listings updated: {visibility_updates}")
        self.stdout.write(
            f"- Premium listings with visibility_country set: {visibility_country_updates}"
        )
        if country_default:
            self.stdout.write(f"- Country default applied: {country_default}")
        if dry_run:
            self.stdout.write("Dry run complete (no changes saved).")
