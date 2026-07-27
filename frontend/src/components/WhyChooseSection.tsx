'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { normalizeLang } from '@/lib/lang';
import { useTranslations } from '@/i18n/translations';

type WhyChooseFeature = {
  title: string;
  description: string;
  badge: string;
  points: string[];
};

type WhyChooseSectionProps = {
  title?: string;
  subtitle?: string;
  items?: Array<Partial<WhyChooseFeature>>;
  settings?: Record<string, unknown>;
};

const baseFeatures = [
  {
    id: 1,
    badgeColor: 'bg-green-500',
    borderColor: 'border-green-500',
    icon: 'VERIFY',
    iconBg: 'bg-green-500',
  },
  {
    id: 2,
    badgeColor: 'bg-blue-500',
    borderColor: 'border-blue-500',
    icon: 'EU',
    iconBg: 'bg-blue-500',
  },
  {
    id: 3,
    badgeColor: 'bg-purple-500',
    borderColor: 'border-purple-500',
    icon: 'SEARCH',
    iconBg: 'bg-purple-500',
  },
  {
    id: 4,
    badgeColor: 'bg-orange-500',
    borderColor: 'border-orange-500',
    icon: 'FREE',
    iconBg: 'bg-orange-500',
  },
  {
    id: 5,
    badgeColor: 'bg-indigo-500',
    borderColor: 'border-indigo-500',
    icon: 'MOBILE',
    iconBg: 'bg-indigo-500',
  },
  {
    id: 6,
    badgeColor: 'bg-pink-500',
    borderColor: 'border-pink-500',
    icon: 'SUPPORT',
    iconBg: 'bg-pink-500',
  },
];

export default function WhyChooseSection({ title, subtitle, items }: WhyChooseSectionProps) {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || 'en'));
  const t = useTranslations(lang);
  const [activeFeature, setActiveFeature] = useState(0);
  const features = useMemo(() => {
    const translationFeatures = t.home.whyChoose.features || [];
    const source = items?.length ? items : translationFeatures;
    return baseFeatures.map((feature, index) => ({
      ...feature,
      title: source[index]?.title || translationFeatures[index]?.title || '',
      description: source[index]?.description || translationFeatures[index]?.description || '',
      badge: source[index]?.badge || translationFeatures[index]?.badge || '',
      points: source[index]?.points || translationFeatures[index]?.points || [],
    }));
  }, [items, t]);

  useEffect(() => {
    if (features.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            {title || t.home.whyChoose.title}
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            {subtitle || t.home.whyChoose.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={`relative bg-white rounded-2xl p-8 transition-all duration-500 border-2 ${
                activeFeature === index
                  ? `${feature.borderColor} shadow-xl transform scale-105`
                  : 'border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg'
              }`}
            >
              <div className="absolute top-6 right-6">
                <div
                  className={`w-12 h-12 ${feature.iconBg} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
                >
                  {feature.icon}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 pr-16">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                <div className="inline-block">
                  <span className={`${feature.badgeColor} text-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm`}>
                    {feature.badge}
                  </span>
                </div>
                <ul className="space-y-2 mt-6">
                  {feature.points.map((point: string, pointIndex: number) => (
                    <li key={pointIndex} className="flex items-start gap-2 text-sm text-slate-600">
                      <div className={`w-1.5 h-1.5 ${feature.badgeColor} rounded-full mt-2 flex-shrink-0`}></div>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {activeFeature === index && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-30 rounded-b-2xl"
                  style={{ color: feature.borderColor.replace('border-', '') }}
                ></div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12 space-x-3">
          {features.map((feature, index) => (
            <button
              key={feature.id}
              onClick={() => setActiveFeature(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                activeFeature === index ? `${feature.badgeColor} shadow-lg` : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
