import HomeHero from '@/components/HomeHero';
import Link from 'next/link';
import { debugLog } from '@/lib/debug';

interface Section {
  id: number;
  key: string;
  type: string;
  order: number;
  active: boolean;
  settings: Record<string, any>;
  title: string;
  subtitle: string;
  body: string;
  cta_label: string;
  cta_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
  items: any[];
}

interface HeroSectionProps {
  section: Section;
  lang?: string;
  breadcrumbs?: React.ReactNode;
}

export function HeroSection({ section, lang, breadcrumbs }: HeroSectionProps) {
  debugLog('HeroSection rendering:', {
    sectionKey: section.key,
    useHomeHero: section.settings?.useHomeHero,
    sectionId: section.id,
    component: 'src/components/sections/HeroSection.tsx',
  });

  // If this is the home page hero (based on section key), use the HomeHero component
  if (section.key === 'home_hero' || section.key === 'hero_main' || section.settings?.useHomeHero) {
    debugLog('Using HomeHero component for section:', section.key);
    return (
      <div>
        <HomeHero />
      </div>
    );
  }

  debugLog('Using CMS hero for section:', section.key);

  // Otherwise, render a CMS-driven hero section
  return (
    <div>
      <section className="relative isolate overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {section.title}
            </h1>
            {section.subtitle && (
              <p className="mt-6 text-xl leading-8 text-blue-100">
                {section.subtitle}
              </p>
            )}
            {section.body && (
              <p className="mt-4 text-lg leading-7 text-blue-200">
                {section.body}
              </p>
            )}

            {/* CTA Buttons */}
            {(section.cta_label || section.cta_secondary_label) && (
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {section.cta_label && section.cta_href && (
                  <Link
                    href={section.cta_href}
                    className="rounded-lg bg-white px-6 py-3 text-base font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
                  >
                    {section.cta_label}
                  </Link>
                )}
                {section.cta_secondary_label && section.cta_secondary_href && (
                  <Link
                    href={section.cta_secondary_href}
                    className="rounded-lg border border-blue-200 px-6 py-3 text-base font-semibold text-white hover:bg-blue-600"
                  >
                    {section.cta_secondary_label}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Breadcrumbs at bottom of hero */}
          {breadcrumbs && (
            <div className="mt-16 pt-6 border-t border-blue-500/30">
              <div className="text-sm">
                {breadcrumbs}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


