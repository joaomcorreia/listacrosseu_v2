'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { normalizeSpokenLanguages, spokenLanguageName, SPOKEN_LANGUAGES } from '@/lib/spokenLanguages';

export default function SpokenLanguagePicker({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = normalizeSpokenLanguages(value);
  const filtered = useMemo(() => SPOKEN_LANGUAGES.filter((language) => language.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [query]);
  const toggle = (code: string) => onChange(selected.includes(code) ? selected.filter((item) => item !== code) : [...selected, code]);
  return <div className="relative">
    <div className="flex min-h-10 flex-wrap gap-1 rounded border border-slate-300 bg-white p-1.5 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
      {selected.map((code) => <span key={code} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">{spokenLanguageName(code)}<button type="button" onClick={() => toggle(code)} aria-label={`Remove ${spokenLanguageName(code)}`}><X className="h-3 w-3" /></button></span>)}
      <button type="button" onClick={() => setOpen(!open)} className="flex min-w-28 flex-1 items-center justify-between px-2 py-1 text-left text-sm text-slate-500" aria-expanded={open}>Add languages <ChevronDown className="h-4 w-4" /></button>
    </div>
    {open && <div className="absolute z-30 mt-1 w-full min-w-[min(100%,28rem)] rounded-lg border border-slate-300 bg-white p-3 shadow-xl" role="dialog" aria-label="Choose spoken languages">
      <div className="flex items-center gap-2 rounded border border-slate-300 px-2"><Search className="h-4 w-4 text-slate-400" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search languages" className="w-full border-0 p-2 text-sm outline-none" /></div>
      <div className="mt-2 grid max-h-64 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
        {filtered.map((language) => <button type="button" key={language.code} onClick={() => toggle(language.code)} className="flex items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-blue-50"><span>{language.name}</span>{selected.includes(language.code) && <Check className="h-4 w-4 text-blue-700" />}</button>)}
      </div>
      {!filtered.length && <p className="p-3 text-sm text-slate-500">No matching language.</p>}
      <button type="button" onClick={() => setOpen(false)} className="mt-2 w-full rounded bg-slate-900 px-3 py-2 text-sm font-bold text-white">Done</button>
    </div>}
  </div>;
}
