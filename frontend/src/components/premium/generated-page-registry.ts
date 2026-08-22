import type { GeneratedTemplateId } from './generated-page-schema';
import { DEFAULT_GENERATED_TEMPLATE_ID } from './generated-page-schema';

export const GENERATED_PAGE_TEMPLATES: Readonly<Record<GeneratedTemplateId, { label: string }>> = {
  'editorial-v1': { label: 'Editorial' },
};

export function resolveGeneratedTemplateId(value?: string): GeneratedTemplateId {
  return value && value in GENERATED_PAGE_TEMPLATES ? value as GeneratedTemplateId : DEFAULT_GENERATED_TEMPLATE_ID;
}
