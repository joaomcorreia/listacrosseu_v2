import Container from '@/components/Container';
import CategoryMarquee from '@/components/home/CategoryMarquee';
import AdPlaceholder from '@/components/ads/AdPlaceholder';

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
  return (
    <section className="py-16 bg-slate-50">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {section.title || 'Explore Business Categories'}
          </h2>
          <p className="text-xl text-slate-600">
            {section.subtitle || 'Discover businesses across all sectors'}
          </p>
        </div>
        
        {/* Category Marquee Slider */}
        <CategoryMarquee lang={lang} />
        
        {/* Inline Ad Placement */}
        <div className="flex justify-center mt-12">
          <AdPlaceholder variant="inline" />
        </div>
      </Container>
    </section>
  );
}