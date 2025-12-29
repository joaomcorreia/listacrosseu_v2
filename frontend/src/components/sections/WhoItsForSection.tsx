interface SectionItem {
  id: number;
  title: string;
  subtitle: string;
  meta: Record<string, any>;
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

interface WhoItsForSectionProps {
  section: Section;
  lang?: string;
}

export function WhoItsForSection({ section }: WhoItsForSectionProps) {
  const sortedItems = [...section.items].sort((a, b) => a.order - b.order);
  const goodFitItems = sortedItems.filter(item => item.meta?.group === 'Good fit');
  const notFitItems = sortedItems.filter(item => item.meta?.group === 'Not a fit (yet)');
  
  return (
    <section className="py-16 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {section.title}
          </h2>
        </div>
        
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Good Fit */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 text-lg font-bold">✓</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Good fit</h3>
            </div>
            <div className="space-y-4">
              {goodFitItems.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-600">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Not a Fit */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-lg font-bold">✗</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Not a fit (yet)</h3>
            </div>
            <div className="space-y-4">
              {notFitItems.map((item) => (
                <div key={item.id} className="bg-white p-4 rounded-lg border border-slate-200 opacity-75">
                  <h4 className="font-semibold text-slate-700 mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-500">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}