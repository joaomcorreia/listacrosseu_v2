import { SUPPORTED_LANGS, normalizeLang, type SupportedLang } from '@/lib/lang';
export type { SupportedLang } from '@/lib/lang';

export type GeneratedTemplateId = 'editorial-v1' | 'classic-business' | 'service-pro';

export const DEFAULT_GENERATED_TEMPLATE_ID: GeneratedTemplateId = 'editorial-v1';

export type WebsiteContact = {
  eyebrow?: string;
  title?: string;
  message?: string;
  phone: string;
  whatsapp?: string;
  email: string;
  website: string;
  visibility?: {
    phone?: boolean;
    whatsapp?: boolean;
    email?: boolean;
    website?: boolean;
    address?: boolean;
  };
};

export type GeneratedGalleryImage = string;
export type GeneratedOpeningHour = { day: string; hours: string; closed?: boolean };
export type GeneratedFaqItem = { question?: string; answer?: string };
export type WebsiteLanguageConfig = { primary: SupportedLang; additional: SupportedLang[]; max_count: 1 | 4 };
export type GeneratedLocalizedContent = {
  page_title?: string;
  sections?: Record<string, Record<string, unknown>>;
  contact?: Record<string, unknown>;
};

export const SUPPORTED_GENERATED_WEBSITE_LANGUAGES = SUPPORTED_LANGS;

export function normalizeWebsiteLanguageConfig(input: Partial<WebsiteLanguageConfig> | undefined, fallback = 'en'): WebsiteLanguageConfig {
  const primary = normalizeLang(String(input?.primary || fallback)) as SupportedLang;
  const max_count: 1 | 4 = input?.max_count === 4 ? 4 : 1;
  const additional = max_count === 4
    ? Array.from(new Set((input?.additional || []).map((value) => normalizeLang(String(value))).filter((value): value is SupportedLang => SUPPORTED_LANGS.includes(value as SupportedLang) && value !== primary))).slice(0, 3)
    : [];
  return { primary, additional, max_count };
}

function legacyLocalizedContent(website: GeneratedWebsite['website']): GeneratedLocalizedContent {
  const sections = website.sections || ({} as GeneratedWebsite['website']['sections']);
  const serviceItems = sections.services?.items || [];
  return {
    page_title: website.page_title,
    sections: {
      hero: { title: sections.hero?.title || '', tagline: sections.hero?.tagline || '', cta_label: sections.hero?.cta_label || '' },
      about: { eyebrow: sections.about?.eyebrow || '', title: sections.about?.title || '', intro: sections.about?.intro || '', text: sections.about?.text || '' },
      services: { eyebrow: sections.services?.eyebrow || '', title: sections.services?.title || '', items: serviceItems.map((item) => typeof item === 'string' ? { name: item, description: '' } : { name: item.name || '', description: item.description || '' }) },
      why_choose: { title: sections.why_choose?.title || '', text: sections.why_choose?.text || '' },
      gallery: { title: sections.gallery?.title || '' },
      opening_hours: { title: sections.opening_hours?.title || '' },
      faq: { title: sections.faq?.title || '', items: (sections.faq?.items || []).map((item) => ({ question: item.question || '', answer: item.answer || '' })) },
    },
    contact: { eyebrow: website.contact?.eyebrow || '', title: website.contact?.title || '', message: website.contact?.message || '', location_label: sections.contact?.location_label || '', location_title: sections.contact?.location_title || '', location_intro: sections.contact?.location_intro || '' },
  };
}

export function localizedContentFor(website: GeneratedWebsite['website']): Record<string, GeneratedLocalizedContent> {
  const config = normalizeWebsiteLanguageConfig(website.language_config, 'en');
  const stored = website.localized && typeof website.localized === 'object' ? website.localized : {};
  return { [config.primary]: legacyLocalizedContent(website), ...stored };
}

export function getLocalizedWebsiteView(website: GeneratedWebsite['website'], requestedLanguage: string): { website: GeneratedWebsite['website']; language: SupportedLang; config: WebsiteLanguageConfig } {
  const config = normalizeWebsiteLanguageConfig(website.language_config, requestedLanguage);
  const selected = [config.primary, ...config.additional];
  const language = selected.includes(normalizeLang(requestedLanguage) as SupportedLang) ? normalizeLang(requestedLanguage) as SupportedLang : config.primary;
  const localized = localizedContentFor(website)[language] || {};
  const source = localized.sections || {};
  const raw = website.sections;
  const overlay = (key: string, fields: string[]) => ({ ...raw[key as keyof typeof raw], ...Object.fromEntries(fields.map((field) => [field, Object.prototype.hasOwnProperty.call(source[key] || {}, field) ? (source[key] as Record<string, unknown>)[field] : language === config.primary ? (raw[key as keyof typeof raw] as Record<string, unknown>)?.[field] || '' : ''])) }) as any;
  const localizedServices = Array.isArray((source.services as Record<string, unknown> | undefined)?.items) ? (source.services as Record<string, unknown>).items as Array<Record<string, unknown>> : [];
  const services = raw.services.items.map((item, index) => {
    const base = typeof item === 'string' ? { name: item, description: '' } : item;
    const translated = localizedServices[index] || {};
    return { ...base, name: Object.prototype.hasOwnProperty.call(translated, 'name') ? String(translated.name || '') : language === config.primary ? base.name || '' : '', description: Object.prototype.hasOwnProperty.call(translated, 'description') ? String(translated.description || '') : language === config.primary ? base.description || '' : '' };
  });
  const localizedFaq = (Array.isArray((source.faq as Record<string, unknown> | undefined)?.items) ? (source.faq as Record<string, unknown>).items : []) as Array<Record<string, unknown>>;
  const faqItems = (raw.faq?.items || []).map((item, index) => {
    const translated = localizedFaq[index] || {};
    return { ...item, question: Object.prototype.hasOwnProperty.call(translated, 'question') ? String(translated.question || '') : language === config.primary ? item.question || '' : '', answer: Object.prototype.hasOwnProperty.call(translated, 'answer') ? String(translated.answer || '') : language === config.primary ? item.answer || '' : '' };
  });
  const nextSections = {
    ...raw,
    hero: overlay('hero', ['title', 'tagline', 'cta_label']),
    about: overlay('about', ['eyebrow', 'title', 'intro', 'text']),
    services: { ...raw.services, ...overlay('services', ['eyebrow', 'title']), items: services },
    why_choose: { ...raw.why_choose, ...overlay('why_choose', ['title', 'text']) },
    gallery: { ...raw.gallery, ...overlay('gallery', ['title']) },
    opening_hours: { ...raw.opening_hours, ...overlay('opening_hours', ['title']) },
    faq: { ...raw.faq, ...overlay('faq', ['title']), items: faqItems },
    contact: { ...raw.contact, ...Object.fromEntries(['location_label', 'location_title', 'location_intro'].filter((field) => Object.prototype.hasOwnProperty.call(source.contact || {}, field)).map((field) => [field, (source.contact as Record<string, unknown>)[field]])) },
  };
  const localizedContact = localized.contact || {};
  return { config, language, website: { ...website, page_title: typeof localized.page_title === 'string' ? localized.page_title : language === config.primary ? website.page_title : '', sections: nextSections, contact: { ...website.contact, ...Object.fromEntries(['eyebrow', 'title', 'message'].map((field) => [field, Object.prototype.hasOwnProperty.call(localizedContact, field) ? localizedContact[field] : language === config.primary ? website.contact?.[field as keyof WebsiteContact] || '' : ''])) } } };
}

export type GeneratedBusinessContent = {
  tagline: string;
  description: string;
  logo: string;
  hero_image: string;
  category: string;
  services: Array<string | { name?: string; description?: string; private_placeholder?: boolean }>;
  contact: WebsiteContact & { address: string; city: string; region: string; country: string };
  gallery: string[];
};

export type GeneratedWebsite = {
  business_id: number;
  business_slug: string;
  business_name: string;
  preview_url?: string;
  public_url?: string;
  template_id?: GeneratedTemplateId | string;
  website: {
    status: string;
    website_slug: string;
    page_title: string;
    target_location: string;
    target_city: string;
    target_region: string;
    target_country: string;
    service_area: string;
    layout_mode: 'one_page' | 'multi_page';
    theme: { primary: string; dark: string };
    settings?: { attribution_visible?: boolean };
    entitlement?: { attribution_visibility_unlocked?: boolean };
    contact: WebsiteContact;
    effects?: { reveal?: boolean; background_parallax?: boolean };
    content?: GeneratedBusinessContent;
    language_config?: WebsiteLanguageConfig;
    localized?: Record<string, GeneratedLocalizedContent>;
    trial: { status: string; started_at: string | null; ends_at: string | null };
    sections: {
      hero: { enabled: boolean; title: string; tagline: string; cta_label?: string; image: string; image_position?: string; overlay?: number };
      services: { enabled: boolean; eyebrow?: string; title?: string; items: Array<string | { name?: string; description?: string; private_placeholder?: boolean }> };
      about: { enabled: boolean; eyebrow?: string; title: string; intro?: string; text: string; image?: string; image_position?: string; overlay?: number };
      why_choose?: { enabled: boolean; title?: string; text?: string };
      gallery: { enabled: boolean; title?: string; items: GeneratedGalleryImage[] };
      opening_hours?: { enabled: boolean; title?: string; items: GeneratedOpeningHour[] };
      faq?: { enabled: boolean; title?: string; items: GeneratedFaqItem[] };
      contact: { enabled: boolean; location_label?: string; location_title?: string; location_intro?: string; address: string; city: string; region: string; country: string };
    };
  };
};

export function normalizeGeneratedWebsite(input: GeneratedWebsite): GeneratedWebsite {
  const website = input.website;
  const sections = website.sections || ({} as GeneratedWebsite['website']['sections']);
  const storedContact = (website.contact || {}) as Partial<WebsiteContact>;
  const normalizedContact = {
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    ...storedContact,
    visibility: { phone: true, whatsapp: true, email: true, website: true, ...(storedContact.visibility || {}) },
  };
  const content = website.content || {
    tagline: sections.hero?.tagline || '',
    description: sections.about?.text || '',
    logo: '',
    hero_image: sections.hero?.image || '',
    category: '',
    services: sections.services?.items || [],
    contact: { phone: '', whatsapp: '', email: '', website: '', ...sections.contact },
    gallery: sections.gallery?.items || [],
  };
  return {
    ...input,
    template_id: input.template_id || DEFAULT_GENERATED_TEMPLATE_ID,
    website: {
      ...website,
      contact: normalizedContact,
      content,
      language_config: normalizeWebsiteLanguageConfig(website.language_config, 'en'),
      localized: localizedContentFor({ ...website, sections: { ...sections, hero: { ...sections.hero, image_position: sections.hero?.image_position || 'center', overlay: sections.hero?.overlay ?? 0.75 }, about: { ...sections.about, image_position: sections.about?.image_position || 'center', overlay: sections.about?.overlay ?? 0.25, intro: sections.about?.intro || '' }, gallery: { ...sections.gallery, enabled: sections.gallery?.enabled ?? false, items: sections.gallery?.items || [] }, opening_hours: { ...sections.opening_hours, enabled: sections.opening_hours?.enabled ?? false, title: sections.opening_hours?.title || 'Opening Hours', items: sections.opening_hours?.items || [] }, faq: { ...sections.faq, enabled: sections.faq?.enabled ?? false, title: sections.faq?.title || 'Frequently Asked Questions', items: sections.faq?.items || [] } } }),
      effects: { reveal: false, background_parallax: false, ...(website.effects || {}) },
      sections: {
        ...sections,
        hero: { image_position: 'center', overlay: 0.75, ...sections.hero },
        about: { image_position: 'center', overlay: 0.25, intro: '', ...sections.about },
        why_choose: { ...sections.why_choose, enabled: sections.why_choose?.enabled ?? false, title: sections.why_choose?.title || 'Why choose us', text: sections.why_choose?.text || '' },
        gallery: { ...sections.gallery, enabled: sections.gallery?.enabled ?? false, title: sections.gallery?.title || 'Gallery', items: sections.gallery?.items || [] },
        opening_hours: { ...sections.opening_hours, enabled: sections.opening_hours?.enabled ?? false, title: sections.opening_hours?.title || 'Opening Hours', items: sections.opening_hours?.items || [] },
        faq: { ...sections.faq, enabled: sections.faq?.enabled ?? false, title: sections.faq?.title || 'Frequently Asked Questions', items: sections.faq?.items || [] },
      },
    },
  };
}
