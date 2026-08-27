'use client';

import { useEffect, useMemo, useState } from 'react';
import type { GeneratedHeroSlide } from './generated-page-schema';

export default function GeneratedHeroSlider({ slides, renderSlide, primary }: { slides: GeneratedHeroSlide[]; renderSlide: (slide: GeneratedHeroSlide, index: number) => React.ReactNode; primary: string }) {
  const ordered = useMemo(() => slides.filter((slide) => slide.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0)).slice(0, 3), [slides]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => { if (ordered.length < 2 || paused) return; const timer = window.setInterval(() => setActive((current) => (current + 1) % ordered.length), 6500); return () => window.clearInterval(timer); }, [ordered.length, paused]);
  useEffect(() => { if (active >= ordered.length) setActive(0); }, [active, ordered.length]);
  if (!ordered.length) return null;
  const current = ordered[active] || ordered[0];
  return <div className="generated-hero-slider" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>{renderSlide(current, active)}{ordered.length > 1 && <><button type="button" aria-label="Previous hero slide" onClick={() => { setPaused(true); setActive((active - 1 + ordered.length) % ordered.length); }} className="absolute left-5 top-1/2 z-10 rounded-full bg-white/90 px-3 py-2 text-slate-900 shadow">←</button><button type="button" aria-label="Next hero slide" onClick={() => { setPaused(true); setActive((active + 1) % ordered.length); }} className="absolute right-5 top-1/2 z-10 rounded-full bg-white/90 px-3 py-2 text-slate-900 shadow">→</button><div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">{ordered.map((_, index) => <button type="button" key={index} aria-label={`Go to slide ${index + 1}`} onClick={() => { setPaused(true); setActive(index); }} className="h-2.5 w-2.5 rounded-full border border-white" style={{ backgroundColor: index === active ? primary : 'transparent' }} />)}</div></>}</div>;
}
