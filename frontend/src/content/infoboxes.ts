import type { InfoBoxItem } from "@/components/InfoBoxes";

type InfoBoxContent = {
  title?: string;
  subtitle?: string;
  items: InfoBoxItem[];
};

type InfoBoxContentByCategory = Record<string, InfoBoxContent>;

type InfoBoxContentByLocale = Record<string, { categories: InfoBoxContentByCategory }>;

export const infoboxContent: InfoBoxContentByLocale = {
  en: {
    categories: {
      employment: {
        subtitle: "Short guidance for employers hiring or contracting across the EU.",
        items: [
          {
            title: "Hiring checklist",
            description: "Clarify role type, contract terms, and local employment rules.",
            href: "/en/blog",
            icon: "HR",
          },
          {
            title: "Payroll basics",
            description: "Set up compliant payroll, taxes, and social contributions.",
            href: "/en/blog",
            icon: "PAY",
          },
          {
            title: "Compliance files",
            description: "Keep documentation for onboarding, hours, and benefits.",
            href: "/en/blog",
            icon: "DOC",
          },
          {
            title: "Cross-border teams",
            description: "Plan for remote policies, data access, and local rules.",
            href: "/en/blog",
            icon: "EU",
          },
        ],
      },
      retail: {
        subtitle: "Operational essentials for retail businesses serving EU customers.",
        items: [
          {
            title: "Inventory planning",
            description: "Forecast demand and align stock with seasonal patterns.",
            href: "/en/blog",
            icon: "INV",
          },
          {
            title: "Returns policy",
            description: "Offer clear returns and exchanges that align with EU rules.",
            href: "/en/blog",
            icon: "RET",
          },
          {
            title: "Payments and POS",
            description: "Support local payment methods and receipt requirements.",
            href: "/en/blog",
            icon: "POS",
          },
          {
            title: "Customer service",
            description: "Set response times and a clear complaint process.",
            href: "/en/blog",
            icon: "CS",
          },
        ],
      },
      "asian-restaurants": {
        subtitle: "Key operational considerations for Asian restaurant owners.",
        items: [
          {
            title: "Food safety",
            description: "Document hygiene routines and staff training.",
            href: "/en/blog",
            icon: "SAFE",
          },
          {
            title: "Allergen info",
            description: "Provide clear allergen notices on menus.",
            href: "/en/blog",
            icon: "ALL",
          },
          {
            title: "Licensing checks",
            description: "Verify local permits and inspection schedules.",
            href: "/en/blog",
            icon: "LIC",
          },
          {
            title: "Local sourcing",
            description: "Build supplier relationships for consistent quality.",
            href: "/en/blog",
            icon: "SRC",
          },
        ],
      },
    },
  },
};

export function getInfoBoxes(locale: string, categorySlug: string): InfoBoxContent | null {
  const normalized = String(locale || "en").toLowerCase();
  const localized = infoboxContent[normalized]?.categories?.[categorySlug];
  if (localized) {
    return localized;
  }
  return infoboxContent.en?.categories?.[categorySlug] || null;
}
