'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { normalizeLang } from '@/lib/lang';
import { useTranslations } from '@/i18n/translations';

type FooterSourceKey = 'googlePlaces' | 'marketResearch' | 'chamberCommerce' | 'industryNews' | 'euRegulations';
type FooterBlogKey = 'businessTips' | 'marketInsights' | 'successStories' | 'industryNews' | 'euRegulations';
type FooterMenuKey = 'countries' | 'cities' | 'blog' | 'listYourBusiness' | 'about';

type FooterSourceLink = { key: FooterSourceKey; href: string };
type FooterBlogLink = { key: FooterBlogKey; slug: string };
type FooterMenuLink = { key: FooterMenuKey; href: string };

const footerLinks: {
  sources: FooterSourceLink[];
  blogCategories: FooterBlogLink[];
  menu: FooterMenuLink[];
} = {
  sources: [],
  blogCategories: [
    { key: 'businessTips', slug: 'business-tips' },
    { key: 'marketInsights', slug: 'market-insights' },
    { key: 'successStories', slug: 'success-stories' },
    { key: 'industryNews', slug: 'industry-news' },
    { key: 'euRegulations', slug: 'eu-regulations' },
  ],
  menu: [
    { key: 'countries', href: '/countries' },
    { key: 'cities', href: '/cities' },
    { key: 'blog', href: '/blog' },
    { key: 'listYourBusiness', href: '/list-your-business' },
    { key: 'about', href: '/about' },
  ],
};

function AnimatedParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const canvasEl: HTMLCanvasElement = canvas;
    const ctx: CanvasRenderingContext2D = context;

    const resizeCanvas = () => {
      canvasEl.width = canvasEl.offsetWidth;
      canvasEl.height = canvasEl.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      opacity: number;
    }> = [];

    const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvasEl.width,
        y: Math.random() * canvasEl.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.8 + 0.2,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0) particle.x = canvasEl.width;
        if (particle.x > canvasEl.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvasEl.height;
        if (particle.y > canvasEl.height) particle.y = 0;

        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-60" style={{ pointerEvents: 'none' }} />;
}

export default function Footer() {
  const params = useParams();
  const lang = normalizeLang(String(params?.lang || 'en'));
  const t = useTranslations(lang);

  return (
    <footer className="relative overflow-hidden bg-slate-900 text-white">
      <AnimatedParticles />
      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <h3 className="mb-4 text-xl font-bold">{t.footer.brandName}</h3>
              <p className="mb-6 text-sm leading-relaxed text-slate-300">{t.footer.tagline}</p>
            </div>

            {footerLinks.sources.length > 0 && (
              <div>
                <h3 className="mb-6 text-lg font-semibold text-red-400">{t.footer.headings.sources}</h3>
                <ul className="space-y-3">
                  {footerLinks.sources.map((link) => (
                    <li key={link.key}>
                      <a href={`/${lang}${link.href}`} className="text-sm text-slate-300 transition-colors hover:text-white">
                        {t.footer.sources[link.key]}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="mb-6 text-lg font-semibold text-green-400">{t.footer.headings.blogCategories}</h3>
              <ul className="space-y-3">
                {footerLinks.blogCategories.map((link) => (
                  <li key={link.key}>
                    <a href={`/${lang}/blog?category=${encodeURIComponent(link.slug)}`} className="text-sm text-slate-300 transition-colors hover:text-white">
                      {t.footer.blogCategories[link.key]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-6 text-lg font-semibold text-blue-400">{t.footer.headings.menu}</h3>
              <ul className="space-y-3">
                {footerLinks.menu.map((link) => (
                  <li key={link.key}>
                    <a href={`/${lang}${link.href}`} className="text-sm text-slate-300 transition-colors hover:text-white">
                      {t.footer.menu[link.key]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-700 pt-8">
            <div className="flex flex-col items-center justify-between md:flex-row">
              <p className="text-sm text-slate-400">
                {t.footer.copyright.replace('{year}', '2025').replace('{legal}', t.footer.legal)}
              </p>
              <div className="mt-4 flex space-x-6 md:mt-0">
                <a href={`/${lang}/how-it-works`} className="text-sm text-slate-400 transition-colors hover:text-white">How it works</a>
                <a href={`/${lang}/privacy`} className="text-sm text-slate-400 transition-colors hover:text-white">{t.footer.menu.privacy}</a>
                <a href={`/${lang}/terms`} className="text-sm text-slate-400 transition-colors hover:text-white">{t.footer.menu.terms}</a>
                <a href={`/${lang}/cookies`} className="text-sm text-slate-400 transition-colors hover:text-white">{t.footer.menu.cookies}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
