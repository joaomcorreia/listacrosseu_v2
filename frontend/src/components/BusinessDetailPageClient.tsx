"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { normalizeLang } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";
import { fetchBusinessDetail, type BusinessDetail } from "@/lib/api";

export default function BusinessDetailPageClient() {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  const slug = String(params?.slug || "");
  const t = useTranslations(lang);

  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchBusinessDetail({ slug, lang });
        if (!cancelled) setBusiness(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(t.business.errorLoad);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, lang, t]);

  if (loading && !business) {
    return (
      <div className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-500">
            {t.business.loading}
          </div>
        </div>
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!business) return null;

  const b = business;

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {b.name}
              </h1>
              <div className="mt-1 text-xs text-slate-500">
                {b.city?.name && b.country?.name
                  ? `${b.city.name}, ${b.country.name}`
                  : b.country?.name || ""}
              </div>
              {b.is_micro && (
                <span className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {t.business.microBadge}
                </span>
              )}
            </div>
            {b.website && (
              <a
                href={b.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow hover:bg-blue-700"
              >
                {t.business.visitWebsite}
              </a>
            )}
          </div>

          {b.description && (
            <p className="mt-4 text-sm text-slate-700">{b.description}</p>
          )}

          <div className="mt-4 grid gap-3 text-xs text-slate-700 md:grid-cols-2">
            {b.address && (
              <div>
                <div className="font-semibold text-slate-900">{t.business.addressLabel}</div>
                <div>{b.address}</div>
              </div>
            )}
            {(b.phone || b.website) && (
              <div>
                <div className="font-semibold text-slate-900">{t.business.contactLabel}</div>
                {b.phone && (
                  <div>
                    {t.business.phoneLabel}: {b.phone}
                  </div>
                )}
                {b.website && (
                  <div>
                    {t.business.websiteLabel}:
                    <a
                      href={b.website}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1 text-blue-600 hover:underline"
                    >
                      {b.website}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {b.category && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                {b.category.name}
              </span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
