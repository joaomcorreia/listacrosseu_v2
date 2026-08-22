'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchCategories, type Category } from '@/lib/api/listings';
import { useTranslations } from '@/i18n/translations';
import { debugWarn } from '@/lib/debug';
import { isPublicCategory } from '@/lib/public-categories';

interface CategoryMarqueeProps {
  lang: string;
}

const CategoryMarquee: React.FC<CategoryMarqueeProps> = ({ lang }) => {
  const t = useTranslations(lang);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        debugWarn('Failed to load live categories:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, [lang]);

  const featuredCategories = useMemo(() => {
    const sorted = [...categories]
      .filter(isPublicCategory)
      .sort((a, b) => (b.business_count || 0) - (a.business_count || 0));
    return sorted.slice(0, 6);
  }, [categories]);

  const categoryThemes: Record<string, { gradient: string; icon: string }> = {
    restaurants: {
      gradient: 'from-orange-200 via-rose-100 to-red-200',
      icon: t.home.categoryMarquee.icons.restaurants,
    },
    automotive: {
      gradient: 'from-slate-200 via-blue-100 to-slate-300',
      icon: t.home.categoryMarquee.icons.automotive,
    },
    'shopping-retail': {
      gradient: 'from-fuchsia-200 via-pink-100 to-purple-200',
      icon: t.home.categoryMarquee.icons.shoppingRetail,
    },
    'health-medical': {
      gradient: 'from-emerald-200 via-teal-100 to-sky-200',
      icon: t.home.categoryMarquee.icons.healthMedical,
    },
    'professional-services': {
      gradient: 'from-amber-200 via-yellow-100 to-orange-200',
      icon: t.home.categoryMarquee.icons.professionalServices,
    },
    'beauty-wellness': {
      gradient: 'from-pink-200 via-rose-100 to-purple-200',
      icon: t.home.categoryMarquee.icons.beautyWellness,
    },
  };

  const CategoryCard: React.FC<{ category: Category }> = ({ category }) => {
    const count = category.business_count || 0;
    const theme = categoryThemes[category.slug] || {
      gradient: 'from-blue-200 via-slate-100 to-indigo-200',
      icon: category.name.charAt(0).toUpperCase(),
    };

    return (
      <Link
        href={`/${lang}/categories/${category.slug}`}
        className={`group relative overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br ${theme.gradient} p-8 min-h-[128px] shadow-lg transition-all duration-200 hover:-translate-y-2 hover:rotate-1 hover:shadow-2xl hover:ring-2 hover:ring-white/60`}
      >
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_60%)]" />
        <div className="absolute -bottom-10 -right-6 h-32 w-32 rounded-full bg-white/40 blur-2xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-xl font-bold text-slate-700">{theme.icon}</div>
          <h3 className="mt-4 text-2xl font-bold text-slate-900">
            {category.name}
          </h3>
          <p className="mt-2 text-lg text-slate-600">
            {count.toLocaleString()} {t.home.categoryMarquee.businessesLabel}
          </p>

        </div>
      </Link>
    );
  };

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
    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {featuredCategories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
};

export default CategoryMarquee;

