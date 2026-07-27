import { useTranslations } from '@/i18n/translations';

interface Section {
  id: number;
  key: string;
  type: string;
  title: string;
  body: string;
  settings: Record<string, any>;
}

interface ProblemSolutionSectionProps {
  section: Section;
  lang?: string;
}

export function ProblemSolutionSection({ section, lang = "en" }: ProblemSolutionSectionProps) {
  const t = useTranslations(lang);
  const problemPoints = (section.body || '').split('\n\n').filter(line => line.trim());
  
  return (
    <section className="py-16 bg-slate-50">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {section.title}
          </h2>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {problemPoints.map((point, index) => (
            <div key={index} className="flex items-start gap-4 p-6 bg-white rounded-lg border border-slate-200">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-red-600 text-sm font-bold">
                  {t.home.problemSolution.bulletIcon}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">{point.trim()}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
