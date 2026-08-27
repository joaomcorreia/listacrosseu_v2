'use client';

export default function PremiumPreviewClient({ lang }: { businessId: string; lang: string; activePage?: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><section className="max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Product 2</p><h1 className="mt-2 text-3xl font-black text-slate-900">Generated Website</h1><p className="mt-4 text-slate-600">Coming soon. This product is being prepared and is not available to claimants yet.</p><a href={`/${lang}/dashboard`} className="mt-6 inline-flex rounded bg-blue-700 px-4 py-2 font-bold text-white">Back to dashboard</a></section></main>;
}
