"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { normalizeLang } from "@/lib/lang";
import { fetchSidebarItems, type SidebarItem } from "@/lib/api";

type SidebarProps = {
  slot: string; // e.g. "search_page", "blog_post"
};

export default function Sidebar({ slot }: SidebarProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = normalizeLang(String(params?.lang || "en"));

  const [items, setItems] = useState<SidebarItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSidebarItems({ slot, lang });
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Failed to load sidebar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slot, lang]);

  if (loading && items.length === 0) {
    return (
      <aside className="space-y-3">
        <div className="rounded-xl bg-slate-100 p-4 text-xs text-slate-500">
          Loading sponsored links…
        </div>
      </aside>
    );
  }

  if (error && items.length === 0) {
    return null; // silently fail, main content is more important
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <aside className="space-y-3">
      {items.map((item) => {
        if (item.content_html) {
          // Custom HTML (affiliate embed, etc.)
          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              dangerouslySetInnerHTML={{ __html: item.content_html }}
            />
          );
        }

        return (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-2"
          >
            <div className="text-sm font-semibold text-slate-900">
              {item.title}
            </div>
            {item.image_url && (
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <a href={item.link_url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-auto w-full object-cover"
                  />
                </a>
              </div>
            )}
            {item.link_url && (
              <a
                href={item.link_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex text-xs font-medium text-blue-600 hover:underline"
              >
                {item.link_text || "Learn more"}
              </a>
            )}
          </div>
        );
      })}
    </aside>
  );
}