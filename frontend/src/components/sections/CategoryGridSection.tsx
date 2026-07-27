import Container from '@/components/Container';
import CategoryMarquee from '@/components/home/CategoryMarquee';
import AdPlaceholder from '@/components/ads/AdPlaceholder';
import { useTranslations } from '@/i18n/translations';

interface Section {
  id: number;
  key: string;
  type: string;
  order: number;
  active: boolean;
  settings: Record<string, any>;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
  items: any[];
}

interface CategoryGridSectionProps {
  section: Section;
  lang?: string;
}

export function CategoryGridSection({ section, lang = 'en' }: CategoryGridSectionProps) {
  const t = useTranslations(lang);
  return (
    <section className="py-20 bg-slate-50">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {section.title || t.home.categoryGrid.title}
          </h2>
          <p className="text-xl text-slate-600">
            {section.subtitle || t.home.categoryGrid.subtitle}
          </p>
        </div>
        
        {/* Category Marquee Slider */}
        <CategoryMarquee lang={lang} />
        
        {/* Inline Ad Placement */}
        <div className="mt-12">
          <div className="mx-auto max-w-4xl px-4">
            <AdPlaceholder variant="banner" />
          </div>
        </div>
      </Container>
    </section>
  );
}
