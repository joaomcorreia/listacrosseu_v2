'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PUBLIC_API_BASE_URL } from '@/lib/env.public';

export default function AccountVerificationClient({ lang }: { lang: string }) {
  const params = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState('');
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('This verification link is missing a token.');
      return;
    }
    fetch(`${PUBLIC_API_BASE_URL}/api/account/verify/?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || 'This verification link is invalid or expired.');
        setEmail(data.email || '');
        setBusinessId(data.business_id || null);
        setAuthenticated(Boolean(data.authenticated));
        setState('success');
      })
      .catch((error) => {
        setState('error');
        setMessage(error.message);
      });
  }, [token]);

  const next = businessId ? `/${lang}/dashboard?business=${businessId}` : `/${lang}/dashboard`;

  const continuation = authenticated ? next : `/${lang}/login?next=${encodeURIComponent(next)}`;
  const continuationLabel = authenticated ? 'Open my business dashboard' : 'Sign in to my business dashboard';
  return <main className="mx-auto max-w-xl px-6 py-16"><section className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm"><h1 className="text-3xl font-black">{state === 'success' ? 'Email confirmed' : state === 'loading' ? 'Confirming your email' : 'Verification link unavailable'}</h1>{state === 'loading' && <p className="mt-4 text-slate-600">Please wait while we confirm your email.</p>}{state === 'error' && <p className="mt-4 text-red-700">{message}</p>}{state === 'success' && <><p className="mt-4 leading-7 text-slate-700">Your account is ready{email ? ` for ${email}` : ''}. Your new business listing is now associated with your account.</p><Link href={continuation} className="mt-6 inline-flex rounded-lg bg-blue-700 px-5 py-3 font-bold text-white">{continuationLabel}</Link></>}</section></main>;
}
