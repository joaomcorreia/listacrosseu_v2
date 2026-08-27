'use client';

import { useState } from 'react';
import { PUBLIC_API_BASE_URL } from '@/lib/env.public';

export default function GeneratedWebsiteContactForm({ slug, page = 'contact', previewToken }: { slug: string; page?: string; previewToken?: string }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', website_url: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [notice, setNotice] = useState('');
  function update(field: keyof typeof form, value: string) { setForm((current) => ({ ...current, [field]: value })); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState('sending'); setNotice('');
    try {
      const query = previewToken ? `?preview_token=${encodeURIComponent(previewToken)}` : '';
      const response = await fetch(`${PUBLIC_API_BASE_URL}/api/listings/generated-websites/${encodeURIComponent(slug)}/contact/${query}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, page }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || 'Unable to send your message.');
      setState('sent'); setNotice(data.detail || 'Your message has been sent.'); setForm({ name: '', email: '', phone: '', subject: '', message: '', website_url: '' });
    } catch (error) { setState('error'); setNotice(error instanceof Error ? error.message : 'Unable to send your message.'); }
  }
  const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200';
  return <form onSubmit={submit} className="mt-8 rounded-2xl bg-white p-5 text-slate-900 shadow-sm ring-1 ring-slate-200 sm:p-7"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Name<input required maxLength={120} value={form.name} onChange={(event) => update('name', event.target.value)} className={inputClass} /></label><label className="text-sm font-semibold">Email<input required type="email" maxLength={254} value={form.email} onChange={(event) => update('email', event.target.value)} className={inputClass} /></label><label className="text-sm font-semibold">Phone <span className="font-normal text-slate-500">(optional)</span><input maxLength={80} value={form.phone} onChange={(event) => update('phone', event.target.value)} className={inputClass} /></label><label className="text-sm font-semibold">Subject <span className="font-normal text-slate-500">(optional)</span><input maxLength={160} value={form.subject} onChange={(event) => update('subject', event.target.value)} className={inputClass} /></label></div><label className="mt-4 block text-sm font-semibold">Message<textarea required maxLength={5000} rows={5} value={form.message} onChange={(event) => update('message', event.target.value)} className={inputClass} /></label><input tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website_url} onChange={(event) => update('website_url', event.target.value)} className="absolute -left-[9999px] h-px w-px" /><div className="mt-4 flex flex-wrap items-center gap-4"><button type="submit" disabled={state === 'sending'} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{state === 'sending' ? 'Sending...' : 'Send message'}</button>{notice && <p role="status" className={`text-sm font-semibold ${state === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>{notice}</p>}</div></form>;
}
