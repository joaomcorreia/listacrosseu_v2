import Link from 'next/link';

export default function DashboardFooter({ lang }: { lang: string }) {
  const links = [
    { label: 'Help', href: `/${lang}/how-it-works` },
    { label: 'How it works', href: `/${lang}/how-it-works` },
    { label: 'Privacy', href: `/${lang}/privacy` },
    { label: 'Terms', href: `/${lang}/terms` },
  ];

  return <footer className="mt-10 border-t border-slate-200 pt-5 text-sm text-slate-500"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p>ListAcrossEU © 2026</p><a href="mailto:info@listacross.eu" className="hover:text-slate-900">info@listacross.eu</a><nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Dashboard footer"><Link href={links[0].href} className="hover:text-slate-900">{links[0].label}</Link><Link href={links[1].href} className="hover:text-slate-900">{links[1].label}</Link><Link href={links[2].href} className="hover:text-slate-900">{links[2].label}</Link><Link href={links[3].href} className="hover:text-slate-900">{links[3].label}</Link></nav></div></footer>;
}
