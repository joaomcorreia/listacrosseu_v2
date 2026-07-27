"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Business } from "@/lib/api/listings";
import { normalizeLang } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";

interface BusinessListProps {
  businesses: Business[];
  title?: string;
  showPagination?: boolean;
  total?: number;
  limit?: number;
  offset?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
}

export default function BusinessList({
  businesses,
  title,
  showPagination = false,
  total = 0,
  limit = 20,
  offset = 0,
  onPrevPage,
  onNextPage,
}: BusinessListProps) {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(lang);
  const canPrev = showPagination && offset > 0;
  const canNext = showPagination && offset + limit < total;

  return (
    <div className="space-y-6">
      {title && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {total > 0
              ? t.messages.businessList.totalFound.replace("{count}", String(total))
              : t.messages.businessList.noneFound}
          </p>
        </div>
      )}

      {businesses.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <div className="text-slate-400">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            {t.messages.businessList.emptyTitle}
          </h3>
          <p className="mt-2 text-slate-600">
            {t.messages.businessList.emptyBody}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {businesses.map((business) => (
            <div
              key={business.id}
              className="rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-slate-900">
                        <Link
                          href={`/${lang}/business/${business.slug}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {business.name}
                        </Link>
                      </h3>

                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                        {business.category && (
                          <>
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              {business.category.name}
                            </span>
                            <span className="text-slate-400">{t.actions.separator}</span>
                          </>
                        )}
                        <span>
                          {business.city?.name}
                          {business.country?.name && `, ${business.country.name}`}
                        </span>
                        {business.is_micro && (
                          <>
                            <span className="text-slate-400">{t.actions.separator}</span>
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              {t.businessCard.microBadge}
                            </span>
                          </>
                        )}
                      </div>

                      {business.address && (
                        <p className="mt-2 text-sm text-slate-600">
                          {t.businessCard.address}: {business.address}
                        </p>
                      )}

                      {business.description && (
                        <p className="mt-2 text-sm text-slate-700 line-clamp-2">
                          {business.description}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-4">
                        {business.website && (
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                            </svg>
                            {t.buttons.visitWebsite}
                          </a>
                        )}
                        {business.phone && (
                          <a
                            href={`tel:${business.phone}`}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                            </svg>
                            {t.buttons.call}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPagination && (businesses.length > 0 || total > 0) && (
        <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm">
          <div className="text-sm text-slate-600">
            {t.messages.businessList.resultsSummary
              .replace("{start}", String(offset + 1))
              .replace("{end}", String(Math.min(offset + limit, total)))
              .replace("{total}", String(total))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onPrevPage}
              disabled={!canPrev}
              className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
            >
              {t.buttons.previous}
            </button>
            <button
              onClick={onNextPage}
              disabled={!canNext}
              className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
            >
              {t.buttons.next}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
