import Container from '@/components/Container';
import TopCities from '@/components/home/TopCities';
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

interface TopCitiesSectionProps {
  section: Section;
  lang?: string;
}

export function TopCitiesSection({ section, lang = 'en' }: TopCitiesSectionProps) {
  return (
    <section className="py-16 bg-slate-50">
      <Container>
        <TopCities lang={lang} />
        
        {/* Inline Ad Placement */}
        <div className="mt-16">
          <div className="mx-auto max-w-4xl px-4">
            <AdPlaceholder variant="banner" />
          </div>
        </div>
      </Container>
    </section>
  );
}

export default TopCitiesSection;
