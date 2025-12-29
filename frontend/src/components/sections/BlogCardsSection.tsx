'use client';

import { useState, useEffect } from 'react';

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

interface BlogCardsSection {
  section: Section;
  lang?: string;
}

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  image: string;
  date: string;
  featured?: boolean;
}

// Static blog posts for now - in future this could be from API
const staticBlogPosts: BlogPost[] = [
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
    readTime: '6 min read',
    image: '🌱',
    date: 'Dec 1, 2025',
    featured: true
  }
];

export function BlogCardsSection({ section, lang }: BlogCardsSection) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch blog posts based on section settings
    const fetchPosts = async () => {
      try {
        // For now, use static data
        const { mode, limit, categorySlug } = section.settings;
        
        let filteredPosts = [...staticBlogPosts];
        
        // Apply category filter if specified
        if (categorySlug) {
          filteredPosts = filteredPosts.filter(post => 
            post.category.toLowerCase().replace(/\s+/g, '-') === categorySlug
          );
        }
        
        // Apply limit
        const limitedPosts = filteredPosts.slice(0, limit || 3);
        
        setPosts(limitedPosts);
      } catch (error) {
        console.error('Failed to fetch blog posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [section.settings]);

  // Don't render anything if no posts and not loading
  if (!loading && posts.length === 0) {
    // In development, show empty state for debugging
    if (process.env.NODE_ENV === 'development') {
      return (
        <section className="py-12 bg-gray-50 border-2 border-dashed border-yellow-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-yellow-600">
              <h3 className="text-lg font-medium mb-2">🚧 Blog Cards Section (Development)</h3>
              <p className="text-sm">No blog posts available - this section would be hidden in production</p>
              <p className="text-xs mt-1">Section key: {section.key} | Settings: {JSON.stringify(section.settings)}</p>
            </div>
          </div>
        </section>
      );
    }
    // In production, don't render empty sections
    return null;
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {section.title || 'Featured Blog Posts'}
          </h2>
          {section.subtitle && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {section.subtitle}
            </p>
          )}
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Blog Posts Grid */}
        {!loading && posts.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="group cursor-pointer">
                {/* Blog Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                  {/* Image/Icon */}
                  <div className="h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border-b">
                    <div className="text-6xl">{post.image}</div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    {/* Category and Date */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {post.category}
                      </span>
                      <span>{post.date}</span>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      <span className="line-clamp-2">
                        {post.title}
                      </span>
                    </h3>
                    
                    {/* Excerpt */}
                    <p className="text-gray-600 text-sm mb-4">
                      <span className="line-clamp-3">
                        {post.excerpt}
                      </span>
                    </p>
                    
                    {/* Read Time */}
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {post.readTime}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        
        {/* CTA Button */}
        {section.cta_label && section.cta_href && (
          <div className="text-center mt-12">
            <a 
              href={section.cta_href}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {section.cta_label}
              <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}