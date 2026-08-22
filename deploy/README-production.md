# ListAcrossEU production release

Production is deliberately not run from the developer SQLite file. The live
layout is `/var/www/listacross.eu/app`, with the database at
`/var/www/listacross.eu/shared/db/db.sqlite3`. Secrets stay in
`/etc/listacross.eu/backend.env` and `/etc/listacross.eu/frontend.env`.

After a release commit/tag exists locally, the operator runs:

```sh
sudo /var/www/listacross.eu/app/deploy/production-release.sh <release-tag>
```

The script backs up SQLite, checks out the exact release, installs backend
requirements, runs Django deploy checks/tests, runs frontend `npm ci`, lint,
TypeScript, and production build, checks migrations, and performs a guarded
OSM dry-run. It then restarts `listacrosseu-backend.service` and
`listacrosseu-frontend.service` and checks ports 8004 and 3004.

The optional `--import` flag is the only path that runs migrations and writes
approved OSM records. It never replaces the production database. Review the
dry-run output first; it reports insertions, existing external IDs,
duplicates, protected manual/claimed records, uncategorized rows, and the
Brussels/Ixelles reassignment count.
