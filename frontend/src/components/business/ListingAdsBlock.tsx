'use client';

export function ListingAdsBlock({ showDirectoryAd = true }: { showDirectoryAd?: boolean }) {
  return (
    <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Discover More European Businesses
        </h3>
        
        {showDirectoryAd && <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h4 className="font-medium text-gray-900">ListAcrossEU</h4>
              <p className="text-sm text-gray-600">
                Connect with trusted small & micro businesses across Europe
              </p>
            </div>
            <a 
              href="/en" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Explore
            </a>
          </div>
        </div>}

        {/* Just Code Works Ad */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h4 className="font-medium text-gray-900">Just Code Works</h4>
              <p className="text-sm text-gray-600">
                Professional web development and digital solutions
              </p>
            </div>
            <a 
              href="https://justcode.works" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Visit Site
            </a>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Sponsored content helps keep ListAcrossEU free for small businesses
        </p>
      </div>
    </div>
  );
}
