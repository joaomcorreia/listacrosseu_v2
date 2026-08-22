import { proxySitemap } from "@/lib/sitemap-proxy";

export function GET() {
  return proxySitemap("businesses");
}
