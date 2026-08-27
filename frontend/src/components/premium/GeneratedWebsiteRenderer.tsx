'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import GeneratedWebsitePageRenderer from './GeneratedWebsitePageRenderer';
import { normalizeGeneratedWebsite, type GeneratedWebsite, type GeneratedWebsitePage } from './generated-page-schema';
import { resolveGeneratedTemplateId, resolveGeneratedTemplateVariant } from './generated-page-registry';

class GeneratedWebsiteRenderBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Generated Website render failed', error, info);
  }

  render() {
    if (this.state.failed) {
      return <main className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-2xl font-black text-slate-900">Generated Website unavailable</h1><p className="mt-3 text-slate-600">This website could not be displayed right now. Please try again later.</p></main>;
    }
    return this.props.children;
  }
}

export default function GeneratedWebsiteRenderer(props: { initial: GeneratedWebsite; businessId: string; lang: string; readOnly?: boolean; privatePreview?: boolean; activePage?: GeneratedWebsitePage }) {
  const initial = normalizeGeneratedWebsite(props.initial);
  const templateId = resolveGeneratedTemplateId(initial.template_id);

  return <GeneratedWebsiteRenderBoundary><GeneratedWebsitePageRenderer {...props} initial={{ ...initial, template_id: templateId, template_variant: resolveGeneratedTemplateVariant(initial.template_variant) }} /></GeneratedWebsiteRenderBoundary>;
}
