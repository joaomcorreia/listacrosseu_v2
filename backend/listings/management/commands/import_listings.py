"""
Import listings from normalized CSV files
"""
import csv
import hashlib
from datetime import datetime
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify
from listings.models import Business, Country, City, Category


class Command(BaseCommand):
    help = 'Import listings from normalized CSV file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            required=True,
            help='Path to normalized CSV file'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=200,
            help='Maximum number of records to import (default: 200)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be imported without making changes'
        )

    def handle(self, *args, **options):
        file_path = Path(options['file'])
        limit = options['limit']
        dry_run = options['dry_run']

        if not file_path.exists():
            raise CommandError(f'File not found: {file_path}')

        self.stdout.write(f'🔄 Importing from: {file_path}')
        self.stdout.write(f'📊 Limit: {limit} records')
        
        if dry_run:
            self.stdout.write('🧪 DRY RUN MODE - No changes will be made')

        stats = {
            'created': 0,
            'updated': 0,
            'skipped': 0,
            'failed': 0,
        }

        try:
            with open(file_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                
                processed = 0
                for row in reader:
                    if processed >= limit:
                        break
                    
                    try:
                        result = self.process_row(row, dry_run)
                        stats[result] += 1
                        processed += 1
                        
                        if processed % 50 == 0:
                            self.stdout.write(f'   Processed {processed} records...')
                            
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'❌ Failed to process row {processed}: {e}')
                        )
                        stats['failed'] += 1
                        processed += 1

        except Exception as e:
            raise CommandError(f'Error reading CSV file: {e}')

        # Print results
        self.stdout.write('\n' + '='*50)
        self.stdout.write('📋 Import Summary')
        self.stdout.write('='*50)
        self.stdout.write(f'✅ Created: {stats["created"]}')
        self.stdout.write(f'🔄 Updated: {stats["updated"]}')
        self.stdout.write(f'⏭️  Skipped: {stats["skipped"]}')
        self.stdout.write(f'❌ Failed: {stats["failed"]}')
        self.stdout.write(f'📊 Total processed: {sum(stats.values())}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('🧪 This was a DRY RUN - no actual changes made'))

    def process_row(self, row, dry_run=False):
        """Process a single CSV row"""
        
        # Skip rows without required fields
        if not row.get('name') or not row.get('name').strip():
            return 'skipped'

        # Clean and validate data
        name = row.get('name', '').strip()
        source = row.get('source', '').strip()
        external_id = row.get('external_id', '').strip()
        
        # Create lookup key for deduplication
        if external_id and source:
            # Use external_id if available
            lookup_key = f"{source}:{external_id}"
            dedupe_key = None
        else:
            # Fall back to name + address + location key
            lookup_key = None
            address_parts = [
                row.get('name', '').strip().lower(),
                row.get('address_line1', '').strip().lower(),
                row.get('postal_code', '').strip().lower(),
                row.get('city', '').strip().lower(),
                row.get('country_code', '').strip().upper()
            ]
            dedupe_key = '|'.join(p for p in address_parts if p)

        if dry_run:
            self.stdout.write(f'   Would process: {name} (source: {source})')
            return 'created'  # Assume would create for dry run stats

        with transaction.atomic():
            # Find or create country
            country_code = row.get('country_code', '').strip().upper()
            country_name = row.get('country', '').strip()
            
            # If no country code, try to use country name
            if not country_code and country_name:
                # Map common country names to codes
                country_mapping = {
                    'AUSTRIA': 'AT', 'BELGIUM': 'BE', 'BULGARIA': 'BG', 'CROATIA': 'HR',
                    'CYPRUS': 'CY', 'CZECH REPUBLIC': 'CZ', 'DENMARK': 'DK', 'ESTONIA': 'EE',
                    'FINLAND': 'FI', 'FRANCE': 'FR', 'GERMANY': 'DE', 'GREECE': 'GR',
                    'HUNGARY': 'HU', 'IRELAND': 'IE', 'ITALY': 'IT', 'LATVIA': 'LV',
                    'LITHUANIA': 'LT', 'LUXEMBOURG': 'LU', 'MALTA': 'MT', 'NETHERLANDS': 'NL',
                    'POLAND': 'PL', 'PORTUGAL': 'PT', 'ROMANIA': 'RO', 'SLOVAKIA': 'SK',
                    'SLOVENIA': 'SI', 'SPAIN': 'ES', 'SWEDEN': 'SE'
                }
                country_code = country_mapping.get(country_name.upper(), country_name[:2].upper())
            
            if not country_code and not country_name:
                return 'skipped'
                
            # Use country name as fallback
            country_identifier = country_code or slugify(country_name)
            country_display_name = country_name or country_code
                
            country, _ = Country.objects.get_or_create(
                slug=slugify(country_identifier),
                defaults={'name': country_display_name}
            )

            # Find or create city (if provided)
            city = None
            city_name = row.get('city', '').strip()
            if city_name:
                city, _ = City.objects.get_or_create(
                    country=country,
                    slug=slugify(city_name),
                    defaults={'name': city_name}
                )

            # Find or create category (if provided)
            category = None
            category_name = row.get('category_primary', '').strip()
            if category_name:
                category, _ = Category.objects.get_or_create(
                    slug=slugify(category_name),
                    defaults={'name': category_name}
                )

            # Try to find existing business
            existing = None
            
            if lookup_key:
                # Look up by external_id
                existing = Business.objects.filter(
                    source=source,
                    external_id=external_id
                ).first()
            elif dedupe_key:
                # Look up by dedupe key - check if a business with same name/address exists
                existing = Business.objects.filter(
                    name__iexact=name,
                    address__icontains=row.get('address_line1', '').strip(),
                    country=country
                ).first()

            # Clean coordinate data
            latitude = None
            longitude = None
            try:
                if row.get('latitude'):
                    latitude = float(row['latitude'])
                if row.get('longitude'):
                    longitude = float(row['longitude'])
            except (ValueError, TypeError):
                pass

            # Prepare business data
            business_data = {
                'name': name,
                'country': country,
                'city': city,
                'category': category,
                'address': row.get('address_line1', '').strip(),
                'website': row.get('website', '').strip(),
                'phone': row.get('phone', '').strip(),
                'description': row.get('description', '').strip(),
                'latitude': latitude,
                'longitude': longitude,
                'source': source,
                'external_id': external_id,
                'imported_from_csv': True,
                'csv_imported_at': datetime.now(),
            }

            if existing:
                # Update existing business
                for field, value in business_data.items():
                    if field not in ['country']:  # Don't override country
                        setattr(existing, field, value)
                
                existing.save()
                return 'updated'
            else:
                # Create new business
                business = Business.objects.create(**business_data)
                return 'created'

    def create_dedupe_hash(self, parts):
        """Create a hash for deduplication"""
        text = '|'.join(str(p).lower().strip() for p in parts if p)
        return hashlib.md5(text.encode()).hexdigest()[:16]