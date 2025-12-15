# Preview Deployment Status – v2

## Overview
ListAcrossEU v2 has been prepared for **preview/soft launch** deployment. This document outlines what is ready, what is intentionally hidden, and known limitations.

*Last Updated: December 14, 2025*

---

## Preview-Ready Pages ✅

### Core Navigation
- **Home** (`/[lang]/`) - Main landing page with country explorer
- **Countries** (`/[lang]/countries`) - Country grid with featured country cards
- **Country Detail** (`/[lang]/countries/[slug]`) - Individual country pages with Popular Business Types
- **Cities** (`/[lang]/cities`) - Cities listing page  
- **City Detail** (`/[lang]/cities/[slug]`) - Individual city pages with Popular Business Types
- **Blog** (`/[lang]/blog`) - Blog system with CMS sections

### Key Features Implemented
1. **Popular Business Types Sections**
   - Added to Country detail pages (6-8 categories shown)
   - Added to City detail pages (4-6 categories shown) 
   - Data-driven from real backend category counts
   - Links to search with location + category filters
   - Clean card/chip design without SEO spam

2. **Navigation Cleanup**
   - Streamlined main navigation for preview
   - Hidden unfinished pages from public view

3. **Data Quality**
   - Real imported business data (no fake/demo filtering needed)
   - Legitimate businesses from CSV imports and other sources

---

## Pages Hidden from Navigation 🚫

The following pages exist as routes but are **intentionally hidden** from navigation during preview:

### Temporarily Hidden
- **Search/Directory** (`/[lang]/search`) - Basic functionality exists but needs polish
- **Locations** (`/[lang]/locations`) - Future feature, currently basic

*Note: These routes are NOT broken - they are functional but not exposed in the navigation UI for preview purposes.*

---

## Technical Architecture

### Backend (Django REST)
- **Port**: 8000 
- **Status**: Stable, all core APIs functional
- **Key Endpoints**:
  - `/api/listings/countries/stats/` - Country explorer data
  - `/api/listings/categories/?country=X` - Location-filtered categories
  - `/api/listings/businesses/search/` - Business search with filters

### Frontend (Next.js)
- **Port**: 3000
- **Status**: Preview-ready for core pages
- **Framework**: Next.js 16.0.8 with App Router

---

## Known Limitations

### Intentionally Unfinished (Out of Preview Scope)
1. **Search Page Polish**: Basic search works but UI needs enhancement
2. **SEO Depth**: Pages are functional but don't have deep SEO content yet
3. **Maps Integration**: Not implemented for preview
4. **Business Detail Polish**: Some type compatibility issues in advanced features
5. **Mobile Optimization**: Basic responsive design, needs refinement

### Data Assumptions
- **Countries**: 27 countries with businesses available
- **Cities**: Major European cities with business listings
- **Categories**: Real business categories with actual counts
- **Business Tiers**: Free, Claimed, Premium (basic implementation)

### TypeScript Issues (Non-Critical)
- Some type compatibility warnings in advanced components
- Business detail page components have minor type mismatches
- Footer animation canvas null-check warnings
- **Impact**: Does not affect core preview functionality

---

## Preview Testing Checklist

### Core User Flows ✅
- [x] Homepage loads with country explorer
- [x] Countries page displays grid with stats
- [x] Country detail pages show Popular Business Types
- [x] Cities page loads properly
- [x] City detail pages show Popular Business Types  
- [x] Blog system functional
- [x] Navigation menu clean and functional

### Data Verification ✅
- [x] Real business data (no demo/test entries)
- [x] Category counts accurate per location
- [x] Country/city statistics working
- [x] API responses properly formatted

---

## Deployment Readiness

### Ready for Preview
- Core functionality stable
- Navigation cleaned up
- Popular Business Types feature complete
- No critical runtime errors
- Real data powering all features

### Post-Preview Tasks
- Re-enable Search/Locations in navigation
- Polish search page UI
- Add deeper SEO content
- Resolve TypeScript type compatibility
- Enhanced mobile optimization
- Maps integration

---

## Quick Start Commands

```bash
# Backend (from C:\projects\listacrosseu_v2)
.\start_backend.cmd

# Frontend (from C:\projects\listacrosseu_v2) 
.\start_frontend.cmd
```

**Preview URL**: http://localhost:3000

---

*This documentation reflects the current preview deployment status and will be updated as additional features are completed.*