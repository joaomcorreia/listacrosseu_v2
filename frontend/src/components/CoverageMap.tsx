"use client";

type CoverageMapProps = {
  mode: "country" | "eu";
  countryCode?: string;
};

const EU_CODES = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
];

export default function CoverageMap({ mode, countryCode }: CoverageMapProps) {
  const normalized = (countryCode || "NL").toUpperCase();
  const selected = EU_CODES.includes(normalized) ? normalized : "NL";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Coverage Map</h3>
          <p className="mt-1 text-sm text-slate-600">
            {mode === "eu"
              ? "Premium (EU) highlights every EU country."
              : "Premium (Country) highlights a single country."}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {mode === "eu" ? "EU coverage" : `Country: ${selected}`}
        </span>
      </div>
      <div className="mt-6 grid grid-cols-6 gap-2 sm:grid-cols-9 md:grid-cols-10">
        {EU_CODES.map((code) => {
          const isActive = mode === "eu" || code === selected;
          return (
            <div
              key={code}
              className={[
                "flex h-9 items-center justify-center rounded-md border text-xs font-semibold",
                isActive
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-slate-50 text-slate-400",
              ].join(" ")}
            >
              {code}
            </div>
          );
        })}
      </div>
    </div>
  );
}
