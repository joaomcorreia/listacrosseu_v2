"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { translations, useTranslations } from "@/i18n/translations";
import { countryCategoryCopy } from "@/lib/country-category-copy";
import {
  fetchBusinesses,
  type Business,
  type BusinessSearchResult,
  type Category,
  type Country,
} from "@/lib/api/listings";
import BusinessCard from "@/components/BusinessCard";
import DirectoryBusinessList from "@/components/DirectoryBusinessList";
import DirectoryViewToggle, { type DirectoryView } from "@/components/DirectoryViewToggle";

function format(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template,
  );
}

export default function CountryCategoryPageClient({
  lang,
  country,
  category,
  listingCount,
}: {
  lang: string;
  country: Country;
  category: Category;
  listingCount: number;
}) {
  const t = useTranslations(lang);
  const directory = t.directory ?? translations.en.directory;
  const categoriesText = directory.categories ?? translations.en.directory.categories;
  const copy = countryCategoryCopy(category, country, lang);
  const countryName = copy.countryName;
  const categoryName = copy.categoryName;
  const [businesses, setBusinesses] = useState<BusinessSearchResult | null>(null);
  const [view, setView] = useState<DirectoryView>("grid");
  const [loading, setLoading] = useState(true);
  const limit = 24;

  useEffect(() => {
    let cancelled = false;
    fetchBusinesses({ country: country.slug, category: category.slug, limit })
      .then((result) => {
        if (!cancelled) setBusinesses(result);
      })
      .catch(() => {
        if (!cancelled) setBusinesses({ total: 0, limit, offset: 0, results: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country.slug, category.slug]);

  useEffect(() => {
    const saved = window.localStorage.getItem("listacrosseu-directory-view");
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);

  function changeView(nextView: DirectoryView) {
    setView(nextView);
    window.localStorage.setItem("listacrosseu-directory-view", nextView);
  }

  const results = businesses?.results || [];
  const title = copy.title.replace(" | ListAcross EU", "");
  const subtitle = format(categoriesText.heroCount, {
    count: (businesses?.total ?? listingCount).toLocaleString(),
    category: categoryName,
  });

  return (
    <div className="bg-slate-50">
      <section className="relative isolate -mt-16 bg-gradient-to-r from-purple-700 to-blue-700 pt-16 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-purple-100">{countryName}</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-5xl">{title}</h1>
          <p className="mt-4 text-lg text-purple-100">{subtitle}</p>
          <Link
            href={`/${lang}/search?country=${encodeURIComponent(country.slug)}&category=${encodeURIComponent(category.slug)}`}
            className="mt-7 inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-purple-800 shadow-sm hover:bg-purple-50"
          >
            {categoriesText.advancedSearch}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="leading-7 text-slate-700">
            {copy.intro}
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl bg-white p-8 text-sm text-slate-500">{categoriesText.loading}</div>
        ) : results.length > 0 ? (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-slate-900">
                {format(categoriesText.resultsTitle, { category: categoryName })}
              </h2>
              <DirectoryViewToggle value={view} onChange={changeView} />
            </div>
            {view === "grid" ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {results.map((business) => <BusinessCard key={business.id} business={business as any} lang={lang} />)}
              </div>
            ) : (
              <DirectoryBusinessList businesses={results} lang={lang} />
            )}
          </>
        ) : (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{categoriesText.noBusinessesTitle}</h2>
            <p className="mt-2 text-slate-600">{categoriesText.noBusinessesBody}</p>
          </div>
        )}
      </section>
    </div>
  );
}
