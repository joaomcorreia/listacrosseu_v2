import BlogCarousel from '@/components/BlogCarousel';

interface Section {
  id: number;
  key: string;
  type: string;
  title: string;
  subtitle: string;
  settings: Record<string, any>;
}

export function BlogCardsSection({ section }: { section: Section; lang?: string }) {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900">{section.title || 'Latest articles'}</h2>
          {section.subtitle && <p className="mx-auto mt-4 max-w-2xl text-xl text-gray-600">{section.subtitle}</p>}
        </div>
        <BlogCarousel settings={section.settings} />
      </div>
    </section>
  );
}
