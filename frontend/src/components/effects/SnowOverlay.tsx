'use client';

import { useEffect, useState } from 'react';

interface SnowFlake {
  id: number;
  left: number;
  animationDuration: number;
  opacity: number;
  size: number;
  delay: number;
}

export default function SnowOverlay() {
  const [snowflakes, setSnowflakes] = useState<SnowFlake[]>([]);

  useEffect(() => {
    // Generate snowflakes
    const flakes: SnowFlake[] = [];
    for (let i = 0; i < 50; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: Math.random() * 3 + 2, // 2-5 seconds
        opacity: Math.random() * 0.3 + 0.4, // 0.4-0.7 for subtlety
        size: Math.random() * 3 + 2, // 2-5px
        delay: Math.random() * 2, // 0-2s delay
      });
    }
    setSnowflakes(flakes);
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10px) translateX(0px);
          }
          100% {
            transform: translateY(calc(100vh + 10px)) translateX(50px);
          }
        }
        .snowflake {
          animation: snowfall linear infinite;
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute snowflake"
            style={{
              left: `${flake.left}%`,
              opacity: flake.opacity,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              animationDuration: `${flake.animationDuration}s`,
              animationDelay: `${flake.delay}s`,
            }}
          >
            <div className="w-full h-full bg-white rounded-full shadow-sm" />
          </div>
        ))}
      </div>
    </>
  );
}