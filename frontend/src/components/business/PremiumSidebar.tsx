'use client';

interface Business {
  name: string;
  phone?: string;
  premium_sidebar?: {
    sidebar_highlight?: string;
    services?: string[];
    contact_email?: string;
    opening_hours?: string;
  };
}

interface TierStyles {
  borderColor: string;
  accentColor: string;
  bgColor: string;
}

interface PremiumSidebarProps {
  business: Business;
  tierStyles: TierStyles;
}

export function PremiumSidebar({ business, tierStyles }: PremiumSidebarProps) {
  const sidebarData = business.premium_sidebar || {};
  
  const handleContactClick = () => {
    // Scroll to contact form
    const contactSection = document.getElementById('contact-section');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Info Box */}
      <div className={`p-6 rounded-lg border-2 ${tierStyles.borderColor} bg-white`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
        
        {/* Sidebar highlight */}
        {sidebarData.sidebar_highlight && (
          <div className="mb-4">
            <p className={`text-sm font-medium ${tierStyles.accentColor} p-3 rounded ${tierStyles.bgColor}`}>
              {sidebarData.sidebar_highlight}
            </p>
          </div>
        )}

        {/* Contact Email */}
        {sidebarData.contact_email && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-1">Email</h4>
            <a 
              href={`mailto:${sidebarData.contact_email}`}
              className={`text-sm ${tierStyles.accentColor} hover:underline`}
            >
              {sidebarData.contact_email}
            </a>
          </div>
        )}

        {/* Phone (fallback to main phone) */}
        {(sidebarData.contact_email || business.phone) && business.phone && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-1">Phone</h4>
            <a 
              href={`tel:${business.phone}`}
              className={`text-sm ${tierStyles.accentColor} hover:underline`}
            >
              {business.phone}
            </a>
          </div>
        )}

        {/* Opening Hours */}
        {sidebarData.opening_hours && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-1">Opening Hours</h4>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {sidebarData.opening_hours}
            </p>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleContactClick}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
            tierStyles.accentColor.includes('orange') 
              ? 'bg-orange-600 hover:bg-orange-700' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Contact Business
        </button>
      </div>

      {/* Services List */}
      {sidebarData.services && sidebarData.services.length > 0 && (
        <div className={`p-6 rounded-lg border ${tierStyles.borderColor} bg-white`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Services</h3>
          <ul className="space-y-2">
            {sidebarData.services.map((service, index) => (
              <li key={index} className="flex items-start">
                <div className={`w-2 h-2 rounded-full ${tierStyles.accentColor.replace('text-', 'bg-')} mt-2 mr-3 flex-shrink-0`}></div>
                <span className="text-sm text-gray-700">{service}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}