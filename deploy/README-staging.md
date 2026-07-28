# ListAcrossEU v2 staging deployment checklist

Paths
- Backend app dir: <BACKEND_DIR>
- Frontend app dir: <FRONTEND_DIR>
- Backend env file: <BACKEND_ENV_FILE>
- Frontend env file: <FRONTEND_ENV_FILE>
- Python virtualenv: <VENV_DIR>
- Backend static root: <BACKEND_STATIC_ROOT>
- Backend media root: <BACKEND_MEDIA_ROOT>

Build commands
- Backend deps: `pip install -r backend/requirements.txt`
- Frontend deps: `npm ci` inside `frontend`
- Frontend build: `npm run build` inside `frontend`
- Production frontend build ownership: after each production build, run `sudo chown -R www-data:www-data /var/www/listacross.eu/app/frontend/.next`
- Static collection: `py -3 manage.py collectstatic --noinput` with `DJANGO_SETTINGS_MODULE=config.settings.production`

Runtime commands
- Gunicorn: `gunicorn listacrosseu_backend.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 60`
- Next.js: `npm run start -- --hostname 127.0.0.1 --port 3000`

Systemd units
- `deploy/systemd/listacrosseu-backend.service.example`
- `deploy/systemd/listacrosseu-frontend.service.example`

Nginx template
- `deploy/nginx/listacrosseu-staging.conf.example`

Restart commands
- `sudo systemctl daemon-reload`
- `sudo systemctl restart listacrosseu-backend`
- `sudo systemctl restart listacrosseu-frontend`
- `sudo nginx -t && sudo systemctl reload nginx`

Health checks
- Frontend: `https://<STAGING_DOMAIN>/`
- Frontend API health: `https://<STAGING_DOMAIN>/api/health`
- Backend health: `https://<STAGING_DOMAIN>/healthz/`
- Admin auth check: `https://<STAGING_DOMAIN>/api/admin/auth/`

Staging noindex expectations
- Backend env: `STAGING_NOINDEX=1`
- Frontend env: `NEXT_PUBLIC_STAGING_NOINDEX=1`
- Verify `robots.txt` disallows `/`
- Verify page responses include `X-Robots-Tag: noindex, nofollow`

Notes
- Keep the current populated SQLite database untouched unless and until a deliberate migration/cutover plan is approved.
- If switching to PostgreSQL later, copy data through a separate migration plan; this checkpoint does not do that work.
- Keep `ENABLE_VISUAL_HOMEPAGE_EDITOR=0` on staging unless explicitly needed.
- Keep `EXPOSE_PUBLIC_DEBUG_ENDPOINTS=0` on staging.
- The production frontend service runs as `www-data`. Runtime-writable Next.js build artifacts under `/var/www/listacross.eu/app/frontend/.next` must stay owned by `www-data:www-data`.
