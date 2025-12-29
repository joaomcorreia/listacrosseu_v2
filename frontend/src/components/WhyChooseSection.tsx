'use client';

import { useState, useEffect } from 'react';

const features = [
  {
    id: 1,
    title: 'Verified Business Information',
    description: 'Every business listing is verified and regularly updated to ensure accuracy and reliability.',
    badge: '99.2% Accuracy Rate',
    badgeColor: 'bg-green-500',
    borderColor: 'border-green-500',
    icon: '✓',
    iconBg: 'bg-green-500',
    points: [
      'Manual verification process',
      'Regular data updates', 
      'Contact information validation',
      'Business status monitoring'
    ]
  },
  {
    id: 2,
    title: 'Complete EU Coverage',
    description: 'Access businesses across all 27 EU member states through one unified platform.',
    badge: '27 Countries',
    badgeColor: 'bg-blue-500',
    borderColor: 'border-blue-500',
    icon: 'EU',
    iconBg: 'bg-blue-500',
    points: [
      'All EU member states',
      'Multi-language support',
      'Local business insights',
      'Cultural adaptability'
    ]
  },
  {
    id: 3,
    title: 'Advanced Search & Filters',
    description: 'Find exactly what you need with sophisticated search tools and smart filtering options.',
    badge: '50+ Filter Options',
    badgeColor: 'bg-purple-500',
    borderColor: 'border-purple-500',
    icon: '🔍',
    iconBg: 'bg-purple-500',
    points: [
      'Location-based search',
      'Category refinement',
      'Rating and review filters',
      'Availability status'
    ]
  },
  {
    id: 4,
    title: 'Free Basic Listings',
    description: 'Get your business discovered across Europe at no cost with our comprehensive free tier.',
    badge: 'Always Free',
    badgeColor: 'bg-orange-500',
    borderColor: 'border-orange-500',
    icon: '💰',
    iconBg: 'bg-orange-500',
    points: [
      'No setup fees',
      'Basic business profile',
      'Contact information display',
      'Category placement'
    ]
  },
  {
    id: 5,
    title: 'Mobile-Optimized Experience',
    description: 'Seamlessly browse and manage listings on any device with our responsive design.',
    badge: '98% Mobile Score',
    badgeColor: 'bg-indigo-500',
    borderColor: 'border-indigo-500',
    icon: '📱',
    iconBg: 'bg-indigo-500',
    points: [
      'Responsive design',
      'Touch-friendly interface',
      'Offline capabilities',
      'Fast loading times'
    ]
  },
  {
    id: 6,
    title: '24/7 Customer Support',
    description: 'Get help when you need it with our dedicated multilingual support team.',
    badge: '<2min Response',
    badgeColor: 'bg-pink-500',
    borderColor: 'border-pink-500',
    icon: '🎧',
    iconBg: 'bg-pink-500',
    points: [
      'Multilingual support',
      'Live chat available',
      'Email assistance',
      'Phone support (premium)'
    ]
  }
];

export default function WhyChooseSection() {
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Why Choose ListAcross EU?
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            We're not just another business directory. We're your gateway to European commerce, built by 
            Europeans for Europeans, with the features that matter most.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={`relative bg-white rounded-2xl p-8 transition-all duration-500 border-2 ${
                activeFeature === index 
                  ? `${feature.borderColor} shadow-xl transform scale-105` 
                  : 'border-gray-200 hover:border-gray-300 shadow-md hover:shadow-lg'
              }`}
            >
              {/* Icon */}
              <div className="absolute top-6 right-6">
                <div className={`w-12 h-12 ${feature.iconBg} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 pr-16">
                  {feature.title}
                </h3>
                
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Badge */}
                <div className="inline-block">
                  <span className={`${feature.badgeColor} text-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm`}>
                    {feature.badge}
                  </span>
                </div>

                {/* Feature Points */}
                <ul className="space-y-2 mt-6">
                  {feature.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start gap-2 text-sm text-slate-600">
                      <div className={`w-1.5 h-1.5 ${feature.badgeColor} rounded-full mt-2 flex-shrink-0`}></div>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Active indicator */}
              {activeFeature === index && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-30 rounded-b-2xl"
                     style={{ color: feature.borderColor.replace('border-', '') }}></div>
              )}
            </div>
          ))}
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center mt-12 space-x-3">
          {features.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveFeature(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                activeFeature === index 
                  ? features[index].badgeColor.replace('bg-', 'bg-') + ' shadow-lg' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}