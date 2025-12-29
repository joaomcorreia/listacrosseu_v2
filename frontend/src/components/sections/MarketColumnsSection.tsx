import TopCities from '@/components/TopCities';

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

interface MarketColumnsSectionProps {
  section: Section;
}

export function MarketColumnsSection({ section }: MarketColumnsSectionProps) {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {section.title}
          </h2>
          <p className="text-xl text-gray-600">
            {section.subtitle}
          </p>
        </div>
        
        <TopCities settings={section.settings} />
      </div>
    </section>
  );
}