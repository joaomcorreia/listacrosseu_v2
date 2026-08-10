import Link from "next/link";
import Layout from "@/components/Layout";
import InnerPageHero from "@/components/InnerPageHero";
import DirectoryBusinessList from "@/components/DirectoryBusinessList";
import { INTERNAL_BACKEND_URL } from "@/lib/env.server";
import type { Business } from "@/lib/api/listings";

type VisibilityPageKind =
  | "business-visibility"
  | "ai-visibility"
  | "promote-your-business-free"
  | "get-found-online";

type PageCopy = {
  eyebrow: string;
  title: string;
  description: string;
  introTitle: string;
  intro: string;
  points: { title: string; body: string }[];
  timeTitle: string;
  timeBody: string;
  listingsTitle: string;
  listingsBody: string;
};

const COPY: Record<VisibilityPageKind, PageCopy> = {
  "business-visibility": {
    eyebrow: "Business visibility",
    title: "Help more people discover your business",
    description:
      "Build a stronger public presence across business listings, search engines, social platforms and emerging AI-powered discovery tools.",
    introTitle: "Visibility starts with clear, accurate business information",
    intro:
      "Customers can discover a company in many different places. A useful public listing gives search and discovery services another reliable place to understand what the business does, where it is located and how customers can contact it.",
    points: [
      { title: "Be consistent", body: "Keep your business name, location, category, website and contact details accurate across the web." },
      { title: "Be specific", body: "Clear descriptions, services and categories help people and automated systems understand when your business is relevant." },
      { title: "Build over time", body: "Visibility is cumulative. New pages and updated information need time to be discovered, crawled and evaluated." },
    ],
    timeTitle: "Good visibility is built, not switched on",
    timeBody:
      "No directory, search engine or AI platform can guarantee immediate placement. We focus on creating useful public information and stronger discovery signals that can grow over time.",
    listingsTitle: "Businesses building their presence",
    listingsBody: "Explore claimed ListAcrossEU listings. Claiming a listing is free and helps business owners keep their public information accurate.",
  },
  "ai-visibility": {
    eyebrow: "AI visibility",
    title: "Prepare your business for AI-powered discovery",
    description:
      "AI search tools increasingly help people discover local companies. Give them clear, public and structured information they can understand.",
    introTitle: "Make your business easier to understand online",
    intro:
      "Services such as ChatGPT can search the public web when answering relevant questions. There is no guaranteed placement, but crawlable pages with accurate business information can create a stronger foundation for discovery.",
    points: [
      { title: "Public information", body: "Your business needs useful pages that search and AI crawlers are allowed to access." },
      { title: "Clear context", body: "Location, category, services, contact details and descriptive content help establish what the business is and when it may be relevant." },
      { title: "Independent signals", body: "A consistent presence across your own site, directories, profiles and genuine customer feedback can strengthen the wider public footprint." },
    ],
    timeTitle: "AI visibility takes time",
    timeBody:
      "Publishing or updating a page does not mean an AI service will immediately use it. Crawling, indexing, relevance and reliability signals develop over time, and no third party can promise when a particular business will appear.",
    listingsTitle: "Public businesses on ListAcrossEU",
    listingsBody: "These claimed listings are examples of public business information that can be discovered across the open web.",
  },
  "promote-your-business-free": {
    eyebrow: "Free business promotion",
    title: "Start promoting your business without an advertising budget",
    description:
      "A public ListAcrossEU listing is free. Add your business, keep the information accurate and create another place where potential customers can discover you.",
    introTitle: "Start with the things that do not require ad spend",
    intro:
      "Small businesses do not always need to begin with paid advertising. Accurate listings, useful profiles, local search visibility, social pages and genuine recommendations can create a foundation before you decide where paid promotion is worth the money.",
    points: [
      { title: "List for free", body: "Create or claim a ListAcrossEU business listing without paying for advertising exposure." },
      { title: "Keep it accurate", body: "Make sure customers can find the correct website, telephone number, location and business category." },
      { title: "Expand when useful", body: "Paid pages and visibility services can come later when the business needs a richer online presence." },
    ],
    timeTitle: "Free visibility still needs patience",
    timeBody:
      "A new listing is another public discovery point, not an instant stream of customers. Search engines, AI services and people need time to encounter and trust new information.",
    listingsTitle: "Recently claimed businesses",
    listingsBody: "See businesses that have taken control of their ListAcrossEU presence. Business owners can claim an existing listing for free.",
  },
  "get-found-online": {
    eyebrow: "Get found online",
    title: "Create more ways for customers to find your business",
    description:
      "Your website is only one discovery point. Business directories, local search, social profiles and AI-powered search can all help customers reach you.",
    introTitle: "Think in discovery paths, not one platform",
    intro:
      "Someone may search by city, category, service, language or a conversational question. The stronger and more consistent your public business information is, the more useful paths you create back to your company.",
    points: [
      { title: "Own your details", body: "Make your core business information easy to verify and keep it updated when something changes." },
      { title: "Connect the web", body: "Link useful profiles and pages together so customers can move from discovery to your website, telephone, directions or other contact channels." },
      { title: "Measure what matters", body: "As traffic grows, focus on useful actions such as visits, calls, directions and enquiries rather than visibility claims alone." },
    ],
    timeTitle: "Discovery grows in layers",
    timeBody:
      "Online visibility usually improves through repeated discovery and consistent information. Changes can take days, weeks or longer to be reflected across different services.",
    listingsTitle: "Explore businesses already listed",
    listingsBody: "Browse claimed businesses and see how ListAcrossEU connects business information with location and category discovery.",
  },
};

async function fetchClaimedBusinesses(): Promise<Business[]> {
  const params = new URLSearchParams({ tier: "claimed", limit: "8", offset: "0" });
  try {
    const response = await fetch(`${INTERNAL_BACKEND_URL}/api/listings/businesses/search/?${params.toString()}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 900 },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return [];
  }
}

export function getVisibilityPageCopy(kind: VisibilityPageKind): PageCopy {
  return COPY[kind];
}

export default async function VisibilityLandingPage({
  lang,
  kind,
}: {
  lang: string;
  kind: VisibilityPageKind;
}) {
  const copy = COPY[kind];
  const businesses = await fetchClaimedBusinesses();

  return (
    <Layout>
      <InnerPageHero
        variant="medium"
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        breadcrumbs={[{ label: "Home", href: `/${lang}` }, { label: copy.eyebrow }]}
        actions={[
          { label: "List your business for free", href: `/${lang}/list-your-business` },
          { label: "Browse businesses", href: `/${lang}/businesses` },
        ]}
      />

      <main className="bg-slate-50 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl space-y-16 px-4 sm:px-6 lg:px-8">
          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{copy.introTitle}</h2>
              <p className="mt-4 text-base leading-7 text-slate-700">{copy.intro}</p>
            </div>
            <div className="grid gap-4">
              {copy.points.map((point) => (
                <article key={point.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-950">{point.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{point.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">{copy.timeTitle}</h2>
            <p className="mt-3 max-w-4xl leading-7 text-slate-700">{copy.timeBody}</p>
          </section>

          <section>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{copy.listingsTitle}</h2>
                <p className="mt-2 max-w-3xl text-slate-600">{copy.listingsBody}</p>
              </div>
              <Link href={`/${lang}/list-your-business`} className="shrink-0 text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline">
                List your business for free
              </Link>
            </div>
            {businesses.length > 0 ? (
              <DirectoryBusinessList businesses={businesses} lang={lang} />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="font-medium text-slate-800">Claimed business examples will appear here as the directory grows.</p>
                <Link href={`/${lang}/list-your-business`} className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline">
                  Add or claim your business for free
                </Link>
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-slate-950 px-6 py-9 text-white sm:px-9">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Start with a free listing</h2>
                <p className="mt-2 max-w-2xl text-slate-300">Build a public business presence first. Stronger paid visibility options can be added later when they make sense for your company.</p>
              </div>
              <Link href={`/${lang}/list-your-business`} className="inline-flex shrink-0 justify-center rounded-lg bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-blue-50">
                List your business for free
              </Link>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
}
