import Link from 'next/link';

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

interface CTABandSectionProps {
  section: Section;
  lang?: string;
}

export function CTABandSection({ section }: CTABandSectionProps) {
  const isGradient = section.settings?.style === 'gradient';
  const bgClass = isGradient 
    ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
    : 'bg-gray-900';

  return (
    <section className={`py-16 ${bgClass}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          {section.title}
        </h2>
        <p className="text-xl text-gray-200 mb-8">
          {section.subtitle}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {section.cta_label && section.cta_href && (
            <Link
              href={section.cta_href}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              {section.cta_label}
            </Link>
          )}
          
          {section.cta_secondary_label && section.cta_secondary_href && (
            <Link
              href={section.cta_secondary_href}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
            >
              {section.cta_secondary_label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}