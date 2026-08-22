import Link from "next/link";
import Container from "@/components/Container";
import { GENERATED_WEBSITE_PRODUCT } from "@/lib/product-config";
import { publicActionHref } from "@/lib/public-actions";

export default function PricingPageClient({ lang }: { lang: string }) {
  return (
    <>
      <section className="py-16"><Container><div className="mx-auto max-w-3xl text-center"><h1 className="text-4xl font-black text-slate-900">{GENERATED_WEBSITE_PRODUCT.name}</h1><p className="mt-4 text-lg text-slate-600">Start with {GENERATED_WEBSITE_PRODUCT.trial} after creating or claiming your listing.</p></div><div className="mx-auto mt-12 max-w-xl"><article className="rounded-2xl border border-blue-600 bg-white p-7 shadow-sm ring-2 ring-blue-100"><h2 className="text-xl font-bold text-slate-900">One product, one price</h2><p className="mt-3 text-sm text-slate-600">A simple generated website for a claimed ListAcrossEU business listing.</p><p className="mt-7 text-3xl font-black text-slate-900">{GENERATED_WEBSITE_PRODUCT.price}</p><p className="mt-1 text-xs text-slate-500">after the {GENERATED_WEBSITE_PRODUCT.trialLabel}; custom domain options are coming next.</p><Link href={publicActionHref(lang, 'TRY_GENERATED_WEBSITE')} className="mt-7 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">{GENERATED_WEBSITE_PRODUCT.cta}</Link></article></div></Container></section>
      <section className="pb-20"><Container><div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center"><h2 className="text-lg font-bold text-amber-950">Activation note</h2><p className="mt-2 text-sm text-amber-900">Stripe checkout is not available yet. The trial and billing options shown here are planned website options; activation will be completed after the trial flow is ready.</p></div></Container></section>
    </>
  );
}
