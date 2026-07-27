"use client";

import { useRouter, usePathname, useParams } from "next/navigation";
import { useState } from "react";
import { normalizeLang, SUPPORTED_LANGS } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";
import { debugWarn } from "@/lib/debug";
import { resolveBlogDetailTargetUrl } from "@/lib/blogRouting";

const FLAG_MAP: Record<string, string> = {
  en: "/images/flags/lang-flags/uk.png",
  pt: "/images/flags/lang-flags/pt.png",
  nl: "/images/flags/lang-flags/nl.png",
  fr: "/images/flags/lang-flags/fr.png",
  de: "/images/flags/lang-flags/de.png",
  es: "/images/flags/lang-flags/es.png",
};

type LanguageSelectorProps = {
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
};

export default function LanguageSelector({
  className = "",
  buttonClassName = "",
  menuClassName = "",
}: LanguageSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [open, setOpen] = useState(false);

  // pathname example: "/en/search" or "/nl/blog/xyz"
  const segments = pathname.split("/").filter(Boolean); // ["en", "search"]
  const current = normalizeLang(segments[0] || "en");
  const t = useTranslations(current);

  async function changeLang(lang: string) {
    const newSegments = [...segments];
    if (!newSegments.length) {
      newSegments.push(lang);
    } else {
      newSegments[0] = lang;
    }

    const isBlogDetail = newSegments.length >= 3 && newSegments[1] === "blog";
    if (isBlogDetail) {
      const currentSlug = String(params?.slug || newSegments[2] || "");
      let currentId: number | null = null;

      try {
        const storedId =
          window.sessionStorage.getItem("blogPostId") ||
          window.sessionStorage.getItem(`blogPostId:${current}:${currentSlug}`);
        currentId = storedId ? Number(storedId) : null;
      } catch (storageError) {
        debugWarn("Unable to read blog post id for language switch.", storageError);
      }

      const targetUrl = await resolveBlogDetailTargetUrl({
        currentLang: current,
        currentSlug,
        targetLang: lang,
        storedId: currentId,
      });
      router.push(targetUrl);
      return;
    }

    const newPath = "/" + newSegments.join("/");
    router.push(newPath);
  }

  const currentLabel = t.language.options[current] || current.toUpperCase();
  const currentFlag = FLAG_MAP[current] || FLAG_MAP.en;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200 ${buttonClassName}`}
        aria-label={t.language.ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <img
          src={currentFlag}
          alt={currentLabel}
          className="h-5 w-5 rounded-sm object-cover"
        />
        <span className="sr-only">{currentLabel}</span>
        <svg className="h-3 w-3 text-current opacity-70" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.25 7.5L10 12.25 14.75 7.5H5.25z" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-2 w-44 rounded-md border border-slate-200 bg-white shadow-lg z-50 ${menuClassName}`}
          role="listbox"
        >
          {SUPPORTED_LANGS.map((code) => {
            const label = t.language.options[code] || code.toUpperCase();
            const flag = FLAG_MAP[code] || FLAG_MAP.en;
            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setOpen(false);
                  changeLang(code);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-100 ${
                  code === current ? "bg-slate-50 text-slate-900" : "text-slate-700"
                }`}
                role="option"
                aria-selected={code === current}
              >
                <img
                  src={flag}
                  alt={label}
                  className="h-5 w-5 rounded-sm object-cover"
                />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

