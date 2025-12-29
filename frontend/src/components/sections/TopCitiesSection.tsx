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
    <section className="py-16 bg-white">
      <Container>
        <TopCities lang={lang} />
        
        {/* Inline Ad Placement */}
        <div className="flex justify-center mt-16">
          <AdPlaceholder variant="banner" />
        </div>
      </Container>
    </section>
  );
}

export default TopCitiesSection;