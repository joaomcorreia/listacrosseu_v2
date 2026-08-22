export type GeneratedTemplateId = 'editorial-v1';

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
    trial: { status: string; started_at: string | null; ends_at: string | null };
    sections: {
      hero: { enabled: boolean; title: string; tagline: string; cta_label?: string; image: string; image_position?: string; overlay?: number };
      services: { enabled: boolean; eyebrow?: string; title?: string; items: Array<string | { name?: string; description?: string; private_placeholder?: boolean }> };
      about: { enabled: boolean; eyebrow?: string; title: string; text: string; image?: string; image_position?: string; overlay?: number };
      gallery: { enabled: boolean; items: string[] };
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
      effects: { reveal: false, background_parallax: false, ...(website.effects || {}) },
      sections: {
        ...sections,
        hero: { image_position: 'center', overlay: 0.75, ...sections.hero },
        about: { image_position: 'center', overlay: 0.25, ...sections.about },
      },
    },
  };
}
