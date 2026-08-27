'use client';

import { Check } from 'lucide-react';
import { CLASSIC_BUSINESS_VARIANT_OPTIONS } from './generated-page-registry';

export default function ClassicBusinessVariantSelector({ selected, primary, onSelect }: { selected: 'variant-1' | 'variant-2'; primary: string; onSelect: (variant: 'variant-1' | 'variant-2') => void }) {
  return <section aria-labelledby="classic-layout-heading" className="border-b border-slate-200 bg-slate-50 px-5 py-4">
    <div className="mx-auto max-w-3xl">
      <div className="mb-3"><h2 id="classic-layout-heading" className="text-sm font-black text-slate-900">Classic Business layout</h2><p className="mt-1 text-xs text-slate-500">Choose a visual layout for the same website content.</p></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CLASSIC_BUSINESS_VARIANT_OPTIONS.map((option) => {
          const isSelected = selected === option.id;
          return <button key={option.id} type="button" disabled={!option.enabled} aria-label={`Classic Business Layout ${option.id.replace('variant-', '')}`} aria-pressed={isSelected} onClick={() => option.enabled && onSelect(option.id as 'variant-1' | 'variant-2')} className={`group relative overflow-hidden rounded-xl border-2 bg-white text-left shadow-sm transition ${isSelected ? 'shadow-md' : 'border-slate-200'} ${option.enabled ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : 'cursor-not-allowed opacity-65'}`} style={isSelected ? { borderColor: primary } : undefined}>
            <div className="aspect-[16/9] overflow-hidden bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300">
              <img src={option.previewImage} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
              {!option.enabled && <span className="absolute inset-0 flex items-center justify-center bg-slate-900/45 text-xs font-black uppercase tracking-[0.16em] text-white">Coming soon</span>}
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2.5"><span className="text-xs font-bold text-slate-800">{option.label}</span>{isSelected && <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide" style={{ color: primary }}><Check size={13} aria-hidden="true" /> Selected</span>}</div>
          </button>;
        })}
      </div>
    </div>
  </section>;
}
