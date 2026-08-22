export type PublicAction =
  | 'LIST_BUSINESS'
  | 'TRY_GENERATED_WEBSITE'
  | 'MANAGE_GENERATED_WEBSITE'
  | 'GENERATED_WEBSITE_PAYMENT';

export type PublicActionContext = Partial<Record<'category' | 'city' | 'region' | 'country', string>>;

export function publicActionHref(lang: string, action: PublicAction, context: PublicActionContext = {}): string {
  let path: string;
  switch (action) {
    case 'LIST_BUSINESS':
      path = `/${lang}/list-your-business`;
      break;
    case 'TRY_GENERATED_WEBSITE':
      path = `/${lang}/list-your-business?next=generated-website`;
      break;
    case 'MANAGE_GENERATED_WEBSITE':
      path = `/${lang}/dashboard?next=generated-website`;
      break;
    case 'GENERATED_WEBSITE_PAYMENT':
      path = `/${lang}/dashboard?next=payment`;
      break;
  }
  const params = new URLSearchParams();
  Object.entries(context).forEach(([key, value]) => { if (value) params.set(key, value); });
  return params.size ? `${path}${path.includes('?') ? '&' : '?'}${params.toString()}` : path;
}

export function actionHrefForLabel(lang: string, label: string | undefined, fallback?: string, context?: PublicActionContext): string {
  const value = (label || '').toLowerCase();
  if (value.includes('generated') || value.includes('start free trial') || value.includes('try your')) {
    return publicActionHref(lang, 'TRY_GENERATED_WEBSITE', context);
  }
  if (value.includes('list') || value.includes('claim')) {
    return publicActionHref(lang, 'LIST_BUSINESS', context);
  }
  return fallback || publicActionHref(lang, 'LIST_BUSINESS');
}
