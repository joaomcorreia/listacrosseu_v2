'use client';

import React from 'react';

interface AdPlaceholderProps {
  variant?: 'banner' | 'sidebar' | 'inline';
  label?: string;
  className?: string;
}

export const AdPlaceholder: React.FC<AdPlaceholderProps> = ({
  variant = 'banner',
  label,
  className = '',
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'banner':
        return 'h-24 w-full max-w-4xl';
      case 'sidebar':
        return 'h-64 w-full';
      case 'inline':
        return 'h-32 w-full max-w-2xl';
      default:
        return 'h-24 w-full';
    }
  };

  const variantClasses =
    variant === 'banner'
      ? 'border border-slate-200 bg-white shadow-sm'
      : 'border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100';

  const defaultLabel = label || 'ListAcross EU Ad Slot';

  return (
    <div
      className={`
        ${getVariantClasses()}
        ${variantClasses}
        rounded-lg
        flex items-center justify-center
        text-center
        relative
        hover:border-blue-300
        hover:shadow-md
        transition-all duration-200
        overflow-hidden
        ${className}
      `}
    >
      {/* Shape decorations instead of images */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-2 right-4 w-8 h-8 bg-blue-200/40 rounded-full blur-sm" />
        <div className="absolute bottom-3 left-6 w-6 h-6 bg-purple-200/30 rounded-full blur-sm" />
        {variant === 'banner' && (
          <div className="absolute top-1/2 left-1/3 w-12 h-12 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-md transform -translate-y-1/2" />
        )}
      </div>
      
      {/* Ad Badge */}
      <div className="absolute top-2 left-2 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium shadow-sm">
        Advertisement
      </div>
      
      {/* Main Content */}
      <div className="text-center text-slate-600 relative z-10">
        <div className="text-sm font-medium">{defaultLabel}</div>
        <div className="text-xs opacity-75 mt-1">Premium Placement</div>
      </div>
    </div>
  );
};

export default AdPlaceholder;
