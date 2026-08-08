# ListAcrossEU v2

**What**: ListAcrossEU v2 – high-performance multi-language EU business directory (Django + Next.js).

**Why**: Rebuilt from scratch for speed, clean imports, and AI-driven tools while preserving the existing marketing & directory design.

## Architecture

- **Backend**: Django 5.x + Django REST Framework
- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS
- **Languages**: English, French, Dutch, Portuguese, German, Spanish, Arabic

## Local development

The repository has two applications:

- `backend/`: Django REST API and the populated local SQLite database.
- `frontend/`: Next.js App Router application.

### Backend

The supported local interpreter is `backend\.venv`.

```powershell
cd C:\projects\listacrosseu_v2\backend
.\.venv\Scripts\Activate.ps1
python manage.py check
python manage.py runserver 127.0.0.1:8020
```

Backend URL: http://127.0.0.1:8020/

The development settings module is `listacrosseu_backend.settings`. Local settings use Django debug defaults, localhost hosts, and `backend/db.sqlite3`. Production uses the separate `config.settings.production` module and must retain its deployment environment variables.

### Frontend

```powershell
cd C:\projects\listacrosseu_v2\frontend
npm ci
npm run dev
```

Frontend URL: http://localhost:3000/

The local frontend API variables are `NEXT_PUBLIC_API_BASE_URL` and `BACKEND_URL`; both should point to `http://127.0.0.1:8020` for this setup. Other supported frontend variables include `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_STAGING_NOINDEX`, and `ENABLE_VISUAL_HOMEPAGE_EDITOR`.

Do not reset, recreate, flush, migrate destructively, seed, or replace `backend/db.sqlite3`. It contains the populated development dataset.

## Documentation

All legacy v1 documentation should be copied to `docs/99_archive/` for reference, then distilled into proper v2 docs in the respective sections.

### 📋 [Preview Deployment Status](PREVIEW_DEPLOYMENT_STATUS.md)
Current preview readiness status, including what's ready for launch and what's intentionally hidden.

## Recent Updates

### Business Card CTAs & Premium Preview Fixed (December 14, 2025)
**Clean business card CTAs and restored premium preview experience**
- **Removed duplicate CTAs**: Fixed BusinessCard layouts to show only ONE primary CTA per tier
  - **Free cards**: Only "Claim this business" button (green)
  - **Claimed cards**: Only "View Details" button (blue) 
  - **Premium cards**: Only "View Details" button (orange)
- **Premium "View Details" restored**: Clicking View Details on premium cards navigates to `/[lang]/premium-preview` page
- **Claimed "View Details" behavior**: Opens claim modal (step 1) for claimed businesses
- **No 404 routes**: Confirmed no `/businesses/*` routes used in CTAs, all routing is locale-aware
- **Modal system preserved**: ListingFlowModal still available for claim flow with live preview functionality

### Demo Prep Phase 1.2 (December 14, 2025)
**Comprehensive demo preparation with enhanced UX and visual polish**
- **Development banner (red)**: Global red strip "Website under development" at top of all pages
- **Navbar overlay restored + mobile nav fixed**: Proper transparent/white transitions, mobile menu functionality restored
- **Countries sidebar unified**: Fixed double sidebar issue by removing inner grid layout from CountriesPageClient
- **Wider container**: Consistent max-w-7xl usage across all pages via Container component
- **Ads placeholders added**: Shape-based AdPlaceholder component with gradient backgrounds, strategically placed in homepage, sidebar areas, and between content sections
- **Category marquee slider added**: Infinite-scroll horizontal category slider with auto-scroll, pause-on-hover, and reduced motion support
- **Top Cities section filled**: Real city data with business counts, fallback to static cities if API fails
- **No-images policy enforced**: All visual elements use gradients, shapes, and borders instead of images

### Frontend Layout Improvements
- **Header expanded with breadcrumb row** (+~60px): Header now includes a dedicated breadcrumb section positioned at the bottom of the header area
- **Added Countries/Cities/Locations page shells** with shared hero + Layout + breadcrumbs: New directory pages at `/{lang}/countries`, `/{lang}/cities`, and `/{lang}/locations` ready for listings integration
- **Enhanced navigation**: Added new navigation items for Countries, Cities, and Locations with locale-aware routing
- **Maintained hero overlay system**: All new pages use the existing `-mt-16 pt-16` pattern for proper header overlay

## Project Structure

```
listacrosseu_v2/
├── backend/          # Django API
├── frontend/         # Next.js app  
├── docs/            # Documentation
│   ├── 01_architecture/
│   ├── 02_backend/
│   ├── 03_frontend/
│   ├── 04_ai/
│   ├── 05_importers/
│   ├── 06_plans_billing/
│   ├── 07_ops/
│   └── 99_archive/   # Legacy v1 docs
└── README.md
```
