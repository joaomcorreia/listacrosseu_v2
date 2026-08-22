"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeLang } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";
import { publicActionHref } from "@/lib/public-actions";

export default function TopHeader() {
  const params = useParams();
  const currentLang = normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(currentLang);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50);
    }

    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={[
        "fixed inset-x-0 top-0 z-50 h-8 text-white transition-colors duration-200",
        scrolled ? "bg-blue-700/90 shadow-sm backdrop-blur" : "bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-xs sm:px-6 lg:px-8">
        <span className="font-medium">{t.nav.brandName}</span>
        <span className="hidden sm:inline">
          {t.nav.tagline}
        </span>
        <Link
          href={publicActionHref(currentLang, 'LIST_BUSINESS')}
          className="font-medium text-white/90 hover:text-white"
        >
          {t.nav.listYourBusiness}
        </Link>
      </div>
    </div>
  );
}
