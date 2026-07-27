import type { MetadataRoute } from "next";

import { GLOBAL_NOINDEX_ENABLED, PUBLIC_SITE_URL } from "@/lib/env.public";

export default function robots(): MetadataRoute.Robots {
  if (GLOBAL_NOINDEX_ENABLED) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${PUBLIC_SITE_URL}/sitemap.xml`,
    host: PUBLIC_SITE_URL,
  };
}
