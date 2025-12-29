"use client";

import { CountryWithStats } from "@/lib/api/listings";

interface CountryExplorerStatsProps {
  countries: CountryWithStats[];
}

export default function CountryExplorerStats({ countries }: CountryExplorerStatsProps) {
  // Calculate totals
  const totalBusinesses = countries.reduce((sum, country) => sum + country.business_count, 0);
  const totalCities = countries.reduce((sum, country) => sum + country.city_count, 0);
  const totalCountries = countries.length;

  // Find largest countries by business count
  const topCountries = [...countries]
    .sort((a, b) => b.business_count - a.business_count)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
          Quick Stats
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">Countries Available</span>
            <span className="font-semibold text-lg text-slate-900">
              {totalCountries}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">Total Cities</span>
            <span className="font-semibold text-lg text-slate-900">
              {totalCities.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-600 text-sm">Total Businesses</span>
            <span className="font-semibold text-lg text-blue-600">
              {totalBusinesses.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Top Countries */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Most Active
        </h3>
        
        <div className="space-y-3">
          {topCountries.map((country, index) => (
            <div key={country.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-slate-900">
                  {country.name}
                </span>
              </div>
              <span className="text-sm text-slate-600">
                {country.business_count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* EU Info */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="European Union flag">🇪🇺</span>
          About Our Coverage
        </h3>
        
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            Explore businesses across European Union member states and EEA countries.
          </p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>EU Member States</span>
              <span className="font-medium text-slate-900">27</span>
            </div>
            <div className="flex justify-between">
              <span>EEA Members</span>
              <span className="font-medium text-slate-900">30</span>
            </div>
            <div className="flex justify-between">
              <span>Official Languages</span>
              <span className="font-medium text-slate-900">24+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}