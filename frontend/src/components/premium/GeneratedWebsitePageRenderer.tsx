'use client';

import GeneratedWebsiteTemplate from './GeneratedWebsiteTemplate';
import type { GeneratedWebsite, GeneratedWebsitePage } from './generated-page-schema';

// Thin page dispatcher: all page views still consume the same normalized website
// object and the same rendered editor. Dedicated compositions can be extracted
// here later without creating page-specific content stores.
export default function GeneratedWebsitePageRenderer(props: { initial: GeneratedWebsite; businessId: string; lang: string; readOnly?: boolean; privatePreview?: boolean; activePage?: GeneratedWebsitePage }) {
  return <GeneratedWebsiteTemplate {...props} />;
}
