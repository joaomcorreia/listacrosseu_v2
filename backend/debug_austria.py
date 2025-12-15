import csv

# Check what happened to Austria in the normalized file
with open('imports/normalized/all_listings_normalized.csv', 'r') as f:
    reader = csv.DictReader(f)
    austria_records = []
    for i, row in enumerate(reader):
        if i >= 10:  # Just check first 10 records
            break
        if 'austria' in row.get('country', '').lower():
            austria_records.append(row)
    
    print(f"Found {len(austria_records)} Austria records in first 10:")
    for record in austria_records:
        print(f"  Country: '{record.get('country', '')}'")
        print(f"  Country Code: '{record.get('country_code', '')}'")
        print()