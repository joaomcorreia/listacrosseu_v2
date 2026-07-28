# Known Issues and Gotchas

## Development Environment

**Windows Command Prompt**:
- Always use absolute paths with `cd /d`
- Never rely on previous working directory
- No PowerShell command chaining (&&, ;)
- Each command block must navigate explicitly

**Next.js Configuration**:
- Never enable experimental Turbopack
- Remove any `experimental.turbo` config
- Prefer stable config: `reactStrictMode: true`
- i18n config not supported in App Router

**Port Management**:
- Backend: http://127.0.0.1:8000/
- Frontend: http://localhost:3000/
- Use `netstat -ano | findstr :3000` to check ports
- Kill stuck processes: `taskkill /PID <pid> /F`

**Cache Hygiene**:
- Clean script: `npm run clean` (rimraf .next .turbo)
- Use before starting if crash occurred
- Scripts must be idempotent

## Production Considerations

**Database**:
- Development: SQLite
- Production: PostgreSQL required

**Environment Variables**:
- Always use python-decouple
- Never commit secrets to git
- Separate .env files per environment

**Deferred Review Items**:
- Homepage copy currently says `6,352 verified businesses`, but the production database contains 8,114 `listings_business` rows; the displayed value is hard-coded in `frontend/src/i18n/translations.ts`.
- French pages currently return `<html lang="en">` instead of the correct document language.
