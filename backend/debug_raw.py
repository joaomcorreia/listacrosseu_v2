import csv
import os

raw_files = [
    'employment_businesses_20251106_120745.csv',
    'eu_businesses_comprehensive_20251106_114856.csv'
]

for filename in raw_files:
    filepath = f'imports/raw/{filename}'
    if os.path.exists(filepath):
        print(f"\n=== {filename} ===")
        with open(filepath, 'r') as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames
            print(f"Headers: {', '.join(headers)}")
            
            # Check first row for country info
            first_row = next(reader, None)
            if first_row:
                print("First row country-related fields:")
                for header in headers:
                    if 'country' in header.lower():
                        print(f"  {header}: '{first_row.get(header, '')}'")
    else:
        print(f"File not found: {filepath}")