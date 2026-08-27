import type { GeneratedTemplateId, GeneratedTemplateVariant } from './generated-page-schema';
import { DEFAULT_GENERATED_TEMPLATE_ID, DEFAULT_GENERATED_TEMPLATE_VARIANT } from './generated-page-schema';

export type GeneratedTemplateDefinition = {
  label: string;
  description: string;
  renderer: 'classic-business' | 'service-pro';
  sectionVariants: Readonly<Record<string, string>>;
  designDefaults?: Readonly<Record<string, string>>;
  variants?: Readonly<Record<GeneratedTemplateVariant, { label: string; description: string }>>;
  defaultVariant?: GeneratedTemplateVariant;
};

export type ClassicBusinessVariantOption = {
  id: 'variant-1' | 'variant-2' | 'variant-3' | 'variant-4';
  label: string;
  description: string;
  previewImage: string;
  enabled: boolean;
};

export const CLASSIC_BUSINESS_VARIANT_OPTIONS: readonly ClassicBusinessVariantOption[] = [
  { id: 'variant-1', label: 'Variant 1', description: 'Balanced, centered local-business layout.', previewImage: '/template-previews/classic-business/variant-1.jpg', enabled: true },
  { id: 'variant-2', label: 'Variant 2', description: 'Asymmetric, image-led business layout.', previewImage: '/template-previews/classic-business/variant-2.jpg', enabled: true },
  { id: 'variant-3', label: 'Variant 3', description: 'A future Classic Business layout.', previewImage: '/template-previews/classic-business/variant-3.jpg', enabled: false },
  { id: 'variant-4', label: 'Variant 4', description: 'A future Classic Business layout.', previewImage: '/template-previews/classic-business/variant-4.jpg', enabled: false },
];

export const CLASSIC_BUSINESS_VARIANTS: Readonly<Record<GeneratedTemplateVariant, { label: string; description: string; heroClass: string; heroContentClass: string; aboutClass: string; servicesGridClass: string; galleryGridClass: string; contactClass: string }>> = {
  'variant-1': {
    label: 'Variant 1', description: 'Balanced, centered local-business layout.',
    heroClass: 'py-20 sm:py-28', heroContentClass: 'max-w-4xl text-center', aboutClass: 'md:flex-row', servicesGridClass: 'lg:grid-cols-3', galleryGridClass: 'sm:grid-cols-2 lg:grid-cols-3', contactClass: 'lg:grid-cols-2',
  },
  'variant-2': {
    label: 'Variant 2', description: 'Asymmetric, image-led business layout.',
    heroClass: 'py-16 sm:min-h-[34rem] sm:py-20', heroContentClass: 'max-w-6xl text-left lg:mr-auto', aboutClass: 'md:flex-row-reverse', servicesGridClass: 'lg:grid-cols-2', galleryGridClass: 'sm:grid-cols-2', contactClass: 'lg:grid-cols-[1.15fr_0.85fr]',
  },
};

export function resolveGeneratedTemplateVariant(value?: string): GeneratedTemplateVariant {
  return value === 'variant-2' ? 'variant-2' : DEFAULT_GENERATED_TEMPLATE_VARIANT;
}

export const GENERATED_PAGE_TEMPLATES: Readonly<Record<GeneratedTemplateId, GeneratedTemplateDefinition>> = {
  'editorial-v1': { label: 'Classic Business', description: 'The original ListAcrossEU generated website presentation.', renderer: 'classic-business', sectionVariants: { hero: 'default', about: 'default', services: 'cards', gallery: 'default' }, variants: CLASSIC_BUSINESS_VARIANTS, defaultVariant: DEFAULT_GENERATED_TEMPLATE_VARIANT },
  'classic-business': { label: 'Classic Business', description: 'A balanced local-business presentation.', renderer: 'classic-business', sectionVariants: { hero: 'default', about: 'default', services: 'cards', gallery: 'default' }, variants: CLASSIC_BUSINESS_VARIANTS, defaultVariant: DEFAULT_GENERATED_TEMPLATE_VARIANT },
  'service-pro': { label: 'Service Pro', description: 'A structured professional-services presentation.', renderer: 'service-pro', sectionVariants: { hero: 'split', about: 'split', services: 'cards', gallery: 'projects', contact: 'structured' }, designDefaults: { rhythm: 'light-dark' } },
};

export function resolveGeneratedTemplateId(value?: string): GeneratedTemplateId {
  if (value === 'editorial-v1' || value === 'classic-business') return value;
  return value === 'service-pro' ? 'service-pro' : DEFAULT_GENERATED_TEMPLATE_ID;
}
