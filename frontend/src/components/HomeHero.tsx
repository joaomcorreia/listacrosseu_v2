"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { normalizeLang } from "@/lib/lang";
import { useParams } from "next/navigation";
import SnowOverlay from "@/components/effects/SnowOverlay";
import { useTranslations } from "@/i18n/translations";
import { fetchBusinesses, fetchCountriesWithStats } from "@/lib/api/listings";

type Slide = {
  title: string;
  subtitle: string;
  animation: "top" | "bottom" | "left" | "right" | "fade";
};

const slides: Slide[] = [
  {
    title: "slide_1",
    subtitle: "slide_1_subtitle",
    animation: "top",
  },
  {
    title: "slide_2",
    subtitle: "slide_2_subtitle",
    animation: "left",
  },
  {
    title: "slide_3",
    subtitle: "slide_3_subtitle",
    animation: "bottom",
  },
  {
    title: "slide_4",
    subtitle: "slide_4_subtitle",
    animation: "right",
  },
];

function getInactiveTransform(animation: Slide["animation"]) {
  switch (animation) {
    case "top":
      return "-translate-y-10";
    case "bottom":
      return "translate-y-10";
    case "left":
      return "-translate-x-12";
    case "right":
      return "translate-x-12";
    case "fade":
    default:
      return "";
  }
}

export default function HomeHero() {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(lang);
  const [activeIndex, setActiveIndex] = useState(0);
  const [businessCount, setBusinessCount] = useState<number | null>(null);
  const [countryCounts, setCountryCounts] = useState<Array<{ name: string; business_count: number }>>([]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchBusinesses({ limit: 1 }), fetchCountriesWithStats()]).then(([businesses, countries]) => {
      if (cancelled) return;
      setBusinessCount(businesses.total);
      setCountryCounts(countries.filter((country) => ["Spain", "France", "Germany"].includes(country.name)));
    }).catch(() => {
      if (!cancelled) {
        setBusinessCount(null);
        setCountryCounts([]);
      }
    });
    return () => { cancelled = true; };
  }, []);

  function goToSlide(nextIndex: number) {
    const total = slides.length;
    const normalized = ((nextIndex % total) + total) % total;
    setActiveIndex(normalized);
  }

  const slideCopy = [
    { title: t.hero.title, subtitle: businessCount === null ? "Explore businesses across Europe" : `Explore ${businessCount.toLocaleString()} listed businesses across Europe` },
    { title: t.hero.connectSmes, subtitle: t.hero.connectSmesSubtitle },
    { title: t.hero.listBusiness, subtitle: t.hero.listBusinessSubtitle },
    { title: "Create your business website", subtitle: "Start with a free 14-day trial after claiming or creating a listing" },
  ];

  return (
    <section className="relative isolate -mt-24 pt-24 min-h-[80vh] md:min-h-[90vh] overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 text-white">
      {/* EU Map Background Overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none"
        style={{
          backgroundImage: "url(/images/eu-map.png)",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      />
      <SnowOverlay />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-12 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute top-24 left-10 h-40 w-40 rounded-full bg-blue-400/20 blur-2xl" />
        <div className="absolute bottom-10 right-1/4 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-center px-4 py-16">
        <div className="relative max-w-3xl">
          <div className="relative min-h-[180px] sm:min-h-[200px]">
            {slides.map((slide, index) => {
              const isActive = index === activeIndex;
              const inactiveTransform = getInactiveTransform(slide.animation);
              const copy = slideCopy[index];
              return (
                <div
                  key={slide.title}
                  className={[
                    "absolute inset-0 transition-all duration-700 ease-out",
                    isActive
                      ? "opacity-100 translate-x-0 translate-y-0"
                      : `opacity-0 ${inactiveTransform}`,
                  ].join(" ")}
                >
                  <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
                    {copy.title}
                  </h1>
                  <p className="mt-4 text-base text-blue-100 md:text-lg">
                    {copy.subtitle}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href={`/${lang}/search`}
              className="inline-flex items-center rounded-full bg-amber-400 px-6 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-amber-300"
            >
              {t.hero.exploreBusiness}
            </Link>
            <Link
              href={`/${lang}/list-your-business`}
              className="inline-flex items-center rounded-full bg-purple-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-purple-500"
            >
              {t.nav.listYourBusiness}
            </Link>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => goToSlide(activeIndex - 1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white hover:bg-white/10"
              aria-label={t.hero.prevSlideLabel}
            >
              &#8592;
            </button>
            <button
              type="button"
              onClick={() => goToSlide(activeIndex + 1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white hover:bg-white/10"
              aria-label={t.hero.nextSlideLabel}
            >
              &#8594;
            </button>

            <div className="ml-4 flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={[
                    "h-2.5 w-2.5 rounded-full transition-all",
                    index === activeIndex ? "bg-amber-400" : "bg-white/40",
                  ].join(" ")}
                  aria-label={t.hero.goToSlideLabel.replace("{index}", String(index + 1))}
                />
              ))}
            </div>
          </div>
        </div>

        {countryCounts.length > 0 && <div className="mt-10 flex flex-wrap gap-3">
          {countryCounts.map((country) => <span key={country.name} className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-blue-100">{country.name}: {country.business_count.toLocaleString()}</span>)}
        </div>}
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
      `}</style>
    </section>
  );
}
