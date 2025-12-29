"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SnowOverlay from "@/components/effects/SnowOverlay";
import { normalizeLang } from "@/lib/lang";
import { useParams } from "next/navigation";
import {
  fetchHeroEffectSettings,
  fetchUiText,
  type HeroEffectSettings,
  type UiTextResponse,
} from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

const defaultSettings: HeroEffectSettings = {
  enabled: true,
  opacity: 0.8,
  intensity: "high",
  updated_at: "",
};

const defaultUiText: UiTextResponse = {
  group: 0,
  language: "en",
  data: {},
  updated_at: "",
};

export default function HomeHero() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const lang = normalizeLang(String(params?.lang || "en"));

  const [settings, setSettings] = useState<HeroEffectSettings>(defaultSettings);
  const [uiText, setUiText] = useState<UiTextResponse>(defaultUiText);

  // Debug log to identify this component
  console.log("HERO COMPONENT:", "src/components/HomeHero.tsx");

  useEffect(() => {
    let cancelled = false;

    async function loadSettingsAndText() {
      try {
        const [effects, text] = await Promise.all([
          fetchHeroEffectSettings(),
          fetchUiText("home", lang).catch(() => defaultUiText), // fallback if no translations
        ]);
        if (!cancelled) {
          setSettings((prev) => ({ ...prev, ...effects }));
          setUiText(text);
        }
      } catch (err) {
        console.error("Failed to load hero settings or text", err);
      }
    }

    loadSettingsAndText();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const effectiveOpacity = Math.min(Math.max(settings.opacity, 0), 1);

  const title =
    uiText.data["hero_title"] ||
    "Connect with trusted small & micro businesses across Europe.";

  const subtitle =
    uiText.data["hero_subtitle"] ||
    "ListAcrossEU helps you discover verified local businesses in every EU country — from solo professionals to small teams.";

  return (
    <section className="relative isolate -mt-20 pt-[94px] overflow-hidden bg-gradient-to-b from-[#0a3cff] to-[#00144f] text-white min-h-[520px] md:min-h-[620px]">
      {/* Christmas Snow Overlay */}
      <SnowOverlay />
      
      {/* Decorative shapes instead of images */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-xl" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-400/30 rounded-full blur-lg" />
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-indigo-400/15 rounded-full blur-2xl" />
      </div>

      <div className="relative mx-auto flex min-h-[420px] md:min-h-[520px] max-w-7xl flex-col justify-center px-4 py-16">
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-blue-200">
            European business directory
          </p>
          {/* Debug marker to identify this hero */}
          <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] px-1 z-50">HERO-DEBUG-A</div>
          <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-sm text-blue-100 md:text-base">
            {subtitle}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/${lang}/search`}
              className="inline-flex items-center rounded-full bg-amber-400 px-5 py-2 text-sm font-medium text-blue-900 shadow hover:bg-amber-300"
            >
              Browse directory
            </Link>
            <span className="text-xs text-blue-200">
              Search by country, city, category, or micro business focus.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}