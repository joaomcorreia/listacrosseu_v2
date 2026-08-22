// @ts-expect-error Node's native TypeScript runner requires the source extension.
import { generatedWebsiteRewriteUrl, resolveGeneratedWebsiteHost } from './generated-host.ts';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const forwardedHttp = generatedWebsiteRewriteUrl(
  'http://localhost:3004/',
  'auto-repairs-soldier',
);
assert(forwardedHttp.toString() === 'http://localhost:3004/_generated-site/auto-repairs-soldier', 'HTTP rewrite should target the generated-site route over HTTP');

const forwardedHttps = generatedWebsiteRewriteUrl(
  'https://localhost:3004/',
  'auto-repairs-soldier',
);
assert(forwardedHttps.toString() === 'http://localhost:3004/_generated-site/auto-repairs-soldier', 'HTTPS rewrite must downgrade only the internal hop to HTTP');

assert(resolveGeneratedWebsiteHost('auto-repairs-soldier.listacross.local') === 'auto-repairs-soldier', 'Generated HTTPS host should resolve to its slug');
assert(resolveGeneratedWebsiteHost('auto-repairs-soldier.listacross.local:443') === 'auto-repairs-soldier', 'Generated forwarded HTTPS host with port should resolve to its slug');
assert(resolveGeneratedWebsiteHost('listacross.local') === null, 'Apex host must not be treated as a generated website');
