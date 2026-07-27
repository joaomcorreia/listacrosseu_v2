"use client";

import { useParams } from "next/navigation";
import { normalizeLang } from "@/lib/lang";
import { useTranslations } from "@/i18n/translations";
import AdPlaceholder from "./ads/AdPlaceholder";

export default function Sidebar({
  content,
}: {
  content?: "ads" | "business-detail" | "custom";
}) {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  const t = useTranslations(lang);

  if (content === "ads") {
    return (
      <div className="space-y-6 sticky top-24">
        <AdPlaceholder variant="sidebar" />
        <AdPlaceholder variant="inline" className="h-40" />
      </div>
    );
  }

  if (content === "business-detail") {
    return (
      <div className="space-y-6 sticky top-24">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-semibold mb-3">{t.sidebar.businessPromo.title}</h3>
          <p className="text-sm text-gray-600 mb-4">
            {t.sidebar.businessPromo.body}
          </p>
          <a
            href="https://justcodeworks.eu"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700"
          >
            {t.sidebar.businessPromo.button}
          </a>
        </div>
        <AdPlaceholder variant="inline" className="h-40" />
      </div>
    );
  }

  return null;
}
