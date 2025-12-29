"use client";

import { useRouter, usePathname } from "next/navigation";
import { normalizeLang, SUPPORTED_LANGS } from "@/lib/lang";

const LANG_LABELS: Record<string, string> = {
  en: "English",
  nl: "Nederlands", 
  pt: "Português",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
};

export default function LanguageSelector() {
  const router = useRouter();
  const pathname = usePathname();

  // pathname example: "/en/search" or "/nl/blog/xyz"
  const segments = pathname.split("/").filter(Boolean); // ["en", "search"]
  const current = normalizeLang(segments[0] || "en");

  function changeLang(lang: string) {
    const newSegments = [...segments];
    if (!newSegments.length) {
      newSegments.push(lang);
    } else {
      newSegments[0] = lang;
    }
    const newPath = "/" + newSegments.join("/");
    router.push(newPath);
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="lang-selector"
        className="hidden text-xs font-medium text-slate-500 md:inline-block"
      >
        Language
      </label>
      <select
        id="lang-selector"
        value={current}
        onChange={(e) => changeLang(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
      >
        {SUPPORTED_LANGS.map((code) => (
          <option key={code} value={code}>
            {LANG_LABELS[code]}
          </option>
        ))}
      </select>
    </div>
  );
}