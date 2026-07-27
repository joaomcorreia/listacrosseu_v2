"use client";

import { useState } from "react";
import Link from "next/link";

const euCountryCodes = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI",
  "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
  "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
];

const countryNames: Record<string, string> = {
  AT: "Austria",
  BE: "Belgium",
  BG: "Bulgaria",
  HR: "Croatia",
  CY: "Cyprus",
  CZ: "Czech Republic",
  DK: "Denmark",
  EE: "Estonia",
  FI: "Finland",
  FR: "France",
  DE: "Germany",
  GR: "Greece",
  HU: "Hungary",
  IE: "Ireland",
  IT: "Italy",
  LV: "Latvia",
  LT: "Lithuania",
  LU: "Luxembourg",
  MT: "Malta",
  NL: "Netherlands",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  SK: "Slovakia",
  SI: "Slovenia",
  ES: "Spain",
  SE: "Sweden",
};

function FlagItem({ code, lang }: { code: string; lang: string }) {
  const [hasError, setHasError] = useState(false);
  const imgSrc = `/images/flags/${code.toLowerCase()}.png`;
  const countryName = countryNames[code] || code;
  const countrySlug = code.toLowerCase();

  return (
    <Link
      href={`/${lang}/countries/${countrySlug}`}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label={`Go to ${countryName}`}
      title={countryName}
    >
      {!hasError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={countryName}
          className="h-8 w-8 rounded-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        code
      )}
    </Link>
  );
}

export default function FlagCarousel({ lang = "en" }: { lang?: string }) {
  const carouselCodes = [...euCountryCodes, ...euCountryCodes];

  return (
    <div className="w-full border-y border-slate-200 bg-white">
      <div className="w-full overflow-hidden">
        <div className="relative flex items-center gap-3 py-4 animate-flag-scroll">
          {carouselCodes.map((code, index) => (
            <FlagItem key={`${code}-${index}`} code={code} lang={lang} />
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes flag-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-flag-scroll {
          animation: flag-scroll 24s linear infinite;
          width: max-content;
        }
        .animate-flag-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
