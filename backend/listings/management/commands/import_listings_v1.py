"""
Django management command to import listings from normalized CSV files
Usage: python manage.py import_listings_v1 --file <path> [--wipe] [--limit N]
"""
import csv
import hashlib
import os
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.conf import settings
from listings.models import Business, Country, City, Category


class Command(BaseCommand):
    help = 'Import listings from normalized Import v1 CSV format'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            required=True,
            help='Path to the normalized CSV file to import'
        )
        parser.add_argument(
            '--wipe',
            action='store_true',
            help='Delete all existing listings before import (DEV ONLY)'
        )
        parser.add_argument(
            '--limit',
            type=int,
            help='Limit number of rows to process'
        )

    def handle(self, *args, **options):
        file_path = options['file']
        wipe_data = options['wipe']
        limit = options['limit']

        # Safety check for wipe operation
        if wipe_data:
            if not settings.DEBUG:
                raise CommandError("--wipe can only be used in DEBUG mode for safety")
            
            confirm = input("⚠️  WARNING: This will delete ALL existing listings. Type 'DELETE' to confirm: ")
            if confirm != 'DELETE':
                self.stdout.write(self.style.ERROR('Import cancelled'))
                return

        # Check if file exists
        if not os.path.exists(file_path):
            raise CommandError(f'File not found: {file_path}')

        self.stdout.write(f'🔄 Starting Import v1 from: {file_path}')
        
        if wipe_data:
            self.wipe_existing_data()

        # Import the data
        stats = self.import_csv_file(file_path, limit)
        
        # Print summary
        self.print_summary(stats)

    def wipe_existing_data(self):
        """Delete all existing listings (DEV ONLY)"""
        self.stdout.write('🗑️  Wiping existing listings...')
        
        with transaction.atomic():
            count = Business.objects.count()
            Business.objects.all().delete()
            
        self.stdout.write(f'   ✅ Deleted {count} existing listings')

    def import_csv_file(self, file_path, limit=None):
        """Import listings from CSV file"""
        stats = {
            'total_rows': 0,
            'created': 0,
            'updated': 0,
            'skipped': 0,
            'errors': 0,
            'countries': set(),
            'cities': set(),
            'categories': set()
        }

        try:
            with open(file_path, 'r', encoding='utf-8', newline='') as csvfile:
                reader = csv.DictReader(csvfile)
                
                # Verify expected headers
                expected_headers = [
                    'source', 'source_external_id', 'name', 'description', 'category_primary',
                    'tags', 'website', 'email', 'phone', 'address_line1', 'postal_code', 
                    'town', 'city', 'region', 'country_code', 'latitude', 'longitude', 
                    'logo_url', 'status', 'notes'
                ]
                
                missing_headers = set(expected_headers) - set(reader.fieldnames or [])
                if missing_headers:
                    self.stdout.write(
                        self.style.WARNING(f'Missing headers: {", ".join(missing_headers)}')
                    )

                for row_num, row in enumerate(reader, 1):
                    stats['total_rows'] = row_num
                    
                    if limit and row_num > limit:
                        break
                    
                    try:
                        result = self.process_row(row, stats)
                        if result == 'created':
                            stats['created'] += 1
                        elif result == 'updated':
                            stats['updated'] += 1
                        else:
                            stats['skipped'] += 1
                            
                        # Progress indicator
                        if row_num % 1000 == 0:
                            self.stdout.write(f'   📊 Processed {row_num} rows...')
                            
                    except Exception as e:
                        stats['errors'] += 1
                        if stats['errors'] <= 10:  # Only log first 10 errors
                            self.stdout.write(
                                self.style.ERROR(f'Row {row_num} error: {str(e)}')
                            )

        except Exception as e:
            raise CommandError(f'Error reading CSV file: {e}')

        return stats

    def process_row(self, row, stats):
        """Process a single CSV row"""
        # Skip empty names
        name = row.get('name', '').strip()
        if not name:
            return 'skipped'

        # Get or create country
        country = None
        country_code = row.get('country_code', '').strip().upper()
        if country_code and len(country_code) == 2:
            country, _ = Country.objects.get_or_create(
                slug=country_code.lower(),
                defaults={'name': self.get_country_name(country_code)}
            )
            stats['countries'].add(country_code)

        # Get or create city
        city = None
        city_name = row.get('city', '').strip()
        if city_name and country:
            city_slug = self.slugify_text(city_name)
            city, _ = City.objects.get_or_create(
                slug=city_slug,
                country=country,
                defaults={'name': city_name}
            )
            stats['cities'].add(f"{city_name}, {country_code}")

        # Get or create category
        category = None
        category_name = row.get('category_primary', '').strip()
        if category_name:
            category_slug = self.slugify_text(category_name)
            category, _ = Category.objects.get_or_create(
                slug=category_slug,
                defaults={'name': category_name}
            )
            stats['categories'].add(category_name)

        # Determine lookup key for upsert
        source = row.get('source', '').strip()
        source_external_id = row.get('source_external_id', '').strip()
        
        lookup_kwargs = {}
        if source and source_external_id:
            lookup_kwargs = {'source': source, 'external_id': source_external_id}
        else:
            # Use dedupe hash
            dedupe_key = self.create_dedupe_hash(row)
            lookup_kwargs = {'slug__endswith': f'-{dedupe_key[:8]}'}

        # Prepare business data
        business_data = {
            'name': name,
            'slug': self.create_business_slug(name, row),
            'country': country,
            'city': city,
            'category': category,
            'address': row.get('address_line1', '').strip(),
            'website': row.get('website', '').strip(),
            'phone': row.get('phone', '').strip(),
            'description': row.get('description', '').strip(),
            'source': source or 'import_v1',
            'external_id': source_external_id or '',
            'is_micro': False,  # Default value
            'employee_count': None,
        }

        # Handle coordinates
        try:
            lat = row.get('latitude', '').strip()
            lon = row.get('longitude', '').strip()
            if lat and lon:
                business_data['latitude'] = float(lat)
                business_data['longitude'] = float(lon)
        except (ValueError, TypeError):
            pass

        # Try to find existing business for update
        try:
            if source and source_external_id:
                business = Business.objects.get(source=source, external_id=source_external_id)
                # Update existing
                for field, value in business_data.items():
                    setattr(business, field, value)
                business.save()
                return 'updated'
            else:
                # Check for duplicate by name and location
                if city:
                    existing = Business.objects.filter(
                        name__iexact=name,
                        city=city
                    ).first()
                    if existing:
                        return 'skipped'  # Skip duplicates
        except Business.DoesNotExist:
            pass

        # Create new business
        Business.objects.create(**business_data)
        return 'created'

    def create_business_slug(self, name, row):
        """Create a unique slug for the business"""
        base_slug = self.slugify_text(name)
        
        # Add city and country for uniqueness
        city = row.get('city', '').strip()
        country_code = row.get('country_code', '').strip().lower()
        
        if city and country_code:
            city_slug = self.slugify_text(city)
            full_slug = f"{base_slug}-{city_slug}-{country_code}"
        else:
            full_slug = base_slug

        # Ensure uniqueness
        original_slug = full_slug
        counter = 1
        while Business.objects.filter(slug=full_slug).exists():
            full_slug = f"{original_slug}-{counter}"
            counter += 1
            
        return full_slug

    def slugify_text(self, text):
        """Convert text to URL-friendly slug"""
        import re
        # Simple slugification
        text = text.lower().strip()
        text = re.sub(r'[^a-z0-9]+', '-', text)
        text = text.strip('-')
        return text[:50]  # Limit length

    def create_dedupe_hash(self, row):
        """Create deduplication hash from key fields"""
        key_fields = ['name', 'address_line1', 'city', 'country_code']
        key_values = []
        
        for field in key_fields:
            value = row.get(field, '').strip().lower()
            key_values.append(value)
        
        key_string = '|'.join(key_values)
        return hashlib.md5(key_string.encode()).hexdigest()

    def get_country_name(self, country_code):
        """Get full country name from ISO code"""
        country_names = {
            'NL': 'Netherlands',
            'DE': 'Germany', 
            'FR': 'France',
            'ES': 'Spain',
            'PT': 'Portugal',
            'IT': 'Italy',
            'DK': 'Denmark',
            'SE': 'Sweden',
            'NO': 'Norway',
            'BE': 'Belgium',
            'AT': 'Austria',
            'CH': 'Switzerland',
            'GB': 'United Kingdom',
            'IE': 'Ireland',
            'PL': 'Poland',
            'CZ': 'Czech Republic',
            'SK': 'Slovakia',
            'HU': 'Hungary',
            'RO': 'Romania',
            'BG': 'Bulgaria',
            'HR': 'Croatia',
            'SI': 'Slovenia',
            'EE': 'Estonia',
            'LV': 'Latvia',
            'LT': 'Lithuania',
            'FI': 'Finland',
            'GR': 'Greece',
            'MT': 'Malta',
            'CY': 'Cyprus'
        }
        return country_names.get(country_code, country_code)

    def print_summary(self, stats):
        """Print import summary"""
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('✅ IMPORT v1 COMPLETE'))
        self.stdout.write('='*60)
        self.stdout.write(f"📊 Rows processed: {stats['total_rows']:,}")
        self.stdout.write(f"✅ Created: {stats['created']:,}")
        self.stdout.write(f"🔄 Updated: {stats['updated']:,}")
        self.stdout.write(f"⏭️  Skipped: {stats['skipped']:,}")
        if stats['errors'] > 0:
            self.stdout.write(f"❌ Errors: {stats['errors']:,}")
        
        self.stdout.write(f"\n🌍 Countries: {len(stats['countries'])} distinct")
        if stats['countries']:
            countries_list = ', '.join(sorted(stats['countries']))
            self.stdout.write(f"   {countries_list}")
            
        self.stdout.write(f"🏙️  Cities: {len(stats['cities'])} distinct") 
        self.stdout.write(f"🏷️  Categories: {len(stats['categories'])} distinct")
        
        self.stdout.write('='*60)