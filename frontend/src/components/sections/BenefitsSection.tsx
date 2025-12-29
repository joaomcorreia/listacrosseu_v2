interface SectionItem {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
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

interface BenefitsSectionProps {
  section: Section;
  lang?: string;
}

export function BenefitsSection({ section }: BenefitsSectionProps) {
  const sortedItems = [...section.items].sort((a, b) => a.order - b.order);
  
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {section.title}
          </h2>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {sortedItems.map((item) => (
            <div key={item.id} className="text-center group">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <span className="text-2xl">{item.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {item.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {item.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}