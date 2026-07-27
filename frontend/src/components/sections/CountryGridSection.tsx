import CountryExplorer from '@/components/CountryExplorer';

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

interface CountryGridSectionProps {
  section: Section;
  lang?: string;
}

export function CountryGridSection({ section }: CountryGridSectionProps) {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {section.title}
          </h2>
          <p className="text-xl text-gray-600">
            {section.subtitle}
          </p>
        </div>
        
        <CountryExplorer settings={section.settings} />
      </div>
    </section>
  );
}