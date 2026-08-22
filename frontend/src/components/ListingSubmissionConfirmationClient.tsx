'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ListingSubmissionConfirmationClient({ lang }: { lang: string }) {
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<{ businessId?: number; email?: string; next?: string; authenticated?: boolean }>({});
  useEffect(() => { try { setPending(JSON.parse(sessionStorage.getItem('listacrosseu-pending-listing') || '{}')); } catch { setPending({}); } }, []);
  const next = pending.next === 'generated-website' || searchParams.get('next') === 'generated-website' ? `/${lang}/list-your-business/confirmation?next=generated-website` : `/${lang}/list-your-business/confirmation`;
  const signup = `/${lang}/signup?next=${encodeURIComponent(next)}`;
  const login = `/${lang}/login?next=${encodeURIComponent(pending.next === 'generated-website' ? `/${lang}/dashboard?next=generated-website` : `/${lang}/dashboard${pending.businessId ? `?business=${pending.businessId}` : ''}`)}`;
  return <main className="mx-auto max-w-3xl px-6 py-16"><section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">ListAcrossEU</p><h1 className="mt-2 text-3xl font-black text-slate-900">Your business has been submitted</h1><p className="mt-4 leading-7 text-slate-700">We've received your business information. {pending.authenticated ? 'Your signed-in account is associated with this listing.' : "To manage your listing, keep your details up to date and access your List Across EU dashboard, you'll need a verified account."}</p><p className="mt-3 leading-7 text-slate-700">{pending.authenticated ? 'Submission review or duplicate/claim checks may still apply; this confirmation does not promise publication or approval.' : 'Create your account using the email associated with your business, then confirm your email address. Submission review or duplicate/claim checks may still apply; this confirmation does not promise publication or approval.'}</p><div className="mt-8 flex flex-wrap gap-3">{pending.authenticated ? <Link href={login} className="rounded-lg bg-blue-700 px-5 py-3 font-bold text-white">Go to my dashboard</Link> : <><Link href={signup} className="rounded-lg bg-blue-700 px-5 py-3 font-bold text-white">Create my account</Link><Link href={login} className="rounded-lg border border-blue-700 px-5 py-3 font-bold text-blue-800">I already have an account</Link></>}</div><p className="mt-5 text-sm text-slate-600">{pending.email ? `We'll use ${pending.email} for the ownership and verification steps.` : 'Use the email you submitted with your listing.'}</p></section></main>;
}
