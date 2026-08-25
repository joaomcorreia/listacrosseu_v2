// @ts-expect-error Node's native TypeScript runner requires the source extension.
import { getLocalizedWebsiteView, normalizeGeneratedWebsite, type GeneratedWebsite } from './generated-page-schema.ts';

const productionShapedSoldierWebsite: GeneratedWebsite = {
  business_id: 11875,
  business_slug: 'auto-repairs-soldier',
  business_name: 'Auto Repairs Soldier',
  template_id: 'editorial-v1',
  website: {
    status: 'published',
    website_slug: 'auto-repairs-soldier',
    page_title: 'Auto Repairs Soldier',
    target_location: '',
    target_city: '',
    target_region: '',
    target_country: '',
    service_area: '',
    layout_mode: 'one_page',
    theme: { primary: '#7c3aed', dark: '#0f172a' },
    settings: { attribution_visible: true },
    entitlement: { attribution_visibility_unlocked: false },
    contact: { phone: '', email: '', website: '', visibility: {} },
    effects: { reveal: false, background_parallax: false },
    trial: { status: 'trial', started_at: null, ends_at: null },
    sections: {
      hero: { enabled: true, title: 'Auto Repairs Soldier', tagline: 'Reliable vehicle repairs.', image: '' },
      services: { enabled: true, items: [{ private_placeholder: true }, { private_placeholder: true }, { private_placeholder: true }] },
      about: { enabled: true, title: 'About', text: 'A fictional local auto repair business.' },
      gallery: { enabled: false, items: [] },
      contact: { enabled: true, address: '', city: '', region: '', country: '' },
    },
  },
};

const normalized = normalizeGeneratedWebsite(productionShapedSoldierWebsite);
if (normalized.business_name !== 'Auto Repairs Soldier') throw new Error('Published business identity was not preserved');
if (normalized.website.sections.services.items.length !== 3) throw new Error('Private placeholder service objects were not preserved for renderer input');
if (!normalized.website.sections.services.items.every((item) => typeof item !== 'string' && item.private_placeholder)) throw new Error('Service placeholder shape changed unexpectedly');

const multilingual = normalizeGeneratedWebsite({
  ...productionShapedSoldierWebsite,
  website: {
    ...productionShapedSoldierWebsite.website,
    language_config: { primary: 'en', additional: ['fr', 'de', 'es'], max_count: 4 },
    localized: { fr: { sections: { hero: { title: 'Titre français' }, faq: { items: [{ question: 'Question française', answer: 'Réponse française' }] } } } },
  },
});
const frenchView = getLocalizedWebsiteView(multilingual.website, 'fr');
if (frenchView.language !== 'fr') throw new Error('Selected generated website language was not preserved');
if (frenchView.website.sections.hero.title !== 'Titre français') throw new Error('Secondary hero translation was not rendered');
if (frenchView.website.sections.hero.tagline !== '') throw new Error('Missing secondary content was copied from primary language');
if (frenchView.website.contact.phone !== '') throw new Error('Shared contact data should remain available independently of localized text');
if (frenchView.config.additional.length !== 3) throw new Error('Four-language configuration was not retained');
