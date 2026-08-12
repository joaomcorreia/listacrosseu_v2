from django.core.management.base import BaseCommand
from django.utils.text import slugify

from listings.models import City, Country


class Command(BaseCommand):
    help = "Create the approved Belgian SEO locality records idempotently."

    CITIES = {
        "anderlecht": "Anderlecht",
        "leuven": "Leuven",
        "mechelen": "Mechelen",
        "hasselt": "Hasselt",
        "bruges": "Bruges",
    }

    def handle(self, *args, **options):
        belgium = Country.objects.get(slug="be")
        for slug, name in self.CITIES.items():
            city, created = City.objects.get_or_create(
                country=belgium,
                slug=slugify(slug),
                defaults={"name": name},
            )
            self.stdout.write(f"{'Created' if created else 'Existing'} {city.name}, {belgium.name} ({city.slug})")
