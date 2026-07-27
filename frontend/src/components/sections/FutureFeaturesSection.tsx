import { useTranslations } from '@/i18n/translations';

interface SectionItem {
  id: number;
  title: string;
  subtitle: string;
  order: number;
}

interface Section {
  id: number;
  key: string;
  type: string;
  title: string;
  body: string;
  items: SectionItem[];
  settings: Record<string, any>;
}

interface FutureFeaturesSectionProps {
  section: Section;
  lang?: string;
}

export function FutureFeaturesSection({ section, lang = "en" }: FutureFeaturesSectionProps) {
  const t = useTranslations(lang);
  const sortedItems = [...section.items].sort((a, b) => a.order - b.order);
  
  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-purple-600 text-2xl">{t.home.futureFeatures.badgeIcon}</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {section.title}
          </h2>
          {section.body && (
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {section.body}
            </p>
          )}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedItems.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-purple-600 text-xs font-bold">{t.home.futureFeatures.itemIcon}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.subtitle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
