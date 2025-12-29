'use client';

import React from 'react';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  business_count?: number;
  slug: string;
}

interface PopularBusinessTypesProps {
  title?: string;
  categories: Category[];
  baseUrl: string; // e.g., '/en/search?country=portugal' or '/en/search?city=lisbon'
  limit?: number;
}

export const PopularBusinessTypes: React.FC<PopularBusinessTypesProps> = ({
  title = "Popular Business Types",
  categories,
  baseUrl,
  limit = 12
}) => {
  // Show top categories by business count
  const topCategories = categories
    .filter(category => category.business_count && category.business_count > 0)
    .sort((a, b) => (b.business_count || 0) - (a.business_count || 0))
    .slice(0, limit);

  if (topCategories.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          {title}
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {topCategories.map((category) => (
            <Link
              key={category.id}
              href={`${baseUrl}&category=${category.slug}`}
              className="group block"
            >
              <div className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all duration-200 group-hover:bg-blue-50">
                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 mb-1 line-clamp-2">
                  {category.name}
                </div>
                <div className="text-xs text-gray-500 group-hover:text-blue-600">
                  {category.business_count || 0} businesses
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularBusinessTypes;