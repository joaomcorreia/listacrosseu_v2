import Link from 'next/link';
import Breadcrumbs from '@/components/Breadcrumbs';

export type InnerPageHeroVariant = 'tall' | 'medium' | 'compact';

type HeroStat = { label: string; value: string | number };
type HeroAction = { label: string; href: string };

type Props = {
  title: string;
  description?: string;
  variant?: InnerPageHeroVariant;
  breadcrumbs?: { label: string; href?: string }[];
  eyebrow?: string;
  stats?: HeroStat[];
  actions?: HeroAction[];
  countryFlag?: string;
};

const heightClasses: Record<InnerPageHeroVariant, string> = {
  tall: 'py-20 sm:py-24',
  medium: 'py-10 sm:py-14',
  compact: 'py-8 sm:py-10',
};

export default function InnerPageHero({
  title,
  description,
  variant = 'medium',
  breadcrumbs,
  eyebrow,
  stats = [],
  actions = [],
  countryFlag,
}: Props) {
  return (
    <section className={`relative isolate overflow-hidden bg-gradient-to-br from-[#123fc9] via-[#2454d8] to-[#6426a7] text-white ${heightClasses[variant]}`}>
      <img src="/images/eu-map.png" alt="" aria-hidden="true" className="pointer-events-none absolute right-[-8%] top-1/2 w-[min(620px,58vw)] -translate-y-1/2 opacity-15 mix-blend-screen" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.16),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(196,181,253,0.18),transparent_32%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {breadcrumbs && breadcrumbs.length > 0 && <div className="mb-5 text-sm"><Breadcrumbs items={breadcrumbs} variant="dark" /></div>}
        <div className="max-w-3xl">
          {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">{eyebrow}</p>}
          <div className="flex items-start gap-3">
            {countryFlag && <img src={countryFlag} alt="" className="mt-2 h-7 w-7 rounded-full object-cover ring-2 ring-white/30" />}
            <h1 className={variant === 'tall' ? 'text-4xl font-bold tracking-tight sm:text-6xl' : variant === 'medium' ? 'text-3xl font-bold tracking-tight sm:text-5xl' : 'text-3xl font-bold tracking-tight sm:text-4xl'}>{title}</h1>
          </div>
          {description && <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">{description}</p>}
          {actions.length > 0 && <div className="mt-7 flex flex-wrap gap-3">{actions.map((action) => <Link key={action.href} href={action.href} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-50">{action.label}</Link>)}</div>}
          {stats.length > 0 && <div className="mt-8 flex flex-wrap gap-3">{stats.map((stat) => <div key={stat.label} className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm"><div className="text-xl font-bold">{stat.value}</div><div className="text-xs text-blue-100">{stat.label}</div></div>)}</div>}
        </div>
      </div>
    </section>
  );
}
