import Link from "next/link";
import Container from "@/components/Container";

const plans = [
  { id: "monthly", name: "Monthly", price: "€14.95", detail: "per month", description: "Flexible website billing." },
  { id: "quarterly", name: "Quarterly", price: "€12.95", detail: "per month · €38.85 billed quarterly", description: "Lower monthly rate with quarterly billing." },
  { id: "six-month", name: "6 months", price: "€10.95", detail: "per month · €65.70 billed every 6 months", description: "A longer billing period at a lower monthly rate." },
  { id: "yearly", name: "Yearly", price: "€8.95", detail: "per month · €107.40 billed yearly", description: "Best value for a full year." },
];

export default function PricingPageClient({ lang }: { lang: string }) {
  return (
    <>
      <section className="py-16"><Container><div className="mx-auto max-w-3xl text-center"><h1 className="text-4xl font-black text-slate-900">Generated Website plans</h1><p className="mt-4 text-lg text-slate-600">Start with a free 14-day trial after creating or claiming your listing.</p></div><div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">{plans.map((plan) => <article key={plan.id} className={`rounded-2xl border bg-white p-7 shadow-sm ${plan.id === 'yearly' ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200'}`}><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>{plan.id === 'yearly' && <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">Best value</span>}</div><p className="mt-3 text-sm text-slate-600">{plan.description}</p><p className="mt-7 text-3xl font-black text-slate-900">{plan.price}</p><p className="mt-1 text-xs text-slate-500">{plan.detail}</p><Link href={`/${lang}/list-your-business`} className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">Create your website</Link></article>)}</div></Container></section>
      <section className="pb-20"><Container><div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center"><h2 className="text-lg font-bold text-amber-950">Activation note</h2><p className="mt-2 text-sm text-amber-900">Stripe checkout is not available yet. The trial and billing options shown here are planned website options; activation will be completed after the trial flow is ready.</p></div></Container></section>
    </>
  );
}
