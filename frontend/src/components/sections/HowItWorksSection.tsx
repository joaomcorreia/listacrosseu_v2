interface SectionItem {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  order: number;
}

interface Section {
  id: number;
  key: string;
  type: string;
  title: string;
  items: SectionItem[];
  settings: Record<string, any>;
}

interface HowItWorksSectionProps {
  section: Section;
  lang?: string;
}

export function HowItWorksSection({ section }: HowItWorksSectionProps) {
  const sortedItems = [...section.items].sort((a, b) => a.order - b.order);
  
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {section.title}
          </h2>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {sortedItems.map((item, index) => (
            <div key={item.id} className="relative">
              {index < sortedItems.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-8 h-0.5 bg-blue-200 z-10"></div>
              )}
              <div className="text-center relative z-20">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                  {item.badge}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-600">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}