# ListAcrossEU v2 Architecture Overview

## Tech Stack

**Backend**: Django 5.x + Django REST Framework
- Multi-language support (EN, FR, NL, PT, DE, ES, AR)
- REST API for all frontend interactions
- SQLite for development, PostgreSQL for production
- CORS enabled for frontend communication

**Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS
- Server-side rendering with App Router
- API proxy to Django backend
- Responsive design inherited from v1
- TypeScript for type safety

**Data Sources**:
- CSV imports (primary business data)
- Google Places API integration
- Future: additional business directories

## Design Philosophy

v2 preserves the existing UI design and user experience from v1 while implementing a clean, scalable architecture underneath. Focus is on performance, maintainability, and AI-driven enhancements.

## Development Workflow

1. Backend API development first
2. Frontend integration with API
3. Data import pipeline setup
4. AI features integration
5. Performance optimization
