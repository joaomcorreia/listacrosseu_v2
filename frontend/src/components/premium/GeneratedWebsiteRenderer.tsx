'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import GeneratedWebsiteTemplate from './GeneratedWebsiteTemplate';
import { normalizeGeneratedWebsite, type GeneratedWebsite } from './generated-page-schema';
import { resolveGeneratedTemplateId } from './generated-page-registry';

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

export default function GeneratedWebsiteRenderer(props: { initial: GeneratedWebsite; businessId: string; lang: string; readOnly?: boolean; privatePreview?: boolean }) {
  const initial = normalizeGeneratedWebsite(props.initial);
  const templateId = resolveGeneratedTemplateId(initial.template_id);

  switch (templateId) {
    case 'editorial-v1':
    default:
      return <GeneratedWebsiteRenderBoundary><GeneratedWebsiteTemplate {...props} initial={initial} /></GeneratedWebsiteRenderBoundary>;
  }
}
