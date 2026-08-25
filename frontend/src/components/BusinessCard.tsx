"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { BriefcaseBusiness, MapPin, Phone, Globe, Mail, Tag } from "lucide-react";
import { useModal } from "../hooks/useModal";
import ClaimBusinessModal from "./ClaimBusinessModal";
import ViewBusinessDetailsModal from "./modals/ViewBusinessDetailsModal";
import { useTranslations } from "@/i18n/translations";
import { normalizeLang } from "@/lib/lang";
import { debugLog } from "@/lib/debug";
import Link from "next/link";
import { getBusinessCanonicalPath } from "@/lib/businessUrls";

interface Business {
  id: number;
  name: string;
  slug: string;
  tier?: "free" | "claimed" | "premium";
  plan_type?: "free" | "claimed" | "premium";
  category_name?: string;
  country?: {
    id: number;
    name: string;
    slug: string;
  };
  city?: {
    id: number;
    name: string;
    slug: string;
    country: {
      id: number;
      name: string;
      slug: string;
    };
  };
  town?: {
    id: number;
    name: string;
    slug: string;
    city: {
      id: number;
      name: string;
      slug: string;
      country: {
        id: number;
        name: string;
        slug: string;
      };
    };
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  address?: string;
  address_line1?: string;
  postal_code?: string;
  website?: string;
  phone?: string;
  email?: string;
  description?: string;
  logo_url?: string;
  image_url?: string;
  accent_color?: string;
  canonical_path?: string;
}

interface BusinessCardProps {
  business: Business;
  onClaim?: () => void;
  onViewDetails?: () => void;
  lang?: string;
}

function isUserLoggedIn(): boolean {
  return false;
}

function getLocationString(business: Business) {
  const city = business.city?.name;
  const country = business.country?.name || business.city?.country?.name;
  if (city && country) return `${city}, ${country}`;
  return city || country || "";
}

function getAddressLine(business: Business) {
  if (business.address_line1) {
    return business.postal_code
      ? `${business.address_line1}, ${business.postal_code}`
      : business.address_line1;
  }
  return business.address || "";
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function getCategoryLabel(business: Business) {
  const categoryValue = (business as any).category;
  if (typeof categoryValue === "string") return categoryValue;
  return business.category?.name || business.category_name || "";
}

function getClaimedAccent(business: Business) {
  return business.tier === 'claimed' && /^#[0-9A-F]{6}$/i.test(business.accent_color || '') ? business.accent_color : '#2563EB';
}

const CARD_ACCENTS = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-teal-100 text-teal-700',
  'bg-emerald-100 text-emerald-700',
] as const;

function getCardAccent(business: Business) {
  return CARD_ACCENTS[Math.abs(business.id) % CARD_ACCENTS.length];
}

function BusinessCardIcon({ business, imageUrl }: { business: Business; imageUrl?: string }) {
  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg ${getCardAccent(business)}`} aria-hidden={!imageUrl}>
      {imageUrl ? <img src={imageUrl} alt={`${business.name} logo`} className="h-full w-full object-contain p-1.5" /> : <BriefcaseBusiness className="h-6 w-6" />}
    </div>
  );
}

function CategoryBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex w-fit max-w-full items-center whitespace-normal break-words rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium leading-4 text-blue-700">
      <Tag className="mr-1 h-3.5 w-3.5" />
      {label}
    </span>
  );
}

// Main BusinessCard Router - Single source of truth for tier-based rendering
export default function BusinessCard({ business, onClaim, lang }: BusinessCardProps) {
  const router = useRouter();
  const params = useParams();
  const claimModal = useModal();
  const viewDetailsModal = useModal();
  const didLogRef = useRef(false);

  const effectiveLang = normalizeLang(String(lang || params?.lang || "en"));
  const t = useTranslations(effectiveLang);
  const tier = business.plan_type ?? business.tier ?? "free";

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (didLogRef.current) return;
    didLogRef.current = true;
    debugLog("BusinessCard debug:", {
      id: business.id,
      name: business.name,
      tier,
      category: (business as any).category,
      category_name: business.category_name,
    });
  }, [business, tier]);

  const handleClaimClick = () => {
    claimModal.openModal();
  };

  const handleViewDetailsClick = () => {
    if (tier === "premium") {
      const currentLang = lang || "en";
      window.open(`/${currentLang}/premium-preview`, "_blank", "noopener,noreferrer");
    } else {
      if (isUserLoggedIn()) {
        router.push("/dashboard");
        return;
      }
      viewDetailsModal.openModal();
    }
  };

  const renderCard = () => {
    switch (tier) {
      case "premium":
        return (
          <PremiumBusinessCard
            business={business}
            onClaim={onClaim}
            onViewDetails={handleViewDetailsClick}
            t={t}
          />
        );
      case "claimed":
        return (
          <ClaimedBusinessCard
            business={business}
            onClaim={onClaim}
            onViewDetails={handleViewDetailsClick}
            t={t}
          />
        );
      default:
        return (
          <FreeBusinessCard
            business={business}
            onClaim={handleClaimClick}
            t={t}
            lang={effectiveLang}
          />
        );
    }
  };

  const wrapperClassName = ["relative flex h-full flex-col", tier === "premium" ? "col-span-2" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClassName}>
      {renderCard()}
      <ClaimBusinessModal
        isOpen={claimModal.isOpen}
        onClose={claimModal.closeModal}
        business={business as any}
      />
      <ViewBusinessDetailsModal
        isOpen={viewDetailsModal.isOpen}
        onClose={viewDetailsModal.closeModal}
        business={business}
      />
    </div>
  );
}

function FreeBusinessCard({
  business,
  onClaim,
  t,
  lang,
}: BusinessCardProps & {
  t: ReturnType<typeof useTranslations>;
  lang: string;
}) {
  const categoryLabel = getCategoryLabel(business) || t.businessCard.uncategorized;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-full items-start gap-3 p-4 sm:p-5">
        <BusinessCardIcon business={business} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Link
          href={getBusinessCanonicalPath(business, lang)}
          className="line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-7 text-gray-900 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {business.name}
        </Link>

        <CategoryBadge label={categoryLabel} />

        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="mr-1 h-4 w-4" />
          <span className="truncate">{getLocationString(business)}</span>
        </div>

        <button
          onClick={onClaim}
          className="mt-auto pt-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Claim for free
        </button>
        </div>
      </div>
    </div>
  );
}

function ClaimedBusinessCard({
  business,
  onViewDetails,
  t,
}: BusinessCardProps & { t: ReturnType<typeof useTranslations> }) {
  const categoryLabel = getCategoryLabel(business) || t.businessCard.uncategorized;
  const websiteLabel = business.website
    ? business.website.replace(/^https?:\/\//, "").replace(/^www\./, "")
    : "";
  const accent = getClaimedAccent(business);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-full items-start gap-3 p-4">
        <BusinessCardIcon business={business} imageUrl={business.logo_url} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-h-[3.5rem] items-start justify-between gap-2">
          <h3 className="line-clamp-2 min-w-0 flex-1 text-lg font-bold leading-7 text-gray-900">{business.name}</h3>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ color: accent, backgroundColor: `${accent}14` }}>
            {t.badges.verified}
          </span>
        </div>

        <CategoryBadge label={categoryLabel} />

        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="mr-1 h-4 w-4" />
          <span className="truncate">{getLocationString(business)}</span>
        </div>

        {business.phone && (
          <a
            href={`tel:${business.phone}`}
            className="flex items-center text-sm text-gray-700 hover:text-blue-600"
          >
            <Phone className="mr-2 h-4 w-4" />
            {business.phone}
          </a>
        )}

        {business.website ? (
          <a
            href={business.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-gray-700 hover:text-blue-600"
          >
            <Globe className="mr-2 h-4 w-4" />
            <span className="truncate">{websiteLabel}</span>
          </a>
        ) : business.email ? (
          <a
            href={`mailto:${business.email}`}
            className="flex items-center text-sm text-gray-700 hover:text-blue-600"
          >
            <Mail className="mr-2 h-4 w-4" />
            {business.email}
          </a>
        ) : null}

        {business.description && (
          <p className="line-clamp-2 text-sm text-gray-600">
            {truncateText(business.description, 100)}
          </p>
        )}

        <button
          onClick={onViewDetails}
          className="mt-auto w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {t.buttons.viewDetails}
        </button>
        </div>
      </div>
    </div>
  );
}

function PremiumBusinessCard({
  business,
  onViewDetails,
  t,
}: BusinessCardProps & { t: ReturnType<typeof useTranslations> }) {
  const categoryLabel = getCategoryLabel(business) || t.businessCard.uncategorized;
  const imageUrl = business.logo_url || business.image_url;
  const websiteLabel = business.website
    ? business.website.replace(/^https?:\/\//, "").replace(/^www\./, "")
    : "";

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-full items-start gap-3 p-4">
        <BusinessCardIcon business={business} imageUrl={imageUrl} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-h-[3.5rem] items-start justify-between gap-3">
          <h3 className="line-clamp-2 min-w-0 flex-1 text-lg font-bold leading-7 text-gray-900">{business.name}</h3>
          <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
            {`★ ${t.badges.premium}`}
          </span>
        </div>

        <CategoryBadge label={categoryLabel} />

        <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="mr-1 h-4 w-4" />
              <span>{getLocationString(business)}</span>
            </div>
            {getAddressLine(business) && (
              <div className="text-xs text-gray-500">{getAddressLine(business)}</div>
            )}
        </div>

        {business.phone && (
          <a
            href={`tel:${business.phone}`}
            className="flex items-center text-sm text-gray-700 hover:text-orange-600"
          >
            <Phone className="mr-2 h-4 w-4" />
            {business.phone}
          </a>
        )}

        {business.website && (
          <a
            href={business.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-gray-700 hover:text-orange-600"
          >
            <Globe className="mr-2 h-4 w-4" />
            <span className="truncate">{websiteLabel}</span>
          </a>
        )}

        {business.email && (
          <a
            href={`mailto:${business.email}`}
            className="flex items-center text-sm text-gray-700 hover:text-orange-600"
          >
            <Mail className="mr-2 h-4 w-4" />
            {business.email}
          </a>
        )}

        {business.description && (
          <p className="line-clamp-2 text-sm text-gray-600">
            {business.description}
          </p>
        )}

        <button
          onClick={onViewDetails}
          className="mt-auto w-full rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
        >
          {t.buttons.viewDetails}
        </button>
        </div>
      </div>
    </div>
  );
}


