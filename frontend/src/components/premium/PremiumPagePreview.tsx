import { Building2, Globe, MapPin, Phone } from 'lucide-react';

interface Business {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category?: { name: string };
  city?: { name: string };
  country?: { name: string };
  address?: string;
  phone?: string;
  website?: string;
  keywords?: string[];
  is_premium?: boolean;
  tier?: string;
}

export default function PremiumPagePreview({ business, className = '' }: { business: Business; className?: string; lang?: string }) {
  const location = [business.address, business.city?.name, business.country?.name].filter(Boolean).join(', ');

  return (
    <div className={`bg-gray-50 ${className}`}>
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-t-2xl bg-gradient-to-r from-blue-700 to-blue-800 p-6 text-white">
          <div className="text-center">
            <p className="mb-3 text-sm font-medium text-blue-100">Website preview</p>
            <h1 className="text-2xl font-bold">{business.name || 'Business name'}</h1>
            <p className="mt-2 text-blue-100">{business.category?.name || 'Category not provided'}</p>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">{business.name || 'Business name'}</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {business.category?.name && <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-700" />{business.category.name}</p>}
                {location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-700" />{location}</p>}
                {business.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-700" />{business.phone}</p>}
                {business.website && <p className="flex items-center gap-2"><Globe className="h-4 w-4 text-blue-700" />{business.website}</p>}
              </div>
            </section>

            {business.description && <section className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">About this business</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{business.description}</p>
            </section>}

            {business.keywords && business.keywords.length > 0 && <section className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Business highlights</h2>
              <div className="mt-3 flex flex-wrap gap-2">{business.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{keyword}</span>)}</div>
            </section>}
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-900">Website draft</h2>
              <p className="mt-2 text-sm text-slate-600">This preview uses the business information currently available. Add more details from the Listing dashboard.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-900">Contact</h2>
              <p className="mt-2 text-sm text-slate-600">Contact form activation is not available yet.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
