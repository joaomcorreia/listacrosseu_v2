'use client';

import React, { useEffect, useState, useRef } from 'react';
import { fetchCategories, type Category } from '@/lib/api/listings';

interface CategoryMarqueeProps {
  lang: string;
}

const CategoryMarquee: React.FC<CategoryMarqueeProps> = ({ lang }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await fetchCategories();
        setCategories(data.length > 0 ? data : getFallbackCategories());
      } catch (error) {
        console.warn('Failed to load categories, using fallback:', error);
        setCategories(getFallbackCategories());
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, [lang]);

  // Fallback categories if API fails
  const getFallbackCategories = (): Category[] => [
    { id: 1, name: 'Restaurants', slug: 'restaurants', business_count: 1250 },
    { id: 2, name: 'Hotels & Travel', slug: 'hotels-travel', business_count: 980 },
    { id: 3, name: 'Health & Medical', slug: 'health-medical', business_count: 850 },
    { id: 4, name: 'Shopping & Retail', slug: 'shopping-retail', business_count: 720 },
    { id: 5, name: 'Professional Services', slug: 'professional-services', business_count: 650 },
    { id: 6, name: 'Automotive', slug: 'automotive', business_count: 480 },
    { id: 7, name: 'Beauty & Wellness', slug: 'beauty-wellness', business_count: 420 },
    { id: 8, name: 'Education', slug: 'education', business_count: 380 }
  ];

  // Check for reduced motion preference
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsPaused(true);
    }
  }, []);

  // Create duplicated array for infinite effect
  const duplicatedCategories = [...categories, ...categories];

  const CategoryCard: React.FC<{ category: Category }> = ({ category }) => (
    <div className="flex-shrink-0 bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow duration-200 mx-2 relative overflow-hidden min-w-[200px]">
      {/* Shape decoration instead of image */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-sm opacity-60" />
        <div className="absolute bottom-2 left-2 w-4 h-4 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full blur-sm opacity-50" />
      </div>
      
      <div className="relative z-10">
        {/* Icon placeholder */}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-3">
          <div className="w-4 h-4 bg-white rounded-sm opacity-90" />
        </div>
        
        <h3 className="font-medium text-slate-900 mb-1 text-sm">
          {category.name}
        </h3>
        
        {category.business_count && (
          <p className="text-xs text-slate-600">
            {category.business_count.toLocaleString()} businesses
          </p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="relative overflow-hidden">
        <div className="flex gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 bg-slate-200 rounded-lg p-4 min-w-[200px] h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div 
        ref={containerRef}
        className="flex gap-0"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          // Only resume if user doesn't prefer reduced motion
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (!prefersReducedMotion) {
            setIsPaused(false);
          }
        }}
        style={{
          animation: isPaused ? 'none' : 'marquee 60s linear infinite',
        }}
      >
        {duplicatedCategories.map((category, index) => (
          <CategoryCard key={`${category.id}-${index}`} category={category} />
        ))}
      </div>
      
      {/* CSS Animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
      
      {/* Gradient overlays for smooth fade effect */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default CategoryMarquee;