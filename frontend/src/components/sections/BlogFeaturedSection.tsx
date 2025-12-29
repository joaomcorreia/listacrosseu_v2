import BlogCarousel from '@/components/BlogCarousel';

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

interface BlogFeaturedSectionProps {
  section: Section;
}

export function BlogFeaturedSection({ section }: BlogFeaturedSectionProps) {
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
        
        <BlogCarousel settings={section.settings} />
        
        {section.cta_label && section.cta_href && (
          <div className="text-center mt-8">
            <a 
              href={section.cta_href}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {section.cta_label}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}