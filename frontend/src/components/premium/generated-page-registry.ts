import type { GeneratedTemplateId } from './generated-page-schema';
import { DEFAULT_GENERATED_TEMPLATE_ID } from './generated-page-schema';

export type GeneratedTemplateDefinition = {
  label: string;
  description: string;
  renderer: 'classic-business' | 'service-pro';
  sectionVariants: Readonly<Record<string, string>>;
  designDefaults?: Readonly<Record<string, string>>;
};

export const GENERATED_PAGE_TEMPLATES: Readonly<Record<GeneratedTemplateId, GeneratedTemplateDefinition>> = {
  'editorial-v1': { label: 'Classic Business', description: 'The original ListAcrossEU generated website presentation.', renderer: 'classic-business', sectionVariants: { hero: 'default', about: 'default', services: 'cards', gallery: 'default' } },
  'classic-business': { label: 'Classic Business', description: 'A balanced local-business presentation.', renderer: 'classic-business', sectionVariants: { hero: 'default', about: 'default', services: 'cards', gallery: 'default' } },
  'service-pro': { label: 'Service Pro', description: 'A structured professional-services presentation.', renderer: 'service-pro', sectionVariants: { hero: 'split', about: 'split', services: 'cards', gallery: 'projects', contact: 'structured' }, designDefaults: { rhythm: 'light-dark' } },
};

export function resolveGeneratedTemplateId(value?: string): GeneratedTemplateId {
  if (value === 'editorial-v1' || value === 'classic-business') return value;
  return value === 'service-pro' ? 'service-pro' : DEFAULT_GENERATED_TEMPLATE_ID;
}
