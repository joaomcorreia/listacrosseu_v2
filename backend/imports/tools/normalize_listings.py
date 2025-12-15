#!/usr/bin/env python3
"""
ListAcrossEU v2 CSV Normalizer
Normalizes raw CSV files into canonical import format
"""

import os
import json
import pandas as pd
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Set

class ListingsNormalizer:
    def __init__(self, base_dir: str = None):
        if base_dir is None:
            base_dir = Path(__file__).parent.parent
        else:
            base_dir = Path(base_dir)
        
        self.base_dir = base_dir
        self.raw_dir = base_dir / "raw"
        self.tools_dir = base_dir / "tools"
        self.normalized_dir = base_dir / "normalized"
        self.reports_dir = base_dir / "reports"
        
        # Load canonical headers
        with open(self.tools_dir / "canonical_headers.json", 'r') as f:
            self.canonical_headers = json.load(f)
        
        # Column mapping synonyms - common variations to canonical names
        self.column_synonyms = {
            # ID fields
            'id': 'external_id',
            'business_id': 'external_id',
            'listing_id': 'external_id',
            'company_id': 'external_id',
            'uuid': 'external_id',
            
            # Names
            'business_name': 'name',
            'company_name': 'name',
            'organization_name': 'name',
            'listing_name': 'name',
            'title': 'name',
            'company': 'name',
            'business': 'name',
            
            'legal_business_name': 'legal_name',
            'company_legal_name': 'legal_name',
            'registered_name': 'legal_name',
            
            # Description fields
            'summary': 'description',
            'about': 'description',
            'overview': 'description',
            'business_description': 'description',
            'company_description': 'description',
            
            # Categories
            'category': 'category_primary',
            'primary_category': 'category_primary',
            'main_category': 'category_primary',
            'business_category': 'category_primary',
            'industry': 'category_primary',
            'sector': 'category_primary',
            
            'subcategory': 'category_secondary',
            'secondary_category': 'category_secondary',
            'sub_category': 'category_secondary',
            
            'keywords': 'tags',
            'tag': 'tags',
            
            # Contact
            'url': 'website',
            'website_url': 'website',
            'web': 'website',
            'homepage': 'website',
            'site': 'website',
            
            'email_address': 'email',
            'contact_email': 'email',
            'e_mail': 'email',
            
            'phone_number': 'phone',
            'telephone': 'phone',
            'contact_phone': 'phone',
            'tel': 'phone',
            'mobile': 'phone',
            
            # Address fields
            'address': 'address_line1',
            'street_address': 'address_line1',
            'address1': 'address_line1',
            'street': 'address_line1',
            'address_1': 'address_line1',
            
            'address2': 'address_line2',
            'address_2': 'address_line2',
            'suite': 'address_line2',
            'unit': 'address_line2',
            'apartment': 'address_line2',
            
            'zip': 'postal_code',
            'zipcode': 'postal_code',
            'zip_code': 'postal_code',
            'postcode': 'postal_code',
            'post_code': 'postal_code',
            
            'town': 'city',
            'municipality': 'city',
            'locality': 'city',
            
            'state': 'region',
            'province': 'region',
            'district': 'region',
            
            'country': 'country',
            'nation': 'country',
            
            'lat': 'latitude',
            'lng': 'longitude',
            'lon': 'longitude',
            'long': 'longitude',
            
            # Social media
            'facebook_url': 'facebook',
            'fb_url': 'facebook',
            'facebook_page': 'facebook',
            
            'instagram_url': 'instagram',
            'ig_url': 'instagram',
            'insta': 'instagram',
            
            'linkedin_url': 'linkedin',
            'linkedin_page': 'linkedin',
            
            # Images
            'logo': 'logo_url',
            'image': 'image_url',
            'photo': 'image_url',
            'picture': 'image_url',
            
            # Other
            'hours': 'opening_hours',
            'business_hours': 'opening_hours',
            'operating_hours': 'opening_hours',
            
            'active': 'status',
            'is_active': 'status',
            'enabled': 'status',
            
            'is_verified': 'verified',
            'verified_business': 'verified',
            
            'comments': 'notes',
            'remarks': 'notes',
            'additional_info': 'notes',
            
            'created': 'created_at',
            'date_created': 'created_at',
            'creation_date': 'created_at',
            
            'modified': 'updated_at',
            'updated': 'updated_at',
            'last_modified': 'updated_at',
            'date_modified': 'updated_at',
        }
    
    def normalize_column_name(self, col_name: str) -> str:
        """Normalize a column name to lowercase with underscores"""
        if pd.isna(col_name) or not isinstance(col_name, str):
            return ""
        
        # Convert to lowercase and strip
        normalized = str(col_name).lower().strip()
        
        # Replace spaces and common separators with underscores
        normalized = re.sub(r'[\s\-\.]+', '_', normalized)
        
        # Remove special characters except underscores
        normalized = re.sub(r'[^a-z0-9_]', '', normalized)
        
        # Remove leading/trailing underscores and collapse multiple underscores
        normalized = re.sub(r'^_+|_+$', '', normalized)
        normalized = re.sub(r'_+', '_', normalized)
        
        return normalized
    
    def map_column_to_canonical(self, col_name: str) -> str:
        """Map a column name to canonical schema"""
        normalized = self.normalize_column_name(col_name)
        
        # Direct match
        if normalized in self.canonical_headers:
            return normalized
        
        # Synonym match
        if normalized in self.column_synonyms:
            return self.column_synonyms[normalized]
        
        # Partial matches for country codes
        if 'country' in normalized and ('code' in normalized or 'iso' in normalized):
            return 'country_code'
        
        # Return None if no mapping found
        return None
    
    def clean_country_code(self, value) -> str:
        """Clean and standardize country code"""
        if pd.isna(value) or not str(value).strip():
            return ""
        
        code = str(value).strip().upper()
        
        # Handle common country name to code mappings
        name_to_code = {
            'NETHERLANDS': 'NL',
            'GERMANY': 'DE',
            'FRANCE': 'FR',
            'BELGIUM': 'BE',
            'SPAIN': 'ES',
            'ITALY': 'IT',
            'PORTUGAL': 'PT',
            'AUSTRIA': 'AT',
            'DENMARK': 'DK',
            'SWEDEN': 'SE',
            'FINLAND': 'FI',
            'NORWAY': 'NO',
            'IRELAND': 'IE',
            'POLAND': 'PL',
            'CZECH REPUBLIC': 'CZ',
            'HUNGARY': 'HU',
            'SLOVAKIA': 'SK',
            'SLOVENIA': 'SI',
            'CROATIA': 'HR',
            'ROMANIA': 'RO',
            'BULGARIA': 'BG',
            'GREECE': 'GR',
            'CYPRUS': 'CY',
            'MALTA': 'MT',
            'LUXEMBOURG': 'LU',
            'ESTONIA': 'EE',
            'LATVIA': 'LV',
            'LITHUANIA': 'LT',
        }
        
        if code in name_to_code:
            return name_to_code[code]
        
        # If it looks like a 2-letter code, return as-is
        if len(code) == 2 and code.isalpha():
            return code
        
        return code
    
    def clean_coordinate(self, value) -> float:
        """Clean and convert coordinate to float"""
        if pd.isna(value):
            return None
        
        try:
            return float(str(value).strip())
        except (ValueError, TypeError):
            return None
    
    def normalize_file(self, csv_path: Path) -> Dict:
        """Normalize a single CSV file"""
        print(f"\n🔄 Processing: {csv_path.name}")
        
        try:
            # Read CSV with multiple encodings fallback
            encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']
            df = None
            
            for encoding in encodings:
                try:
                    df = pd.read_csv(csv_path, encoding=encoding)
                    print(f"   ✅ Loaded with {encoding} encoding")
                    break
                except UnicodeDecodeError:
                    continue
            
            if df is None:
                raise ValueError(f"Could not read {csv_path.name} with any encoding")
            
            original_rows = len(df)
            source_name = csv_path.stem
            
            # Normalize column names and create mapping
            column_mapping = {}
            unmapped_columns = []
            
            for col in df.columns:
                canonical = self.map_column_to_canonical(col)
                if canonical:
                    column_mapping[col] = canonical
                else:
                    unmapped_columns.append(col)
            
            # Create new dataframe with canonical columns
            normalized_df = pd.DataFrame(columns=self.canonical_headers)
            
            # Map existing columns
            for original_col, canonical_col in column_mapping.items():
                if canonical_col in self.canonical_headers:
                    normalized_df[canonical_col] = df[original_col]
            
            # Add metadata columns
            normalized_df['source'] = source_name
            
            # Clean specific columns
            if 'country_code' in normalized_df.columns:
                normalized_df['country_code'] = normalized_df['country_code'].apply(self.clean_country_code)
            
            if 'latitude' in normalized_df.columns:
                normalized_df['latitude'] = normalized_df['latitude'].apply(self.clean_coordinate)
            
            if 'longitude' in normalized_df.columns:
                normalized_df['longitude'] = normalized_df['longitude'].apply(self.clean_coordinate)
            
            # Remove completely empty rows
            normalized_df = normalized_df.dropna(how='all')
            
            # Sort by country_code, city, name
            sort_columns = []
            if 'country_code' in normalized_df.columns:
                sort_columns.append('country_code')
            if 'city' in normalized_df.columns:
                sort_columns.append('city')
            if 'name' in normalized_df.columns:
                sort_columns.append('name')
            
            if sort_columns:
                normalized_df = normalized_df.sort_values(sort_columns, na_position='last')
            
            # Save normalized file
            output_path = self.normalized_dir / f"{source_name}__normalized.csv"
            normalized_df.to_csv(output_path, index=False)
            
            # Generate stats
            stats = {
                'file': csv_path.name,
                'rows_in': original_rows,
                'rows_out': len(normalized_df),
                'columns_mapped': len(column_mapping),
                'columns_unmapped': len(unmapped_columns),
                'missing_country_code': normalized_df['country_code'].isna().sum() if 'country_code' in normalized_df.columns else original_rows,
                'missing_city': normalized_df['city'].isna().sum() if 'city' in normalized_df.columns else original_rows,
                'with_latlng': ((normalized_df['latitude'].notna()) & (normalized_df['longitude'].notna())).sum() if 'latitude' in normalized_df.columns else 0,
                'has_external_id': (normalized_df['external_id'].notna()).sum() if 'external_id' in normalized_df.columns else 0,
                'column_mapping': column_mapping,
                'unmapped_columns': unmapped_columns
            }
            
            # Generate mapping report
            self.generate_mapping_report(csv_path.name, stats)
            
            print(f"   📊 Stats: {stats['rows_in']} → {stats['rows_out']} rows, {stats['columns_mapped']} mapped columns")
            
            return stats, normalized_df
            
        except Exception as e:
            print(f"   ❌ Error processing {csv_path.name}: {str(e)}")
            return None, None
    
    def generate_mapping_report(self, filename: str, stats: Dict):
        """Generate a mapping report for a file"""
        report_path = self.reports_dir / f"{Path(filename).stem}__mapping.md"
        
        with open(report_path, 'w') as f:
            f.write(f"# Mapping Report: {filename}\n\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("## Statistics\n\n")
            f.write(f"- **Input rows:** {stats['rows_in']}\n")
            f.write(f"- **Output rows:** {stats['rows_out']}\n")
            f.write(f"- **Columns mapped:** {stats['columns_mapped']}\n")
            f.write(f"- **Columns unmapped:** {stats['columns_unmapped']}\n")
            f.write(f"- **Missing country code:** {stats['missing_country_code']}\n")
            f.write(f"- **Missing city:** {stats['missing_city']}\n")
            f.write(f"- **With lat/lng:** {stats['with_latlng']}\n")
            f.write(f"- **Has external ID:** {stats['has_external_id']}\n\n")
            
            f.write("## Column Mapping\n\n")
            if stats['column_mapping']:
                f.write("| Source Column | Canonical Column |\n")
                f.write("|---------------|------------------|\n")
                for src, dst in stats['column_mapping'].items():
                    f.write(f"| {src} | {dst} |\n")
            else:
                f.write("No columns were mapped.\n")
            
            f.write("\n## Unmapped Columns\n\n")
            if stats['unmapped_columns']:
                for col in stats['unmapped_columns']:
                    f.write(f"- {col}\n")
            else:
                f.write("All columns were mapped successfully.\n")
    
    def create_dedupe_key(self, row) -> str:
        """Create a deduplication key for a row"""
        key_parts = []
        
        for field in ['name', 'address_line1', 'postal_code', 'city', 'country_code']:
            value = str(row.get(field, '')).lower().strip()
            key_parts.append(value)
        
        return '|'.join(key_parts)
    
    def count_blanks(self, row) -> int:
        """Count blank/empty values in a row"""
        return sum(1 for v in row.values() if pd.isna(v) or str(v).strip() == '')
    
    def merge_and_dedupe(self, normalized_files: List[pd.DataFrame]) -> pd.DataFrame:
        """Merge all normalized files and deduplicate"""
        print(f"\n🔄 Merging {len(normalized_files)} files...")
        
        # Combine all dataframes
        merged_df = pd.concat(normalized_files, ignore_index=True)
        original_count = len(merged_df)
        
        # Deduplicate by external_id first (if available)
        if 'external_id' in merged_df.columns:
            # Group by source + external_id and keep first
            has_external_id = merged_df['external_id'].notna()
            external_id_df = merged_df[has_external_id].drop_duplicates(['source', 'external_id'], keep='first')
            no_external_id_df = merged_df[~has_external_id]
            
            print(f"   📊 {len(external_id_df)} rows with external_id, {len(no_external_id_df)} without")
        else:
            no_external_id_df = merged_df
            external_id_df = pd.DataFrame(columns=merged_df.columns)
        
        # Deduplicate remaining rows by normalized key
        if len(no_external_id_df) > 0:
            # Create dedupe keys
            dedupe_keys = []
            for idx, row in no_external_id_df.iterrows():
                key = self.create_dedupe_key(row)
                dedupe_keys.append(key)
            
            no_external_id_df = no_external_id_df.copy()
            no_external_id_df['_dedupe_key'] = dedupe_keys
            
            # Group by dedupe key and keep row with fewest blanks
            def keep_best_row(group):
                if len(group) == 1:
                    return group.iloc[0]
                
                # Calculate blank counts for each row
                blank_counts = []
                for idx, row in group.iterrows():
                    blank_count = self.count_blanks(row)
                    blank_counts.append((blank_count, idx))
                
                # Keep row with fewest blanks (lowest count)
                blank_counts.sort()
                best_idx = blank_counts[0][1]
                return group.loc[best_idx]
            
            deduped_df = no_external_id_df.groupby('_dedupe_key').apply(keep_best_row).reset_index(drop=True)
            deduped_df = deduped_df.drop('_dedupe_key', axis=1)
        else:
            deduped_df = pd.DataFrame(columns=merged_df.columns)
        
        # Combine both parts
        final_df = pd.concat([external_id_df, deduped_df], ignore_index=True)
        
        # Final sort
        sort_columns = ['country_code', 'city', 'name']
        final_df = final_df.sort_values([col for col in sort_columns if col in final_df.columns], na_position='last')
        
        duplicates_removed = original_count - len(final_df)
        print(f"   📊 Removed {duplicates_removed} duplicates ({original_count} → {len(final_df)} rows)")
        
        return final_df
    
    def generate_merge_report(self, stats_list: List[Dict], final_df: pd.DataFrame):
        """Generate final merge report"""
        report_path = self.reports_dir / "all_listings_merge_report.md"
        
        with open(report_path, 'w') as f:
            f.write("# All Listings Merge Report\n\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("## Summary\n\n")
            total_input_rows = sum(s['rows_in'] for s in stats_list)
            total_normalized_rows = sum(s['rows_out'] for s in stats_list)
            final_rows = len(final_df)
            
            f.write(f"- **Files processed:** {len(stats_list)}\n")
            f.write(f"- **Total input rows:** {total_input_rows:,}\n")
            f.write(f"- **Total normalized rows:** {total_normalized_rows:,}\n")
            f.write(f"- **Final deduplicated rows:** {final_rows:,}\n")
            f.write(f"- **Duplicates removed:** {total_normalized_rows - final_rows:,}\n\n")
            
            f.write("## Per-File Statistics\n\n")
            f.write("| File | Rows In | Rows Out | Mapped Cols | External IDs | Lat/Lng |\n")
            f.write("|------|---------|----------|-------------|--------------|----------|\n")
            
            for stats in stats_list:
                f.write(f"| {stats['file']} | {stats['rows_in']} | {stats['rows_out']} | {stats['columns_mapped']} | {stats['has_external_id']} | {stats['with_latlng']} |\n")
            
            f.write("\n## Data Quality\n\n")
            if 'country_code' in final_df.columns:
                country_counts = final_df['country_code'].value_counts()
                f.write("### Countries Represented\n\n")
                for country, count in country_counts.head(10).items():
                    f.write(f"- **{country}:** {count:,} listings\n")
            
            f.write("\n### Column Completeness\n\n")
            for col in self.canonical_headers:
                if col in final_df.columns:
                    non_empty = final_df[col].notna().sum()
                    percentage = (non_empty / len(final_df)) * 100 if len(final_df) > 0 else 0
                    f.write(f"- **{col}:** {non_empty:,} / {len(final_df):,} ({percentage:.1f}%)\n")
            
            f.write("\n## Unmapped Columns Summary\n\n")
            all_unmapped = set()
            for stats in stats_list:
                all_unmapped.update(stats['unmapped_columns'])
            
            if all_unmapped:
                f.write("The following columns could not be mapped and may need manual review:\n\n")
                for col in sorted(all_unmapped):
                    f.write(f"- {col}\n")
            else:
                f.write("All columns were successfully mapped across all files.\n")
    
    def process_all(self):
        """Process all CSV files in the raw directory"""
        print("🚀 ListAcrossEU v2 CSV Normalizer")
        print("=" * 50)
        
        # Find all CSV files
        csv_files = list(self.raw_dir.glob("*.csv"))
        
        if not csv_files:
            print("❌ No CSV files found in raw directory")
            return
        
        print(f"📁 Found {len(csv_files)} CSV files:")
        for csv_file in csv_files:
            print(f"   - {csv_file.name}")
        
        # Process each file
        all_stats = []
        normalized_dfs = []
        
        for csv_file in csv_files:
            stats, df = self.normalize_file(csv_file)
            if stats and df is not None:
                all_stats.append(stats)
                normalized_dfs.append(df)
        
        if not normalized_dfs:
            print("❌ No files were successfully processed")
            return
        
        # Merge and deduplicate
        final_df = self.merge_and_dedupe(normalized_dfs)
        
        # Save final merged file
        output_path = self.normalized_dir / "all_listings_normalized.csv"
        final_df.to_csv(output_path, index=False)
        
        print(f"\n✅ Final output: {output_path}")
        print(f"📊 Total records: {len(final_df):,}")
        
        # Generate merge report
        self.generate_merge_report(all_stats, final_df)
        
        # Print summary
        print("\n" + "=" * 50)
        print("📋 SUMMARY")
        print("=" * 50)
        
        for stats in all_stats:
            print(f"\n📄 {stats['file']}:")
            print(f"   Rows: {stats['rows_in']} → {stats['rows_out']}")
            print(f"   Mapped columns: {stats['columns_mapped']}")
            print(f"   External IDs: {stats['has_external_id']}")
            print(f"   With coordinates: {stats['with_latlng']}")
            if stats['unmapped_columns']:
                print(f"   Unmapped columns: {', '.join(stats['unmapped_columns'])}")
        
        # Check for files with good external IDs
        good_external_id_files = [s for s in all_stats if s['has_external_id'] > 0]
        if good_external_id_files:
            print(f"\n✅ Files with external IDs:")
            for stats in good_external_id_files:
                print(f"   - {stats['file']}: {stats['has_external_id']} records")
        else:
            print(f"\n⚠️  No files had external_id columns")
        
        # Show weird/unmapped columns
        all_unmapped = set()
        for stats in all_stats:
            all_unmapped.update(stats['unmapped_columns'])
        
        if all_unmapped:
            print(f"\n⚠️  Unmapped columns that need review:")
            for col in sorted(all_unmapped):
                print(f"   - {col}")


if __name__ == "__main__":
    normalizer = ListingsNormalizer()
    normalizer.process_all()