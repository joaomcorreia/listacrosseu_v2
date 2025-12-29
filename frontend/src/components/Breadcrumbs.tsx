"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeLang } from "@/lib/lang";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  current?: string;
  items?: BreadcrumbItem[];
  variant?: 'light' | 'dark';
}

export default function Breadcrumbs({ 
  current, 
  items, 
  variant = 'light' 
}: BreadcrumbsProps) {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || "en"));
  
  // Use new items format if provided, otherwise fall back to legacy current prop
  const breadcrumbItems = items || [
    { label: 'Home', href: `/${lang}` },
    { label: current || '' }
  ];

  const baseClasses = "flex items-center gap-2";
  const colorClasses = variant === 'dark' 
    ? "text-white/80" 
    : "opacity-90";

  return (
    <div className={`${baseClasses} ${colorClasses}`}>
      {breadcrumbItems.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && <span>/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}