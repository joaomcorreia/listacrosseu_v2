'use client';

import type { KeyboardEvent } from 'react';

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
}: InlineEditableProps) {
  const Tag = as;
  const selected = activeField === fieldId;

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

  return (
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
}
