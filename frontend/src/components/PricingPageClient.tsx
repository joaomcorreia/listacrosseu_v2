"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CoverageMap from "@/components/CoverageMap";
import Container from "@/components/Container";

type PricingPageClientProps = {
  lang: string;
};

type PlanId = "free" | "standard" | "premium_country" | "premium_eu";

const LANG_COUNTRY_MAP: Record<string, string> = {
  en: "NL",
  pt: "PT",
  nl: "NL",
  fr: "FR",
  de: "DE",
  es: "ES",
};

const plans = [
  {
    id: "free" as PlanId,
    name: "Free",
    price: "EUR 0",
    period: "forever",
    description: "Get listed and be discoverable across the EU directory.",
    cta: "Get Started",
    coverage: "Directory-wide listing",
  },
  {
    id: "standard" as PlanId,
    name: "Standard",
    price: "EUR 19.99",
    period: "per month",
    description: "Verified listing with richer details and better placement.",
    cta: "Get Started",
    coverage: "Country + city visibility",
  },
  {
    id: "premium_country" as PlanId,
    name: "Premium (Country)",
    price: "EUR 29.99",
    period: "per month",
    description: "Premium profile with full visibility in one country.",
    cta: "Choose your country",
    coverage: "One selected country",
  },
  {
    id: "premium_eu" as PlanId,
    name: "Premium (EU)",
    price: "EUR 39.99",
    period: "per month",
    description: "Full premium profile, media gallery, and EU-wide visibility.",
    cta: "Go Premium EU",
    coverage: "All EU countries",
  },
];

const featureRows = [
  {
    label: "Basic directory listing",
    free: true,
    standard: true,
    premium_country: true,
    premium_eu: true,
  },
  {
    label: "Verified badge",
    free: false,
    standard: true,
    premium_country: true,
    premium_eu: true,
  },
  {
    label: "Business details and services",
    free: false,
    standard: true,
    premium_country: true,
    premium_eu: true,
  },
  {
    label: "Premium media gallery",
    free: false,
    standard: false,
    premium_country: true,
    premium_eu: true,
  },
  {
    label: "Priority placement",
    free: false,
    standard: true,
    premium_country: true,
    premium_eu: true,
  },
  {
    label: "Lead form & contact buttons",
    free: false,
    standard: true,
    premium_country: true,
    premium_eu: true,
  },
  {
    label: "Coverage",
    free: "Directory-wide",
    standard: "Country + city",
    premium_country: "One country",
    premium_eu: "All EU",
  },
];

function renderFeatureCell(value: boolean | string) {
  if (typeof value === "string") {
    return <span className="text-slate-600">{value}</span>;
  }
  return (
    <span className={value ? "text-emerald-600 font-semibold" : "text-slate-400"}>
      {value ? "Included" : "-"}
    </span>
  );
}

export default function PricingPageClient({ lang }: PricingPageClientProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("premium_eu");
  const selectedCountry = useMemo(
    () => LANG_COUNTRY_MAP[lang] || "NL",
    [lang]
  );

  return (
    <>
      <section className="py-16">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="grid gap-6 md:grid-cols-2">
              {plans.map((plan) => {
                const isActive = plan.id === selectedPlan;
                return (
                  <div
                    key={plan.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedPlan(plan.id)}
                    onFocus={() => setSelectedPlan(plan.id)}
                    onMouseEnter={() => setSelectedPlan(plan.id)}
                    className={[
                      "relative rounded-2xl border bg-white p-8 shadow-sm transition",
                      isActive
                        ? "border-blue-600 shadow-xl ring-2 ring-blue-200"
                        : "border-slate-200 hover:border-blue-200 hover:shadow-md",
                    ].join(" ")}
                  >
                    {plan.id === "standard" && (
                      <span className="absolute -top-3 left-6 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                        Most Popular
                      </span>
                    )}
                    <h2 className="text-xl font-semibold text-slate-900">
                      {plan.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-slate-900">
                        {plan.price}
                      </span>
                      <span className="text-sm text-slate-500">{plan.period}</span>
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-700">
                      Coverage: <span className="text-slate-600">{plan.coverage}</span>
                    </p>
                    <Link
                      href={`/${lang}/list-your-business`}
                      className={[
                        "mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold",
                        plan.id === "premium_eu" || plan.id === "premium_country"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-slate-900 text-white hover:bg-slate-800",
                      ].join(" ")}
                    >
                      {plan.cta}
                    </Link>
                    <ul className="mt-6 space-y-3 text-sm text-slate-600">
                      <li>Directory listing</li>
                      <li>Business profile highlights</li>
                      <li>Lead capture tools</li>
                    </ul>
                  </div>
                );
              })}
            </div>
            <CoverageMap
              mode={selectedPlan === "premium_country" ? "country" : "eu"}
              countryCode={selectedCountry}
            />
          </div>
        </Container>
      </section>

      <section className="pb-20">
        <Container>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">
              Feature comparison
            </h3>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 pr-4 font-medium">Feature</th>
                    <th className="py-3 pr-4 font-medium">Free</th>
                    <th className="py-3 pr-4 font-medium">Standard</th>
                    <th className="py-3 pr-4 font-medium">Premium (Country)</th>
                    <th className="py-3 pr-4 font-medium">Premium (EU)</th>
                  </tr>
                </thead>
                <tbody>
                  {featureRows.map((row) => (
                    <tr key={row.label} className="border-b border-slate-100">
                      <td className="py-3 pr-4 text-slate-700">{row.label}</td>
                      <td className="py-3 pr-4">{renderFeatureCell(row.free)}</td>
                      <td className="py-3 pr-4">
                        {renderFeatureCell(row.standard)}
                      </td>
                      <td className="py-3 pr-4">
                        {renderFeatureCell(row.premium_country)}
                      </td>
                      <td className="py-3 pr-4">
                        {renderFeatureCell(row.premium_eu)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
