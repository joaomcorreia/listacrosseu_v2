process.env.NEXT_PUBLIC_API_BASE_URL = 'https://listacross.eu';
Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });

// @ts-expect-error Node's native TypeScript runner requires the source extension.
const { withConfiguredPublicApiUrl, withPublicApiUrl } = await import('./env.public.ts');

const configuredUrl = withConfiguredPublicApiUrl('/api/listings/generated-websites/auto-repairs-soldier/');
if (configuredUrl !== 'https://listacross.eu/api/listings/generated-websites/auto-repairs-soldier/') {
  throw new Error(`Unexpected configured Generated Website API URL: ${configuredUrl}`);
}

if (withPublicApiUrl('/api/dashboard/auth/') !== '/api/dashboard/auth/') {
  throw new Error('Existing browser same-origin API behavior changed');
}
