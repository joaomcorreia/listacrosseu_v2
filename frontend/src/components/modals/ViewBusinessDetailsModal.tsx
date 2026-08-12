'use client';

import Modal from '../ui/Modal';

interface Business {
  id: number;
  name: string;
  slug: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  town?: {
    id: number;
    name: string;
    slug: string;
    city: {
      id: number;
      name: string;
      slug: string;
      country: {
        id: number;
        name: string;
        slug: string;
      };
    };
  };
  city?: {
    id: number;
    name: string;
    slug: string;
    country: {
      id: number;
      name: string;
      slug: string;
    };
  };
  country?: {
    id: number;
    name: string;
    slug: string;
  };
  address?: string;
  address_line1?: string;
  postal_code?: string;
  website?: string;
  phone?: string;
  description?: string;
  // API data can be legacy JSON; normalize before using array methods.
  keywords?: unknown;
}

interface ViewBusinessDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
}

function getLocationString(business: Business): string {
  const parts: string[] = [];

  if (business.town?.name) {
    parts.push(business.town.name);
  }
  if (business.town?.city?.name) {
    parts.push(business.town.city.name);
  }
  if (business.town?.city?.country?.name) {
    parts.push(business.town.city.country.name);
  }

  if (parts.length === 0) {
    if (business.city?.name) {
      parts.push(business.city.name);
    }
    if (business.city?.country?.name) {
      parts.push(business.city.country.name);
    }
  }

  if (parts.length === 0 && business.country?.name) {
    parts.push(business.country.name);
  }

  return parts.join(', ');
}

function normalizeKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((keyword): keyword is string => typeof keyword === 'string')
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((keyword) => keyword.trim()).filter(Boolean);
  }
  return [];
}

export default function ViewBusinessDetailsModal({
  isOpen,
  onClose,
  business,
}: ViewBusinessDetailsModalProps) {
  const address = business.address_line1 || business.address || '';
  const keywords = normalizeKeywords(business.keywords);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Business details" maxWidth="4xl">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">{business.name}</h3>
          {business.category && (
            <p className="mt-1 text-sm text-blue-600">{business.category.name}</p>
          )}
          <p className="mt-2 text-sm text-gray-600">{getLocationString(business)}</p>
        </div>

        {(address || business.postal_code) && (
          <div className="text-sm text-gray-700">
            <p className="font-medium text-gray-900">Address</p>
            <p>{address}</p>
            {business.postal_code && <p>{business.postal_code}</p>}
          </div>
        )}

        {(business.phone || business.website) && (
          <div className="grid gap-3 sm:grid-cols-2 text-sm text-gray-700">
            {business.phone && (
              <div>
                <p className="font-medium text-gray-900">Phone / WhatsApp</p>
                <p>{business.phone}</p>
              </div>
            )}
            {business.website && (
              <div>
                <p className="font-medium text-gray-900">Website</p>
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {business.website}
                </a>
              </div>
            )}
          </div>
        )}

        {business.description && (
          <div className="text-sm text-gray-700">
            <p className="font-medium text-gray-900">About</p>
            <p className="mt-1 whitespace-pre-line">{business.description}</p>
          </div>
        )}

        {keywords.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-900">Keywords</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
