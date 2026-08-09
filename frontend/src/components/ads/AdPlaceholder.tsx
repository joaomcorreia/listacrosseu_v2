'use client';

import React from 'react';

interface AdPlaceholderProps {
  variant?: 'banner' | 'sidebar' | 'inline';
  label?: string;
  className?: string;
}

/** Reserved ad-slot API. Empty inventory is intentionally not rendered publicly. */
export const AdPlaceholder: React.FC<AdPlaceholderProps> = () => null;

export default AdPlaceholder;
