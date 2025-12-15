# Normalization Report: real_businesses_data.csv

## Summary
- **Input file**: `real_businesses_data.csv`
- **Output file**: `real_businesses_data__v1.csv`
- **Input rows**: 6,159
- **Output rows**: 6,158
- **Skipped rows**: 1

## Column Mappings Found
- `source_external_id` ← `id`
- `name` ← `name`
- `description` ← `description`
- `tags` ← `keywords`
- `website` ← `website`
- `email` ← `email`
- `phone` ← `phone`
- `address_line1` ← `address`
- `postal_code` ← `postal_code`
- `latitude` ← `latitude`
- `longitude` ← `longitude`
- `status` ← `status`

## Missing Required Fields
- **Missing name**: 1 rows (skipped)
- **Missing country_code**: 6,158 rows (kept with empty country)

## Errors
*No errors*

---
*Generated at 2025-12-12 11:07:19*
