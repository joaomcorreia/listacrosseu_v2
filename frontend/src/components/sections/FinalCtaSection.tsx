interface Section {
  id: number;
  key: string;
  type: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
  settings: Record<string, any>;
}

interface FinalCtaSectionProps {
  section: Section;
  lang?: string;
}

export function FinalCtaSection({ section, lang }: FinalCtaSectionProps) {
  // Make CTAs locale-safe if lang is provided
  const primaryHref = section.cta_href.startsWith('/en/') && lang
    ? section.cta_href.replace('/en/', `/${lang}/`)
    : section.cta_href;
    
  const secondaryHref = section.cta_secondary_href.startsWith('/en/') && lang
    ? section.cta_secondary_href.replace('/en/', `/${lang}/`)
    : section.cta_secondary_href;
  
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black/10 to-black/20"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-white/10 rounded-full"></div>
      </div>
      
      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          {section.title}
        </h2>
        {section.subtitle && (
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            {section.subtitle}
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {section.cta_label && (
            <a 
              href={primaryHref}
              className="group bg-white text-blue-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span className="flex items-center gap-2">
                {section.cta_label}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </span>
            </a>
          )}
          
          {section.cta_secondary_label && (
            <a 
              href={secondaryHref}
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-700 transition-all duration-300"
            >
              {section.cta_secondary_label}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}