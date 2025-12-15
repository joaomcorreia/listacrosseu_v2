"""
Django management command to merge duplicate Country records.

This command safely merges duplicate countries by:
1. Re-pointing all foreign key references from duplicates to canonical records
2. Removing or archiving the duplicate records
3. Reporting on the merge operations

Usage:
    python manage.py merge_duplicate_countries
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count
from listings.models import Country, City, Business


class Command(BaseCommand):
    help = 'Merge duplicate Country records and re-point all foreign key references'

    # Mapping of duplicate_id -> canonical_id
    # Keep the ISO code versions (more standard) and merge the verbose names into them
    MERGE_MAP = {
        1: 6,   # Portugal: portugal -> pt  
        2: 13,  # France: france -> fr
        3: 15,  # Germany: germany -> de
        4: 7,   # Netherlands: netherlands -> nl
    }

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be merged without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        self.stdout.write('=== DUPLICATE COUNTRIES MERGE OPERATION ===\n')
        
        # First, verify all countries exist
        for old_id, new_id in self.MERGE_MAP.items():
            try:
                old_country = Country.objects.get(id=old_id)
                new_country = Country.objects.get(id=new_id)
                self.stdout.write(f'✓ Verified: {old_country.name} (ID {old_id}) -> {new_country.name} (ID {new_id})')
            except Country.DoesNotExist as e:
                self.stdout.write(self.style.ERROR(f'✗ Country not found: {e}'))
                return

        self.stdout.write('')
        
        # Show before counts
        self._show_before_counts()
        
        if not dry_run:
            # Perform the actual merge
            with transaction.atomic():
                self._perform_merge()
        else:
            self._show_dry_run_analysis()
        
        self.stdout.write('')
        
        if not dry_run:
            # Show after counts
            self._show_after_counts()
            self.stdout.write(self.style.SUCCESS('✓ Merge operation completed successfully'))
        else:
            self.stdout.write(self.style.WARNING('Dry run completed - no changes made'))

    def _show_before_counts(self):
        self.stdout.write('=== BEFORE MERGE COUNTS ===')
        for old_id, new_id in self.MERGE_MAP.items():
            old_country = Country.objects.get(id=old_id)
            new_country = Country.objects.get(id=new_id)
            
            old_business_count = Business.objects.filter(country=old_country).count()
            old_city_count = City.objects.filter(country=old_country).count()
            
            new_business_count = Business.objects.filter(country=new_country).count()
            new_city_count = City.objects.filter(country=new_country).count()
            
            self.stdout.write(f'FROM: {old_country.name} (ID {old_id}, slug: {old_country.slug}) - {old_business_count} businesses, {old_city_count} cities')
            self.stdout.write(f'TO:   {new_country.name} (ID {new_id}, slug: {new_country.slug}) - {new_business_count} businesses, {new_city_count} cities')
            self.stdout.write('')

    def _show_after_counts(self):
        self.stdout.write('=== AFTER MERGE COUNTS ===')
        for old_id, new_id in self.MERGE_MAP.items():
            try:
                old_country = Country.objects.get(id=old_id)
                self.stdout.write(self.style.ERROR(f'ERROR: Old country {old_country.name} (ID {old_id}) still exists!'))
            except Country.DoesNotExist:
                self.stdout.write(f'✓ Old country ID {old_id} has been removed')
            
            new_country = Country.objects.get(id=new_id)
            new_business_count = Business.objects.filter(country=new_country).count()
            new_city_count = City.objects.filter(country=new_country).count()
            
            self.stdout.write(f'MERGED: {new_country.name} (ID {new_id}, slug: {new_country.slug}) - {new_business_count} businesses, {new_city_count} cities')
            self.stdout.write('')

    def _show_dry_run_analysis(self):
        self.stdout.write('=== DRY RUN ANALYSIS ===')
        for old_id, new_id in self.MERGE_MAP.items():
            old_country = Country.objects.get(id=old_id)
            new_country = Country.objects.get(id=new_id)
            
            # Count what would be updated
            businesses_to_update = Business.objects.filter(country=old_country).count()
            cities_to_update = City.objects.filter(country=old_country).count()
            
            self.stdout.write(f'Would merge: {old_country.name} -> {new_country.name}')
            self.stdout.write(f'  - Update {businesses_to_update} businesses')
            self.stdout.write(f'  - Update {cities_to_update} cities')
            
            # Check for city conflicts
            old_cities = City.objects.filter(country=old_country)
            new_cities = City.objects.filter(country=new_country)
            old_slugs = set(old_cities.values_list('slug', flat=True))
            new_slugs = set(new_cities.values_list('slug', flat=True))
            conflicts = old_slugs.intersection(new_slugs)
            
            if conflicts:
                self.stdout.write(f'  - Handle {len(conflicts)} city conflicts:')
                for slug in conflicts:
                    old_city = old_cities.get(slug=slug)
                    new_city = new_cities.get(slug=slug)
                    old_biz = Business.objects.filter(city=old_city).count()
                    new_biz = Business.objects.filter(city=new_city).count()
                    self.stdout.write(f'    * {slug}: merge {old_biz} -> {new_biz} businesses, delete duplicate city')
            
            self.stdout.write(f'  - Delete country: {old_country.name} (ID {old_id})')
            self.stdout.write('')

    def _perform_merge(self):
        self.stdout.write('=== PERFORMING MERGE OPERATIONS ===')
        
        for old_id, new_id in self.MERGE_MAP.items():
            old_country = Country.objects.get(id=old_id)
            new_country = Country.objects.get(id=new_id)
            
            self.stdout.write(f'Merging {old_country.name} (ID {old_id}) -> {new_country.name} (ID {new_id})')
            
            # Handle city conflicts first
            self._handle_city_conflicts(old_country, new_country)
            
            # Update Business records pointing to old country
            business_count = Business.objects.filter(country=old_country).update(country=new_country)
            self.stdout.write(f'  ✓ Updated {business_count} businesses')
            
            # Update remaining City records (those without conflicts)
            city_count = City.objects.filter(country=old_country).update(country=new_country)
            self.stdout.write(f'  ✓ Updated {city_count} cities')
            
            # Verify no references remain
            remaining_businesses = Business.objects.filter(country=old_country).count()
            remaining_cities = City.objects.filter(country=old_country).count()
            
            if remaining_businesses > 0 or remaining_cities > 0:
                raise Exception(f'ERROR: {remaining_businesses} businesses and {remaining_cities} cities still reference old country {old_id}')
            
            # Delete the duplicate country
            old_country.delete()
            self.stdout.write(f'  ✓ Deleted duplicate country: {old_country.name} (ID {old_id})')
            self.stdout.write('')

    def _handle_city_conflicts(self, old_country, new_country):
        """Handle cities with conflicting slugs between countries"""
        old_cities = City.objects.filter(country=old_country)
        new_cities = City.objects.filter(country=new_country)
        
        # Find conflicting slugs
        old_slugs = set(old_cities.values_list('slug', flat=True))
        new_slugs = set(new_cities.values_list('slug', flat=True))
        conflicts = old_slugs.intersection(new_slugs)
        
        if conflicts:
            self.stdout.write(f'    Handling {len(conflicts)} city conflicts...')
            
            for slug in conflicts:
                old_city = old_cities.get(slug=slug)
                new_city = new_cities.get(slug=slug)
                
                # Count businesses in each city
                old_business_count = Business.objects.filter(city=old_city).count()
                new_business_count = Business.objects.filter(city=new_city).count()
                
                self.stdout.write(f'      Merging cities "{old_city.name}": {old_business_count} -> {new_business_count} businesses')
                
                # Move businesses from old city to new city
                if old_business_count > 0:
                    moved_count = Business.objects.filter(city=old_city).update(city=new_city)
                    self.stdout.write(f'        ✓ Moved {moved_count} businesses')
                
                # Delete the old city
                old_city.delete()
                self.stdout.write(f'        ✓ Deleted duplicate city: {old_city.name}')

    def _verify_final_state(self):
        """Verify that no duplicates exist after the merge"""
        self.stdout.write('=== FINAL VERIFICATION ===')
        
        # Check for duplicate country names (should be unique)
        duplicate_names = (
            Country.objects
            .values('name')
            .annotate(count=Count('id'))
            .filter(count__gt=1)
        )
        
        if duplicate_names:
            self.stdout.write(self.style.ERROR('ERROR: Duplicate country names still exist:'))
            for dup in duplicate_names:
                self.stdout.write(f"  - {dup['name']}: {dup['count']} records")
        else:
            self.stdout.write('✓ No duplicate country names found')
        
        # Show final country list
        countries = Country.objects.annotate(
            business_count=Count('businesses'),
            city_count=Count('cities')
        ).order_by('name')
        
        self.stdout.write(f'\nFinal country list ({countries.count()} countries):')
        for country in countries:
            self.stdout.write(f'  - {country.name} (slug: {country.slug}): {country.business_count} businesses, {country.city_count} cities')