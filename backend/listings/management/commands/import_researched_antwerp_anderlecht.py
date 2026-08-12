import re
import unicodedata

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from listings.models import Business, Category, City, Country


SOURCE = "researched_manual_2026"

BUSINESSES = [
    ("Mercado Portugal", "Sint-Jansplein 4, 2060 Antwerpen", "Antwerp", "supermarkets", "Portuguese grocery store offering food and specialty products from Portugal."),
    ("Cantinho da Rosinha", "Sint-Jansplein 56, 2060 Antwerpen", "Antwerp", "restaurant", "Portuguese restaurant serving traditional Portuguese dishes."),
    ("Café Kate Kero", "Houwerstraat 26, 2060 Antwerpen", "Antwerp", "cafe", "Local café and bar in Antwerp."),
    ("Café Brazuca", "Van de Wervestraat 99, 2060 Antwerpen", "Antwerp", "cafe", "Café and bar in Antwerp."),
    ("Brazuca Minimarket", "Cassiersstraat 26, 2060 Antwerpen", "Antwerp", "supermarkets", "Local minimarket offering groceries, drinks and snacks."),
    ("A Grelha", "Sint-Jansplein 57, 2060 Antwerpen", "Antwerp", "restaurant", "Portuguese restaurant in Antwerp."),
    ("Estrela do Mar", "Ellermanstraat 96, 2060 Antwerpen", "Antwerp", "restaurant", "Portuguese restaurant in Antwerp."),
    ("A Nossa Taskinha Minhota", "Vondelstraat 9, 2060 Antwerpen", "Antwerp", "restaurant", "Portuguese restaurant in Antwerp."),
    ("Café Cantinho do Alentejano", "Houwerstraat 24, Antwerp", "Antwerp", "cafe", "Local café and bar in Antwerp."),
    ("Expresso Luso", "Italiëlei 125, 2000 Antwerpen", "Antwerp", "cafe", "Local café and bar in Antwerp."),
    ("Cabo Verde Restaurant", "Napelsstraat 116, 2000 Antwerpen", "Antwerp", "restaurant", "Restaurant in Antwerp."),
    ("De Garaasj", "Portugesestraat 80, 2660 Hoboken", "Hoboken", "auto-repair", "Automotive workshop in Hoboken providing vehicle maintenance and repairs."),
    ("Auto Reparadora", "Herentalsebaan 157, 2150 Borsbeek", "Borsbeek", "auto-repair", "Automotive workshop in Borsbeek providing vehicle maintenance and repairs."),
    ("Restaurant Luso", "Rue Henri Deleers 4, 1070 Anderlecht", "Anderlecht", "restaurant", "Portuguese restaurant and café in Anderlecht."),
    ("Prim Land", "Chaussée de Mons 576, 1070 Anderlecht", "Anderlecht", "supermarkets", "Portuguese supermarket offering Portuguese and other Iberian/Brazilian food products."),
    ("Au Chateau d'Or", "Place De Linde 31, 1070 Anderlecht", "Anderlecht", "restaurant", "Portuguese café-restaurant in Anderlecht."),
    ("Café Asturiano", "Rue du Village 53, 1070 Anderlecht", "Anderlecht", "cafe", "Spanish café and restaurant in Anderlecht."),
    ("Boulangerie de quartier", "Chaussée de Mons 483, 1070 Anderlecht", "Anderlecht", "pastry-shops", "Portuguese and Brazilian bakery and pastry shop in Anderlecht."),
]


def comparable(value):
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(char for char in value if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", "", value.lower())


class Command(BaseCommand):
    help = "Import the verified Antwerp/Anderlecht researched free-listing batch idempotently."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Report actions without writing records.")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        country = Country.objects.get(slug="be")
        categories = {category.slug: category for category in Category.objects.all()}
        city_cache = {}
        created = []
        duplicates = []
        issues = []
        new_cities = []

        with transaction.atomic():
            for name, address, city_name, category_slug, description in BUSINESSES:
                city_slug = slugify(city_name)
                city = city_cache.get(city_slug)
                if city is None:
                    city = City.objects.filter(country=country, slug=city_slug).first()
                    if city is None:
                        city = City.objects.filter(country=country, name__iexact=city_name).first()
                    if city is None:
                        if dry_run:
                            city = City(country=country, name=city_name, slug=city_slug)
                            new_cities.append(city_name)
                        else:
                            city = City.objects.create(country=country, name=city_name, slug=city_slug)
                            new_cities.append(city_name)
                    city_cache[city_slug] = city

                category = categories.get(category_slug)
                if category is None:
                    issues.append(f"{name}: missing existing category {category_slug}")
                    continue

                external_id = f"researched-antwerp-anderlecht:{slugify(name)}"
                existing = Business.objects.filter(external_id=external_id).first()
                if existing is None and city.pk:
                    existing = Business.objects.filter(city=city).filter(
                        name__in=[name, "Resto Café Luso", "Resto/Café Luso"] if comparable(name) == "restaurantluso" else [name]
                    ).first()
                if existing is None and city.pk:
                    existing = Business.objects.filter(city=city, address__iexact=address).first()
                if existing is not None:
                    duplicates.append(f"{name} -> {existing.name} (id={existing.id}, tier={existing.tier})")
                    continue

                if dry_run:
                    created.append(name)
                    continue

                Business.objects.create(
                    name=name,
                    tier="free",
                    country=country,
                    city=city,
                    address=address,
                    address_line1=address,
                    category=category,
                    description=description,
                    keywords=[],
                    source=SOURCE,
                    external_id=external_id,
                    imported_from_csv=False,
                )
                created.append(name)

            if dry_run:
                transaction.set_rollback(True)

        self.stdout.write(f"Mode: {'dry-run' if dry_run else 'import'}")
        self.stdout.write(f"Created/planned: {len(created)}")
        for name in created:
            self.stdout.write(f"  CREATE {name}")
        self.stdout.write(f"Duplicates skipped: {len(duplicates)}")
        for item in duplicates:
            self.stdout.write(f"  SKIP {item}")
        self.stdout.write(f"New/planned cities: {sorted(set(new_cities))}")
        self.stdout.write(f"Category issues: {len(issues)}")
        for issue in issues:
            self.stdout.write(f"  ISSUE {issue}")
