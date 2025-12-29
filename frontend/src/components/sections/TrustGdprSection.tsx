interface Section {
  id: number;
  key: string;
  type: string;
  title: string;
  body: string;
  settings: Record<string, any>;
}

interface TrustGdprSectionProps {
  section: Section;
  lang?: string;
}

export function TrustGdprSection({ section }: TrustGdprSectionProps) {
  const trustPoints = (section.body || '').split('\n\n').filter(line => line.trim());
  
  return (
    <section className="py-16 bg-emerald-50">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-emerald-600 text-2xl">🔒</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {section.title}
          </h2>
        </div>
        
        <div className="bg-white rounded-lg p-8 shadow-sm border border-emerald-200">
          <div className="space-y-4">
            {trustPoints.map((point, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-emerald-600 text-sm font-bold">✓</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{point.trim()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}