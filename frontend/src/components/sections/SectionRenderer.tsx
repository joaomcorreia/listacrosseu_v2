import { HeroSection } from '@/components/sections/HeroSection';
import { CategoryGridSection } from '@/components/sections/CategoryGridSection';
import { CTABandSection } from '@/components/sections/CTABandSection';
import { CountryGridSection } from '@/components/sections/CountryGridSection';
import { MarketColumnsSection } from '@/components/sections/MarketColumnsSection';
import { FeatureCardsSection } from '@/components/sections/FeatureCardsSection';
import { BlogFeaturedSection } from '@/components/sections/BlogFeaturedSection';
import { BlogCardsSection } from '@/components/sections/BlogCardsSection';
import { ProblemSolutionSection } from '@/components/sections/ProblemSolutionSection';
import { BenefitsSection } from '@/components/sections/BenefitsSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';
import { TrustGdprSection } from '@/components/sections/TrustGdprSection';
import { WhoItsForSection } from '@/components/sections/WhoItsForSection';
import { FutureFeaturesSection } from '@/components/sections/FutureFeaturesSection';
import { FinalCtaSection } from '@/components/sections/FinalCtaSection';
import { TopCitiesSection } from '@/components/sections/TopCitiesSection';
import ListingsMixedSection from '@/components/sections/ListingsMixedSection';
import ListingsTierSection from '@/components/sections/ListingsTierSection';
import { useTranslations } from '@/i18n/translations';

interface SectionItem {
  id: number;
  order: number;
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  badge: string;
  meta: Record<string, any>;
}

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
  items: SectionItem[];
}

interface SectionRendererProps {
  section: Section;
  lang?: string;
  breadcrumbs?: React.ReactNode;
}

export default function SectionRenderer({ section, lang, breadcrumbs }: SectionRendererProps) {
  const t = useTranslations(lang || 'en');
  const formatText = (template: string, values: Record<string, string | number>) =>
    Object.entries(values).reduce(
      (result, [key, value]) =>
        result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
      template,
    );

  // In development, show warnings for unknown section types
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Add anchor support
  const sectionProps: any = {};
  if (section.settings?.anchor) {
    sectionProps.id = section.settings.anchor;
  }
  
  const renderSection = () => {
    switch (section.type) {
      case 'hero':
        return <HeroSection section={section} lang={lang} breadcrumbs={breadcrumbs} />;
        
      case 'category_grid':
        return <CategoryGridSection section={section} lang={lang} />;
        
      case 'cta_band':
        return <CTABandSection section={section} lang={lang} />;
        
      case 'country_grid':
        return <CountryGridSection section={section} lang={lang} />;
        
      case 'market_columns':
        return <MarketColumnsSection section={section} lang={lang} />;
        
      case 'feature_cards':
        return <FeatureCardsSection section={section} lang={lang} />;
        
      case 'blog_featured':
        return <BlogFeaturedSection section={section} lang={lang} />;
        
      case 'blog_cards':
        return <BlogCardsSection section={section} lang={lang} />;
      
      // Listing section types
      case 'listings_mixed':
        return <ListingsMixedSection section={section} lang={lang} />;
        
      case 'listings_claimed':
        return <ListingsTierSection section={section} tier="claimed" lang={lang} />;
        
      case 'listings_premium':
        return <ListingsTierSection section={section} tier="premium" lang={lang} />;
      
      // New section types for list-your-business page
      case 'problem_solution':
        return <ProblemSolutionSection section={section} lang={lang} />;
        
      case 'benefits':
        return <BenefitsSection section={section} lang={lang} />;
        
      case 'how_it_works':
        return <HowItWorksSection section={section} lang={lang} />;
        
      case 'trust_gdpr':
        return <TrustGdprSection section={section} lang={lang} />;
        
      case 'who_its_for':
        return <WhoItsForSection section={section} lang={lang} />;
        
      case 'future_features':
        return <FutureFeaturesSection section={section} lang={lang} />;
        
      case 'final_cta':
        return <FinalCtaSection section={section} lang={lang} />;
        
      case 'top_cities':
        return <TopCitiesSection section={section} lang={lang} />;
      
      default:
        // Unknown section type - don't crash the site
        if (isDevelopment) {
          const message = formatText(t.home.sectionRenderer.devWarning, {
            type: section.type,
            key: section.key,
          });

          return (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 my-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>{message}</strong>
                  </p>
                </div>
              </div>
            </div>
          );
        }
        
        // In production, silently skip unknown sections
        return null;
    }
  };
  
  return (
    <div {...sectionProps}>
      {renderSection()}
    </div>
  );
}
