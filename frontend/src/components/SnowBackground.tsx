"use client";

type SnowBackgroundProps = {
  /** Optional: tweak opacity if needed */
  opacity?: number;
  /** Optional: control intensity of snow effects */
  intensity?: 'low' | 'medium' | 'high';
};

export default function SnowBackground({ 
  opacity = 0.7, 
  intensity = 'medium' 
}: SnowBackgroundProps) {
  const styleOpacity = Math.min(Math.max(opacity, 0), 1);
  
  // Adjust layer visibility based on intensity
  const getLayerOpacity = (baseOpacity: number) => {
    switch (intensity) {
      case 'low':
        return styleOpacity * baseOpacity * 0.5; // 50% of normal
      case 'medium':
        return styleOpacity * baseOpacity; // Normal
      case 'high':
        return styleOpacity * baseOpacity * 1.3; // 130% of normal
      default:
        return styleOpacity * baseOpacity;
    }
  };

  // Control number of layers based on intensity
  const showAllLayers = intensity !== 'low';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Layer 1 - small, dense particles - always visible */}
      <div
        className="snow-layer snow-layer-sm"
        style={{ 
          opacity: getLayerOpacity(1.0),
          animationDuration: intensity === 'high' ? '50s' : intensity === 'low' ? '80s' : '60s'
        }}
      />
      
      {/* Layer 2 - medium particles - hidden on low intensity */}
      {showAllLayers && (
        <div
          className="snow-layer snow-layer-md"
          style={{ 
            opacity: getLayerOpacity(0.8),
            animationDuration: intensity === 'high' ? '35s' : '45s'
          }}
        />
      )}
      
      {/* Layer 3 - larger slow flakes - only on medium/high */}
      {intensity === 'high' && (
        <div
          className="snow-layer snow-layer-lg"
          style={{ 
            opacity: getLayerOpacity(0.6),
            animationDuration: '25s'
          }}
        />
      )}
      
      {/* Extra layer for high intensity */}
      {intensity === 'high' && (
        <div
          className="snow-layer snow-layer-sm"
          style={{ 
            opacity: getLayerOpacity(0.3),
            animationDuration: '40s',
            transform: 'scale(1.2) rotate(45deg)'
          }}
        />
      )}
    </div>
  );
}