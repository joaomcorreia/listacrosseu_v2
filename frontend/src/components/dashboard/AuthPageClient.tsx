'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PUBLIC_API_BASE_URL } from '@/lib/env.public';

function csrfToken() { return document.cookie.split(';').map((value) => value.trim().split('=')).find(([key]) => key === 'csrftoken')?.[1] || ''; }

export default function AuthPageClient({ lang, mode }: { lang: string; mode: 'login' | 'signup' }) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [csrf, setCsrf] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const requestedNext = searchParams.get('next');
  const nextPath = requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : `/${lang}/dashboard`;
  useEffect(() => { try { const pending = JSON.parse(sessionStorage.getItem('listacrosseu-pending-listing') || '{}'); if (mode === 'signup' && pending.email) setEmail(pending.email); } catch { /* ignore malformed local continuation */ } fetch(`${PUBLIC_API_BASE_URL}/api/dashboard/auth/`, { credentials: 'include' }).then(async (response) => { const data = await response.json().catch(() => ({})); if (data.csrfToken) setCsrf(data.csrfToken); }).catch(() => undefined); }, [mode]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    const endpoint = `${PUBLIC_API_BASE_URL}/api/dashboard/auth/`;
    let pendingToken = '';
    try {
      const claim = JSON.parse(sessionStorage.getItem('listacrosseu-pending-claim') || '{}');
      pendingToken = claim.claimToken || '';
      if (!pendingToken) pendingToken = JSON.parse(sessionStorage.getItem('listacrosseu-pending-listing') || '{}').pendingToken || '';
    } catch { /* ignore malformed local continuation */ }
    try {
      const response = await fetch(endpoint, { method: mode === 'signup' ? 'PUT' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf || csrfToken() }, body: JSON.stringify({ email: email.trim(), password, ...(pendingToken ? { pending_token: pendingToken } : {}) }) });
      if (response.ok) {
        if (mode === 'signup') { window.location.href = `/${lang}/check-email?email=${encodeURIComponent(email)}${nextPath ? `&next=${encodeURIComponent(nextPath)}` : ''}`; return; }
        try { sessionStorage.removeItem('listacrosseu-pending-claim'); } catch { /* ignore storage failures */ }
        window.location.href = nextPath; return;
      }
      setError((await response.json().catch(() => ({}))).detail || 'Unable to continue.');
    } catch {
      setError('Unable to connect. Please try again.');
    }
    setLoading(false);
  }
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6"><section className="w-full max-w-md rounded-xl bg-white p-8 text-slate-900 shadow"><p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">ListAcrossEU</p><h1 className="mt-2 text-3xl font-black text-slate-900">{mode === 'login' ? 'Sign in' : 'Create your account'}</h1><p className="mt-2 text-slate-600">{mode === 'login' ? 'Open your business dashboard.' : 'Claim and manage your business listing.'}</p><form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-semibold text-slate-700">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 font-normal text-slate-900 placeholder:text-slate-500" /></label><label className="block text-sm font-semibold text-slate-700">Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 font-normal text-slate-900 placeholder:text-slate-500" /></label>{error && <p className="text-sm text-red-700">{error}{error.includes('verify') && <><br /><Link className="font-semibold text-blue-700" href={`/${lang}/check-email?email=${encodeURIComponent(email)}`}>Resend verification email</Link></>}</p>}<button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded bg-blue-700 px-4 py-2 font-bold text-white disabled:opacity-60">{loading && <Loader2 className="h-4 w-4" />}{mode === 'login' ? 'Sign in' : 'Create account'}</button></form><p className="mt-6 text-sm text-slate-600">{mode === 'login' ? <>Need an account? <Link className="font-semibold text-blue-700" href={`/${lang}/signup`}>Create one</Link></> : <>Already registered? <Link className="font-semibold text-blue-700" href={`/${lang}/login`}>Sign in</Link></>}</p></section></main>;
}
