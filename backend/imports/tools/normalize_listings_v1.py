#!/usr/bin/env python3
"""
ListAcrossEU v2 - Normalize Raw CSVs to Import v1 Format
Reads all CSV files from backend/imports/raw/ and normalizes them to Import v1 format.
"""

import os
import csv
import sys
import re
from pathlib import Path
from datetime import datetime
import hashlib

# Add parent directory to Python path to import Django settings
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import country code mapping
COUNTRY_CODES = {
    'netherlands': 'NL', 'holland': 'NL', 'nl': 'NL',
    'germany': 'DE', 'deutschland': 'DE', 'de': 'DE', 'ger': 'DE',
    'france': 'FR', 'fr': 'FR',
    'belgium': 'BE', 'be': 'BE',
    'portugal': 'PT', 'pt': 'PT',
    'spain': 'ES', 'es': 'ES',
    'italy': 'IT', 'it': 'IT',
    'denmark': 'DK', 'dk': 'DK',
    'sweden': 'SE', 'se': 'SE',
    'norway': 'NO', 'no': 'NO',
    'finland': 'FI', 'fi': 'FI',
    'poland': 'PL', 'pl': 'PL',
    'czech republic': 'CZ', 'czechia': 'CZ', 'cz': 'CZ',
    'slovakia': 'SK', 'sk': 'SK',
    'austria': 'AT', 'at': 'AT',
    'switzerland': 'CH', 'ch': 'CH',
    'greece': 'GR', 'gr': 'GR',
    'malta': 'MT', 'mt': 'MT',
    'cyprus': 'CY', 'cy': 'CY',
    'ireland': 'IE', 'ie': 'IE',
    'luxembourg': 'LU', 'lu': 'LU',
    'slovenia': 'SI', 'si': 'SI',
    'croatia': 'HR', 'hr': 'HR',
    'bulgaria': 'BG', 'bg': 'BG',
    'romania': 'RO', 'ro': 'RO',
    'hungary': 'HU', 'hu': 'HU',
    'latvia': 'LV', 'lv': 'LV',
    'lithuania': 'LT', 'lt': 'LT',
    'estonia': 'EE', 'ee': 'EE'
}

# Import v1 template headers
V1_HEADERS = [
    'source', 'source_external_id', 'name', 'description', 'category_primary', 
    'tags', 'website', 'email', 'phone', 'address_line1', 'postal_code', 
    'town', 'city', 'region', 'country_code', 'latitude', 'longitude', 
    'logo_url', 'status', 'notes'
]

# Column mapping synonyms
COLUMN_MAPPINGS = {
    'name': ['name', 'business_name', 'company_name', 'title', 'business', 'company'],
    'description': ['description', 'desc', 'about', 'overview', 'summary'],
    'category_primary': ['category', 'category_primary', 'business_category', 'type', 'sector', 'industry'],
    'website': ['website', 'url', 'web', 'homepage', 'site'],
    'email': ['email', 'e_mail', 'contact_email', 'mail'],
    'phone': ['phone', 'telephone', 'tel', 'contact_phone', 'mobile'],
    'address_line1': ['address', 'address_line1', 'street', 'street_address', 'location'],
    'postal_code': ['postal_code', 'zip', 'zipcode', 'postcode', 'zip_code'],
    'town': ['town', 'locality', 'suburb', 'district'],
    'city': ['city', 'municipality', 'place'],
    'region': ['region', 'state', 'province', 'area'],
    'country_code': ['country', 'country_code', 'nation', 'country_slug'],
    'latitude': ['latitude', 'lat', 'y', 'coord_lat'],
    'longitude': ['longitude', 'lng', 'lon', 'x', 'coord_lng', 'coord_lon'],
    'source_external_id': ['id', 'external_id', 'source_id', 'business_id', 'uuid'],
    'tags': ['tags', 'keywords', 'labels'],
    'logo_url': ['logo', 'logo_url', 'image', 'image_url'],
    'status': ['status', 'active', 'enabled', 'published'],
    'notes': ['notes', 'comments', 'remarks', 'additional_info']
}

def normalize_country_code(country_str):
    """Normalize country string to ISO2 code"""
    if not country_str:
        return ''
    
    country_str = str(country_str).strip().lower()
    
    # Direct lookup
    if country_str in COUNTRY_CODES:
        return COUNTRY_CODES[country_str]
    
    # Partial match
    for key, code in COUNTRY_CODES.items():
        if key in country_str or country_str in key:
            return code
    
    # Return as-is if already looks like a code
    if len(country_str) == 2 and country_str.isalpha():
        return country_str.upper()
    
    return ''

def normalize_text(text):
    """Normalize text by trimming and collapsing spaces"""
    if not text:
        return ''
    return re.sub(r'\s+', ' ', str(text).strip())

def find_column_mapping(headers, target_field):
    """Find the best matching column for a target field"""
    headers_lower = [h.lower().replace(' ', '_') for h in headers]
    
    for synonym in COLUMN_MAPPINGS.get(target_field, []):
        if synonym.lower() in headers_lower:
            return headers[headers_lower.index(synonym.lower())]
    
    return None

def normalize_csv_file(input_path, output_path, source_name):
    """Normalize a single CSV file to Import v1 format"""
    
    stats = {
        'input_rows': 0,
        'output_rows': 0,
        'missing_required': {'name': 0, 'country_code': 0},
        'mappings_found': {},
        'errors': []
    }
    
    try:
        with open(input_path, 'r', encoding='utf-8', errors='ignore') as infile:
            # Detect delimiter
            sample = infile.read(1024)
            infile.seek(0)
            
            delimiter = ','
            if '\t' in sample and sample.count('\t') > sample.count(','):
                delimiter = '\t'
            elif ';' in sample and sample.count(';') > sample.count(','):
                delimiter = ';'
            
            reader = csv.DictReader(infile, delimiter=delimiter)
            headers = reader.fieldnames or []
            
            # Find column mappings
            mappings = {}
            for v1_field in V1_HEADERS:
                mapped_col = find_column_mapping(headers, v1_field)
                if mapped_col:
                    mappings[v1_field] = mapped_col
                    stats['mappings_found'][v1_field] = mapped_col
            
            # Write normalized output
            with open(output_path, 'w', newline='', encoding='utf-8') as outfile:
                writer = csv.DictWriter(outfile, fieldnames=V1_HEADERS)
                writer.writeheader()
                
                for row_num, row in enumerate(reader, 1):
                    stats['input_rows'] += 1
                    
                    # Create normalized row
                    normalized_row = {}
                    
                    for v1_field in V1_HEADERS:
                        if v1_field == 'source':
                            normalized_row[v1_field] = source_name
                        elif v1_field == 'status':
                            normalized_row[v1_field] = 'active'
                        elif v1_field in mappings:
                            raw_value = row.get(mappings[v1_field], '')
                            
                            if v1_field == 'country_code':
                                normalized_row[v1_field] = normalize_country_code(raw_value)
                            elif v1_field in ['city', 'town', 'name', 'address_line1']:
                                normalized_row[v1_field] = normalize_text(raw_value)
                            else:
                                normalized_row[v1_field] = str(raw_value).strip() if raw_value else ''
                        else:
                            normalized_row[v1_field] = ''
                    
                    # Check required fields
                    if not normalized_row.get('name'):
                        stats['missing_required']['name'] += 1
                        continue  # Skip rows without name
                    
                    if not normalized_row.get('country_code'):
                        stats['missing_required']['country_code'] += 1
                    
                    writer.writerow(normalized_row)
                    stats['output_rows'] += 1
                    
    except Exception as e:
        stats['errors'].append(f"Error processing file: {str(e)}")
    
    return stats

def generate_report(stats, input_file, output_file):
    """Generate a normalization report"""
    
    report = f"""# Normalization Report: {input_file}

## Summary
- **Input file**: `{input_file}`
- **Output file**: `{output_file}`
- **Input rows**: {stats['input_rows']:,}
- **Output rows**: {stats['output_rows']:,}
- **Skipped rows**: {stats['input_rows'] - stats['output_rows']:,}

## Column Mappings Found
"""
    
    if stats['mappings_found']:
        for v1_field, mapped_col in stats['mappings_found'].items():
            report += f"- `{v1_field}` ← `{mapped_col}`\n"
    else:
        report += "*No automatic mappings found*\n"
    
    report += f"""
## Missing Required Fields
- **Missing name**: {stats['missing_required']['name']:,} rows (skipped)
- **Missing country_code**: {stats['missing_required']['country_code']:,} rows (kept with empty country)

## Errors
"""
    
    if stats['errors']:
        for error in stats['errors']:
            report += f"- {error}\n"
    else:
        report += "*No errors*\n"
    
    report += f"""
---
*Generated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
"""
    
    return report

def merge_normalized_files(normalized_dir, output_path):
    """Merge all normalized files into a single deduplicated file"""
    
    all_rows = []
    seen_hashes = set()
    stats = {'total_files': 0, 'total_rows': 0, 'unique_rows': 0, 'duplicates_removed': 0}
    
    # Read all normalized files
    for file_path in Path(normalized_dir).glob('*__v1.csv'):
        stats['total_files'] += 1
        
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                stats['total_rows'] += 1
                
                # Create dedupe hash from key fields
                key_fields = [
                    normalize_text(row.get('name', '')),
                    normalize_text(row.get('address_line1', '')),
                    normalize_text(row.get('postal_code', '')),
                    normalize_text(row.get('town', '')),
                    normalize_text(row.get('city', '')),
                    row.get('country_code', '').upper()
                ]
                
                dedupe_hash = hashlib.md5('|'.join(key_fields).encode()).hexdigest()
                
                if dedupe_hash not in seen_hashes:
                    seen_hashes.add(dedupe_hash)
                    all_rows.append(row)
                    stats['unique_rows'] += 1
                else:
                    stats['duplicates_removed'] += 1
    
    # Write merged file
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        if all_rows:
            writer = csv.DictWriter(f, fieldnames=V1_HEADERS)
            writer.writeheader()
            writer.writerows(all_rows)
    
    return stats

def main():
    """Main normalization process"""
    
    # Setup paths - navigate up from tools directory to backend
    tools_dir = Path(__file__).parent
    imports_dir = tools_dir.parent
    backend_dir = imports_dir.parent
    raw_dir = imports_dir / 'raw'
    normalized_dir = imports_dir / 'normalized'
    reports_dir = imports_dir / 'reports'
    
    # Create directories
    normalized_dir.mkdir(exist_ok=True)
    reports_dir.mkdir(exist_ok=True)
    
    print("🔄 Starting Import v1 Normalization...")
    print(f"📁 Raw CSV directory: {raw_dir}")
    print(f"📁 Normalized output: {normalized_dir}")
    print(f"📁 Reports output: {reports_dir}")
    
    if not raw_dir.exists():
        print(f"❌ Raw directory not found: {raw_dir}")
        return
    
    csv_files = list(raw_dir.glob('*.csv'))
    if not csv_files:
        print(f"❌ No CSV files found in {raw_dir}")
        return
    
    print(f"📊 Found {len(csv_files)} CSV files to normalize")
    
    total_stats = {'files_processed': 0, 'total_input_rows': 0, 'total_output_rows': 0}
    
    # Process each CSV file
    for csv_file in csv_files:
        source_name = csv_file.stem
        output_file = normalized_dir / f"{source_name}__v1.csv"
        report_file = reports_dir / f"{source_name}__v1_report.md"
        
        print(f"\n🔄 Processing: {csv_file.name}")
        
        stats = normalize_csv_file(csv_file, output_file, source_name)
        
        # Generate report
        report = generate_report(stats, csv_file.name, output_file.name)
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        # Update totals
        total_stats['files_processed'] += 1
        total_stats['total_input_rows'] += stats['input_rows']
        total_stats['total_output_rows'] += stats['output_rows']
        
        print(f"   ✅ {stats['output_rows']:,} rows normalized ({stats['input_rows'] - stats['output_rows']:,} skipped)")
        
        if stats['errors']:
            print(f"   ⚠️  {len(stats['errors'])} errors - see report")
    
    # Merge all normalized files
    print(f"\n🔄 Merging normalized files...")
    merged_file = normalized_dir / "all_listings__v1.csv"
    merge_stats = merge_normalized_files(normalized_dir, merged_file)
    
    print(f"\n✅ Normalization Complete!")
    print(f"📊 Summary:")
    print(f"   • Files processed: {total_stats['files_processed']}")
    print(f"   • Total input rows: {total_stats['total_input_rows']:,}")
    print(f"   • Total output rows: {total_stats['total_output_rows']:,}")
    print(f"   • Merged unique rows: {merge_stats['unique_rows']:,}")
    print(f"   • Duplicates removed: {merge_stats['duplicates_removed']:,}")
    print(f"\n📁 Output files:")
    print(f"   • Individual files: {normalized_dir}/*__v1.csv")
    print(f"   • Merged file: {merged_file}")
    print(f"   • Reports: {reports_dir}/*__v1_report.md")

if __name__ == "__main__":
    main()