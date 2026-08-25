'use client';

import { useState, type KeyboardEvent } from 'react';

type EditableTag = 'span' | 'p' | 'h1' | 'h2' | 'h3';

type InlineEditableProps = {
  as?: EditableTag;
  value: string;
  fieldId: string;
  activeField: string | null;
  onSelect: (fieldId: string) => void;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  onSuggest?: () => Promise<string>;
};

export default function InlineEditable({
  as = 'span',
  value,
  fieldId,
  activeField,
  onSelect,
  onChange,
  className = '',
  placeholder = 'Click to edit',
  multiline = false,
  onSuggest,
}: InlineEditableProps) {
  const Tag = as;
  const selected = activeField === fieldId;
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');

  function commit(target: HTMLElement) {
    const nextValue = target.innerText.replace(/\u00a0/g, ' ').trim();
    onChange(nextValue);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.currentTarget.blur();
      return;
    }
    if (!multiline && event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  async function requestSuggestion() {
    if (!onSuggest) return;
    setSuggesting(true);
    setSuggestion(null);
    setSuggestionError('');
    try {
      setSuggestion(await onSuggest());
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : 'Unable to generate a suggestion.');
    } finally {
      setSuggesting(false);
    }
  }

  const editableElement = (
    <Tag
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={`Edit ${fieldId}`}
        data-editor-field={fieldId}
        data-placeholder={placeholder}
        onFocus={() => onSelect(fieldId)}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(fieldId);
        }}
        onBlur={(event) => commit(event.currentTarget)}
        onKeyDown={handleKeyDown}
        className={`${className} min-w-[1ch] cursor-text rounded-sm outline-none transition hover:ring-2 hover:ring-blue-400/70 focus:ring-2 focus:ring-blue-500 ${selected ? 'ring-2 ring-blue-500' : ''}`}
    >
      {value || placeholder}
    </Tag>
  );

  if (!onSuggest) return editableElement;

  return (
    <div className="relative">
      {editableElement}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-left" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={requestSuggestion} disabled={suggesting} className="rounded border border-blue-200 bg-white/80 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60">
          {suggesting ? 'Generating...' : 'AI Suggest'}
        </button>
        {suggestionError && <span className="text-xs font-medium text-red-700" role="alert">{suggestionError}</span>}
        {suggestion && <div className="w-full rounded-lg border border-blue-200 bg-blue-50/80 p-3 text-sm text-slate-800 shadow-sm">
          <p className="whitespace-pre-wrap">{suggestion}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => { onChange(suggestion); setSuggestion(null); setSuggestionError(''); }} className="rounded bg-blue-700 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-blue-800">Use suggestion</button>
            <button type="button" onClick={requestSuggestion} disabled={suggesting} className="rounded border border-blue-300 bg-white px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-60">Regenerate</button>
            <button type="button" onClick={() => { setSuggestion(null); setSuggestionError(''); }} className="rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          </div>
        </div>}
      </div>
    </div>
  );
}
