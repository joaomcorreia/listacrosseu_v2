'use client';

import { createElement, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PUBLIC_API_BASE_URL } from '@/lib/env.public';
import InlineEditable from '@/components/premium/InlineEditable';

export type DirectoryPageContent = {
  hero_image: string;
  title: string;
  subtitle: string;
  intro: string;
  cta_label: string;
  cta_href: string;
  seo_title?: string;
  meta_description?: string;
  related_links?: Array<{ label: string; href: string }>;
};

type EditorArgs = {
  scope: 'country' | 'city' | 'category' | 'landing';
  slug: string;
  defaults: DirectoryPageContent;
};

function csrfToken() {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find((cookie) => cookie.startsWith('csrftoken='))?.split('=').slice(1).join('=') || '';
}

export function useDirectoryPageEditor({ scope, slug, defaults }: EditorArgs) {
  const searchParams = useSearchParams();
  const [content, setContent] = useState(defaults);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const [staff, setStaff] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);
  const [contentStatus, setContentStatus] = useState<'published' | 'draft'>('published');

  useEffect(() => {
    let cancelled = false;
    setRemoteLoaded(false);
    fetch(`${PUBLIC_API_BASE_URL}/api/content/directory/${scope}/${encodeURIComponent(slug)}/`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setContent(data.content || defaults);
        setRemoteLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setRemoteLoaded(true);
      });
    return () => { cancelled = true; };
  }, [scope, slug]);

  useEffect(() => {
    if (searchParams.get('edit') !== '1') return;
    fetch(`${PUBLIC_API_BASE_URL}/api/admin/auth/`, { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (data.authenticated && data.user?.is_staff) {
          setStaff(true);
          setEditMode(true);
        }
      })
      .catch(() => undefined);
  }, [searchParams]);

  useEffect(() => {
    if (!staff) return;
    fetch(`${PUBLIC_API_BASE_URL}/api/admin/directory/${scope}/${encodeURIComponent(slug)}/`, { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (data.content) setContent(data.content);
        setContentStatus(data.status === 'draft' ? 'draft' : 'published');
      })
      .catch(() => undefined);
  }, [staff, scope, slug]);

  const updateField = (field: keyof DirectoryPageContent, value: string | Array<{ label: string; href: string }>) => {
    setContent((current) => ({ ...current, [field]: value }));
    setDirty(true);
    setNotice('');
  };

  const editable = (
    field: keyof DirectoryPageContent,
    value: string,
    className = '',
    as: 'span' | 'p' | 'h1' | 'h2' = 'span',
    multiline = false,
  ) => editMode
    ? <InlineEditable as={as} value={value} fieldId={`directory.${scope}.${field}`} activeField={activeField} onSelect={setActiveField} onChange={(next) => updateField(field, next)} className={className} multiline={multiline} />
    : createElement(as, { className }, value);

  async function saveDraft() {
    if (!staff || !dirty) return;
    setSaving(true);
    setNotice('');
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/admin/directory/${scope}/${encodeURIComponent(slug)}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() },
      body: JSON.stringify(content),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setContent(data.content || content);
      setDirty(false);
      setContentStatus('draft');
      setNotice('Draft saved.');
    } else {
      setNotice(data.detail || 'Unable to save this page draft.');
    }
    setSaving(false);
  }

  async function publishDraft() {
    if (!staff || dirty || contentStatus !== 'draft') {
      setNotice(dirty ? 'Save your draft before publishing.' : 'There is no saved draft to publish.');
      return;
    }
    setPublishing(true);
    setNotice('');
    const response = await fetch(`${PUBLIC_API_BASE_URL}/api/admin/directory/${scope}/${encodeURIComponent(slug)}/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRFToken': csrfToken() },
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      setContent(data.content || content);
      setContentStatus('published');
      setNotice('Published publicly.');
    } else {
      setNotice(data.detail || 'Unable to publish this page.');
    }
    setPublishing(false);
  }

  const toolbar = useMemo(() => staff ? (
    <aside className="fixed bottom-4 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Directory page editor</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{editMode ? 'Click highlighted text to edit.' : 'Preview mode'} · {contentStatus === 'draft' ? 'Draft' : 'Published'}</p>
        </div>
        <button type="button" onClick={() => setEditMode((current) => !current)} className="text-xs font-bold text-blue-700">{editMode ? 'Preview' : 'Edit'}</button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={saveDraft} disabled={saving || !dirty} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-40">{saving ? 'Saving...' : dirty ? 'Save draft' : 'Saved'}</button>
        <button type="button" onClick={publishDraft} disabled={publishing || dirty || contentStatus !== 'draft'} className="rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-800 disabled:opacity-40">{publishing ? 'Publishing...' : 'Publish'}</button>
      </div>
      {notice && <p className="mt-2 text-center text-xs text-slate-600">{notice}</p>}
      {editMode && <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
        <label className="block text-xs font-semibold text-slate-600">SEO title<input className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs" value={content.seo_title || ''} onChange={(event) => updateField('seo_title', event.target.value)} /></label>
        <label className="block text-xs font-semibold text-slate-600">Meta description<textarea className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xs" rows={3} value={content.meta_description || ''} onChange={(event) => updateField('meta_description', event.target.value)} /></label>
        <label className="block text-xs font-semibold text-slate-600">Related links (JSON)<textarea className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-[11px]" rows={3} value={JSON.stringify(content.related_links || [])} onChange={(event) => { try { const value = JSON.parse(event.target.value); if (Array.isArray(value)) updateField('related_links', value); } catch { /* keep editing until valid JSON */ } }} /></label>
      </div>}
    </aside>
  ) : null, [staff, editMode, saving, publishing, dirty, notice, content, contentStatus]);

  return { content, remoteLoaded, staff, editMode, editable, toolbar };
}
