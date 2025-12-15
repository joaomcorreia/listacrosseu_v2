import csv

with open('imports/normalized/all_listings_normalized.csv', 'r') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        if i >= 3:
            break
        print(f"Row {i+1}:")
        print(f"  Name: '{row.get('name', 'MISSING')}'")
        print(f"  Country Code: '{row.get('country_code', 'MISSING')}'")
        print(f"  City: '{row.get('city', 'MISSING')}'")
        print(f"  Source: '{row.get('source', 'MISSING')}'")
        print()