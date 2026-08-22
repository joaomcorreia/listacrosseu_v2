"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { normalizeLang } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";
import AdPlaceholder from "./ads/AdPlaceholder";
import { GENERATED_WEBSITE_PRODUCT } from '@/lib/product-config';
import { resolveSidebarContent, type SidebarContext } from '@/lib/sidebar-content';
import { publicActionHref } from '@/lib/public-actions';

export default function Sidebar({
  content,
  context,
}: {
  content?: "ads" | "business-detail" | "custom";
  context?: SidebarContext;
}) {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(lang);
  const resolved = resolveSidebarContent(context);

  if (content === "ads") {
    return (
      <div className="space-y-5 lg:sticky lg:top-24">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">List Your Business Free</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Add your business to ListAcrossEU and create a free public listing.
          </p>
          <Link
            href={publicActionHref(lang, 'LIST_BUSINESS')}
            className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-blue-700 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            List Your Business Free
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">{GENERATED_WEBSITE_PRODUCT.name}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create a simple business website and try it free before deciding whether to keep it.
          </p>
          <p className="mt-3 text-xs font-semibold text-slate-500">{GENERATED_WEBSITE_PRODUCT.price} after the trial</p>
          <Link
            href={publicActionHref(lang, 'TRY_GENERATED_WEBSITE')}
            className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {GENERATED_WEBSITE_PRODUCT.cta}
          </Link>
        </div>

        <nav aria-label="Directory links" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">{resolved.heading}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{resolved.body}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {resolved.links.map(([label, href]) => (
              <li key={href + label}>
                <Link href={href.startsWith('/') ? `/${lang}${href}` : href} className="text-blue-700 hover:text-blue-900 hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <AdPlaceholder variant="sidebar" />
      </div>
    );
  }

  if (content === "business-detail") {
    return (
      <div className="space-y-6 sticky top-24">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-3">{t.sidebar.businessPromo.title}</h3>
          <p className="text-sm text-gray-600 mb-4">
            {t.sidebar.businessPromo.body}
          </p>
          <a
            href="https://justcodeworks.eu"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700"
          >
            {t.sidebar.businessPromo.button}
          </a>
        </div>
        <AdPlaceholder variant="inline" className="h-40" />
      </div>
    );
  }

  return null;
}
