"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeLang } from "@/lib/lang";
import { sanitizeSearchValue } from "@/lib/searchValues";

type Props = {
  lang: string;
  initialQuery?: string;
  initialLocation?: string;
  className?: string;
};

const labels: Record<string, { query: string; location: string; submit: string }> = {
  en: { query: "What are you looking for?", location: "City or country", submit: "Search" },
  fr: { query: "Que recherchez-vous ?", location: "Ville ou pays", submit: "Rechercher" },
  de: { query: "Wonach suchen Sie?", location: "Stadt oder Land", submit: "Suchen" },
  es: { query: "¿Qué estás buscando?", location: "Ciudad o país", submit: "Buscar" },
  pt: { query: "O que procura?", location: "Cidade ou país", submit: "Pesquisar" },
  nl: { query: "Waar bent u naar op zoek?", location: "Stad of land", submit: "Zoeken" },
};

export default function DirectorySearchForm({
  lang,
  initialQuery = "",
  initialLocation = "",
  className = "",
}: Props) {
  const router = useRouter();
  const locale = normalizeLang(lang);
  const copy = labels[locale] || labels.en;
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    const safeQuery = sanitizeSearchValue(query);
    const safeLocation = sanitizeSearchValue(location);
    if (safeQuery) params.set("q", safeQuery);
    if (safeLocation) params.set("location", safeLocation);
    const suffix = params.toString();
    router.push(`/${locale}/search${suffix ? `?${suffix}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      className={`grid gap-3 rounded-2xl bg-white/95 p-3 text-slate-900 shadow-xl sm:grid-cols-[1fr_1fr_auto] ${className}`}
      role="search"
      aria-label={copy.submit}
    >
      <label className="min-w-0">
        <span className="sr-only">{copy.query}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.query}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </label>
      <label className="min-w-0">
        <span className="sr-only">{copy.location}</span>
        <input
          type="search"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder={copy.location}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </label>
      <button
        type="submit"
        className="rounded-xl bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/60"
      >
        {copy.submit}
      </button>
    </form>
  );
}
