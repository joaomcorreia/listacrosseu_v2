# Contextual sidebar resolution

`Sidebar` remains the renderer. It accepts an optional context object and calls
`resolveSidebarContent` from `frontend/src/lib/sidebar-content.ts`.

Resolution order is:

1. `city-{slug}`
2. `country-{slug}`
3. `category-{slug}`
4. global fallback

Only non-empty overrides should be added to `OVERRIDES`; the global content is
always merged in, so a partial override cannot produce an empty sidebar. The
current local sample is `city-antwerp`. Future CMS records can use equivalent
keys such as `sidebar-global`, `sidebar-country-be`, `sidebar-city-antwerp`, or
`sidebar-category-restaurants` when the configuration is moved server-side.
