"use client";

import { useState } from "react";
import Link from "next/link";
import type { Business } from "@/lib/api/listings";
import { getBusinessCanonicalPath } from "@/lib/businessUrls";
import ClaimBusinessModal from "@/components/ClaimBusinessModal";

interface DirectoryBusinessListProps {
  businesses: Business[];
  lang: string;
}

function locationFor(business: Business) {
  const city = business.city?.name;
  const country = business.country?.name || business.city?.country?.name;
  return city && country ? `${city}, ${country}` : city || country || "Location not provided";
}

export default function DirectoryBusinessList({ businesses, lang }: DirectoryBusinessListProps) {
  const [claimingId, setClaimingId] = useState<number | null>(null);

  return (
    <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {businesses.map((business) => {
        const isUnclaimed = (business.tier || "free") === "free";
        return (
          <div key={business.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <Link
                href={getBusinessCanonicalPath(business, lang)}
                className="text-base font-semibold text-slate-900 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {business.name}
              </Link>
              <p className="mt-1 text-sm text-slate-600">
                {business.category?.name || "Uncategorized"} <span className="px-1 text-slate-400">·</span> {locationFor(business)}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              <Link
                href={getBusinessCanonicalPath(business, lang)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                View details
              </Link>
              {isUnclaimed && (
                <button
                  type="button"
                  onClick={() => setClaimingId(business.id)}
                  className="rounded-md px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
                >
                  Claim for free
                </button>
              )}
            </div>
            {claimingId === business.id && (
              <ClaimBusinessModal
                isOpen
                onClose={() => setClaimingId(null)}
                business={business as any}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
