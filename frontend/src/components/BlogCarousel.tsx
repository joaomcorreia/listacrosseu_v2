'use client';

import { useState, useEffect } from 'react';

const blogPosts = [
  {
    id: 1,
    title: 'Top 10 European Cities for Digital Nomads in 2025',
    excerpt: 'Discover the most remote-work-friendly cities across Europe, from affordable living costs to excellent internet infrastructure.',
    category: 'Business Tips',
    readTime: '5 min read',
    image: '🌍',
    date: 'Dec 10, 2025',
    featured: true
  },
  {
    id: 2,
    title: 'EU Market Expansion: A Complete Guide for SMEs',
    excerpt: 'Learn how small and medium enterprises can successfully expand across European markets with practical strategies and real case studies.',
    category: 'Market Insights',
    readTime: '8 min read',
    image: '📈',
    date: 'Dec 8, 2025',
    featured: true
  },
  {
    id: 3,
    title: 'Understanding GDPR for Cross-Border Business',
    excerpt: 'Navigate the complexities of European data protection regulations when operating across multiple EU member states.',
    category: 'Industry News',
    readTime: '6 min read',
    image: '🔒',
    date: 'Dec 5, 2025',
    featured: true
  },
  {
    id: 4,
    title: 'Cultural Sensitivity in European B2B Communications',
    excerpt: 'Master the art of cross-cultural business communication across diverse European markets for better client relationships.',
    category: 'Business Tips',
    readTime: '7 min read',
    image: '🤝',
    date: 'Dec 3, 2025',
    featured: true
  },
  {
    id: 5,
    title: 'Sustainable Business Practices Across EU Markets',
    excerpt: 'How European businesses are leading the green transition and what it means for your sustainability strategy.',
    category: 'EU Regulations',
    readTime: '9 min read',
    image: '🌱',
    date: 'Dec 1, 2025',
    featured: true
  }
];

const categoryColors = {
  'Business Tips': 'bg-blue-100 text-blue-800',
  'Market Insights': 'bg-green-100 text-green-800',
  'Industry News': 'bg-purple-100 text-purple-800',
  'EU Regulations': 'bg-orange-100 text-orange-800'
};

export default function BlogCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const maxSlides = Math.max(0, blogPosts.length - 2); // Show 3 posts, so max slide is length - 2
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % (maxSlides || 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [blogPosts.length]);

  const maxSlides = Math.max(0, blogPosts.length - 2);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % (maxSlides || 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + (maxSlides || 1)) % (maxSlides || 1));
  };

  const goToSlide = (index: number) => {
    const maxSlides = Math.max(0, blogPosts.length - 2);
    setCurrentSlide(Math.min(index, maxSlides - 1));
  };

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Featured Blog Posts
            </h2>
            <p className="text-lg text-slate-600">
              Stay updated with the latest insights on European business trends and opportunities.
            </p>
          </div>
          <a 
            href="/en/blog" 
            className="hidden md:inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            View All Posts
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </a>
        </div>

        <div className="relative">
          {/* Carousel Container */}
          <div className="overflow-hidden rounded-2xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * (100 / 3)}%)` }}
            >
              {blogPosts.map((post) => (
                <div key={post.id} className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-3">
                  <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full">
                    {/* Visual Element */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-8 text-center">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-lg mx-auto transform hover:rotate-12 transition-transform duration-300">
                        {post.image}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${categoryColors[post.category as keyof typeof categoryColors]}`}>
                          {post.category}
                        </span>
                        <span className="text-xs text-slate-500">{post.date}</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-500">{post.readTime}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 leading-tight" style={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden' 
                      }}>
                        {post.title}
                      </h3>
                      
                      <p className="text-sm text-slate-600 leading-relaxed" style={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 3, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden' 
                      }}>
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4">
                        <a 
                          href={`/en/blog/${post.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                        >
                          Read More
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                          </svg>
                        </a>
                        <button className="text-slate-400 hover:text-slate-600 p-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
            </svg>
          </button>

          {/* Indicators */}
          <div className="flex justify-center space-x-2 mt-8">
            {Array.from({ length: Math.max(1, blogPosts.length - 2) }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentSlide === index 
                    ? 'bg-blue-600 w-8' 
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Mobile View All Button */}
        <div className="text-center mt-8 md:hidden">
          <a 
            href="/en/blog" 
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            View All Posts
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}