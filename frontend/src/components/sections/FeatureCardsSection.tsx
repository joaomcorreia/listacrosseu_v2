import WhyChooseSection from '@/components/WhyChooseSection';

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

interface FeatureCardsSectionProps {
  section: Section;
}

export function FeatureCardsSection({ section }: FeatureCardsSectionProps) {
  return (
    <WhyChooseSection 
      title={section.title}
      subtitle={section.subtitle}
      items={section.items}
      settings={section.settings}
    />
  );
}