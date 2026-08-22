'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PUBLIC_API_BASE_URL } from '@/lib/env.public';

export default function CheckEmailClient({ lang }: { lang: string }) {
  const params = useSearchParams(); const email = params.get('email') || ''; const next = params.get('next'); const [message, setMessage] = useState(''); const [sending, setSending] = useState(false);
  async function resend() { setSending(true); const response = await fetch(`${PUBLIC_API_BASE_URL}/api/account/resend-verification/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); setMessage(response.ok ? 'If an unverified account exists, a new verification email has been sent.' : 'Please try again shortly.'); setSending(false); }
  return <main className="mx-auto max-w-xl px-6 py-16"><section className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm"><h1 className="text-3xl font-black">Check your email</h1><p className="mt-4 leading-7 text-slate-700">We've sent a verification link to <strong>{email || 'your email address'}</strong>. Open the link to confirm your account. Once your email is verified, you can sign in and manage your business listing.</p><button type="button" onClick={resend} disabled={!email || sending} className="mt-6 rounded-lg border border-blue-700 px-4 py-2 font-semibold text-blue-800 disabled:opacity-50">{sending ? 'Sending…' : 'Resend verification email'}</button>{message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}<div className="mt-6 flex flex-wrap gap-4 text-sm"><Link className="font-semibold text-blue-700" href={`/${lang}/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Return to sign in</Link><Link className="font-semibold text-blue-700" href={`/${lang}/signup`}>Use a different email</Link></div></section></main>;
}
